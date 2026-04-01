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

function getMorningBrief() {
  return {
    date: "2026-04-01",
    summary_text: "昨晚奶奶睡眠6.5小时，今天天气晴，心情平稳。",
    member_snippets: [
      { uid: "u1", display_name: "爸爸", note: "今天上午开会，晚饭后有空。" },
      { uid: "u2", display_name: "奶奶", note: "早晨散步了20分钟。" },
    ],
  };
}

function createCheckIn() {
  return { success: true, created_at: Date.now() };
}

function getHealthSnapshot() {
  return [
    { uid: "u2", date: "2026-04-01", steps: 3120, sleep_hours: 6.5, source: "mock" },
    { uid: "u2", date: "2026-03-31", steps: 4210, sleep_hours: 7.1, source: "mock" },
  ];
}

function listAlbum() {
  return [
    { id: "p1", thumb_url: "", tags: ["早餐", "家人"], uploaded_by: "爸爸", created_at: "今天 08:10" },
    { id: "p2", thumb_url: "", tags: ["散步"], uploaded_by: "奶奶", created_at: "昨天 18:40" },
  ];
}

function listMembers() {
  return mockMembers;
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
  listMembers,
  getVisibility,
  updateVisibility,
};
