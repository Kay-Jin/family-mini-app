const { getSeniorMode, setSeniorMode, getUserRole, setUserRole } = require("../../utils/storage");

Page({
  data: {
    seniorMode: false,
    role: "adult",
    roleOptions: [
      { label: "成年成员（adult）", value: "adult" },
      { label: "长辈成员（senior）", value: "senior" },
    ],
  },

  onShow() {
    this.setData({
      seniorMode: getSeniorMode(),
      role: getUserRole(),
    });
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

  onRoleChange(e) {
    const role = e.detail.value;
    setUserRole(role);
    this.setData({ role });
    wx.showToast({ title: `当前角色：${role}`, icon: "none" });
  },
});
