const DEFAULT_API_BASE_URL = "https://example.com";
const DEFAULT_USE_MOCK = true;
const DEFAULT_AUTH_TOKEN = "";
const HOUSEHOLD_ID = "demo-household-001";
const USER_ID = "u1";

const KEY_API_BASE_URL = "api_base_url";
const KEY_USE_MOCK = "use_mock";
const KEY_AUTH_TOKEN = "auth_token";

function getApiBaseUrl() {
  return wx.getStorageSync(KEY_API_BASE_URL) || DEFAULT_API_BASE_URL;
}

function setApiBaseUrl(url) {
  wx.setStorageSync(KEY_API_BASE_URL, (url || "").trim());
}

function getUseMock() {
  const value = wx.getStorageSync(KEY_USE_MOCK);
  if (value === "" || typeof value === "undefined") return DEFAULT_USE_MOCK;
  return !!value;
}

function setUseMock(enabled) {
  wx.setStorageSync(KEY_USE_MOCK, !!enabled);
}

function getAuthToken() {
  return wx.getStorageSync(KEY_AUTH_TOKEN) || DEFAULT_AUTH_TOKEN;
}

function setAuthToken(token) {
  wx.setStorageSync(KEY_AUTH_TOKEN, (token || "").trim());
}

module.exports = {
  DEFAULT_API_BASE_URL,
  DEFAULT_USE_MOCK,
  getApiBaseUrl,
  setApiBaseUrl,
  getUseMock,
  setUseMock,
  getAuthToken,
  setAuthToken,
  HOUSEHOLD_ID,
  USER_ID,
};
