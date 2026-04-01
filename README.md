# 家

家庭关怀微信小程序（MVP）。

## 已实现（对齐需求 F-M1 ~ F-M5）

- F-M1 `pages/today/index`：每日家庭晨报 + 一键报平安
- F-M2 `pages/today/index`：报平安交互 + 最近记录列表
- F-M3 `pages/health/index`：健康数据看板（步数/睡眠）
- F-M4 `pages/memories/index`：家庭相册列表 + 选图上传
- F-M5 `pages/profile/index`：家账号与权限入口 + 长辈模式开关
## 本轮增强

- 相册支持实际选图上传流程（Mock 可直接完成上传并回显）
- 页面接入角色模拟（adult / senior），用于演示差异化交互
- senior 角色在相册页默认仅浏览，today 页显示简化提示
- 上传与数据读取均通过 `services/familyService.js` 统一封装
- 今日页接入可见性策略（晨报展示、报平安记录展示）
- 健康页接入可见性策略（步数/睡眠可单独隐藏）
- 家庭管理页支持成员角色调整与邀请码生成（MVP）
- 新增运行时接口配置（Mock 开关、Base URL、Bearer Token）
- `http` 请求与上传自动附带鉴权头（如已配置 Token）
- Senior 模式扩展为多页面字号/按钮尺寸增强

- 子页面：
  - `pages/profile/household/index` 家庭组织与角色
  - `pages/profile/visibility/index` 可见性与隐私配置

## 项目结构

- `app.json`：页面路由 + TabBar（今日/健康/回忆/我的）
- `services/mockService.js`：MVP Mock 数据实现
- `services/familyService.js`：业务服务层（可切换 Mock / HTTP）
- `services/http.js`：统一请求封装
- `services/apiConfig.js`：接口环境配置（`USE_MOCK`、`API_BASE_URL`、`HOUSEHOLD_ID`）
- `utils/tokens.js`：设计 Token（颜色/间距）
- `utils/storage.js`：长辈模式本地持久化

## 本地开发

1. 用微信开发者工具导入仓库目录
2. 选择“不使用云开发”即可直接预览
3. 默认 `USE_MOCK=true`，可直接体验全流程
4. 接真实后端：
   - 在“我的”页关闭 `使用 Mock 数据`
   - 在“我的”页配置 `API Base URL` 与 `Bearer Token`（可选）
   - `HOUSEHOLD_ID` / `USER_ID` 当前来自 `services/apiConfig.js`（可按后端身份体系接入）
   - 保持页面层不变，业务调用在 `services/familyService.js` 已抽象

## 下一步建议

- 接入真实后端与鉴权（家庭成员、报平安、健康、相册）
- 增加云函数/消息订阅用于晨报推送
- 补齐长辈模式字号/触控尺寸全局样式策略

