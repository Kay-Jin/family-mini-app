const api = require("../../services/apiConfig");
const auth = require("../../services/authService");

Page({
  data: {
    mode: "choose",
    loading: true,
    bootstrapError: "",
    householdName: "",
    inviteCode: "",
    displayName: "",
    submitting: false,
    myHouseholds: [],
    cloudOpenid: "",
  },

  onLoad() {
    this.setData({ loading: true, bootstrapError: "" });
    this.runEntryFlow();
  },

  async runEntryFlow() {
    const app = getApp();
    const bootstrap = await app.globalData.authReadyPromise;
    if (bootstrap && bootstrap.error) {
      this.setData({
        loading: false,
        bootstrapError: bootstrap.error.message || "初始化失败",
      });
      return;
    }
    const mode = api.getBackendMode();
    if (mode !== "cloudbase") {
      wx.switchTab({ url: "/pages/today/index" });
      return;
    }
    if (api.getHouseholdId()) {
      wx.switchTab({ url: "/pages/today/index" });
      return;
    }
    try {
      const profile = await auth.getOrCreateUserCloud();
      if (profile.householdId) {
        auth.persistProfile(profile);
        wx.switchTab({ url: "/pages/today/index" });
        return;
      }
      const list = profile.memberships || [];
      if (list.length > 1) {
        this.setData({
          loading: false,
          mode: "pickHousehold",
          myHouseholds: list,
          cloudOpenid: profile.openid || "",
        });
        return;
      }
      if (list.length === 1) {
        const only = list[0];
        auth.persistProfile({
          householdId: only.householdId,
          role: only.role,
          display_name: only.display_name,
          openid: profile.openid,
        });
        wx.switchTab({ url: "/pages/today/index" });
        return;
      }
    } catch (e) {
      this.setData({
        loading: false,
        bootstrapError: e.message || "加载失败",
      });
      return;
    }
    this.setData({ loading: false });
  },

  onPickHousehold(e) {
    const hid = e.currentTarget.dataset.hid;
    if (!hid) return;
    const item = (this.data.myHouseholds || []).find((h) => h.householdId === hid);
    if (!item) return;
    auth.persistProfile({
      householdId: hid,
      role: item.role,
      display_name: item.display_name,
      openid: this.data.cloudOpenid || api.getUserId(),
    });
    try {
      const app = getApp();
      if (app && app.globalData) app.globalData.householdId = hid;
    } catch (err) {}
    wx.showToast({ title: "已进入家庭", icon: "success" });
    wx.switchTab({ url: "/pages/today/index" });
  },

  onHouseholdNameInput(e) {
    this.setData({ householdName: e.detail.value || "" });
  },

  onInviteCodeInput(e) {
    this.setData({ inviteCode: e.detail.value || "" });
  },

  onDisplayNameInput(e) {
    this.setData({ displayName: e.detail.value || "" });
  },

  goCreate() {
    this.setData({ mode: "create" });
  },

  goJoin() {
    this.setData({ mode: "join" });
  },

  backChoose() {
    this.setData({ mode: "choose", bootstrapError: "" });
  },

  async onCreateHousehold() {
    if (this.data.submitting) return;
    const name = (this.data.householdName || "").trim();
    if (!name) {
      wx.showToast({ title: "请输入家庭名称", icon: "none" });
      return;
    }
    this.setData({ submitting: true });
    try {
      await auth.createHouseholdCloud(name);
      wx.showToast({ title: "家庭已创建", icon: "success" });
      wx.switchTab({ url: "/pages/today/index" });
    } catch (err) {
      wx.showToast({ title: err.message || "创建失败", icon: "none" });
    } finally {
      this.setData({ submitting: false });
    }
  },

  async onJoinHousehold() {
    if (this.data.submitting) return;
    const code = (this.data.inviteCode || "").trim();
    if (!code) {
      wx.showToast({ title: "请输入邀请码", icon: "none" });
      return;
    }
    this.setData({ submitting: true });
    try {
      const displayName = (this.data.displayName || "").trim();
      await auth.joinHouseholdCloud(code, displayName || undefined);
      wx.showToast({ title: "加入成功", icon: "success" });
      wx.switchTab({ url: "/pages/today/index" });
    } catch (err) {
      wx.showToast({ title: err.message || "加入失败", icon: "none" });
    } finally {
      this.setData({ submitting: false });
    }
  },

  onRetryBootstrap() {
    const app = getApp();
    app.globalData.authReadyPromise = app.runAuthBootstrap();
    this.setData({ loading: true, bootstrapError: "" });
    this.runEntryFlow();
  },
});
