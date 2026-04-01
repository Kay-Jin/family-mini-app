const service = require("../../../services/mockService");

Page({
  data: {
    members: [],
  },

  onShow() {
    this.setData({ members: service.listMembers() });
  },
});
