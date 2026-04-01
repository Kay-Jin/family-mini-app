const { getSeniorMode, setSeniorMode } = require("../../utils/storage");

Page({
  data: {
    seniorMode: false,
    role: "adult",
  },

  onShow() {
    this.setData({ seniorMode: getSeniorMode() });
  },

  onSeniorSwitch(e) {
    const enabled = !!e.detail.value;
    setSeniorMode(enabled);
    this.setData({ seniorMode: enabled });
    wx.showToast({ title: enabled ? "已开启长辈模式" : "已关闭长辈模式", icon: "none" });
  },

  goHousehold() {
    wx.navigateTo({ url: "/pages/profile/household/index" });
  },

  goVisibility() {
    wx.navigateTo({ url: "/pages/profile/visibility/index" });
  },
});
