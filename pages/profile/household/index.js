const service = require("../../../services/familyService");

Page({
  data: {
    members: [],
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
      const members = await service.listMembers();
      this.setData({ members, loading: false });
    } catch (err) {
      this.setData({
        loading: false,
        error: err.message || "加载失败",
      });
    }
  },
});
