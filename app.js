App({
  globalData: {
    seniorMode: false,
    userRole: "adult",
  },
  onLaunch() {
    if (!wx.cloud) return;
    wx.cloud.init({
      traceUser: true,
    });
  },
});
