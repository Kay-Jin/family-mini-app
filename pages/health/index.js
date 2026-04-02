const service = require("../../services/familyService");
const { getBackendMode } = require("../../services/apiConfig");
const { getSeniorMode } = require("../../utils/storage");
const { ensureHouseholdForCloudbase } = require("../../utils/routeGuard");
const tour = require("../../utils/tour");

Page({
  data: {
    snapshots: [],
    reminders: [],
    reminderDraft: {
      type: "medicine",
      title: "",
      remind_at: "08:00",
      repeat_rule: "daily",
    },
    visibility: {
      share_step_band: true,
      share_sleep_summary: true,
    },
    loading: false,
    error: "",
    seniorMode: false,
    showTour: false,
    isMockBackend: false,
  },

  onShow() {
    if (!ensureHouseholdForCloudbase()) return;
    this.setData({
      seniorMode: getSeniorMode(),
      showTour: !tour.hasSeenTour("health"),
      isMockBackend: getBackendMode() === "mock",
    });
    this.loadData();
  },

  onDismissTour() {
    tour.markTourSeen("health");
    this.setData({ showTour: false });
  },

  tourEat() {},

  async onPullDownRefresh() {
    await this.loadData();
    wx.stopPullDownRefresh();
  },

  async loadData() {
    this.setData({ loading: true, error: "" });
    try {
      const [snapshots, visibility] = await Promise.all([
        service.getHealthSnapshot(),
        service.getVisibility(),
      ]);
      const reminders = await service.listCareReminders();
      this.setData({ snapshots, visibility, reminders, loading: false });
    } catch (err) {
      this.setData({
        loading: false,
        error: err.message || "加载失败",
      });
    }
  },

  onReminderTypeChange(e) {
    const type = `${e.detail.value}` === "1" ? "followup" : "medicine";
    this.setData({
      reminderDraft: { ...this.data.reminderDraft, type },
    });
  },

  onReminderTitleInput(e) {
    this.setData({
      reminderDraft: { ...this.data.reminderDraft, title: e.detail.value || "" },
    });
  },

  onReminderTimeInput(e) {
    this.setData({
      reminderDraft: { ...this.data.reminderDraft, remind_at: e.detail.value || "" },
    });
  },

  async onAddReminder() {
    const draft = this.data.reminderDraft;
    if (!draft.title.trim()) {
      wx.showToast({ title: "请先填写提醒标题", icon: "none" });
      return;
    }
    try {
      await service.addCareReminder({
        ...draft,
        title: draft.title.trim(),
      });
      wx.showToast({ title: "提醒已添加", icon: "success" });
      this.setData({
        reminderDraft: {
          ...this.data.reminderDraft,
          title: "",
        },
      });
      await this.loadData();
    } catch (err) {
      wx.showToast({ title: err.message || "新增失败", icon: "none" });
    }
  },

  async onReminderDoneToggle(e) {
    const id = e.currentTarget.dataset.id;
    const done = !!e.detail.value;
    try {
      await service.setCareReminderDone(id, done);
      await this.loadData();
    } catch (err) {
      wx.showToast({ title: err.message || "更新失败", icon: "none" });
    }
  },
});
