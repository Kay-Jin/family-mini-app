const { getBackendMode, getHouseholdId, getUserId } = require("./apiConfig");
const mock = require("./mockService");
const cloud = require("./cloudService");
const { request, uploadFile } = require("./http");

function getMorningBrief() {
  const mode = getBackendMode();
  if (mode === "mock") return Promise.resolve(mock.getMorningBrief());
  if (mode === "cloudbase") return cloud.getMorningBrief();
  return request(`/households/${getHouseholdId()}/morning_briefs/today`);
}

function createCheckIn() {
  const mode = getBackendMode();
  if (mode === "mock") return Promise.resolve(mock.createCheckIn());
  if (mode === "cloudbase") return cloud.createCheckIn();
  return request(`/households/${getHouseholdId()}/check_ins`, "POST", {
    user_uid: getUserId(),
    client_locale: "zh-CN",
  });
}

function listCheckIns() {
  const mode = getBackendMode();
  if (mode === "mock") return Promise.resolve(mock.getCheckIns());
  if (mode === "cloudbase") return cloud.listCheckIns();
  return request(`/households/${getHouseholdId()}/check_ins?limit=20`);
}

function getHealthSnapshot() {
  const mode = getBackendMode();
  if (mode === "mock") return Promise.resolve(mock.getHealthSnapshot());
  if (mode === "cloudbase") return cloud.getHealthSnapshot();
  return request(`/households/${getHouseholdId()}/health_snapshots?uid=${getUserId()}`);
}

function listAlbum() {
  const mode = getBackendMode();
  if (mode === "mock") return Promise.resolve(mock.listAlbum());
  if (mode === "cloudbase") return cloud.listAlbum();
  return request(`/households/${getHouseholdId()}/album`);
}

function addAlbumPhoto({ localPath, tags }) {
  const mode = getBackendMode();
  if (mode === "mock") {
    return Promise.resolve(
      mock.addAlbumPhoto({
        local_path: localPath,
        tags: tags || ["日常"],
        uploaded_by: "我",
      })
    );
  }
  if (mode === "cloudbase") return cloud.addAlbumPhoto({ localPath, tags });
  return uploadFile(`/households/${getHouseholdId()}/album/upload`, localPath, {
    user_uid: getUserId(),
    tags: (tags || []).join(","),
  });
}

function listMembers() {
  const mode = getBackendMode();
  if (mode === "mock") return Promise.resolve(mock.listMembers());
  if (mode === "cloudbase") return cloud.listMembers();
  return request(`/households/${getHouseholdId()}/members`);
}

function updateMemberRole(uid, role) {
  const mode = getBackendMode();
  if (mode === "mock") return Promise.resolve(mock.updateMemberRole(uid, role));
  if (mode === "cloudbase") return cloud.updateMemberRole(uid, role);
  return request(`/households/${getHouseholdId()}/members/${uid}`, "PATCH", { role });
}

function createInviteCode(role, maxUses) {
  const mode = getBackendMode();
  if (mode === "mock") return Promise.resolve({ code: mock.createInviteCode(role, maxUses) });
  if (mode === "cloudbase") return cloud.createInviteCode(role, maxUses);
  return request(`/households/${getHouseholdId()}/invite_codes`, "POST", {
    role,
    max_uses: maxUses,
    maxUses,
  });
}

function getHouseholdSummary() {
  const mode = getBackendMode();
  if (mode === "mock") return Promise.resolve(mock.getHouseholdSummary());
  if (mode === "cloudbase") return cloud.getHouseholdSummary();
  return request(`/households/${getHouseholdId()}/summary`);
}

function revokeInviteCode(code) {
  const mode = getBackendMode();
  if (mode === "mock") return Promise.resolve(mock.revokeInviteCode(code));
  if (mode === "cloudbase") return cloud.revokeInviteCode(code);
  return request(`/households/${getHouseholdId()}/invite_codes/revoke`, "POST", { code });
}

async function dissolveHousehold() {
  const mode = getBackendMode();
  if (mode === "mock") {
    await Promise.resolve(mock.dissolveHousehold());
    return;
  }
  if (mode === "cloudbase") {
    const auth = require("./authService");
    await auth.dissolveHouseholdCloud();
    return;
  }
  await request(`/households/${getHouseholdId()}/dissolve`, "POST", {});
  const api = require("./apiConfig");
  api.setHouseholdId("");
}

