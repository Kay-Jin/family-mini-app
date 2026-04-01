const service = require("../../services/mockService");

Page({
  data: {
    snapshots: [],
  },

  onShow() {
    this.setData({
      snapshots: service.getHealthSnapshot(),
    });
  },
});
