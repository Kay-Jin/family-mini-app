const service = require("../../../services/familyService");
const api = require("../../../services/apiConfig");
const { getSeniorMode } = require("../../../utils/storage");
const { ensureHouseholdForCloudbase } = require("../../../utils/routeGuard");

Page({
  data: {
    members: [],
    roleRange: ["adult", "senior"],
    inviteRole: "adult",
    inviteMaxUses: 1,
    inviteCode: "",
    revokeCode: "",
    summary: null,
    isHouseholdCreator: false,
    inviteList: [],
    currentOpenid: "",
    newHouseholdName: "",
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
      const [members, summary, inviteList] = await Promise.all([
        service.listMembers(),
        service.getHouseholdSummary().catch(() => null),
        service.listInviteCodes().catch(() => []),
      ]);
      const isHouseholdCreator =
        summary && summary.createdBy && summary.createdBy === api.getUserId();
      this.setData({
        members,
        summary,
        isHouseholdCreator: !!isHouseholdCreator,
        inviteList: inviteList || [],
        currentOpenid: api.getUserId(),
        newHouseholdName: (summary && summary.name) || "",
        loading: false,
      });
    } catch (err) {
      this.setData({
        loading: false,
        error: err.message || "加载失败",
      });
    }
  },

  onRevokeCodeInput(e) {
    this.setData({ revokeCode: e.detail.value || "" });
  },

  async onRevokeInvite() {
    const code = (this.data.revokeCode || "").trim().toUpperCase();
    if (!code) {
      wx.showToast({ title: "请输入要作废的邀请码", icon: "none" });
      return;
    }
    try {
      await service.revokeInviteCode(code);
      wx.showToast({ title: "已作废", icon: "success" });
      this.setData({ revokeCode: "" });
      await this.loadData();
    } catch (err) {
      wx.showToast({ title: err.message || "作废失败", icon: "none" });
    }
  },

  onNewHouseholdNameInput(e) {
    this.setData({ newHouseholdName: e.detail.value || "" });
  },

  async onSaveHouseholdName() {
    const name = (this.data.newHouseholdName || "").trim();
    if (!name) {
      wx.showToast({ title: "请输入家庭名称", icon: "none" });
      return;
    }
    try {
      await service.updateHouseholdName(name);
      wx.showToast({ title: "名称已更新", icon: "success" });
      await this.loadData();
    } catch (err) {
      wx.showToast({ title: err.message || "保存失败", icon: "none" });
    }
  },

  async onRevokeListItem(e) {
    const code = (e.currentTarget.dataset.code || "").trim().toUpperCase();
    if (!code) return;
    try {
      await service.revokeInviteCode(code);
      wx.showToast({ title: "已作废", icon: "success" });
      await this.loadData();
    } catch (err) {
      wx.showToast({ title: err.message || "作废失败", icon: "none" });
    }
  },

  onDissolveHousehold() {
    wx.showModal({
      title: "解散家庭",
      content:
        "你是家庭创建者。解散后所有成员将移出该家庭；若你还有其他家庭将自动切换，否则需重新加入或创建。此操作不可撤销，是否继续？",
      confirmText: "解散",
      success: async (res) => {
        if (!res.confirm) return;
        wx.showLoading({ title: "处理中" });
        try {
          await service.dissolveHousehold();
          wx.hideLoading();
          if (api.getHouseholdId()) {
            wx.showToast({ title: "已解散", icon: "success" });
            await this.loadData();
          } else {
            wx.reLaunch({ url: "/pages/onboarding/index" });
          }
        } catch (err) {
          wx.hideLoading();
          wx.showToast({ title: err.message || "操作失败", icon: "none" });
        }
      },
    });
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
