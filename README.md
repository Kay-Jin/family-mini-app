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
- `services/apiConfig.js`：接口环境配置（`backend_mode`、`API_BASE_URL`、`getHouseholdId`/`MOCK_HOUSEHOLD_ID`）
- `services/authService.js`：CloudBase 下 `wx.login`、getOrCreateUser / 创建或加入家庭
- `utils/tokens.js`：设计 Token（颜色/间距）
- `utils/storage.js`：长辈模式本地持久化

## 本地开发

1. 用微信开发者工具导入仓库目录
2. 选择“不使用云开发”即可直接预览
3. 默认后端模式为 `Mock`，可直接体验全流程
4. 在“我的 -> 接口配置”可切换三种后端模式：
   - `Mock（本地模拟）`
   - `CloudBase（微信云开发）`
   - `HTTP API（自建后端）`

## CloudBase 迁移落地（已支持）

### 前端配置

1. 打开“我的 -> 接口配置”
2. 选择 `CloudBase（微信云开发）`
3. 填写 `CloudBase Env ID`
4. 点击“保存接口配置”

### 云函数目录

- `cloudfunctions/family/index.js`
- `cloudfunctions/family/package.json`

在微信开发者工具中右键 `cloudfunctions/family` 进行 **「上传并部署：云端安装依赖」**（修改 `index.js` 后需重新部署方可生效）。

**部署检查清单**

1. 云开发控制台创建数据库集合（见下列表，含 `households`）。
2. 上传并部署云函数 `family`。
3. 小程序「我的 → 接口配置」选择 CloudBase 并保存 Env ID，`wx.cloud.init` 会使用该环境。

### 需要的集合（建议）

- `households`（Onboarding：`name` / `createdBy` / `createdAt`）
- `household_members`（多家庭：`openid` / `householdId` / `uid` / `display_name` / `role` / `joinedAt`；与 `members` 同步，列表成员/改角色以该集合为准）
- `morning_briefs`
- `check_ins`
- `health_snapshots`
- `album_items`
- `members`（Onboarding / 成员：`openid`、`uid`、`display_name`、`householdId`、`role` 等）
- `invite_codes`（成功加入后写入 `usedAt`、`usedByOpenid`，**邀请码一次性**）
- `visibility_settings`
- `checkin_policies`
- `checkin_alerts`
- `care_reminders`
- `help_requests`

### 说明

- 相册上传在 CloudBase 模式下使用 `wx.cloud.uploadFile`，文件地址写入 `album_items`
- 所有业务操作通过云函数 `family` 的 `action` 分发处理
- `openid` 由云函数侧获取并用于写入/鉴权基础字段
- **Onboarding**：`getOrCreateUser` / `createHousehold` / `joinHousehold`；「我的」在 CloudBase 模式下可 **退出当前家庭**（`leaveHousehold`）

## 下一步建议

- 完善 CloudBase 数据权限规则（按 household 成员限制读写）
- 增加云函数/消息订阅用于晨报推送

## 数据库权限（草稿）

- 见 `docs/cloud-database-rules.md`（内测/MVP 规则示例与上线检查项）

## 测试文档

- 测试用例：`docs/test-cases.md`
- 测试报告：`docs/test-report.md`

## 设计文档

- UI/UX 设计系统（温馨风）：`docs/ui-ux-design-system-v1.1.md`

