const KEY_SENIOR_MODE = "senior_mode";
const KEY_USER_ROLE = "user_role";
const KEY_DISPLAY_NAME = "display_name";

function getSeniorMode() {
  return !!wx.getStorageSync(KEY_SENIOR_MODE);
}

function setSeniorMode(enabled) {
  wx.setStorageSync(KEY_SENIOR_MODE, !!enabled);
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
  getDisplayName() {
    return wx.getStorageSync(KEY_DISPLAY_NAME) || "";
  },
  setDisplayName(name) {
    wx.setStorageSync(KEY_DISPLAY_NAME, (name || "").trim());
  },
};
