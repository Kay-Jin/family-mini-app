const DEFAULT_API_BASE_URL = "https://example.com";
const DEFAULT_USE_MOCK = true;
const DEFAULT_AUTH_TOKEN = "";
const DEFAULT_BACKEND_MODE = DEFAULT_USE_MOCK ? "mock" : "http";
const DEFAULT_CLOUD_ENV_ID = "";

/** Mock / 开发默认家庭 ID */
const MOCK_HOUSEHOLD_ID = "demo-household-001";
/** HTTP / Mock 默认用户 ID */
const DEFAULT_USER_ID = "u1";

const KEY_API_BASE_URL = "api_base_url";
const KEY_USE_MOCK = "use_mock";
const KEY_AUTH_TOKEN = "auth_token";
const KEY_BACKEND_MODE = "backend_mode";
const KEY_CLOUD_ENV_ID = "cloud_env_id";
const KEY_HOUSEHOLD_ID = "household_id";
const KEY_USER_ID = "user_id";

function getApiBaseUrl() {
  return wx.getStorageSync(KEY_API_BASE_URL) || DEFAULT_API_BASE_URL;
}

function setApiBaseUrl(url) {
  wx.setStorageSync(KEY_API_BASE_URL, (url || "").trim());
}

function getUseMock() {
  const mode = getBackendMode();
  if (mode === "mock") return true;
  if (mode === "http" || mode === "cloudbase") return false;
  const value = wx.getStorageSync(KEY_USE_MOCK);
  if (value === "" || typeof value === "undefined") return DEFAULT_USE_MOCK;
  return !!value;
}

function setUseMock(enabled) {
  wx.setStorageSync(KEY_USE_MOCK, !!enabled);
  setBackendMode(enabled ? "mock" : "http");
}

function getAuthToken() {
  return wx.getStorageSync(KEY_AUTH_TOKEN) || DEFAULT_AUTH_TOKEN;
}

function setAuthToken(token) {
  wx.setStorageSync(KEY_AUTH_TOKEN, (token || "").trim());
}

function getBackendMode() {
  const mode = wx.getStorageSync(KEY_BACKEND_MODE);
  if (mode === "mock" || mode === "http" || mode === "cloudbase") return mode;
  return DEFAULT_BACKEND_MODE;
}

function setBackendMode(mode) {
  const next = mode === "cloudbase" ? "cloudbase" : mode === "http" ? "http" : "mock";
  wx.setStorageSync(KEY_BACKEND_MODE, next);
}

function getCloudEnvId() {
  return wx.getStorageSync(KEY_CLOUD_ENV_ID) || DEFAULT_CLOUD_ENV_ID;
}

function setCloudEnvId(envId) {
  wx.setStorageSync(KEY_CLOUD_ENV_ID, (envId || "").trim());
}

/**
 * Mock 固定 demo；CloudBase 读 storage，次选 App.globalData；HTTP 无存储时用 demo 兜底。
 */
function getHouseholdId() {
  const mode = getBackendMode();
  if (mode === "mock") return MOCK_HOUSEHOLD_ID;
  const stored = wx.getStorageSync(KEY_HOUSEHOLD_ID);
  if (stored) return stored;
  try {
    const app = getApp();
    if (app && app.globalData && app.globalData.householdId) {
      return app.globalData.householdId;
    }
  } catch (e) {
    /* App 尚未就绪 */
  }
  if (mode === "http") return MOCK_HOUSEHOLD_ID;
  return "";
}

function setHouseholdId(id) {
  const v = `${id || ""}`.trim();
  if (!v) {
    wx.removeStorageSync(KEY_HOUSEHOLD_ID);
    try {
      const app = getApp();
      if (app && app.globalData) app.globalData.householdId = "";
    } catch (e) {}
    return;
  }
  wx.setStorageSync(KEY_HOUSEHOLD_ID, v);
  try {
    const app = getApp();
    if (app && app.globalData) app.globalData.householdId = v;
  } catch (e) {}
}

/** Mock 为 u1；CloudBase 侧为 openid（登录后写入） */
function getUserId() {
  const mode = getBackendMode();
  if (mode === "mock") return DEFAULT_USER_ID;
  return wx.getStorageSync(KEY_USER_ID) || DEFAULT_USER_ID;
}

function setUserId(id) {
  const v = `${id || ""}`.trim();
  if (!v) {
    wx.removeStorageSync(KEY_USER_ID);
    return;
  }
  wx.setStorageSync(KEY_USER_ID, v);
}

module.exports = {
  DEFAULT_API_BASE_URL,
  DEFAULT_USE_MOCK,
  DEFAULT_BACKEND_MODE,
  MOCK_HOUSEHOLD_ID,
  DEFAULT_USER_ID,
  getApiBaseUrl,
  setApiBaseUrl,
  getUseMock,
  setUseMock,
  getBackendMode,
  setBackendMode,
  getAuthToken,
  setAuthToken,
  getCloudEnvId,
  setCloudEnvId,
  getHouseholdId,
  setHouseholdId,
  getUserId,
  setUserId,
};
