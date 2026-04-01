const service = require("../../services/mockService");

Page({
  data: {
    items: [],
  },

  onShow() {
    this.setData({ items: service.listAlbum() });
  },

  onUploadTap() {
    wx.showToast({ title: "MVP: 预留上传", icon: "none" });
  },
});
