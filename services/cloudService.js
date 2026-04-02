const { getHouseholdId } = require("./apiConfig");

function call(action, payload) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: "family",
      data: {
        action,
        householdId: getHouseholdId(),
        ...(payload || {}),
      },
      success(res) {
        const data = res.result || {};
        if (data && data.ok === false) {
          reject(new Error(data.message || "cloud function failed"));
          return;
        }
        resolve(data.data || data);
      },
      fail(err) {
        reject(new Error(err.errMsg || "cloud call failed"));
      },
    });
  });
}

function uploadToCloud(localPath) {
  return new Promise((resolve, reject) => {
    const ext = (localPath.split(".").pop() || "jpg").toLowerCase();
    const cloudPath = `album/${getHouseholdId()}/${Date.now()}-${Math.floor(
      Math.random() * 10000
    )}.${ext}`;
    wx.cloud.uploadFile({
      cloudPath,
      filePath: localPath,
      success(res) {
        resolve(res.fileID);
      },
      fail(err) {
        reject(new Error(err.errMsg || "cloud upload failed"));
      },
    });
  });
}

module.exports = {
  getMorningBrief() {
    return call("getMorningBrief");
  },
  createCheckIn() {
    return call("createCheckIn");
  },
  listCheckIns() {
    return call("listCheckIns");
  },
  getHealthSnapshot() {
    return call("getHealthSnapshot");
  },
  listAlbum() {
    return call("listAlbum");
  },
  async addAlbumPhoto({ localPath, tags }) {
    const fileID = await uploadToCloud(localPath);
    return call("addAlbumPhoto", { fileID, tags: tags || ["日常"] });
  },
  listMembers() {
    return call("listMembers");
  },
  updateMemberRole(uid, role) {
    return call("updateMemberRole", { uid, role });
  },
  createInviteCode(role, maxUses) {
    return call("createInviteCode", { role, maxUses });
  },
  getVisibility() {
    return call("getVisibility");
  },
  updateVisibility(partial) {
    return call("updateVisibility", { partial });
  },
  getCheckinPolicy() {
    return call("getCheckinPolicy");
  },
  updateCheckinPolicy(partial) {
    return call("updateCheckinPolicy", { partial });
  },
  getCheckinAlerts() {
    return call("getCheckinAlerts");
  },
  listCareReminders() {
    return call("listCareReminders");
  },
  addCareReminder(payload) {
    return call("addCareReminder", payload || {});
  },
  setCareReminderDone(id, done) {
    return call("setCareReminderDone", { id, done });
  },
  createHelpRequest(type) {
    return call("createHelpRequest", { type });
  },
};
