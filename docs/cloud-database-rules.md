# CloudBase 数据库权限规则（草稿）

> 仅作 **MVP / 内测** 参考；**生产环境**请按安全审计收紧，并优先用 **云函数** 做写操作，小程序直连 DB 只读或关闭。

## 使用方式

微信开发者工具 → 云开发 → 数据库 → 对应集合 → **权限设置** → 选择「自定义安全规则」，粘贴下列 JSON（按需微调）。

## 原则

1. **写操作建议只走云函数**：客户端 `wx.cloud.callFunction('family')`，集合对 `all` 不设写权限或仅 `read`。
2. 若允许客户端直写，必须使用 **`openid` / `householdId` 与文档字段一致** 的条件，避免跨家庭读写。
3. `household_members` 应以 **`openid` + `householdId`** 约束本人记录。

---

## 建议规则示例（开发阶段：偏宽松）

下列规则假设：**业务写全部由云函数完成**，小程序仅调试用读取；若你暂时无法改客户端，可将 `read` 改为 `true` 且 **不要** 开放危险集合的 `write`。

### `households` / `household_members` / `members` / `invite_codes`

```json
{
  "read": true,
  "write": false
}
```

说明：创建家庭、加入、退出的写操作仅在云函数内执行，由管理员/云函数身份写入。

### `morning_briefs`、`check_ins`、`album_items`、`health_snapshots` 等按家庭隔离的数据

```json
{
  "read": true,
  "write": false
}
```

若必须客户端直写一条记录，可改为（**仍不推荐**）：

```json
{
  "read": "doc.householdId in get('database').collection('household_members').where({ openid: auth.openid }).field({ householdId: true }).get().data.map(h => h.householdId)",
  "write": "doc.householdId in get('database').collection('household_members').where({ openid: auth.openid }).field({ householdId: true }).get().data.map(h => h.householdId)"
}
```

> 注意：微信云自定义规则语法以控制台文档为准，不同环境函数名/子查询支持可能不同，部署前请在控制台规则校验器中验证。

### `visibility_settings`

```json
{
  "read": true,
  "write": false
}
```

写入时应校验 `doc.openid == auth.openid` 且用户属于该 `householdId`（云函数侧已按 `householdId + openid` 更新）。

---

## 邀请码 `invite_codes`

- MVP：**仅云函数** `createInviteCode` / `joinHousehold` 读写。
- 规则推荐：`write: false`，`read: false`（客户端不读邀请码集合）。

```json
{
  "read": false,
  "write": false
}
```

---

## 上线前检查清单

- [ ] 所有敏感集合关闭「所有用户可写」。
- [ ] 确认云函数已部署且小程序仅通过 `family` 云函数写库。
- [ ] `invite_codes` 已支持 `usedAt` / `usedByOpenid`（一次性邀请在 join 时标记）。
- [ ] `household_members` 已创建，并与现有 `members` 数据完成迁移（首次 `getOrCreateUser` 会自动补一行 legacy 数据）。
