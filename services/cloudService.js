const { HOUSEHOLD_ID } = require("./apiConfig");

function normalizeDoc(d) {
  if (!d || typeof d !== "object") return d;
  if (d._id != null && d.id == null) return { ...d, id: d._id };
  return d;
}

function normalizeData(d) {
  if (d == null) return d;
  if (Array.isArray(d)) return d.map(normalizeDoc);
  return normalizeDoc(d);
}

function call(action, payload) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: "family",
      data: {
        action,
        householdId: HOUSEHOLD_ID,
        ...(payload || {}),
      },
      success(res) {
        const data = res.result || {};
        if (data && data.ok === false) {
          reject(new Error(data.message || "cloud function failed"));
          return;
        }
        const raw = data.data !== undefined ? data.data : data;
        resolve(normalizeData(raw));
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
    const cloudPath = `album/${HOUSEHOLD_ID}/${Date.now()}-${Math.floor(
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
  createInviteCode(role) {
    return call("createInviteCode", { role });
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
  updateCareReminder(id, partial) {
    return call("updateCareReminder", { id, partial: partial || {} });
  },
  deleteCareReminder(id) {
    return call("deleteCareReminder", { id });
  },
  setCareReminderDone(id, done) {
    return call("setCareReminderDone", { id, done });
  },
  createHelpRequest(type, message) {
    return call("createHelpRequest", { type, message: message || "" });
  },
  listHelpRequests() {
    return call("listHelpRequests");
  },
  cancelHelpRequest(id) {
    return call("cancelHelpRequest", { id });
  },
  listDailyStatuses() {
    return call("listDailyStatuses");
  },
  addDailyStatus(payload) {
    return call("addDailyStatus", payload || {});
  },
  getStatusDigest() {
    return call("getStatusDigest");
  },
  getWeeklyReport() {
    return call("getWeeklyReport");
  },
  generateWeeklyReport() {
    return call("generateWeeklyReport");
  },
  bootstrapHouseAdmin() {
    return call("bootstrapHouseAdmin");
  },
};
