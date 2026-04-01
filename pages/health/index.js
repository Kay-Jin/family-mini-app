const service = require("../../services/familyService");

Page({
  data: {
    snapshots: [],
    visibility: {
      share_step_band: true,
      share_sleep_summary: true,
    },
    loading: false,
    error: "",
  },

  onShow() {
    this.loadData();
  },

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
      this.setData({ snapshots, visibility, loading: false });
    } catch (err) {
      this.setData({
        loading: false,
        error: err.message || "加载失败",
      });
    }
  },
});
