const mockMembers = [
  { uid: "u1", display_name: "爸爸", role: "adult", is_senior_mode: false },
  { uid: "u2", display_name: "奶奶", role: "senior", is_senior_mode: true },
];

const mockVisibility = {
  share_step_band: true,
  share_sleep_summary: true,
  share_city_weather: true,
  share_last_checkin_time: true,
  share_album_contribute: true,
  include_in_morning_brief: true,
};

const checkInHistory = [
  { id: "c1", user_uid: "u2", display_name: "奶奶", created_at: "今天 07:58" },
  { id: "c2", user_uid: "u1", display_name: "爸爸", created_at: "今天 08:15" },
];

const checkInPolicy = {
  enabled: true,
  start_time: "08:00",
  end_time: "10:00",
  threshold_minutes: 60,
  second_reminder_enabled: false,
  second_reminder_minutes: 30,
  target_openids: [],
};

let checkInAlerts = [
  {
    id: "a1",
    member_name: "奶奶",
    level: "attention",
    message: "今日09:20尚未报平安",
    created_at: "今天 09:20",
  },
];

const careReminders = [
  {
    id: "r1",
    type: "medicine",
    title: "早餐后降压药",
    remind_at: "08:00",
    repeat_rule: "daily",
    status: "active",
  },
  {
    id: "r2",
    type: "followup",
    title: "心内科复诊",
    remind_at: "2026-04-10 09:00",
    repeat_rule: "none",
    status: "active",
  },
];

const helpRequests = [];
const dailyStatuses = [
  {
    id: "s1",
    date: "2026-04-01",
    mood: "平稳",
    sleep_hours: 6.5,
    appetite: "正常",
    note: "上午精神不错，午休30分钟。",
    created_at: "今天 09:10",
  },
];

let mockHouseholdName = "演示家庭";
let mockHouseholdDissolved = false;
let mockInviteCodeRows = [
  {
    _id: "mock-inv-seed",
    code: "ADU-DEMO1",
    role: "adult",
    maxUses: 5,
    usedCount: 0,
    expiresAt: null,
    revokedAt: null,
    createdAt: new Date(),
    createdByOpenid: "u1",
    status: "active",
  },
];

function getMorningBrief() {
  return {
    date: "2026-04-01",
    summary_text: "昨晚奶奶睡眠6.5小时，今天天气晴，心情平稳。",
    city_weather: "杭州 22°C 晴",
    member_snippets: [
      { uid: "u1", display_name: "爸爸", note: "今天上午开会，晚饭后有空。" },
      { uid: "u2", display_name: "奶奶", note: "早晨散步了20分钟。" },
    ],
  };
}

function createCheckIn() {
  const now = new Date();
  const hh = `${now.getHours()}`.padStart(2, "0");
  const mm = `${now.getMinutes()}`.padStart(2, "0");
  const item = {
    id: `c-${Date.now()}`,
    user_uid: "u1",
    display_name: "我",
    created_at: `今天 ${hh}:${mm}`,
  };
  checkInHistory.unshift(item);
  checkInAlerts = [];
  return { success: true, created_at: Date.now(), latest: item };
}

function getHealthSnapshot() {
  return [
    { uid: "u2", date: "2026-04-01", steps: 3120, sleep_hours: 6.5, source: "mock" },
    { uid: "u2", date: "2026-03-31", steps: 4210, sleep_hours: 7.1, source: "mock" },
  ];
}

const mockAlbum = [
  { id: "p1", thumb_url: "", tags: ["早餐", "家人"], uploaded_by: "爸爸", created_at: "今天 08:10" },
  { id: "p2", thumb_url: "", tags: ["散步"], uploaded_by: "奶奶", created_at: "昨天 18:40" },
];

function listAlbum() {
  return [...mockAlbum];
}

function addAlbumPhoto(payload) {
  const now = new Date();
  const hh = `${now.getHours()}`.padStart(2, "0");
  const mm = `${now.getMinutes()}`.padStart(2, "0");
  const item = {
    id: `p-${Date.now()}`,
    thumb_url: payload.thumb_url || payload.local_path || "",
    tags: payload.tags || ["日常"],
    uploaded_by: payload.uploaded_by || "我",
    created_at: `今天 ${hh}:${mm}`,
  };
  mockAlbum.unshift(item);
  return item;
}

function listMembers() {
  return mockMembers.map((m) => ({ ...m }));
}

function updateMemberRole(uid, role) {
  const target = mockMembers.find((m) => m.uid === uid);
  if (!target) throw new Error("member not found");
  target.role = role || "adult";
  return { ...target };
}

function getCheckIns() {
  return [...checkInHistory];
}

