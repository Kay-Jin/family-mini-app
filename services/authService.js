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
  return callFamily({ action: "getOrCreateUser" });
}

async function createHouseholdCloud(householdName) {
  await wxLogin();
  const data = await callFamily({
    action: "createHousehold",
    householdName: (householdName || "").trim(),
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

/** 退出当前家庭：云侧清空 householdId，本地清除存储 */
async function leaveHouseholdCloud() {
  await wxLogin();
  await callFamily({ action: "leaveHousehold" });
  api.setHouseholdId("");
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
};