function listInviteCodes() {
  const mode = getBackendMode();
  if (mode === "mock") return Promise.resolve(mock.listInviteCodes());
  if (mode === "cloudbase") return cloud.listInviteCodes();
  return request(`/households/${getHouseholdId()}/invite_codes`).then((res) => {
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    if (res && Array.isArray(res.items)) return res.items;
    return [];
  });
}

function updateHouseholdName(name) {
  const mode = getBackendMode();
  if (mode === "mock") return Promise.resolve(mock.updateHouseholdName(name));
  if (mode === "cloudbase") return cloud.updateHouseholdName(name);
  return request(`/households/${getHouseholdId()}`, "PATCH", { name });
}

function getVisibility() {
  const mode = getBackendMode();
  if (mode === "mock") return Promise.resolve(mock.getVisibility());
  if (mode === "cloudbase") return cloud.getVisibility();
  return request(`/households/${getHouseholdId()}/settings/${getUserId()}`);
}

function updateVisibility(partial) {
  const mode = getBackendMode();
  if (mode === "mock") return Promise.resolve(mock.updateVisibility(partial));
  if (mode === "cloudbase") return cloud.updateVisibility(partial);
  return request(`/households/${getHouseholdId()}/settings/${getUserId()}`, "PATCH", partial);
}

function getCheckinPolicy() {
  const mode = getBackendMode();
  if (mode === "mock") return Promise.resolve(mock.getCheckinPolicy());
  if (mode === "cloudbase") return cloud.getCheckinPolicy();
  return request(`/households/${getHouseholdId()}/checkin_policy`);
}

function updateCheckinPolicy(partial) {
  const mode = getBackendMode();
  if (mode === "mock") return Promise.resolve(mock.updateCheckinPolicy(partial));
  if (mode === "cloudbase") return cloud.updateCheckinPolicy(partial);
  return request(`/households/${getHouseholdId()}/checkin_policy`, "PATCH", partial);
}

function getCheckinAlerts() {
  const mode = getBackendMode();
  if (mode === "mock") return Promise.resolve(mock.getCheckinAlerts());
  if (mode === "cloudbase") return cloud.getCheckinAlerts();
  return request(`/households/${getHouseholdId()}/checkin_alerts?limit=20`);
}

function listCareReminders() {
  const mode = getBackendMode();
  if (mode === "mock") return Promise.resolve(mock.listCareReminders());
  if (mode === "cloudbase") return cloud.listCareReminders();
  return request(`/households/${getHouseholdId()}/care_reminders`);
}

function addCareReminder(payload) {
  const mode = getBackendMode();
  if (mode === "mock") return Promise.resolve(mock.addCareReminder(payload));
  if (mode === "cloudbase") return cloud.addCareReminder(payload);
  return request(`/households/${getHouseholdId()}/care_reminders`, "POST", payload);
}

function setCareReminderDone(id, done) {
  const mode = getBackendMode();
  if (mode === "mock") return Promise.resolve(mock.setCareReminderDone(id, done));
  if (mode === "cloudbase") return cloud.setCareReminderDone(id, done);
  return request(`/households/${getHouseholdId()}/care_reminders/${id}`, "PATCH", { done });
}

function createHelpRequest(type) {
  const mode = getBackendMode();
  if (mode === "mock") return Promise.resolve(mock.createHelpRequest(type));
  if (mode === "cloudbase") return cloud.createHelpRequest(type);
  return request(`/households/${getHouseholdId()}/help_requests`, "POST", { type });
}

module.exports = {
  getMorningBrief,
  createCheckIn,
  listCheckIns,
  getHealthSnapshot,
  listAlbum,
  addAlbumPhoto,
  listMembers,
  updateMemberRole,
  createInviteCode,
  getHouseholdSummary,
  revokeInviteCode,
  dissolveHousehold,
  listInviteCodes,
  updateHouseholdName,
  getVisibility,
  updateVisibility,
  getCheckinPolicy,
  updateCheckinPolicy,
  getCheckinAlerts,
  listCareReminders,
  addCareReminder,
  setCareReminderDone,
  createHelpRequest,
};
