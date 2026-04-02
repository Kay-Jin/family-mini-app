const service = require("../../services/familyService");
const api = require("../../services/apiConfig");
const { getSeniorMode, getUserRole } = require("../../utils/storage");
const { ensureHouseholdForCloudbase } = require("../../utils/routeGuard");
const tour = require("../../utils/tour");

Page({
  data: {
    brief: null,
    checkIns: [],
    visibility: {
      include_in_morning_brief: true,
      share_last_checkin_time: true,
    },
    loading: false,
    error: "",
    seniorMode: false,
    role: "adult",
    checkinPolicy: {
      enabled: true,
      threshold_minutes: 60,
      second_reminder_enabled: false,
    },
    checkinAlerts: [],
    showTour: false,
  },

  onShow() {
    if (!ensureHouseholdForCloudbase()) return;
    this.setData({
      seniorMode: getSeniorMode(),
      role: getUserRole(),
      showTour: !tour.hasSeenTour("today"),
    });
    this.loadData(false);
  },

  onDismissTour() {
    tour.markTourSeen("today");
    this.setData({ showTour: false });
  },

  tourEat() {},

  async onPullDownRefresh() {
    await this.loadData(true);
    wx.stopPullDownRefresh();
  },

  async loadData(isRefresh) {
    this.setData({ loading: !isRefresh, error: "" });
    try {
      const [brief, checkIns, visibility] = await Promise.all([
        service.getMorningBrief(),
        service.listCheckIns(),
        service.getVisibility(),
      ]);
      const [checkinPolicy, checkinAlerts] = await Promise.all([
        service.getCheckinPolicy(),
        service.getCheckinAlerts(),
      ]);
      this.setData({
        brief,
        checkIns,
        visibility,
        checkinPolicy,
        checkinAlerts,
        loading: false,
      });
    } catch (err) {
      this.setData({
        loading: false,
        error: err.message || "加载失败，请稍后重试",
      });
    }
  },

  async onSafeCheckIn() {
    try {
      await service.createCheckIn();
      wx.showToast({ title: "已报平安", icon: "success" });
      this.loadData(true);
    } catch (err) {
      wx.showToast({ title: err.message || "提交失败", icon: "none" });
    }
  },

  async onPolicyEnabledChange(e) {
    const enabled = !!e.detail.value;
    this.setData({
      checkinPolicy: { ...this.data.checkinPolicy, enabled },
    });
    try {
      await service.updateCheckinPolicy({ enabled });
      wx.showToast({ title: enabled ? "已开启异常提醒" : "已关闭异常提醒", icon: "none" });
    } catch (err) {
      wx.showToast({ title: err.message || "更新失败", icon: "none" });
    }
  },

  async onPolicyThresholdChange(e) {
    const value = `${e.detail.value}` === "1" ? 90 : 60;
    this.setData({
      checkinPolicy: { ...this.data.checkinPolicy, threshold_minutes: value },
    });
    try {
      await service.updateCheckinPolicy({ threshold_minutes: value });
      wx.showToast({ title: `阈值已设为${value}分钟`, icon: "none" });
    } catch (err) {
      wx.showToast({ title: err.message || "更新失败", icon: "none" });
    }
  },

  async onHelpTap() {
    try {
      await service.createHelpRequest("call_me");
      wx.showToast({ title: "求助已发送给家人", icon: "success" });
    } catch (err) {
      wx.showToast({ title: err.message || "发送失败", icon: "none" });
    }
  },

  onViewFamilyDynamics() {
    wx.switchTab({ url: "/pages/memories/index" });
  },

  onSubscribeMorningBrief() {
    const tmplIds = api.getSubscribeMorningTmplIds();
    if (!tmplIds.length) {
      wx.showModal({
        title: "开启晨报提醒",
        content:
          "需要先在「我的 → 高级与调试 → 接口配置」中填写微信公众平台提供的订阅消息模板 ID（逗号分隔，最多 3 个）。保存后再来开启即可。",
        showCancel: false,
      });
      return;
    }
    wx.requestSubscribeMessage({
      tmplIds,
      success: (res) => {
        const accept = Object.keys(res).filter((k) => res[k] === "accept");
        wx.showToast({
          title: accept.length ? `已授权 ${accept.length} 条` : "可稍后重试",
          icon: "none",
        });
      },
      fail: () => wx.showToast({ title: "订阅调用失败", icon: "none" }),
    });
  },
});
