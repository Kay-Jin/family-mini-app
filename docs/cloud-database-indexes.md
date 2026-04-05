# CloudBase 数据库索引清单（按集合）

在微信开发者工具 → **云开发** → **数据库** → 对应集合 → **索引管理** 中创建。若查询报「缺少索引」，控制台会给出推荐，可与下表对照。

以下索引均为 **复合索引**，字段顺序与排序方向需一致。

| 集合 | 建议索引名 | 字段（顺序） | 用途（云函数中的查询） |
|------|------------|--------------|------------------------|
| `weekly_reports` | `household_generated` | `householdId` 升序，`generated_at` 降序 | `getWeeklyReport`：`where(householdId)` + `orderBy(generated_at, desc)` |
| `checkin_alerts` | `household_created` | `householdId` 升序，`created_at` 降序 | `getCheckinAlerts` |
| `checkin_alerts` | `household_member_date` | `householdId` 升序，`member_openid` 升序，`date_key` 升序 | `countMemberAlertsDay`、二次提醒取最近一条 |
| `check_ins` | `household_created` | `householdId` 升序，`created_at` 降序 | `listCheckIns`、策略扫描 |
| `help_requests` | `household_created` | `householdId` 升序，`created_at` 降序 | `listHelpRequests` |
| `care_reminders` | `household_created` | `householdId` 升序，`created_at` 降序 | `listCareReminders`、周报聚合 |
| `daily_statuses` | `household_created` | `householdId` 升序，`created_at` 降序 | `listDailyStatuses`、`getStatusDigest` |
| `morning_briefs` | `household_date` | `householdId` 升序，`date` 降序 | `getMorningBrief` |
| `health_snapshots` | `household_date` | `householdId` 升序，`date` 降序 | `getHealthSnapshot`、周报 |
| `album_items` | `household_created` | `householdId` 升序，`created_at` 降序 | `listAlbum`、周报 |
| `visibility_settings` | `household_openid` | `householdId` 升序，`openid` 升序 | `getVisibility` / `ensureVisibility` |
| `members` | `household_openid` | `householdId` 升序，`openid` 升序 | 策略权限、`bootstrapHouseAdmin`、`getDisplayName`（openid 单查可用单字段索引） |
| `members` | `household_role` | `householdId` 升序，`role` 升序 | `assertCanEditPolicy` 中 admin 计数 |
| `checkin_policies` | `household_only` | `householdId` 升序 | `getCheckinPolicy` / `updateCheckinPolicy`（若仅 `where(householdId)`） |
| `checkin_policies` | `enabled_scan` | `enabled` 升序 | 定时任务 `scanAllCheckinPolicies`：`where({ enabled: true })`（数据量大时建议加） |

## 操作提示

1. 同一集合可有多条索引；名称在控制台内唯一即可。  
2. 创建索引后 **等待构建完成** 再压测云函数。  
3. `checkin_alerts` 上若 `orderBy("created_at")` 仍报错，确认已选 **降序** 与 `householdId` 组合。
