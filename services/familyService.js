const { getBackendMode, HOUSEHOLD_ID, USER_ID } = require("./apiConfig");
const mock = require("./mockService");
const cloud = require("./cloudService");
const { request, uploadFile } = require("./http");

function getMorningBrief() {
  const mode = getBackendMode();
  if (mode === "mock") return Promise.resolve(mock.getMorningBrief());
  if (mode === "cloudbase") return cloud.getMorningBrief();
  return request(`/households/${HOUSEHOLD_ID}/morning_briefs/today`);
}

function createCheckIn() {
  const mode = getBackendMode();
  if (mode === "mock") return Promise.resolve(mock.createCheckIn());
  if (mode === "cloudbase") return cloud.createCheckIn();
  return request(`/households/${HOUSEHOLD_ID}/check_ins`, "POST", {
    user_uid: USER_ID,
    client_locale: "zh-CN",
  });
}

function listCheckIns() {
  const mode = getBackendMode();
  if (mode === "mock") return Promise.resolve(mock.getCheckIns());
  if (mode === "cloudbase") return cloud.listCheckIns();
  return request(`/households/${HOUSEHOLD_ID}/check_ins?limit=20`);
}

function getHealthSnapshot() {
  const mode = getBackendMode();
  if (mode === "mock") return Promise.resolve(mock.getHealthSnapshot());
  if (mode === "cloudbase") return cloud.getHealthSnapshot();
  return request(`/households/${HOUSEHOLD_ID}/health_snapshots?uid=${USER_ID}`);
}

function listAlbum() {
  const mode = getBackendMode();
  if (mode === "mock") return Promise.resolve(mock.listAlbum());
  if (mode === "cloudbase") return cloud.listAlbum();
  return request(`/households/${HOUSEHOLD_ID}/album`);
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
  return uploadFile(`/households/${HOUSEHOLD_ID}/album/upload`, localPath, {
    user_uid: USER_ID,
    tags: (tags || []).join(","),
  });
}

function listMembers() {
  const mode = getBackendMode();
  if (mode === "mock") return Promise.resolve(mock.listMembers());
  if (mode === "cloudbase") return cloud.listMembers();
  return request(`/households/${HOUSEHOLD_ID}/members`);
}

function updateMemberRole(uid, role) {
  const mode = getBackendMode();
  if (mode === "mock") return Promise.resolve(mock.updateMemberRole(uid, role));
  if (mode === "cloudbase") return cloud.updateMemberRole(uid, role);
  return request(`/households/${HOUSEHOLD_ID}/members/${uid}`, "PATCH", { role });
}

function createInviteCode(role) {
  const mode = getBackendMode();
  if (mode === "mock") return Promise.resolve({ code: mock.createInviteCode(role) });
  if (mode === "cloudbase") return cloud.createInviteCode(role);
  return request(`/households/${HOUSEHOLD_ID}/invite_codes`, "POST", { role });
}

function getVisibility() {
  const mode = getBackendMode();
  if (mode === "mock") return Promise.resolve(mock.getVisibility());
  if (mode === "cloudbase") return cloud.getVisibility();
  return request(`/households/${HOUSEHOLD_ID}/settings/${USER_ID}`);
}

function updateVisibility(partial) {
  const mode = getBackendMode();
  if (mode === "mock") return Promise.resolve(mock.updateVisibility(partial));
  if (mode === "cloudbase") return cloud.updateVisibility(partial);
  return request(`/households/${HOUSEHOLD_ID}/settings/${USER_ID}`, "PATCH", partial);
}

function getCheckinPolicy() {
  const mode = getBackendMode();
  if (mode === "mock") return Promise.resolve(mock.getCheckinPolicy());
  if (mode === "cloudbase") return cloud.getCheckinPolicy();
  return request(`/households/${HOUSEHOLD_ID}/checkin_policy`);
}

function updateCheckinPolicy(partial) {
  const mode = getBackendMode();
  if (mode === "mock") return Promise.resolve(mock.updateCheckinPolicy(partial));
  if (mode === "cloudbase") return cloud.updateCheckinPolicy(partial);
  return request(`/households/${HOUSEHOLD_ID}/checkin_policy`, "PATCH", partial);
}

function getCheckinAlerts() {
  const mode = getBackendMode();
  if (mode === "mock") return Promise.resolve(mock.getCheckinAlerts());
  if (mode === "cloudbase") return cloud.getCheckinAlerts();
  return request(`/households/${HOUSEHOLD_ID}/checkin_alerts?limit=20`);
}

function listCareReminders() {
  const mode = getBackendMode();
  if (mode === "mock") return Promise.resolve(mock.listCareReminders());
  if (mode === "cloudbase") return cloud.listCareReminders();
  return request(`/households/${HOUSEHOLD_ID}/care_reminders`);
}

function addCareReminder(payload) {
  const mode = getBackendMode();
  if (mode === "mock") return Promise.resolve(mock.addCareReminder(payload));
  if (mode === "cloudbase") return cloud.addCareReminder(payload);
  return request(`/households/${HOUSEHOLD_ID}/care_reminders`, "POST", payload);
}

function setCareReminderDone(id, done) {
  const mode = getBackendMode();
  if (mode === "mock") return Promise.resolve(mock.setCareReminderDone(id, done));
  if (mode === "cloudbase") return cloud.setCareReminderDone(id, done);
  return request(`/households/${HOUSEHOLD_ID}/care_reminders/${id}`, "PATCH", { done });
}

function createHelpRequest(type) {
  const mode = getBackendMode();
  if (mode === "mock") return Promise.resolve(mock.createHelpRequest(type));
  if (mode === "cloudbase") return cloud.createHelpRequest(type);
  return request(`/households/${HOUSEHOLD_ID}/help_requests`, "POST", { type });
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
