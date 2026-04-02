const api = require("./apiConfig");
const storage = require("../utils/storage");

function wxLogin() {
  return new Promise((resolve, reject) => {
    wx.login({
      success(res) {
        if (res.code) resolve(res.code);
        else reject(new Error("wx.login 未返回 code"));
      },
      fail: reject,
    });
  });
}

/**
 * 调用 family 云函数（可不带 householdId，用于 onboarding）
 * @param {Record<string, unknown>} payload
 */
function callFamily(payload) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: "family",
      data: payload,
      success(res) {
        const result = res.result || {};
        if (result.ok === false) {
          reject(new Error(result.message || "云函数调用失败"));
          return;
        }
        resolve(result.data !== undefined ? result.data : result);
      },
      fail(err) {
        reject(new Error(err.errMsg || "云函数调用失败"));
      },
    });
  });
}

function persistProfile(profile) {
  if (!profile) return;
  if (profile.householdId) api.setHouseholdId(profile.householdId);
  if (profile.display_name) storage.setDisplayName(profile.display_name);
  if (profile.role) storage.setUserRole(profile.role);
  if (profile.openid) api.setUserId(profile.openid);
}

async function getOrCreateUserCloud() {
  await wxLogin();
  return callFamily({
    action: "getOrCreateUser",
    activeHouseholdId: api.getHouseholdId() || undefined,
  });
}

async function createHouseholdCloud(householdName) {
  await wxLogin();
  const clientRequestId = `ch_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
  const data = await callFamily({
    action: "createHousehold",
    householdName: (householdName || "").trim(),
    clientRequestId,
  });
  persistProfile(data);
  return data;
}

async function joinHouseholdCloud(inviteCode, displayName) {
  await wxLogin();
  const data = await callFamily({
    action: "joinHousehold",
    inviteCode: (inviteCode || "").trim(),
    display_name: displayName,
  });
  persistProfile(data);
  return data;
}

/**
 * CloudBase：拉取/创建用户；若已绑定家庭则同步到本地。
 * @returns {Promise<{ hasHousehold: boolean, profile: object }>}
 */
async function bootstrapCloudbase() {
  if (!wx.cloud) {
    throw new Error("当前环境不支持云开发");
  }
  const profile = await getOrCreateUserCloud();
  const hasHousehold = !!profile.householdId;
  if (hasHousehold) persistProfile(profile);
  return { hasHousehold, profile };
}

/** 离开当前家庭：移除 `household_members` 中对应关系，并同步下一活跃家庭或清空 */
async function leaveHouseholdCloud() {
  const hid = api.getHouseholdId();
  if (!hid) throw new Error("当前未选择家庭");
  await wxLogin();
  await callFamily({ action: "leaveHousehold", householdId: hid });
  const profile = await callFamily({
    action: "getOrCreateUser",
    activeHouseholdId: "",
  });
  if (profile.householdId) persistProfile(profile);
  else {
    api.setHouseholdId("");
    try {
      const app = getApp();
      if (app && app.globalData) app.globalData.householdId = "";
    } catch (e) {}
  }
}

/** 解散当前家庭（仅创建者）；同步本地活跃家庭或清空 */
async function dissolveHouseholdCloud() {
  const hid = api.getHouseholdId();
  if (!hid) throw new Error("当前未选择家庭");
  await wxLogin();
  await callFamily({ action: "dissolveHousehold", householdId: hid });
  const profile = await callFamily({
    action: "getOrCreateUser",
    activeHouseholdId: "",
  });
  if (profile.householdId) persistProfile(profile);
  else {
    api.setHouseholdId("");
    try {
      const app = getApp();
      if (app && app.globalData) app.globalData.householdId = "";
    } catch (e) {}
  }
}

module.exports = {
  wxLogin,
  callFamily,
  persistProfile,
  getOrCreateUserCloud,
  createHouseholdCloud,
  joinHouseholdCloud,
  bootstrapCloudbase,
  leaveHouseholdCloud,
  dissolveHouseholdCloud,
};
