/**
 * 上传云函数 family（依赖 miniprogram-ci + 微信公众平台上传密钥）。
 * 环境变量：
 *   MINIPROGRAM_PRIVATE_KEY_PATH  密钥文件路径（勿提交仓库）
 *   CLOUDBASE_ENV_ID             云开发环境 ID（与小程序内一致）
 * 可选：第一个命令行参数覆盖 CLOUDBASE_ENV_ID
 */

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const fnRoot = path.join(root, "cloudfunctions", "family");

const envId = process.argv[2] || process.env.CLOUDBASE_ENV_ID;
const privateKeyPath = process.env.MINIPROGRAM_PRIVATE_KEY_PATH;

if (!envId) {
  console.error("缺少云环境 ID：请设置 CLOUDBASE_ENV_ID 或执行 node scripts/upload-cloud-family.js <envId>");
  process.exit(1);
}
if (!privateKeyPath || !fs.existsSync(privateKeyPath)) {
  console.error(
    "缺少或未找到上传密钥：请设置 MINIPROGRAM_PRIVATE_KEY_PATH，或按 docs/cloud-deploy.md 使用微信开发者工具上传。"
  );
  process.exit(1);
}

let ci;
try {
  ci = require("miniprogram-ci");
} catch (e) {
  console.error("未安装 miniprogram-ci，请在本目录执行：npm install");
  process.exit(1);
}

const projectConfig = JSON.parse(fs.readFileSync(path.join(root, "project.config.json"), "utf8"));
const appid = projectConfig.appid;
if (!appid) {
  console.error("project.config.json 缺少 appid");
  process.exit(1);
}

const project = new ci.Project({
  appid,
  type: "miniProgram",
  projectPath: root,
  privateKeyPath,
  ignores: ["node_modules/**/*", "**/node_modules/**/*", ".git/**/*"],
});

(async () => {
  try {
    const result = await ci.cloud.uploadFunction({
      project,
      env: envId,
      name: "family",
      path: fnRoot,
      remoteNpmInstall: true,
    });
    console.log("云函数 family 已上传。", result);
    console.log("请在微信开发者工具中确认「触发器」已同步；若仅上传代码，可能需在工具内再执行一次触发器同步。");
  } catch (err) {
    console.error("上传失败：", err.message || err);
    process.exit(1);
  }
})();
