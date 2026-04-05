const api = require("../services/apiConfig");

/**
 * CloudBase 且未绑定家庭时，赶去 onboarding。
 * @returns {boolean} 是否可继续当前页
 */
function ensureHouseholdForCloudbase() {
  if (api.getBackendMode() !== "cloudbase") return true;
  if (api.getHouseholdId()) return true;
  wx.reLaunch({ url: "/pages/onboarding/index" });
  return false;
}

module.exports = {
  ensureHouseholdForCloudbase,
};
