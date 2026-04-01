const { USE_MOCK, HOUSEHOLD_ID, USER_ID } = require("./apiConfig");
const mock = require("./mockService");
const { request, uploadFile } = require("./http");

function getMorningBrief() {
  if (USE_MOCK) return Promise.resolve(mock.getMorningBrief());
  return request(`/households/${HOUSEHOLD_ID}/morning_briefs/today`);
}

function createCheckIn() {
  if (USE_MOCK) return Promise.resolve(mock.createCheckIn());
  return request(`/households/${HOUSEHOLD_ID}/check_ins`, "POST", {
    user_uid: USER_ID,
    client_locale: "zh-CN",
  });
}

function getHealthSnapshot() {
  if (USE_MOCK) return Promise.resolve(mock.getHealthSnapshot());
  return request(`/households/${HOUSEHOLD_ID}/health_snapshots?uid=${USER_ID}`);
}

function listAlbum() {
  if (USE_MOCK) return Promise.resolve(mock.listAlbum());
  return request(`/households/${HOUSEHOLD_ID}/album`);
}

function addAlbumPhoto({ localPath, tags }) {
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
  if (USE_MOCK) return Promise.resolve(mock.listMembers());
  return request(`/households/${HOUSEHOLD_ID}/members`);
}

function getVisibility() {
  if (USE_MOCK) return Promise.resolve(mock.getVisibility());
  return request(`/households/${HOUSEHOLD_ID}/settings/${USER_ID}`);
}

function updateVisibility(partial) {
  if (USE_MOCK) return Promise.resolve(mock.updateVisibility(partial));
  return request(`/households/${HOUSEHOLD_ID}/settings/${USER_ID}`, "PATCH", partial);
}

module.exports = {
  getMorningBrief,
  createCheckIn,
  getHealthSnapshot,
  listAlbum,
  addAlbumPhoto,
  listMembers,
  getVisibility,
  updateVisibility,
};
