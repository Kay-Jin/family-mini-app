# 中期：产品路线（建议优先级）

在 **Onboarding / 多家庭 / 邀请码 / 审计** 已落地的前提下，可按业务价值排序。

## P1 — 与「家」强相关

- **家庭成员资料**：在云侧可编辑 `display_name`、头像占位；与本地 `storage` 同步策略写清。
- **家庭设置页**：**家庭名称修改**、**解散家庭**、**邀请码列表 + 作废**（家庭创建者可作废本家庭任意码；成员仅可作废自己生成的码）已在云函数 + `household` 页落地。
- **邀请管理（增强）**：后续可做分页、筛选仅 `active`、与审计导出联动。

## P2 — 体验与留存

- **晨报 / 提醒**：小程序侧已接 **`wx.requestSubscribeMessage`** + 模板 ID 配置；**定时发送**仍须在云函数 + 公众平台完成（见 `docs/morning-brief-subscribe.md`）。
- **新手引导**：首次进入各 Tab 的简单遮罩（纯前端，注意长辈模式下的字号）。
- **错误文案统一**：云函数 `message` 与中文字符串表对齐，便于运营改文案。

## P3 — HTTP / 混合部署

若保留 **`backend_mode: http`**：

- 与自建后端对齐 **路径与字段**：`household_id`、`user_uid`、`max_uses` / `maxUses`、邀请码列表、改名等（见 **`docs/http-api-contract.md`** 与 **`tools/http-stub/README.md`**）。
- **鉴权**：`Authorization` 与 refresh 策略；小程序端仅存 token 不落明文密码。

## P4 — 合规与扩展

- **未成年人 / 监护人** 场景是否需额外 consent（视地区法务）。
- **数据导出与删除**：见 **`docs/COMPLIANCE.md`** 提纲；实施需产品与法务定稿。

---

更新本文件时建议同步改 **`README.md` — 下一步建议** 中的一条 bullet，避免文档分叉。
