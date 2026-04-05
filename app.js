const api = require("./services/apiConfig");
const auth = require("./services/authService");

App({
  globalData: {
    seniorMode: false,
    userRole: "adult",
    householdId: "",
    /** @type {Promise<object> | null} */
    authReadyPromise: null,
  },
  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({
        traceUser: true,
      });
    }
    this.globalData.authReadyPromise = this.runAuthBootstrap();
  },
  async runAuthBootstrap() {
    try {
      const mode = api.getBackendMode();
      if (mode === "cloudbase" && wx.cloud) {
        const { hasHousehold, profile } = await auth.bootstrapCloudbase();
        if (profile && profile.householdId) {
          this.globalData.householdId = profile.householdId;
        }
        return { mode, hasHousehold, profile };
      }
      return { mode, hasHousehold: true, profile: null };
    } catch (err) {
      console.error("[auth bootstrap]", err);
      return { mode: api.getBackendMode(), hasHousehold: false, error: err };
    }
  },
});
