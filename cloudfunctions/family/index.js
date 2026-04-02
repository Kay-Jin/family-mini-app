const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

function isAuditStrict() {
  return process.env.AUDIT_FAIL_STRICT === "1" || process.env.AUDIT_FAIL_STRICT === "true";
}

function isRateLimitEnabled() {
  return process.env.DISABLE_RATE_LIMIT !== "1" && process.env.DISABLE_RATE_LIMIT !== "true";
}

/** 按 openid + 分钟桶计数；集合 `family_rate_limit` 可选，失败则放行（fail-open） */
async function bumpRateLimit(openid, bucketPrefix, limitPerMinute) {
  if (!isRateLimitEnabled() || !openid || !limitPerMinute) return true;
  const windowMin = Math.floor(Date.now() / 60000);
  const rawId = `${bucketPrefix}_${openid}_${windowMin}`;
  const docId = rawId.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 90);
  const _ = db.command;
  try {
    const col = db.collection("family_rate_limit");
    const doc = await col.doc(docId).get();
    if (!doc.data) {
      await col.doc(docId).set({ data: { n: 1, at: new Date() } });
      return true;
    }
    if (doc.data.n >= limitPerMinute) {
      console.warn("[family_rate_limit]", bucketPrefix, doc.data.n);
      return false;
    }
    await col.doc(docId).update({ data: { n: _.inc(1), at: new Date() } });
    return true;
  } catch (e) {
    console.error("[family_rate_limit_error]", bucketPrefix, e && e.message);
    return true;
  }
}

async function ensureVisibility(householdId, openid) {
  const setting = await db
    .collection("visibility_settings")
    .where({ householdId, openid })
    .limit(1)
    .get();
  if (setting.data.length) return setting.data[0];
  const fallback = {
    householdId,
    openid,
    share_step_band: true,
    share_sleep_summary: true,
    share_city_weather: true,
    share_last_checkin_time: true,
    share_album_contribute: true,
    include_in_morning_brief: true,
    updatedAt: new Date(),
  };
  await db.collection("visibility_settings").add({ data: fallback });
  return fallback;
}

async function listHouseholdMemberships(openid) {
  const rows = await db.collection("household_members").where({ openid }).get();
  return rows.data;
}

async function migrateMemberDocToJoinTable(doc) {
  if (!doc || !doc.openid || !doc.householdId) return;
  const existing = await db
    .collection("household_members")
    .where({ openid: doc.openid, householdId: doc.householdId })
    .limit(1)
    .get();
  if (existing.data.length) return;
  await db.collection("household_members").add({
    data: {
      openid: doc.openid,
      householdId: doc.householdId,
      uid: doc.openid,
      role: doc.role || "adult",
      display_name: doc.display_name || "成员",
      joinedAt: doc.joinedAt || new Date(),
    },
  });
}

function resolveActiveHouseholdId(membershipRows, activeFromClient, legacyHouseholdId) {
  const ids = [...new Set(membershipRows.map((m) => m.householdId).filter(Boolean))];
  if (activeFromClient && ids.includes(activeFromClient)) return activeFromClient;
  if (ids.length === 1) return ids[0];
  if (ids.length > 1) {
    if (legacyHouseholdId && ids.includes(legacyHouseholdId)) return legacyHouseholdId;
    return null;
  }
  return legacyHouseholdId || null;
}

async function enrichMemberships(rows) {
  const out = [];
  for (const m of rows) {
    let name = "";
    try {
      const h = await db.collection("households").doc(m.householdId).get();
      name = (h.data && h.data.name) || "";
    } catch (e) {
      name = "";
    }
    out.push({
      householdId: m.householdId,
      role: m.role,
      display_name: m.display_name || "成员",
      name,
    });
  }
  return out;
}

async function upsertHouseholdMember(openid, householdId, role, displayName) {
  const existing = await db.collection("household_members").where({ openid, householdId }).limit(1).get();
  if (existing.data.length) {
    await db.collection("household_members").doc(existing.data[0]._id).update({
      data: {
        role,
        display_name: displayName || existing.data[0].display_name || "成员",
        uid: openid,
        updatedAt: new Date(),
      },
    });
    return;
  }
  await db.collection("household_members").add({
    data: {
      openid,
      householdId,
      uid: openid,
      role: role || "adult",
      display_name: displayName || "成员",
      joinedAt: new Date(),
    },
  });
}

