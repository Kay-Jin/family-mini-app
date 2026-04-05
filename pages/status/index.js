const service = require("../../services/familyService");
const { getSeniorMode } = require("../../utils/storage");

Page({
  data: {
    seniorMode: false,
    loading: false,
    statuses: [],
    form: {
      date: "",
      mood: "平稳",
      sleep_hours: "7",
      appetite: "正常",
      note: "",
    },
  },

  onShow() {
    this.setData({ seniorMode: getSeniorMode() });
    this.loadData();
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      const statuses = await service.listDailyStatuses();
      this.setData({ statuses, loading: false });
    } catch (_) {
      this.setData({ loading: false });
    }
  },

  onDateInput(e) {
    this.setData({ form: { ...this.data.form, date: e.detail.value || "" } });
  },
  onMoodInput(e) {
    this.setData({ form: { ...this.data.form, mood: e.detail.value || "平稳" } });
  },
  onSleepInput(e) {
    this.setData({ form: { ...this.data.form, sleep_hours: e.detail.value || "0" } });
  },
  onAppetiteInput(e) {
    this.setData({ form: { ...this.data.form, appetite: e.detail.value || "正常" } });
  },
  onNoteInput(e) {
    this.setData({ form: { ...this.data.form, note: e.detail.value || "" } });
  },

  async onSubmit() {
    const payload = {
      ...this.data.form,
      sleep_hours: Number(this.data.form.sleep_hours || 0),
    };
    try {
      await service.addDailyStatus(payload);
      wx.showToast({ title: "状态已保存", icon: "success" });
      this.setData({
        form: { ...this.data.form, note: "" },
      });
      await this.loadData();
    } catch (err) {
      wx.showToast({ title: err.message || "保存失败", icon: "none" });
    }
  },
});
