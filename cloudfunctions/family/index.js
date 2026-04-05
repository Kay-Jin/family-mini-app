const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

function bjDateKey(now = new Date()) {
  return now.toLocaleDateString("sv-SE", { timeZone: "Asia/Shanghai" });
}

function bjMinutesFromMidnight(now = new Date()) {
  const s = now.toLocaleTimeString("en-GB", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const [h, m] = s.split(":").map((x) => parseInt(x, 10) || 0);
  return h * 60 + m;
}

function bjHour(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(now);
  return parseInt(parts.find((p) => p.type === "hour").value, 10);
}

function bjDayOfWeek(now = new Date()) {
  const s = now.toLocaleDateString("sv-SE", { timeZone: "Asia/Shanghai" });
  const [y, mo, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
}

function parseHm(str) {
  if (!str || typeof str !== "string") return 8 * 60;
  const [h, m] = str.split(":").map((x) => parseInt(x, 10) || 0);
  return h * 60 + m;
}

function createdAtToBjDateKey(createdAt) {
  const d = createdAt instanceof Date ? createdAt : new Date(createdAt);
  return bjDateKey(d);
}

function createdAtToBjMinutes(createdAt) {
  const d = createdAt instanceof Date ? createdAt : new Date(createdAt);
  return bjMinutesFromMidnight(d);
}

function timeInWindow(mins, startMin, endMin) {
  return mins >= startMin && mins <= endMin;
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

async function getDisplayName(openid) {
  const memberRes = await db.collection("members").where({ openid }).limit(1).get();
  if (memberRes.data.length) return memberRes.data[0].display_name || "成员";
  return "成员";
}

async function assertCanEditPolicy(householdId, openid) {
  const m = await db.collection("members").where({ householdId, openid }).limit(1).get();
  if (!m.data.length) {
    const err = new Error("非家庭成员，无法修改策略");
    err.code = "FORBIDDEN";
    throw err;
  }
  const role = m.data[0].role || "adult";
  const admins = await db.collection("members").where({ householdId, role: "admin" }).count();
  if (admins.total > 0 && role !== "admin") {
    const err = new Error("仅家庭管理员可修改提醒策略");
    err.code = "FORBIDDEN";
    throw err;
  }
}

async function countMemberAlertsDay(householdId, memberOpenid, dateKey) {
  const c = await db
    .collection("checkin_alerts")
    .where({ householdId, member_openid: memberOpenid, date_key: dateKey })
    .count();
  return c.total || 0;
}

async function evaluateOnePolicy(policy) {
  if (!policy.enabled) return { inserted: 0 };
  const householdId = policy.householdId;
  const startMin = parseHm(policy.start_time || "08:00");
  const endMin = parseHm(policy.end_time || "10:00");
  const threshold = Number(policy.threshold_minutes || 60);
  const now = new Date();
  const nowMin = bjMinutesFromMidnight(now);
  const dateKey = bjDateKey(now);

  if (nowMin < startMin + threshold) return { inserted: 0 };
  if (nowMin > endMin + threshold + 180) return { inserted: 0 };

  const [membersRes, checkRes] = await Promise.all([
    db.collection("members").where({ householdId }).get(),
    db.collection("check_ins").where({ householdId }).orderBy("created_at", "desc").limit(200).get(),
  ]);

  const members = membersRes.data || [];
  const checkInsToday = (checkRes.data || []).filter((c) => createdAtToBjDateKey(c.created_at) === dateKey);

  const maxAlerts = policy.second_reminder_enabled ? 2 : 1;
  const secondGapMin = Number(policy.second_reminder_minutes || 30);
  let inserted = 0;

  for (const m of members) {
    const oid = m.openid || m.uid;
    if (!oid) continue;
    const hasInWindow = checkInsToday.some((c) => {
      const same = (c.openid || c.user_uid) === oid;
      if (!same) return false;
      const cm = createdAtToBjMinutes(c.created_at);
      return timeInWindow(cm, startMin, endMin);
    });
    if (hasInWindow) continue;

    const n = await countMemberAlertsDay(householdId, oid, dateKey);
    if (n >= maxAlerts) continue;

    if (policy.second_reminder_enabled && n === 1) {
      const last = await db
        .collection("checkin_alerts")
        .where({ householdId, member_openid: oid, date_key: dateKey })
        .orderBy("created_at", "desc")
        .limit(1)
        .get();
      if (last.data.length) {
        const lastAt = new Date(last.data[0].created_at).getTime();
        if (Date.now() - lastAt < secondGapMin * 60 * 1000) continue;
      }
    }

    await db.collection("checkin_alerts").add({
      data: {
        householdId,
        member_openid: oid,
        member_name: m.display_name || "成员",
        message: `${m.display_name || "成员"}在今日监控时段内尚未报平安`,
        level: "attention",
        created_at: new Date(),
        date_key: dateKey,
      },
    });
    inserted += 1;
  }
  return { inserted };
}

async function scanAllCheckinPolicies() {
  const policies = await db.collection("checkin_policies").where({ enabled: true }).get();
  let alertsInserted = 0;
  for (const p of policies.data || []) {
    const r = await evaluateOnePolicy(p);
    alertsInserted += r.inserted || 0;
  }
  return { scanned: (policies.data || []).length, alertsInserted };
}

async function generateWeeklyForHousehold(householdId) {
  const now = new Date();
  const end = bjDateKey(now);
  const startDate = new Date(now.getTime() - 7 * 86400000);
  const start = bjDateKey(startDate);

  const [checks, album, helps, reminders, snaps] = await Promise.all([
    db.collection("check_ins").where({ householdId }).limit(500).get(),
    db.collection("album_items").where({ householdId }).limit(500).get(),
    db.collection("help_requests").where({ householdId }).limit(200).get(),
    db.collection("care_reminders").where({ householdId }).limit(200).get(),
    db.collection("health_snapshots").where({ householdId }).orderBy("date", "desc").limit(14).get(),
  ]);

  const inRange = (ts) => {
    const k = createdAtToBjDateKey(ts);
    return k >= start && k <= end;
  };

  const checkin_count = (checks.data || []).filter((x) => inRange(x.created_at)).length;
  const album_new_count = (album.data || []).filter((x) => inRange(x.created_at)).length;
  const highlights = [];
  (helps.data || [])
    .filter((x) => inRange(x.created_at))
    .forEach((h) => {
      highlights.push({ type: "help", at: h.created_at, detail: h.type });
    });
  (reminders.data || [])
    .filter((r) => r.type === "followup")
    .forEach((r) => {
      highlights.push({ type: "followup", title: r.title });
    });

  let steps = 0;
  let sleep = 0;
  let c = 0;
  (snaps.data || []).forEach((s) => {
    steps += Number(s.steps || 0);
    sleep += Number(s.sleep_hours || 0);
    c += 1;
  });

  const row = {
    householdId,
    week_start: start,
    week_end: end,
    checkin_count,
    album_new_count,
    health_summary: {
      steps_avg: c ? Math.round(steps / c) : 0,
      sleep_avg: c ? Math.round((sleep / c) * 10) / 10 : 0,
    },
    highlights,
    generated_at: new Date(),
  };
  await db.collection("weekly_reports").add({ data: row });
  return row;
}

async function maybeGenerateWeeklyReports() {
  if (bjDayOfWeek() !== 0) return { skipped: "not_sunday" };
  if (bjHour() !== 22) return { skipped: "not_22h" };

  const mem = await db.collection("members").field({ householdId: true }).limit(1000).get();
  let ids = [...new Set((mem.data || []).map((m) => m.householdId).filter(Boolean))];
  if (!ids.length) {
    const pol = await db.collection("checkin_policies").field({ householdId: true }).limit(500).get();
    ids = [...new Set((pol.data || []).map((p) => p.householdId).filter(Boolean))];
  }
  let n = 0;
  for (const householdId of ids) {
    await generateWeeklyForHousehold(householdId);
    n += 1;
  }
  return { generated: n };
}

exports.main = async (event) => {
  try {
    if (event && event.Type === "Timer") {
      if (event.TriggerName === "checkinMissTimer") {
        const data = await scanAllCheckinPolicies();
        return { ok: true, data };
      }
      if (event.TriggerName === "weeklyReportTimer") {
        const data = await maybeGenerateWeeklyReports();
        return { ok: true, data };
      }
    }
  } catch (e) {
    return { ok: false, message: e.message || "timer error" };
  }

  const { OPENID } = cloud.getWXContext();
  const action = event.action;
  const householdId = event.householdId;

  try {
    if (!householdId) return { ok: false, message: "householdId is required" };

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
      const displayName = await getDisplayName(OPENID);
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
      const displayName = await getDisplayName(OPENID);
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
      const records = await db.collection("members").where({ householdId }).get();
      return { ok: true, data: records.data };
    }

    if (action === "updateMemberRole") {
      const uid = event.uid;
      const role = event.role;
      await db.collection("members").where({ householdId, uid }).update({
        data: {
          role,
          updatedAt: new Date(),
        },
      });
      return { ok: true, data: { uid, role } };
    }

    if (action === "createInviteCode") {
      const role = event.role === "senior" ? "senior" : "adult";
      const prefix = role === "senior" ? "SEN" : "ADU";
      const code = `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const payload = {
        householdId,
        code,
        role,
        createdBy: OPENID,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      };
      await db.collection("invite_codes").add({ data: payload });
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
      const rows = await db.collection("checkin_policies").where({ householdId }).limit(1).get();
      if (rows.data.length) return { ok: true, data: rows.data[0] };
      const defaults = {
        householdId,
        enabled: true,
        start_time: "08:00",
        end_time: "10:00",
        threshold_minutes: 60,
        second_reminder_enabled: false,
        second_reminder_minutes: 30,
        target_openids: [],
        updated_at: new Date(),
      };
      await db.collection("checkin_policies").add({ data: defaults });
      return { ok: true, data: defaults };
    }

    if (action === "updateCheckinPolicy") {
      await assertCanEditPolicy(householdId, OPENID);
      const partial = event.partial || {};
      const rows = await db.collection("checkin_policies").where({ householdId }).limit(1).get();
      if (!rows.data.length) {
        await db.collection("checkin_policies").add({
          data: {
            householdId,
            start_time: "08:00",
            end_time: "10:00",
            threshold_minutes: 60,
            second_reminder_enabled: false,
            second_reminder_minutes: 30,
            target_openids: [],
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
      const latest = await db.collection("checkin_policies").where({ householdId }).limit(1).get();
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
        note: event.note || "",
        remind_at: event.remind_at || "08:00",
        repeat_rule: event.repeat_rule || "daily",
        advance_days: Number(event.advance_days || 0),
        visibility: event.visibility === "self" ? "self" : "household",
        status: "active",
        created_at: new Date(),
      };
      const added = await db.collection("care_reminders").add({ data: payload });
      return { ok: true, data: { ...payload, _id: added._id } };
    }

    if (action === "updateCareReminder") {
      const id = event.id;
      const row = await db.collection("care_reminders").doc(id).get();
      const doc = row.data;
      if (!doc || !doc._id) return { ok: false, message: "reminder not found" };
      if (doc.householdId !== householdId) return { ok: false, message: "forbidden" };
      if (doc.owner_openid !== OPENID) return { ok: false, message: "仅创建者可编辑" };
      const raw = event.partial || {};
      const partial = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== undefined));
      await db.collection("care_reminders").doc(id).update({
        data: {
          ...partial,
          updated_at: new Date(),
        },
      });
      const next = await db.collection("care_reminders").doc(id).get();
      return { ok: true, data: next.data || null };
    }

    if (action === "deleteCareReminder") {
      const id = event.id;
      const row = await db.collection("care_reminders").doc(id).get();
      const doc = row.data;
      if (!doc || !doc._id) return { ok: false, message: "reminder not found" };
      if (doc.householdId !== householdId) return { ok: false, message: "forbidden" };
      if (doc.owner_openid !== OPENID) return { ok: false, message: "仅创建者可删除" };
      await db.collection("care_reminders").doc(id).remove();
      return { ok: true, data: { id } };
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
        message: event.message || "",
        status: "sent",
        created_at: new Date(),
      };
      const added = await db.collection("help_requests").add({ data: payload });
      return { ok: true, data: { ...payload, _id: added._id } };
    }

    if (action === "listHelpRequests") {
      const rows = await db
        .collection("help_requests")
        .where({ householdId })
        .orderBy("created_at", "desc")
        .limit(50)
        .get();
      return { ok: true, data: rows.data };
    }

    if (action === "cancelHelpRequest") {
      const id = event.id;
      const row = await db.collection("help_requests").doc(id).get();
      const doc = row.data;
      if (!doc || !doc._id) return { ok: false, message: "not found" };
      if (doc.householdId !== householdId) return { ok: false, message: "forbidden" };
      if (doc.sender_openid !== OPENID) return { ok: false, message: "仅本人可撤回" };
      const age = Date.now() - new Date(doc.created_at).getTime();
      if (age > 3 * 60 * 1000) return { ok: false, message: "已超过撤回时间" };
      await db.collection("help_requests").doc(id).update({
        data: { status: "cancelled", updated_at: new Date() },
      });
      return { ok: true, data: { id } };
    }

    if (action === "getWeeklyReport") {
      const rows = await db
        .collection("weekly_reports")
        .where({ householdId })
        .orderBy("generated_at", "desc")
        .limit(1)
        .get();
      return { ok: true, data: rows.data[0] || null };
    }

    if (action === "generateWeeklyReport") {
      const row = await generateWeeklyForHousehold(householdId);
      return { ok: true, data: row };
    }

    if (action === "listDailyStatuses") {
      const rows = await db
        .collection("daily_statuses")
        .where({ householdId })
        .orderBy("created_at", "desc")
        .limit(30)
        .get();
      return { ok: true, data: rows.data };
    }

    if (action === "addDailyStatus") {
      const payload = {
        householdId,
        openid: OPENID,
        date: event.date || new Date().toISOString().slice(0, 10),
        mood: event.mood || "平稳",
        sleep_hours: Number(event.sleep_hours || 0),
        appetite: event.appetite || "正常",
        note: event.note || "",
        created_at: new Date(),
      };
      const added = await db.collection("daily_statuses").add({ data: payload });
      return { ok: true, data: { ...payload, _id: added._id } };
    }

    if (action === "getStatusDigest") {
      const rows = await db
        .collection("daily_statuses")
        .where({ householdId })
        .orderBy("created_at", "desc")
        .limit(1)
        .get();
      if (!rows.data.length) return { ok: true, data: null };
      const latest = rows.data[0];
      return {
        ok: true,
        data: {
          date: latest.date,
          summary: `睡眠${latest.sleep_hours}小时，心情${latest.mood}，食欲${latest.appetite}`,
          note: latest.note || "无补充备注",
        },
      };
    }

    if (action === "bootstrapHouseAdmin") {
      const members = await db.collection("members").where({ householdId }).get();
      const list = members.data || [];
      const hasAdmin = list.some((m) => (m.role || "") === "admin");
      if (hasAdmin) {
        return { ok: false, message: "当前家庭已有管理员" };
      }
      const meRes = await db.collection("members").where({ householdId, openid: OPENID }).limit(1).get();
      if (!meRes.data.length) {
        return { ok: false, message: "未找到你的成员记录，请先完成加入家庭流程" };
      }
      const docId = meRes.data[0]._id;
      await db.collection("members").doc(docId).update({
        data: { role: "admin", updatedAt: new Date() },
      });
      return { ok: true, data: { role: "admin" } };
    }

    return { ok: false, message: `unknown action: ${action}` };
  } catch (err) {
    return { ok: false, message: err.message || "cloud function error" };
  }
};
