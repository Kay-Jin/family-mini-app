const KEY_SENIOR_MODE = "senior_mode";

function getSeniorMode() {
  return !!wx.getStorageSync(KEY_SENIOR_MODE);
}

function setSeniorMode(enabled) {
  wx.setStorageSync(KEY_SENIOR_MODE, !!enabled);
}

module.exports = {
  getSeniorMode,
  setSeniorMode,
};
