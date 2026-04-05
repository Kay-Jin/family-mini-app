const service = require("../../services/familyService");
const { getSeniorMode } = require("../../utils/storage");

Page({
  data: {
    snapshots: [],
    reminders: [],
    reminderDraft: {
      type: "medicine",
      title: "",
      note: "",
      remind_at: "08:00",
      repeat_rule: "daily",
      advance_days: 0,
      visibility: "household",
    },
    repeatLabels: ["每天", "每周", "单次"],
    repeatValues: ["daily", "weekly", "none"],
    visibilityLabels: ["全家可见", "仅自己"],
    visibilityValues: ["household", "self"],
    reminderRepeatIndex: 0,
    reminderVisibilityIndex: 0,
    editingId: "",
    visibility: {
      share_step_band: true,
      share_sleep_summary: true,
    },
    loading: false,
    error: "",
    seniorMode: false,
  },

  onShow() {
    this.setData({ seniorMode: getSeniorMode() });
    this.loadData();
  },

  async onPullDownRefresh() {
    await this.loadData();
    wx.stopPullDownRefresh();
  },

  syncDraftIndices() {
    const r = this.data.reminderDraft.repeat_rule;
    const ri = this.data.repeatValues.indexOf(r);
    const vi = this.data.visibilityValues.indexOf(this.data.reminderDraft.visibility);
    this.setData({
      reminderRepeatIndex: ri >= 0 ? ri : 0,
      reminderVisibilityIndex: vi >= 0 ? vi : 0,
    });
  },

  async loadData() {
    this.setData({ loading: true, error: "" });
    try {
      const [snapshots, visibility] = await Promise.all([
        service.getHealthSnapshot(),
        service.getVisibility(),
      ]);
      const reminders = await service.listCareReminders();
      this.setData(
        {
          snapshots,
          visibility,
          reminders: (reminders || []).map((r) => ({ ...r, id: r.id || r._id })),
          loading: false,
        },
        () => this.syncDraftIndices()
      );
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

  onReminderNoteInput(e) {
    this.setData({
      reminderDraft: { ...this.data.reminderDraft, note: e.detail.value || "" },
    });
  },

  onReminderTimeInput(e) {
    this.setData({
      reminderDraft: { ...this.data.reminderDraft, remind_at: e.detail.value || "" },
    });
  },

  onRepeatChange(e) {
    const idx = Number(e.detail.value) || 0;
    const repeat_rule = this.data.repeatValues[idx] || "daily";
    this.setData(
      {
        reminderDraft: { ...this.data.reminderDraft, repeat_rule },
        reminderRepeatIndex: idx,
      },
      () => this.syncDraftIndices()
    );
  },

  onAdvanceDaysInput(e) {
    const n = parseInt(e.detail.value, 10) || 0;
    this.setData({
      reminderDraft: { ...this.data.reminderDraft, advance_days: n },
    });
  },

  onVisibilityDraftChange(e) {
    const idx = Number(e.detail.value) || 0;
    const visibility = this.data.visibilityValues[idx] || "household";
    this.setData(
      {
        reminderDraft: { ...this.data.reminderDraft, visibility },
        reminderVisibilityIndex: idx,
      },
      () => this.syncDraftIndices()
    );
  },

  async onAddReminder() {
    const draft = this.data.reminderDraft;
    if (!draft.title.trim()) {
      wx.showToast({ title: "请先填写提醒标题", icon: "none" });
      return;
    }
    try {
      if (this.data.editingId) {
        await service.updateCareReminder(this.data.editingId, {
          type: draft.type,
          title: draft.title.trim(),
          note: draft.note.trim(),
          remind_at: draft.remind_at.trim(),
          repeat_rule: draft.repeat_rule,
          advance_days: draft.advance_days,
          visibility: draft.visibility,
        });
        wx.showToast({ title: "已保存修改", icon: "success" });
        this.setData({ editingId: "" });
      } else {
        await service.addCareReminder({
          ...draft,
          title: draft.title.trim(),
          note: draft.note.trim(),
          remind_at: draft.remind_at.trim(),
        });
        wx.showToast({ title: "提醒已添加", icon: "success" });
      }
      this.setData({
        reminderDraft: {
          type: "medicine",
          title: "",
          note: "",
          remind_at: "08:00",
          repeat_rule: "daily",
          advance_days: 0,
          visibility: "household",
        },
      });
      await this.loadData();
    } catch (err) {
      wx.showToast({ title: err.message || "操作失败", icon: "none" });
    }
  },

  onEditReminder(e) {
    const id = e.currentTarget.dataset.id;
    const item = this.data.reminders.find((r) => r.id === id);
    if (!item) return;
    this.setData(
      {
        editingId: id,
        reminderDraft: {
          type: item.type || "medicine",
          title: item.title || "",
          note: item.note || "",
          remind_at: item.remind_at || "08:00",
          repeat_rule: item.repeat_rule || "daily",
          advance_days: item.advance_days || 0,
          visibility: item.visibility || "household",
        },
      },
      () => this.syncDraftIndices()
    );
    wx.pageScrollTo({ scrollTop: 0, duration: 200 });
  },

  onCancelEdit() {
    this.setData(
      {
        editingId: "",
        reminderDraft: {
          type: "medicine",
          title: "",
          note: "",
          remind_at: "08:00",
          repeat_rule: "daily",
          advance_days: 0,
          visibility: "household",
        },
      },
      () => this.syncDraftIndices()
    );
  },

  async onDeleteReminder(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    try {
      await service.deleteCareReminder(id);
      wx.showToast({ title: "已删除", icon: "none" });
      if (this.data.editingId === id) this.onCancelEdit();
      await this.loadData();
    } catch (err) {
      wx.showToast({ title: err.message || "删除失败", icon: "none" });
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
