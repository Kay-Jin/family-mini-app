const service = require("../../../services/familyService");
const { getSeniorMode } = require("../../../utils/storage");
const { ensureHouseholdForCloudbase } = require("../../../utils/routeGuard");

Page({
  data: {
    members: [],
    roleRange: ["adult", "senior"],
    inviteRole: "adult",
    inviteMaxUses: 1,
    inviteCode: "",
    loading: false,
    error: "",
    seniorMode: false,
  },

  onShow() {
    if (!ensureHouseholdForCloudbase()) return;
    this.setData({ seniorMode: getSeniorMode() });
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

  async onMemberRoleChange(e) {
    const uid = e.currentTarget.dataset.uid;
    const role = `${e.detail.value}` === "1" ? "senior" : "adult";
    try {
      await service.updateMemberRole(uid, role);
      wx.showToast({ title: "角色已更新", icon: "success" });
      await this.loadData();
    } catch (err) {
      wx.showToast({ title: err.message || "更新失败", icon: "none" });
    }
  },

  onInviteRoleChange(e) {
    this.setData({ inviteRole: e.detail.value || "adult" });
  },

  onInviteMaxUsesInput(e) {
    const n = parseInt(e.detail.value, 10);
    this.setData({ inviteMaxUses: Number.isNaN(n) || n < 1 ? 1 : Math.min(100, n) });
  },

  async onCreateInviteCode() {
    try {
      const result = await service.createInviteCode(this.data.inviteRole, this.data.inviteMaxUses);
      this.setData({ inviteCode: result.code || "" });
      wx.showToast({ title: "邀请码已生成", icon: "success" });
    } catch (err) {
      wx.showToast({ title: err.message || "生成失败", icon: "none" });
    }
  },

  onCopyInviteCode() {
    if (!this.data.inviteCode) return;
    wx.setClipboardData({
      data: this.data.inviteCode,
      success: () => wx.showToast({ title: "邀请码已复制", icon: "none" }),
    });
  },
});
