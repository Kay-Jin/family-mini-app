const service = require("../../../services/mockService");

Page({
  data: {
    form: {},
  },

  onShow() {
    this.setData({ form: service.getVisibility() });
  },

  onToggle(e) {
    const key = e.currentTarget.dataset.key;
    const value = !!e.detail.value;
    const next = { ...this.data.form, [key]: value };
    service.updateVisibility({ [key]: value });
    this.setData({ form: next });
  },
});
