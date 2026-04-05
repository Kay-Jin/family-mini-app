const service = require("../../services/familyService");
const api = require("../../services/apiConfig");
const { getSeniorMode, getUserRole, getLastHelpSentAt, markHelpSent } = require("../../utils/storage");
const { ensureHouseholdForCloudbase } = require("../../utils/routeGuard");
const tour = require("../../utils/tour");

const HELP_GAP_MS = 5 * 60 * 1000;

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
    seniorMoreExpanded: false,
    checkinPolicy: {
      enabled: true,
      start_time: "08:00",
      end_time: "10:00",
      threshold_minutes: 60,
      second_reminder_enabled: false,
      second_reminder_minutes: 30,
    },
    checkinAlerts: [],
    statusDigest: null,
    helpRequests: [],
    weeklyTeaser: null,
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

  toggleSeniorMore() {
    this.setData({ seniorMoreExpanded: !this.data.seniorMoreExpanded });
  },

  async loadData(isRefresh) {
    this.setData({ loading: !isRefresh, error: "" });
    try {
      const [brief, checkIns, visibility] = await Promise.all([
        service.getMorningBrief(),
        service.listCheckIns(),
        service.getVisibility(),
      ]);
      const [checkinPolicy, checkinAlerts, statusDigest, helpRequests, weeklyTeaser] = await Promise.all([
        service.getCheckinPolicy(),
        service.getCheckinAlerts(),
        service.getStatusDigest(),
        service.listHelpRequests().catch(() => []),
        service.getWeeklyReport().catch(() => null),
      ]);
      this.setData({
        brief,
        checkIns,
        visibility,
        checkinPolicy,
        checkinAlerts,
        statusDigest,
        helpRequests: (helpRequests || []).map((h) => ({
          ...h,
          _displayTime: formatHelpTime(h.created_at),
          _typeLabel: helpTypeLabel(h.type),
        })),
        weeklyTeaser,
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

  onPolicyStartInput(e) {
    this.setData({
      checkinPolicy: { ...this.data.checkinPolicy, start_time: e.detail.value || "08:00" },
    });
  },

  onPolicyEndInput(e) {
    this.setData({
      checkinPolicy: { ...this.data.checkinPolicy, end_time: e.detail.value || "10:00" },
    });
  },

  async onPolicyTimeBlur() {
    const { start_time, end_time } = this.data.checkinPolicy;
    try {
      await service.updateCheckinPolicy({ start_time, end_time });
      wx.showToast({ title: "监控时段已保存", icon: "none" });
    } catch (err) {
      wx.showToast({ title: err.message || "保存失败", icon: "none" });
    }
  },

  async onSecondReminderChange(e) {
    const second_reminder_enabled = !!e.detail.value;
    this.setData({
      checkinPolicy: { ...this.data.checkinPolicy, second_reminder_enabled },
    });
    try {
      await service.updateCheckinPolicy({ second_reminder_enabled });
    } catch (err) {
      wx.showToast({ title: err.message || "更新失败", icon: "none" });
    }
  },

  async onHelpTypeTap(e) {
    const type = e.currentTarget.dataset.type || "call_me";
    const last = getLastHelpSentAt(type);
    if (Date.now() - last < HELP_GAP_MS) {
      wx.showToast({ title: "请稍后再试，避免重复发送", icon: "none" });
      return;
    }
    try {
      await service.createHelpRequest(type);
      markHelpSent(type);
      wx.showToast({ title: "求助已发送给家人", icon: "success" });
      this.loadData(true);
    } catch (err) {
      wx.showToast({ title: err.message || "发送失败", icon: "none" });
    }
  },

  async onCancelHelp(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    try {
      await service.cancelHelpRequest(id);
      wx.showToast({ title: "已撤回", icon: "none" });
      this.loadData(true);
    } catch (err) {
      wx.showToast({ title: err.message || "无法撤回", icon: "none" });
    }
  },

  onViewFamilyDynamics() {
    wx.switchTab({ url: "/pages/memories/index" });
  },

  onGoStatusPage() {
    wx.navigateTo({ url: "/pages/status/index" });
  },

  onGoWeekly() {
    wx.navigateTo({ url: "/pages/weekly/index" });
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

function helpTypeLabel(type) {
  if (type === "companionship") return "需要陪同";
  if (type === "unwell") return "身体不适";
  return "请联系我";
}

function formatHelpTime(ts) {
  if (ts == null) return "";
  if (typeof ts === "number") {
    const d = new Date(ts);
    return `${d.getHours()}:${`${d.getMinutes()}`.padStart(2, "0")}`;
  }
  const d = new Date(ts);
  if (!Number.isNaN(d.getTime())) {
    return `${d.getHours()}:${`${d.getMinutes()}`.padStart(2, "0")}`;
  }
  return `${ts}`;
}
