const { API_BASE_URL } = require("./apiConfig");

function request(path, method = "GET", data) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE_URL}${path}`,
      method,
      data,
      timeout: 12000,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
          return;
        }
        reject(new Error(res.data?.message || `HTTP ${res.statusCode}`));
      },
      fail(err) {
        reject(new Error(err.errMsg || "network error"));
      },
    });
  });
}

function uploadFile(path, filePath, formData) {
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: `${API_BASE_URL}${path}`,
      filePath,
      name: "file",
      formData: formData || {},
      timeout: 20000,
      success(res) {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        try {
          resolve(res.data ? JSON.parse(res.data) : {});
        } catch (_) {
          resolve({});
        }
      },
      fail(err) {
        reject(new Error(err.errMsg || "upload failed"));
      },
    });
  });
}

module.exports = {
  request,
  uploadFile,
};
