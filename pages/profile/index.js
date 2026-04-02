const {
  getSeniorMode,
  setSeniorMode,
  getUserRole,
  setUserRole,
  setDisplayName,
} = require("../../utils/storage");
const { ensureHouseholdForCloudbase } = require("../../utils/routeGuard");
const auth = require("../../services/authService");
const {
  getApiBaseUrl,
  setApiBaseUrl,
  getBackendMode,
  setBackendMode,
  getCloudEnvId,
  setCloudEnvId,
  getAuthToken,
  setAuthToken,
  getHouseholdId,
  setHouseholdId,
  getUserId,
} = require("../../services/apiConfig");

Page({
  data: {
    seniorMode: false,
    role: "adult",
    roleOptions: [
      { label: "成年成员（adult）", value: "adult" },
      { label: "长辈成员（senior）", value: "senior" },
    ],
    backendMode: "mock",
    backendModeOptions: [
      { value: "mock", label: "Mock（本地模拟）" },
      { value: "cloudbase", label: "CloudBase（微信云开发）" },
      { value: "http", label: "HTTP API（自建后端）" },
    ],
    apiBaseUrl: "",
    cloudEnvId: "",
    authToken: "",
    myHouseholds: [],
  },

  async onShow() {
    if (!ensureHouseholdForCloudbase()) return;
    this.setData({
      seniorMode: getSeniorMode(),
      role: getUserRole(),
      backendMode: getBackendMode(),
      apiBaseUrl: getApiBaseUrl(),
      cloudEnvId: getCloudEnvId(),
      authToken: getAuthToken(),
    });
    if (getBackendMode() === "cloudbase") {
      try {
        const p = await auth.getOrCreateUserCloud();
        this.setData({ myHouseholds: p.memberships || [] });
      } catch (e) {
        this.setData({ myHouseholds: [] });
      }
    } else {
      this.setData({ myHouseholds: [] });
    }
  },

  onSwitchHousehold(e) {
    const hid = e.currentTarget.dataset.hid;
    if (!hid) return;
    const item = (this.data.myHouseholds || []).find((h) => h.householdId === hid);
    if (!item) return;
    setHouseholdId(hid);
    try {
      const app = getApp();
      if (app && app.globalData) app.globalData.householdId = hid;
    } catch (err) {}
    setUserRole(item.role);
    setDisplayName(item.display_name || "");
    auth.persistProfile({
      householdId: hid,
      role: item.role,
      display_name: item.display_name,
      openid: getUserId(),
    });
    this.setData({ role: item.role });
    wx.showToast({ title: "已切换家庭", icon: "success" });
    wx.switchTab({ url: "/pages/today/index" });
  },

  onSeniorSwitch(e) {
    const enabled = !!e.detail.value;
    setSeniorMode(enabled);
    this.setData({ seniorMode: enabled });
    wx.showToast({ title: enabled ? "已开启长辈模式" : "已关闭长辈模式", icon: "none" });
  },

  goHousehold() {
    wx.navigateTo({ url: "/pages/profile/household/index" });
  },

  goVisibility() {
    wx.navigateTo({ url: "/pages/profile/visibility/index" });
  },

  onRoleChange(e) {
    const role = e.detail.value;
    setUserRole(role);
    this.setData({ role });
    wx.showToast({ title: `当前角色：${role}`, icon: "none" });
  },

  onBackendModeChange(e) {
    const mode = e.detail.value || "mock";
    setBackendMode(mode);
    this.setData({ backendMode: mode });
    wx.showToast({ title: `后端模式：${mode}`, icon: "none" });
  },

  onApiInput(e) {
    this.setData({ apiBaseUrl: e.detail.value || "" });
  },

  onTokenInput(e) {
    this.setData({ authToken: e.detail.value || "" });
  },

  onCloudEnvInput(e) {
    this.setData({ cloudEnvId: e.detail.value || "" });
  },

  onSaveApiConfig() {
    setApiBaseUrl(this.data.apiBaseUrl);
    setCloudEnvId(this.data.cloudEnvId);
    setAuthToken(this.data.authToken);
    if (wx.cloud && this.data.cloudEnvId) {
      wx.cloud.init({
        env: this.data.cloudEnvId,
        traceUser: true,
      });
    }
    wx.showToast({ title: "接口配置已保存", icon: "success" });
  },

  onLeaveHousehold() {
    if (getBackendMode() !== "cloudbase") return;
    wx.showModal({
      title: "退出当前家庭",
      content: "将离开当前家庭。若你还加入了其他家庭，会自动切换到剩余家庭；否则将回到「加入家庭」流程。是否继续？",
      confirmText: "退出",
      success: async (res) => {
        if (!res.confirm) return;
        wx.showLoading({ title: "处理中" });
        try {
          await auth.leaveHouseholdCloud();
          wx.hideLoading();
          if (getHouseholdId()) {
            wx.showToast({ title: "已离开该家庭", icon: "success" });
          } else {
            wx.showToast({ title: "已退出", icon: "success" });
            wx.reLaunch({ url: "/pages/onboarding/index" });
          }
        } catch (err) {
          wx.hideLoading();
          wx.showToast({ title: err.message || "操作失败", icon: "none" });
        }
      },
    });
  },
});
