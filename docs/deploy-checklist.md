# 上线前操作清单（按 1 → 2 → 3）

适合 **首次接 CloudBase** 或 **拉取含 Onboarding / 多家庭 / 邀请码改动的代码后** 核对。

## 1. 云控制台：数据库集合

在微信开发者工具 → **云开发** → **数据库**，确认已创建（可空集合启动）：

| 集合 | 说明 |
|------|------|
| `households` | 家庭文档 |
| `household_members` | 成员与家庭的关联（列表/角色/多家庭） |
| `members` | 用户总档（openid、默认 `householdId` 等） |
| `invite_codes` | 邀请码，含 `maxUses` / `usedCount` / `expiresAt` |
| `family_audit_logs` | **可选**，云函数审计；见 `docs/security-hardening.md` |
| 其余业务集合 | 见根目录 `README.md` |

权限建议见 **`docs/cloud-database-rules.md`**。

## 2. 云函数部署

1. 本地确认 `cloudfunctions/family/index.js`、`package.json` 已保存。
2. 开发者工具中右键 **`cloudfunctions/family`** → **上传并部署：云端安装依赖**。
3. 部署完成后在 **云开发 → 云函数** 查看 `family` 上次更新时间是否刷新。

## 3. 小程序端验证

1. **我的 → 接口配置**：`CloudBase` + 正确 **Env ID**，保存。
2. 清除开发者工具 **缓存 / 存储**（可选，模拟新用户）。
3. **冷启动**：应进入 **加入家庭** 或 **选择家庭**（多成员且无法唯一解析活跃家庭时）。
4. **家庭组织**：生成邀请码时可设 **可用人次**；多人依次加入直至 `usedCount` 达 `maxUses`。
5. **我的**：多家庭时出现 **切换家庭**；**退出当前家庭** 若仍有其他家庭应留在应用内。

---

若某步失败：**云函数日志**（云开发 → 云函数 → family → 日志）与 **数据库** 中单条文档字段是否齐全（尤其 `household_members`、`invite_codes.usedCount`）。
