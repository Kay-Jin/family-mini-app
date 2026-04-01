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
};
