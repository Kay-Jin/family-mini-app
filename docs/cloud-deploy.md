# 云函数 `family` 部署与触发器（步骤 1）

## 方式 A：微信开发者工具（推荐，无需密钥脚本）

1. 用微信开发者工具打开本仓库根目录（含 `app.json`、`cloudfunctions/`）。  
2. 在工具中开通/绑定 **云开发**，环境与「我的 → CloudBase Env ID」一致。  
3. 在左侧找到 `cloudfunctions/family`。  
4. 右键 → **上传并部署：云端安装依赖**（等待完成）。  
5. 再次右键同一目录 → 若有 **上传触发器** / **同步触发器配置**，执行一次，确保 `config.json` 内 `checkinMissTimer`、`weeklyReportTimer` 已同步到云端。  
6. 在云开发控制台 → **云函数** → `family` → 查看 **触发器** 是否列出两条定时任务。

## 方式 B：命令行（需小程序上传密钥）

1. 登录 [微信公众平台](https://mp.weixin.qq.com/) → 开发 → 开发管理 → 开发设置 → 下载 **代码上传密钥**（勿提交到 Git）。  
2. 配置环境变量：  
   - `MINIPROGRAM_PRIVATE_KEY_PATH`：密钥文件绝对路径  
   - `CLOUDBASE_ENV_ID`：云环境 ID（与小程序内 `wx.cloud.init` 一致）  
3. 在项目根目录执行：

```bash
npm install
npm run deploy:cloud
```

脚本会读取 `project.config.json` 中的 `appid`，上传 `cloudfunctions/family` 并在云端安装依赖。若本机 `miniprogram-ci` 版本 API 有差异，请以方式 A 为准。

## 验证

- 云函数列表中 `family` 版本时间与本次部署一致。  
- 触发器列表中可见 `checkinMissTimer`（每 15 分钟）、`weeklyReportTimer`（周日 22:00，上海时区逻辑在云函数内二次校验）。  
