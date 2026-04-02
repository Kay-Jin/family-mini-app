# 中期：产品路线（建议优先级）

在 **Onboarding / 多家庭 / 邀请码 / 审计** 已落地的前提下，可按业务价值排序。

## P1 — 与「家」强相关

- **家庭成员资料**：在云侧可编辑 `display_name`、头像占位；与本地 `storage` 同步策略写清。
- **家庭设置页**：家庭名称修改、解散家庭（仅创建者？需风控与二次确认）。
- **邀请管理**：列表展示未过期邀请码、剩余次数、支持主动作废（写 `revokedAt`）。

## P2 — 体验与留存

- **晨报 / 提醒**：订阅消息、定时触发器（云开发定时器 + 云函数），与 `morning_briefs` 联动。
- **新手引导**：首次进入各 Tab 的简单遮罩（纯前端，注意长辈模式下的字号）。
- **错误文案统一**：云函数 `message` 与中文字符串表对齐，便于运营改文案。

## P3 — HTTP / 混合部署

若保留 **`backend_mode: http`**：

- 与自建后端对齐 **路径与字段**：`household_id`、`user_uid`、`max_uses` 等（见下方「接口备注」）。
- **鉴权**：`Authorization` 与 refresh 策略；小程序端仅存 token 不落明文密码。

### HTTP 接口备注（草案，非实现）

| 能力 | 方法 | 路径示例 | 备注 |
|------|------|-----------|------|
| 创建邀请码 | POST | `/households/:id/invite_codes` | Body: `{ role, max_uses }` |
| 加入家庭 | POST | `/households/join` | Body: `{ code, display_name }`（若后端需要） |

具体以你们后端契约为准；前端 `familyService.js` 需在 `http` 分支补齐字段。

## P4 — 合规与扩展

- **未成年人 / 监护人** 场景是否需额外 consent（视地区法务）。
- **数据导出与删除**（GDPR 风格）：用户请求删除 `members` / `household_members` 的流程。

---

更新本文件时建议同步改 **`README.md` — 下一步建议** 中的一条 bullet，避免文档分叉。
