const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

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

exports.main = async (event) => {
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
