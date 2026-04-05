const service = require("../../services/familyService");

Page({
  data: {
    report: null,
    loading: true,
    error: "",
    generating: false,
  },

  onShow() {
    this.load();
  },

  async load() {
    this.setData({ loading: true, error: "" });
    try {
      const report = await service.getWeeklyReport();
      this.setData({ report, loading: false });
    } catch (e) {
      this.setData({
        loading: false,
        error: e.message || "加载失败",
        report: null,
      });
    }
  },

  async onGenerate() {
    this.setData({ generating: true });
    try {
      const report = await service.generateWeeklyReport();
      wx.showToast({ title: "已生成", icon: "success" });
      this.setData({ report, generating: false });
    } catch (e) {
      wx.showToast({ title: e.message || "生成失败", icon: "none" });
      this.setData({ generating: false });
    }
  },
});
