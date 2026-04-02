/** 首次进入各 Tab 的简单引导（仅本地偏好，非业务数据） */
const PREFIX = "ui_tour_v1_";

function key(pageId) {
  return PREFIX + pageId;
}

function hasSeenTour(pageId) {
  try {
    return !!wx.getStorageSync(key(pageId));
  } catch (e) {
    return false;
  }
}

function markTourSeen(pageId) {
  try {
    wx.setStorageSync(key(pageId), 1);
  } catch (e) {}
}

module.exports = {
  hasSeenTour,
  markTourSeen,
};