function createInviteCode(role, maxUses) {
  const mu =
    maxUses != null && Number(maxUses) > 0 ? Math.min(100, Number(maxUses)) : 1;
  const rrole = role === "senior" ? "senior" : "adult";
  const prefix = rrole === "senior" ? "SEN" : "ADU";
  const code = `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  mockInviteCodeRows.unshift({
    _id: `mock-${Date.now()}`,
    code,
    role: rrole,
    maxUses: mu,
    usedCount: 0,
    expiresAt: null,
    revokedAt: null,
    createdAt: new Date(),
    createdByOpenid: "u1",
    status: "active",
  });
  return code;
}

function getHouseholdSummary() {
  return {
    name: mockHouseholdName,
    createdBy: "u1",
    dissolvedAt: mockHouseholdDissolved ? new Date().toISOString() : null,
  };
}

function revokeInviteCode(inviteCode) {
  const c = `${inviteCode || ""}`.trim().toUpperCase();
  const row = mockInviteCodeRows.find((x) => x.code === c);
  if (!row) throw new Error("邀请码不存在");
  row.revokedAt = new Date();
  row.status = "revoked";
  row.usedCount = row.maxUses;
  return { code: c };
}

function dissolveHousehold() {
  mockHouseholdDissolved = true;
  return { householdId: null };
}

function listInviteCodes() {
  return mockInviteCodeRows.map((r) => ({ ...r }));
}

function updateHouseholdName(name) {
  const n = `${name || ""}`.trim();
  if (n) mockHouseholdName = n;
  return { name: mockHouseholdName };
}

function getCheckinPolicy() {
  return { ...checkInPolicy };
}

function updateCheckinPolicy(partial) {
  Object.assign(checkInPolicy, partial || {});
  return { ...checkInPolicy };
}

function getCheckinAlerts() {
  if (!checkInPolicy.enabled) return [];
  return [...checkInAlerts];
}

function listCareReminders() {
  return [...careReminders];
}

function addCareReminder(payload) {
  const item = {
    id: `r-${Date.now()}`,
    type: payload.type || "medicine",
    title: payload.title || "未命名提醒",
    note: payload.note || "",
    remind_at: payload.remind_at || "08:00",
    repeat_rule: payload.repeat_rule || "daily",
    advance_days: Number(payload.advance_days || 0),
    visibility: payload.visibility === "self" ? "self" : "household",
    status: "active",
  };
  careReminders.unshift(item);
  return item;
}

function updateCareReminder(id, partial) {
  const target = careReminders.find((r) => r.id === id);
  if (!target) throw new Error("reminder not found");
  Object.assign(target, partial || {});
  return { ...target };
}

function deleteCareReminder(id) {
  const i = careReminders.findIndex((r) => r.id === id);
  if (i < 0) throw new Error("reminder not found");
  careReminders.splice(i, 1);
  return { id };
}

function setCareReminderDone(id, done) {
  const target = careReminders.find((r) => r.id === id);
  if (!target) throw new Error("reminder not found");
  target.status = done ? "done" : "active";
  return { ...target };
}

function createHelpRequest(type, message) {
  const t = type || "call_me";
  const item = {
    id: `h-${Date.now()}`,
    type: t,
    message:
      message ||
      (t === "unwell"
        ? "身体不适，需要联系"
        : t === "companionship"
        ? "需要陪同帮助"
        : "请尽快联系我"),
    created_at: Date.now(),
    status: "sent",
  };
  helpRequests.unshift(item);
  return item;
}

function listHelpRequests() {
  return [...helpRequests];
}

function cancelHelpRequest(id) {
  const t = helpRequests.find((h) => h.id === id);
  if (!t) throw new Error("not found");
  if (Date.now() - t.created_at > 3 * 60 * 1000) throw new Error("已超过撤回时间");
  t.status = "cancelled";
  return { id };
}

let weeklyReportCache = null;

function getWeeklyReport() {
  return weeklyReportCache;
}

function bootstrapHouseAdmin() {
  if (mockMembers.some((m) => (m.role || "") === "admin")) {
    throw new Error("当前家庭已有管理员");
  }
  if (!mockMembers.length) throw new Error("未找到成员");
  mockMembers[0].role = "admin";
  return { role: "admin" };
}

function generateWeeklyReport() {
  weeklyReportCache = {
    week_start: "2026-03-30",
    week_end: "2026-04-05",
    checkin_count: checkInHistory.length,
    album_new_count: mockAlbum.length,
    health_summary: { steps_avg: 4000, sleep_avg: 6.5 },
    highlights: [{ type: "demo", detail: "mock 周报" }],
    generated_at: new Date().toISOString(),
  };
  return weeklyReportCache;
}

function listDailyStatuses() {
  return [...dailyStatuses];
}

function addDailyStatus(payload) {
  const now = new Date();
  const hh = `${now.getHours()}`.padStart(2, "0");
  const mm = `${now.getMinutes()}`.padStart(2, "0");
  const item = {
    id: `s-${Date.now()}`,
    date: payload.date || "今天",
    mood: payload.mood || "平稳",
    sleep_hours: Number(payload.sleep_hours || 0),
    appetite: payload.appetite || "正常",
    note: payload.note || "",
    created_at: `今天 ${hh}:${mm}`,
  };
  dailyStatuses.unshift(item);
  return item;
}

function getStatusDigest() {
  if (!dailyStatuses.length) return null;
  const latest = dailyStatuses[0];
  return {
    date: latest.date,
    summary: `睡眠${latest.sleep_hours}小时，心情${latest.mood}，食欲${latest.appetite}`,
    note: latest.note || "无补充备注",
  };
}

function updateVisibility(partial) {
  Object.assign(mockVisibility, partial || {});
  return mockVisibility;
}

function getVisibility() {
  return { ...mockVisibility };
}

module.exports = {
  getMorningBrief,
  createCheckIn,
  getHealthSnapshot,
  listAlbum,
  addAlbumPhoto,
  listMembers,
  updateMemberRole,
  getCheckIns,
  createInviteCode,
  getHouseholdSummary,
  revokeInviteCode,
  dissolveHousehold,
  listInviteCodes,
  updateHouseholdName,
  getCheckinPolicy,
  updateCheckinPolicy,
  getCheckinAlerts,
  listCareReminders,
  addCareReminder,
  updateCareReminder,
  deleteCareReminder,
  setCareReminderDone,
  createHelpRequest,
  listHelpRequests,
  cancelHelpRequest,
  listDailyStatuses,
  addDailyStatus,
  getStatusDigest,
  getVisibility,
  updateVisibility,
  getWeeklyReport,
  generateWeeklyReport,
  bootstrapHouseAdmin,
};
