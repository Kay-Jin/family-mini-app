const service = require("../../services/familyService");

Page({
  data: {
    snapshots: [],
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
      const snapshots = await service.getHealthSnapshot();
      this.setData({ snapshots, loading: false });
    } catch (err) {
      this.setData({
        loading: false,
        error: err.message || "加载失败",
      });
    }
  },
});
