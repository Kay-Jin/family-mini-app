const { getHouseholdId } = require("./apiConfig");

/** @param {{ result?: { ok?: boolean, message?: string, data?: unknown } }} res */
function unwrapResult(res) {
  const result = res.result || {};
  if (result.ok === false) {
    throw new Error(result.message || "云函数调用失败");
  }
  return result.data !== undefined ? result.data : result;
}

/**
 * 调用 `family` 云函数，`data` 由调用方完整构造（适合 onboarding / 无 household 场景）。
 * @param {Record<string, unknown>} data
 */
function callFamilyRaw(data) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: "family",
      data,
      success(res) {
        try {
          resolve(unwrapResult(res));
        } catch (e) {
          reject(e);
        }
      },
      fail(err) {
        reject(new Error(err.errMsg || "云函数调用失败"));
      },
    });
  });
}

/**
 * 自动附带当前 `householdId`（与业务接口约定一致）。
 * @param {string} action
 * @param {Record<string, unknown>} [payload]
 */
function callFamilyAuthed(action, payload) {
  return callFamilyRaw({
    action,
    householdId: getHouseholdId(),
    ...(payload || {}),
  });
}

module.exports = {
  callFamilyRaw,
  callFamilyAuthed,
};
