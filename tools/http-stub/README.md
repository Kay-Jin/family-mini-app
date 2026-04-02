# HTTP 自建后端 · 本地参照实现

本目录暂无自动运行的服务端代码；契约见 **`docs/http-api-contract.md`**。

可用任意框架实现，以下为 **Express** 路由骨架思路（需自行接数据库与用户鉴权）：

```js
// POST /households/:householdId/invite_codes  body: { role, max_uses?, maxUses? }
// GET  /households/:householdId/invite_codes  -> 列表（与云侧 listInviteCodes 字段对齐）
// POST /households/:householdId/invite_codes/revoke  body: { code }
// GET  /households/:householdId/summary
// POST /households/:householdId/dissolve
// PATCH /households/:householdId  body: { name }
```

建议：

- 鉴权：`Authorization: Bearer`，解析出 `openid` 或 `user_id`，与文档中 `createdBy` 一致。
- **邀请码列表**、**作废**、**解散** 的权限规则与云函数保持一致（创建者、码创建者）。
