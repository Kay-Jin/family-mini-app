const { getSeniorMode, setSeniorMode, getUserRole, setUserRole } = require("../../utils/storage");
const {
  getApiBaseUrl,
  setApiBaseUrl,
  getUseMock,
  setUseMock,
  getAuthToken,
  setAuthToken,
} = require("../../services/apiConfig");

Page({
  data: {
    seniorMode: false,
    role: "adult",
    roleOptions: [
      { label: "成年成员（adult）", value: "adult" },
      { label: "长辈成员（senior）", value: "senior" },
    ],
    useMock: true,
    apiBaseUrl: "",
    authToken: "",
  },

  onShow() {
    this.setData({
      seniorMode: getSeniorMode(),
      role: getUserRole(),
      useMock: getUseMock(),
      apiBaseUrl: getApiBaseUrl(),
      authToken: getAuthToken(),
    });
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

  onUseMockChange(e) {
    const enabled = !!e.detail.value;
    setUseMock(enabled);
    this.setData({ useMock: enabled });
    wx.showToast({ title: enabled ? "已切换 Mock" : "已切换真实接口", icon: "none" });
  },

  onApiInput(e) {
    this.setData({ apiBaseUrl: e.detail.value || "" });
  },

  onTokenInput(e) {
    this.setData({ authToken: e.detail.value || "" });
  },

  onSaveApiConfig() {
    setApiBaseUrl(this.data.apiBaseUrl);
    setAuthToken(this.data.authToken);
    wx.showToast({ title: "接口配置已保存", icon: "success" });
  },
});