async function getDisplayNameForHousehold(openid, householdId) {
  if (!householdId) return "成员";
  const memberRes = await db.collection("household_members").where({ openid, householdId }).limit(1).get();
  if (memberRes.data.length) return memberRes.data[0].display_name || "成员";
  const fallback = await db.collection("members").where({ openid }).limit(1).get();
  if (fallback.data.length) return fallback.data[0].display_name || "成员";
  return "成员";
}

async function assertHouseholdActive(hid) {
  if (!hid) return { ok: false, message: "householdId is required" };
  try {
    const h = await db.collection("households").doc(hid).get();
    if (!h.data) return { ok: false, message: "家庭不存在" };
    if (h.data.dissolvedAt) return { ok: false, message: "家庭已解散" };
  } catch (e) {
    return { ok: false, message: "家庭不存在" };
  }
  return null;
}

/**
 * 可选集合 `family_audit_logs`。
 * 默认：写失败仅打云日志，不阻断业务。
 * 严格：云函数环境变量 `AUDIT_FAIL_STRICT=1` 时，写审计失败会抛错并中断当前请求。
 */
async function tryAudit(openid, actionName, hid, meta) {
  try {
    await db.collection("family_audit_logs").add({
      data: {
        at: new Date(),
        openid: openid || "",
        action: actionName,
        householdId: hid || null,
        meta: meta || {},
      },
    });
  } catch (e) {
    const msg = (e && e.message) || String(e);
    console.error("[family_audit_failed]", actionName, msg);
    if (isAuditStrict()) {
      throw new Error(`AUDIT_WRITE_FAILED: ${msg}`);
    }
  }
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const action = event.action;
  const householdId = event.householdId;

  try {
    if (action === "getOrCreateUser") {
      let rows = await db.collection("members").where({ openid: OPENID }).limit(1).get();
      if (!rows.data.length) {
        await db.collection("members").add({
          data: {
            openid: OPENID,
            uid: OPENID,
            display_name: (event.display_name && String(event.display_name).trim()) || "成员",
            householdId: null,
            role: "adult",
            createdAt: new Date(),
          },
        });
        rows = await db.collection("members").where({ openid: OPENID }).limit(1).get();
      }
      const doc = rows.data[0] || {};
      await migrateMemberDocToJoinTable(doc);
      let membershipRows = await listHouseholdMemberships(OPENID);
      const activeFromClient = `${event.activeHouseholdId || event.active_household_id || ""}`.trim();
      const resolvedHid = resolveActiveHouseholdId(membershipRows, activeFromClient, doc.householdId);
      const memberships = await enrichMemberships(membershipRows);
      const currentMb = membershipRows.find((m) => m.householdId === resolvedHid);
      const display_name = currentMb
        ? currentMb.display_name || doc.display_name
        : doc.display_name || "成员";
      const role = currentMb ? currentMb.role : doc.role || "adult";

      return {
        ok: true,
        data: {
          openid: OPENID,
          display_name: display_name || "成员",
          householdId: resolvedHid || null,
          role,
          memberships,
        },
      };
    }

    if (action === "createHousehold") {
      if (!(await bumpRateLimit(OPENID, "createHousehold", 8))) {
        return { ok: false, message: "操作过于频繁，请稍后再试" };
      }
      const reqId = `${event.clientRequestId || ""}`.trim().slice(0, 80);
      let idemKey = null;
      if (reqId) {
        idemKey = `createHH_${OPENID}_${reqId}`.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 90);
      }
      if (idemKey) {
        try {
          const prev = await db.collection("family_idempotency").doc(idemKey).get();
          if (prev.data && prev.data.result && prev.data.result.ok) {
            return prev.data.result;
          }
        } catch (e) {
          console.error("[idempotency_read]", e && e.message);
        }
      }
      const nameRaw = (event.householdName || event.name || "").trim();
      const name = nameRaw || "我的家庭";
      const created = await db.collection("households").add({
        data: {
          name,
          createdBy: OPENID,
          createdAt: new Date(),
        },
      });
      const newHouseholdId = created._id;
      const membersExist = await db.collection("members").where({ openid: OPENID }).limit(1).get();
      if (!membersExist.data.length) {
        await db.collection("members").add({
          data: {
            openid: OPENID,
            uid: OPENID,
            display_name: "成员",
            householdId: newHouseholdId,
            role: "adult",
            joinedAt: new Date(),
            createdAt: new Date(),
          },
        });
      } else {
        await db.collection("members").where({ openid: OPENID }).update({
          data: {
            householdId: newHouseholdId,
            role: "adult",
            uid: OPENID,
            joinedAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
      const after = await db.collection("members").where({ openid: OPENID }).limit(1).get();
      const doc = after.data[0] || {};
      await upsertHouseholdMember(OPENID, newHouseholdId, "adult", doc.display_name || "成员");
      await tryAudit(OPENID, "createHousehold", newHouseholdId, { name });
      const createResult = {
        ok: true,
        data: {
          householdId: newHouseholdId,
          name,
          openid: OPENID,
          display_name: doc.display_name || "成员",
          role: doc.role || "adult",
        },
      };
      if (idemKey) {
        try {
          await db.collection("family_idempotency").doc(idemKey).set({
            data: {
              savedAt: new Date(),
              action: "createHousehold",
              result: createResult,
            },
          });
        } catch (e) {
          console.error("[idempotency_save]", e && e.message);
        }
      }
      return createResult;
    }

    if (action === "joinHousehold") {
      if (!(await bumpRateLimit(OPENID, "joinHousehold", 24))) {
        return { ok: false, message: "尝试次数过多，请稍后再试" };
      }
      const rawCode = `${event.inviteCode || event.code || ""}`.trim().toUpperCase();
      if (!rawCode) return { ok: false, message: "请填写邀请码" };
      const inviteRows = await db.collection("invite_codes").where({ code: rawCode }).limit(1).get();
      if (!inviteRows.data.length) return { ok: false, message: "邀请码无效" };
      const inv = inviteRows.data[0];
      const exp = inv.expiresAt ? new Date(inv.expiresAt) : null;
      if (exp && exp.getTime() < Date.now()) return { ok: false, message: "邀请码已过期" };
      const maxUses =
        inv.maxUses != null && Number(inv.maxUses) > 0 ? Number(inv.maxUses) : 1;
      let usedCount = inv.usedCount != null ? Number(inv.usedCount) : 0;
      if (inv.usedAt && usedCount < 1) usedCount = 1;
      if (usedCount >= maxUses) {
        return {
          ok: false,
          message: maxUses === 1 ? "邀请码已使用" : "邀请码已达使用上限",
        };
      }
      if (inv.revokedAt) return { ok: false, message: "邀请码已作废" };

      const hid = inv.householdId;
      const hh = await db.collection("households").doc(hid).get();
      if (!hh.data || hh.data.dissolvedAt) {
        return { ok: false, message: "家庭已解散或不存在" };
      }
      const joinRole = inv.role === "senior" ? "senior" : "adult";
      const incomingName = (event.display_name && String(event.display_name).trim()) || "";

      const already = await db
        .collection("household_members")
        .where({ openid: OPENID, householdId: hid })
        .limit(1)
        .get();
      if (already.data.length) {
        await db.collection("members").where({ openid: OPENID }).update({
          data: { householdId: hid, role: joinRole, updatedAt: new Date() },
        });
        const after = await db.collection("members").where({ openid: OPENID }).limit(1).get();
        const doc = after.data[0] || {};
        return {
          ok: true,
          data: {
            householdId: hid,
            openid: OPENID,
            display_name: doc.display_name || "成员",
            role: joinRole,
          },
        };
      }

      const memRows = await db.collection("members").where({ openid: OPENID }).limit(1).get();
      const displayName = incomingName || (memRows.data.length && memRows.data[0].display_name) || "成员";

      if (!memRows.data.length) {
        await db.collection("members").add({
          data: {
            openid: OPENID,
            uid: OPENID,
            display_name: displayName,
            householdId: hid,
            role: joinRole,
            joinedAt: new Date(),
            createdAt: new Date(),
          },
        });
      } else {
        await db.collection("members").where({ openid: OPENID }).update({
          data: {
            householdId: hid,
            role: joinRole,
            display_name: incomingName || memRows.data[0].display_name || "成员",
            uid: OPENID,
            joinedAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }

      await upsertHouseholdMember(OPENID, hid, joinRole, displayName);

      const _ = db.command;
      await db.collection("invite_codes").doc(inv._id).update({
        data: {
          usedCount: _.inc(1),
          usedAt: new Date(),
          usedByOpenid: OPENID,
        },
      });

      const afterJoin = await db.collection("members").where({ openid: OPENID }).limit(1).get();
      const doc = afterJoin.data[0] || {};
      await tryAudit(OPENID, "joinHousehold", hid, {
        inviteSuffix: rawCode.length > 4 ? rawCode.slice(-4) : rawCode,
      });
      return {
        ok: true,
        data: {
          householdId: hid,
          openid: OPENID,
          display_name: doc.display_name || "成员",
          role: doc.role || joinRole,
        },
      };
    }

    if (action === "leaveHousehold") {
      const leaveHid = `${event.householdId || event.leaveHouseholdId || ""}`.trim();
      if (!leaveHid) return { ok: false, message: "householdId is required" };

      const toRemove = await db
        .collection("household_members")
        .where({ openid: OPENID, householdId: leaveHid })
        .get();
      for (const r of toRemove.data) {
        await db.collection("household_members").doc(r._id).remove();
      }

      const remaining = await listHouseholdMemberships(OPENID);
      const nextHid = remaining.length ? remaining[0].householdId : null;
      await db.collection("members").where({ openid: OPENID }).update({
        data: { householdId: nextHid, updatedAt: new Date() },
      });

      await tryAudit(OPENID, "leaveHousehold", leaveHid, { nextHouseholdId: nextHid });
      return {
        ok: true,
        data: {
          openid: OPENID,
          nextHouseholdId: nextHid,
        },
      };
    }

    if (!householdId) return { ok: false, message: "householdId is required" };

    if (action === "getHouseholdSummary") {
      const h = await db.collection("households").doc(householdId).get();
      if (!h.data) return { ok: false, message: "家庭不存在" };
      const mem = await db
        .collection("household_members")
        .where({ householdId, openid: OPENID })
        .limit(1)
        .get();
      if (!mem.data.length) return { ok: false, message: "无权查看" };
      return {
        ok: true,
        data: {
          name: h.data.name || "",
          createdBy: h.data.createdBy || "",
          dissolvedAt: h.data.dissolvedAt || null,
        },
      };
    }

    if (action === "dissolveHousehold") {
      if (!(await bumpRateLimit(OPENID, "dissolveHousehold", 4))) {
        return { ok: false, message: "操作过于频繁，请稍后再试" };
      }
      const h = await db.collection("households").doc(householdId).get();
      if (!h.data) return { ok: false, message: "家庭不存在" };
      if (h.data.dissolvedAt) return { ok: false, message: "家庭已解散" };
      if (h.data.createdBy !== OPENID) {
        return { ok: false, message: "仅家庭创建者可解散" };
      }
      const membersInHouse = await db.collection("household_members").where({ householdId }).get();
      const openids = [...new Set(membersInHouse.data.map((m) => m.openid))];
      for (const m of membersInHouse.data) {
        await db.collection("household_members").doc(m._id).remove();
      }
      for (const oid of openids) {
        const remaining = await listHouseholdMemberships(oid);
        const nextHid = remaining.length ? remaining[0].householdId : null;
        await db.collection("members").where({ openid: oid }).update({
          data: { householdId: nextHid, updatedAt: new Date() },
        });
      }
      await db.collection("households").doc(householdId).update({
        data: {
          dissolvedAt: new Date(),
          dissolvedBy: OPENID,
        },
      });
      await tryAudit(OPENID, "dissolveHousehold", householdId, { memberCount: openids.length });
      return { ok: true, data: { householdId } };
    }

    const householdGone = await assertHouseholdActive(householdId);
    if (householdGone) return householdGone;

    if (action === "revokeInviteCode") {
      const code = `${event.code || event.inviteCode || ""}`.trim().toUpperCase();
      if (!code) return { ok: false, message: "请填写邀请码" };
      const rows = await db.collection("invite_codes").where({ code }).limit(1).get();
      if (!rows.data.length) return { ok: false, message: "邀请码不存在" };
      const inv = rows.data[0];
      if (inv.householdId !== householdId) return { ok: false, message: "无权作废该邀请码" };
      if (inv.createdBy !== OPENID) {
        return { ok: false, message: "仅邀请码创建者可作废" };
      }
      if (inv.revokedAt) return { ok: false, message: "邀请码已作废" };
      const cap = inv.maxUses != null && Number(inv.maxUses) > 0 ? Number(inv.maxUses) : 1;
      await db.collection("invite_codes").doc(inv._id).update({
        data: {
          revokedAt: new Date(),
          usedCount: cap,
        },
      });
      await tryAudit(OPENID, "revokeInviteCode", householdId, {
        codeSuffix: code.length > 4 ? code.slice(-4) : code,
      });
      return { ok: true, data: { code } };
    }

    if (action === "getMorningBrief") {
      const records = await db
        .collection("morning_briefs")
        .where({ householdId })
        .orderBy("date", "desc")
        .limit(1)
        .get();
      return { ok: true, data: records.data[0] || null };
    }

    if (action === "createCheckIn") {
      const displayName = await getDisplayNameForHousehold(OPENID, householdId);
      const payload = {
        householdId,
        openid: OPENID,
        display_name: displayName,
        created_at: new Date(),
      };
      await db.collection("check_ins").add({ data: payload });
      return { ok: true, data: payload };
    }

    if (action === "listCheckIns") {
      const records = await db
        .collection("check_ins")
        .where({ householdId })
        .orderBy("created_at", "desc")
        .limit(20)
        .get();
      return { ok: true, data: records.data };
    }

    if (action === "getHealthSnapshot") {
      const records = await db
        .collection("health_snapshots")
        .where({ householdId })
        .orderBy("date", "desc")
        .limit(30)
        .get();
      return { ok: true, data: records.data };
    }

    if (action === "listAlbum") {
      const records = await db
        .collection("album_items")
        .where({ householdId })
        .orderBy("created_at", "desc")
        .limit(100)
        .get();
      return { ok: true, data: records.data };
    }

    if (action === "addAlbumPhoto") {
      const displayName = await getDisplayNameForHousehold(OPENID, householdId);
      const payload = {
        householdId,
        fileID: event.fileID,
        thumb_url: event.fileID,
        tags: event.tags || [],
        uploaded_by: displayName,
        created_at: new Date(),
      };
      const added = await db.collection("album_items").add({ data: payload });
      return { ok: true, data: { ...payload, _id: added._id } };
    }

    if (action === "listMembers") {
      const records = await db.collection("household_members").where({ householdId }).get();
      const data = records.data.map((m) => ({
        ...m,
        uid: m.uid || m.openid,
        display_name: m.display_name || "成员",
      }));
      return { ok: true, data };
    }

    if (action === "updateMemberRole") {
      const uid = event.uid;
      const role = event.role;
      await db.collection("household_members").where({ householdId, uid }).update({
        data: {
          role,
          updatedAt: new Date(),
        },
      });
      await tryAudit(OPENID, "updateMemberRole", householdId, { uid, role });
      return { ok: true, data: { uid, role } };
    }

    if (action === "createInviteCode") {
      const role = event.role === "senior" ? "senior" : "adult";
      const prefix = role === "senior" ? "SEN" : "ADU";
      const code = `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      let maxUses = parseInt(event.maxUses, 10);
      if (Number.isNaN(maxUses) || maxUses < 1) maxUses = 1;
      if (maxUses > 100) maxUses = 100;
      const payload = {
        householdId,
        code,
        role,
        maxUses,
        usedCount: 0,
        createdBy: OPENID,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      };
      await db.collection("invite_codes").add({ data: payload });
      await tryAudit(OPENID, "createInviteCode", householdId, {
        maxUses,
        role,
        codeSuffix: code.length > 4 ? code.slice(-4) : code,
      });
      return { ok: true, data: { code } };
    }

    if (action === "getVisibility") {
      const settings = await ensureVisibility(householdId, OPENID);
      return { ok: true, data: settings };
    }

    if (action === "updateVisibility") {
      const partial = event.partial || {};
      await ensureVisibility(householdId, OPENID);
      await db.collection("visibility_settings").where({ householdId, openid: OPENID }).update({
        data: {
          ...partial,
          updatedAt: new Date(),
        },
      });
      const next = await db
        .collection("visibility_settings")
        .where({ householdId, openid: OPENID })
        .limit(1)
        .get();
      return { ok: true, data: next.data[0] || null };
    }

    if (action === "getCheckinPolicy") {
      const rows = await db
        .collection("checkin_policies")
        .where({ householdId })
        .limit(1)
        .get();
      if (rows.data.length) return { ok: true, data: rows.data[0] };
      const defaults = {
        householdId,
        enabled: true,
        start_time: "08:00",
        end_time: "10:00",
        threshold_minutes: 60,
        second_reminder_enabled: false,
        second_reminder_minutes: 30,
        updated_at: new Date(),
      };
      await db.collection("checkin_policies").add({ data: defaults });
      return { ok: true, data: defaults };
    }

    if (action === "updateCheckinPolicy") {
      const partial = event.partial || {};
      const rows = await db
        .collection("checkin_policies")
        .where({ householdId })
        .limit(1)
        .get();
      if (!rows.data.length) {
        await db.collection("checkin_policies").add({
          data: {
            householdId,
            ...partial,
            updated_at: new Date(),
          },
        });
      } else {
        await db.collection("checkin_policies").doc(rows.data[0]._id).update({
          data: {
            ...partial,
            updated_at: new Date(),
          },
        });
      }
      const latest = await db
        .collection("checkin_policies")
        .where({ householdId })
        .limit(1)
        .get();
      return { ok: true, data: latest.data[0] || null };
    }

    if (action === "getCheckinAlerts") {
      const rows = await db
        .collection("checkin_alerts")
        .where({ householdId })
        .orderBy("created_at", "desc")
        .limit(20)
        .get();
      return { ok: true, data: rows.data };
    }

    if (action === "listCareReminders") {
      const rows = await db
        .collection("care_reminders")
        .where({ householdId })
        .orderBy("created_at", "desc")
        .limit(100)
        .get();
      return { ok: true, data: rows.data };
    }

    if (action === "addCareReminder") {
      const payload = {
        householdId,
        owner_openid: OPENID,
        type: event.type || "medicine",
        title: event.title || "未命名提醒",
        remind_at: event.remind_at || "08:00",
        repeat_rule: event.repeat_rule || "daily",
        status: "active",
        created_at: new Date(),
      };
      const added = await db.collection("care_reminders").add({ data: payload });
      return { ok: true, data: { ...payload, _id: added._id } };
    }

    if (action === "setCareReminderDone") {
      await db.collection("care_reminders").doc(event.id).update({
        data: {
          status: event.done ? "done" : "active",
          updated_at: new Date(),
        },
      });
      return { ok: true, data: { id: event.id, done: !!event.done } };
    }

    if (action === "createHelpRequest") {
      const type = event.type || "call_me";
      const payload = {
        householdId,
        sender_openid: OPENID,
        type,
        status: "sent",
        created_at: new Date(),
      };
      const added = await db.collection("help_requests").add({ data: payload });
      return { ok: true, data: { ...payload, _id: added._id } };
    }

    return { ok: false, message: `unknown action: ${action}` };
  } catch (err) {
    return { ok: false, message: err.message || "cloud function error" };
  }
};
