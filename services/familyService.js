const { getUseMock, HOUSEHOLD_ID, USER_ID } = require("./apiConfig");
const mock = require("./mockService");
const { request, uploadFile } = require("./http");

function getMorningBrief() {
  const USE_MOCK = getUseMock();
  if (USE_MOCK) return Promise.resolve(mock.getMorningBrief());
  return request(`/households/${HOUSEHOLD_ID}/morning_briefs/today`);
}

function createCheckIn() {
  const USE_MOCK = getUseMock();
  if (USE_MOCK) return Promise.resolve(mock.createCheckIn());
  return request(`/households/${HOUSEHOLD_ID}/check_ins`, "POST", {
    user_uid: USER_ID,
    client_locale: "zh-CN",
  });
}

function listCheckIns() {
  const USE_MOCK = getUseMock();
  if (USE_MOCK) return Promise.resolve(mock.getCheckIns());
  return request(`/households/${HOUSEHOLD_ID}/check_ins?limit=20`);
}

function getHealthSnapshot() {
  const USE_MOCK = getUseMock();
  if (USE_MOCK) return Promise.resolve(mock.getHealthSnapshot());
  return request(`/households/${HOUSEHOLD_ID}/health_snapshots?uid=${USER_ID}`);
}

function listAlbum() {
  const USE_MOCK = getUseMock();
  if (USE_MOCK) return Promise.resolve(mock.listAlbum());
  return request(`/households/${HOUSEHOLD_ID}/album`);
}

function addAlbumPhoto({ localPath, tags }) {
  const USE_MOCK = getUseMock();
  if (USE_MOCK) {
    return Promise.resolve(
      mock.addAlbumPhoto({
        local_path: localPath,
        tags: tags || ["日常"],
        uploaded_by: "我",
      })
    );
  }
  return uploadFile(`/households/${HOUSEHOLD_ID}/album/upload`, localPath, {
    user_uid: USER_ID,
    tags: (tags || []).join(","),
  });
}

function listMembers() {
  const USE_MOCK = getUseMock();
  if (USE_MOCK) return Promise.resolve(mock.listMembers());
  return request(`/households/${HOUSEHOLD_ID}/members`);
}

function updateMemberRole(uid, role) {
  const USE_MOCK = getUseMock();
  if (USE_MOCK) return Promise.resolve(mock.updateMemberRole(uid, role));
  return request(`/households/${HOUSEHOLD_ID}/members/${uid}`, "PATCH", { role });
}

function createInviteCode(role) {
  const USE_MOCK = getUseMock();
  if (USE_MOCK) return Promise.resolve({ code: mock.createInviteCode(role) });
  return request(`/households/${HOUSEHOLD_ID}/invite_codes`, "POST", { role });
}

function getVisibility() {
  const USE_MOCK = getUseMock();
  if (USE_MOCK) return Promise.resolve(mock.getVisibility());
  return request(`/households/${HOUSEHOLD_ID}/settings/${USER_ID}`);
}

function updateVisibility(partial) {
  const USE_MOCK = getUseMock();
  if (USE_MOCK) return Promise.resolve(mock.updateVisibility(partial));
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
