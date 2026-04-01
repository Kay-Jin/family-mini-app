const service = require("../../services/familyService");
const { getUserRole } = require("../../utils/storage");

Page({
  data: {
    items: [],
    visibility: {
      share_album_contribute: true,
    },
    loading: false,
    error: "",
    role: "adult",
  },

  onShow() {
    this.setData({ role: getUserRole() });
    this.loadData();
  },

  async onPullDownRefresh() {
    await this.loadData();
    wx.stopPullDownRefresh();
  },

  async loadData() {
    this.setData({ loading: true, error: "" });
    try {
      const [items, visibility] = await Promise.all([
        service.listAlbum(),
        service.getVisibility(),
      ]);
      this.setData({ items, visibility, loading: false });
    } catch (err) {
      this.setData({
        loading: false,
        error: err.message || "加载失败",
      });
    }
  },

  async onUploadTap() {
    if (!this.data.visibility.share_album_contribute) {
      wx.showToast({ title: "当前家庭关闭了相册共建", icon: "none" });
      return;
    }
    try {
      const chooseRes = await new Promise((resolve, reject) => {
        wx.chooseMedia({
          count: 1,
          mediaType: ["image"],
          sourceType: ["album", "camera"],
          success: resolve,
          fail: reject,
        });
      });
      const file = chooseRes.tempFiles && chooseRes.tempFiles[0];
      if (!file || !file.tempFilePath) return;

      wx.showLoading({ title: "上传中..." });
      const created = await service.addAlbumPhoto({
        localPath: file.tempFilePath,
        tags: ["日常"],
      });
      wx.hideLoading();

      if (created && created.id) {
        this.setData({
          items: [created, ...this.data.items],
        });
      } else {
        await this.loadData();
      }
      wx.showToast({ title: "上传成功", icon: "success" });
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: err.message || "上传失败", icon: "none" });
    }
  },
});
