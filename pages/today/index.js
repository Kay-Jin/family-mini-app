const service = require("../../services/familyService");
const { getSeniorMode, getUserRole } = require("../../utils/storage");

Page({
  data: {
    brief: null,
    loading: false,
    error: "",
    seniorMode: false,
    role: "adult",
  },

  onShow() {
    this.setData({
      seniorMode: getSeniorMode(),
      role: getUserRole(),
    });
    this.loadData(false);
  },

  async onPullDownRefresh() {
    await this.loadData(true);
    wx.stopPullDownRefresh();
  },

  async loadData(isRefresh) {
    this.setData({ loading: !isRefresh, error: "" });
    try {
      const brief = await service.getMorningBrief();
      this.setData({ brief, loading: false });
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
});
