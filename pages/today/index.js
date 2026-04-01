const service = require("../../services/mockService");
const { getSeniorMode } = require("../../utils/storage");

Page({
  data: {
    brief: null,
    loading: true,
    seniorMode: false,
  },

  onShow() {
    this.setData({ seniorMode: getSeniorMode() });
    this.loadData();
  },

  loadData() {
    const brief = service.getMorningBrief();
    this.setData({ brief, loading: false });
  },

  onSafeCheckIn() {
    service.createCheckIn();
    wx.showToast({ title: "已报平安", icon: "success" });
  },
});
