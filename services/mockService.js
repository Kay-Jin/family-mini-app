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
  void maxUses;
  const prefix = role === "senior" ? "SEN" : "ADU";
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
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
    remind_at: payload.remind_at || "08:00",
    repeat_rule: payload.repeat_rule || "daily",
    status: "active",
  };
  careReminders.unshift(item);
  return item;
}

function setCareReminderDone(id, done) {
  const target = careReminders.find((r) => r.id === id);
  if (!target) throw new Error("reminder not found");
  target.status = done ? "done" : "active";
  return { ...target };
}

function createHelpRequest(type) {
  const t = type || "call_me";
  const item = {
    id: `h-${Date.now()}`,
    type: t,
    message:
      t === "unwell"
        ? "身体不适，需要联系"
        : t === "companionship"
        ? "需要陪同帮助"
        : "请尽快联系我",
    created_at: Date.now(),
    status: "sent",
  };
  helpRequests.unshift(item);
  return item;
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
  getCheckinPolicy,
  updateCheckinPolicy,
  getCheckinAlerts,
  listCareReminders,
  addCareReminder,
  setCareReminderDone,
  createHelpRequest,
  getVisibility,
  updateVisibility,
};
