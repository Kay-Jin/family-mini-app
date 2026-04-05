const KEY_SENIOR_MODE = "senior_mode";
const KEY_USER_ROLE = "user_role";
const KEY_HELP_THROTTLE = "help_req_throttle_v1";

function getSeniorMode() {
  return !!wx.getStorageSync(KEY_SENIOR_MODE);
}

function setSeniorMode(enabled) {
  wx.setStorageSync(KEY_SENIOR_MODE, !!enabled);
}

function getLastHelpSentAt(type) {
  const raw = wx.getStorageSync(KEY_HELP_THROTTLE) || {};
  return Number(raw[type] || 0);
}

function markHelpSent(type) {
  const raw = wx.getStorageSync(KEY_HELP_THROTTLE) || {};
  raw[type] = Date.now();
  wx.setStorageSync(KEY_HELP_THROTTLE, raw);
}

module.exports = {
  getSeniorMode,
  setSeniorMode,
  getUserRole() {
    return wx.getStorageSync(KEY_USER_ROLE) || "adult";
  },
  setUserRole(role) {
    wx.setStorageSync(KEY_USER_ROLE, role || "adult");
  },
  getLastHelpSentAt,
  markHelpSent,
};
