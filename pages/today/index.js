const service = require("../../services/familyService");
const { getSeniorMode, getUserRole } = require("../../utils/storage");

Page({
  data: {
    brief: null,
    checkIns: [],
    visibility: {
      include_in_morning_brief: true,
      share_last_checkin_time: true,
    },
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
      const [brief, checkIns, visibility] = await Promise.all([
        service.getMorningBrief(),
        service.listCheckIns(),
        service.getVisibility(),
      ]);
      this.setData({ brief, checkIns, visibility, loading: false });
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
