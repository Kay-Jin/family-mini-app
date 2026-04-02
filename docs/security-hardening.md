# 短期：质量与安全硬化

面向 **内测 → 小规模真实用户**，在「功能已通」后逐步收紧。

## 1. 数据库：默认拒绝客户端直写

| 目标 | 做法 |
|------|------|
| 防跨界读写 | 业务集合 **`write: false`**，仅 **云函数**（管理员身份）写入；详见 `cloud-database-rules.md`。 |
| 敏感集合 | `invite_codes`、`family_audit_logs`、可选 `household_members` 均不对小程序开启写权限。 |
| 校验规则 | 在控制台「自定义规则」里用官方文档校验；勿复制未经验证的跨集合子查询。 |

## 2. 业务字段（解散 / 作废）

- **`households.dissolvedAt` / `dissolvedBy`**：解散标记；常规业务 action 会 `assertHouseholdActive` 拒绝已解散家庭。
- **`invite_codes.revokedAt`**：邀请码作废；加入前会拦截，与 `usedCount` 用满一致。

## 3. 审计：`family_audit_logs`（可选）

云函数在以下成功路径会 **尝试** 追加一条日志（集合不存在则静默失败，不影响业务）：

- `createHousehold`
- `joinHousehold`（仅 **`meta.inviteSuffix`** 为邀请码后 4 位，不存全码）
- `leaveHousehold`（含 `nextHouseholdId`）
- `updateMemberRole`
- `createInviteCode`（**`meta.codeSuffix`** 为后 4 位；含 `maxUses`、`role`）
- `revokeInviteCode`、`dissolveHousehold`、`updateHouseholdName`

**建议在云控制台创建空集合** `family_audit_logs`，权限 **仅管理员 / 云函数可写**，控制台可读。

单条字段示例：`at`、`openid`、`action`、`householdId`、`meta`（对象）。

## 4. 运营与隐私

- 定期导出/清理审计日志，避免长期保存不必要字段。
- 用户协议中说明：家庭场景下 **openid**、**家庭 ID** 用于技术服务与纠纷排查边界。
- 真机测试：**弱网 / 重复点击** 下是否产生重复写；必要时在云函数对 `createHousehold` 等加 **幂等键**（后续迭代）。

## 5. 云函数自身

- 部署后用 **云函数日志** 监控错误率；对 `unknown action`、数据库超时单独告警（微信云控制台/的外部监控）。
- **依赖**：`npm audit` 在 `cloudfunctions/family` 内定期执行；升级 `wx-server-sdk` 跟官方发版说明走。

## 6. 云函数环境变量（微信云开发 → 云函数 → family → 版本/配置）

| 变量 | 含义 |
|------|------|
| `AUDIT_FAIL_STRICT=1` | 写 **`family_audit_logs` 失败则整笔请求报错**（需已建集合并配置好权限）。默认不写或 `0`：**仅打日志，不阻断**。 |
| `DISABLE_RATE_LIMIT=1` | 关闭 **`joinHousehold` / `createHousehold` / `dissolveHousehold`** 的分钟级限流。 |
| `RL_CREATE_HOUSEHOLD_PER_MIN` | 创建家庭上限（默认 **8**） |
| `RL_JOIN_HOUSEHOLD_PER_MIN` | 加入尝试上限（默认 **24**） |
| `RL_DISSOLVE_HOUSEHOLD_PER_MIN` | 解散家庭上限（默认 **4**） |

限流依赖集合 **`family_rate_limit`**（可按文档 ID 自增计数）；**不存在时 `bumpRateLimit` 会失败并 fail-open 放行**，与审计默认策略一致。

## 7. 幂等：`family_idempotency`（创建家庭）

- 小程序 **`createHouseholdCloud`** 会生成 **`clientRequestId`** 并随云函数传入。
- 云函数在 **`createHousehold`** 成功后将 `{ ok, data }` 全文缓存在 **`family_idempotency`**（文档 ID 与 `openid`+`clientRequestId` 绑定）。
- **相同 `clientRequestId` 重试**时直接返回缓存结果，避免网络重试导致 **重复创建多个家庭**（需在控制台创建该集合，否则读写失败会打日志；读失败会继续创建——与其它可选集合一致）。

## 8. 与「今晚联调」的关系

先完成 **`docs/smoke-test-lian-tiao.md`** 或 **`docs/todo-evening-local.md`**，再在测试环境把数据库权限收到上表建议。若要验证严格审计：**先建 `family_audit_logs` 再设 `AUDIT_FAIL_STRICT=1`**，故意写错集合权限应看到请求失败。
