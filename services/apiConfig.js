const DEFAULT_API_BASE_URL = "https://example.com";
const DEFAULT_USE_MOCK = true;
const DEFAULT_AUTH_TOKEN = "";
const DEFAULT_BACKEND_MODE = DEFAULT_USE_MOCK ? "mock" : "http";
const DEFAULT_CLOUD_ENV_ID = "";
const HOUSEHOLD_ID = "demo-household-001";
const USER_ID = "u1";

const KEY_API_BASE_URL = "api_base_url";
const KEY_USE_MOCK = "use_mock";
const KEY_AUTH_TOKEN = "auth_token";
const KEY_BACKEND_MODE = "backend_mode";
const KEY_CLOUD_ENV_ID = "cloud_env_id";

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

module.exports = {
  DEFAULT_API_BASE_URL,
  DEFAULT_USE_MOCK,
  DEFAULT_BACKEND_MODE,
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
  HOUSEHOLD_ID,
  USER_ID,
};
