const { USE_MOCK, HOUSEHOLD_ID, USER_ID } = require("./apiConfig");
const mock = require("./mockService");
const { request } = require("./http");

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
  listMembers,
  getVisibility,
  updateVisibility,
};
