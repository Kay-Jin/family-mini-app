const service = require("../../../services/familyService");
const { getSeniorMode } = require("../../../utils/storage");

Page({
  data: {
    form: {},
    loading: false,
    error: "",
    seniorMode: false,
  },

  async onShow() {
    this.setData({ seniorMode: getSeniorMode() });
    await this.loadData();
  },

  async loadData() {
    this.setData({ loading: true, error: "" });
    try {
      const form = await service.getVisibility();
      this.setData({ form, loading: false });
    } catch (err) {
      this.setData({
        loading: false,
        error: err.message || "加载失败",
      });
    }
  },

  async onToggle(e) {
    const key = e.currentTarget.dataset.key;
    const value = !!e.detail.value;
    const next = { ...this.data.form, [key]: value };
    this.setData({ form: next });
    try {
      await service.updateVisibility({ [key]: value });
    } catch (err) {
      wx.showToast({ title: err.message || "更新失败", icon: "none" });
    }
  },
});
