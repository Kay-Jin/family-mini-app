const service = require("../../services/familyService");

Page({
  data: {
    items: [],
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
      const items = await service.listAlbum();
      this.setData({ items, loading: false });
    } catch (err) {
      this.setData({
        loading: false,
        error: err.message || "加载失败",
      });
    }
  },

  onUploadTap() {
    wx.showToast({ title: "MVP: 预留上传", icon: "none" });
  },
});
