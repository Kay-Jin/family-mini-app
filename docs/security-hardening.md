# 短期：质量与安全硬化

面向 **内测 → 小规模真实用户**，在「功能已通」后逐步收紧。

## 1. 数据库：默认拒绝客户端直写

| 目标 | 做法 |
|------|------|
| 防跨界读写 | 业务集合 **`write: false`**，仅 **云函数**（管理员身份）写入；详见 `cloud-database-rules.md`。 |
| 敏感集合 | `invite_codes`、`family_audit_logs`、可选 `household_members` 均不对小程序开启写权限。 |
| 校验规则 | 在控制台「自定义规则」里用官方文档校验；勿复制未经验证的跨集合子查询。 |

## 2. 审计：`family_audit_logs`（可选）

云函数在以下成功路径会 **尝试** 追加一条日志（集合不存在则静默失败，不影响业务）：

- `createHousehold`
- `joinHousehold`（仅 **`meta.inviteSuffix`** 为邀请码后 4 位，不存全码）
- `leaveHousehold`（含 `nextHouseholdId`）
- `updateMemberRole`
- `createInviteCode`（**`meta.codeSuffix`** 为后 4 位；含 `maxUses`、`role`）

**建议在云控制台创建空集合** `family_audit_logs`，权限 **仅管理员 / 云函数可写**，控制台可读。

单条字段示例：`at`、`openid`、`action`、`householdId`、`meta`（对象）。

## 3. 运营与隐私

- 定期导出/清理审计日志，避免长期保存不必要字段。
- 用户协议中说明：家庭场景下 **openid**、**家庭 ID** 用于技术服务与纠纷排查边界。
- 真机测试：**弱网 / 重复点击** 下是否产生重复写；必要时在云函数对 `createHousehold` 等加 **幂等键**（后续迭代）。

## 4. 云函数自身

- 部署后用 **云函数日志** 监控错误率；对 `unknown action`、数据库超时单独告警（微信云控制台/的外部监控）。
- **依赖**：`npm audit` 在 `cloudfunctions/family` 内定期执行；升级 `wx-server-sdk` 跟官方发版说明走。

## 5. 与「今晚联调」的关系

先完成 **`docs/smoke-test-lian-tiao.md`** 或 **`docs/todo-evening-local.md`**，再在测试环境把数据库权限收到上表建议，观察是否仍有合法路径被拦截。
