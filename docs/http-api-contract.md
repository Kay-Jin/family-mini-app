# HTTP 模式 API 约定（与小程序 `familyService` 对齐）

自建后端实现下列路由时，可与小程序 **HTTP** 分支互通。路径前缀为 **`API_BASE_URL`**，鉴权为可选 **`Authorization: Bearer <token>`**。

## 邀请码

### 生成

- **POST** `/households/:householdId/invite_codes`
- **Body（JSON）**
  - `role`：`adult` | `senior`
  - **`max_uses`**（number，推荐）：可用人数上限，与云函数 `maxUses` 一致
  - **`maxUses`**（number，可选）：与 `max_uses` 同义，客户端会 **同时发送** 两种字段以便兼容不同后端

示例：

```json
{ "role": "adult", "max_uses": 5, "maxUses": 5 }
```

### 作废

- **POST** `/households/:householdId/invite_codes/revoke`
- **Body**：`{ "code": "ADU-XXXXXX" }`
- **语义**：将该码标记为不可用（等价云侧 `revokedAt` + `usedCount` 顶满）。**家庭创建者**或**码创建者**可操作（与云函数一致）。

### 列表

- **GET** `/households/:householdId/invite_codes`
- **Response**：数组，或 `{ "data": [...] }` / `{ "items": [...] }`；元素字段建议与云函数 `listInviteCodes` 对齐（`code`、`role`、`maxUses`、`usedCount`、`status`、`createdByOpenid`、`expiresAt` 等）。

## 家庭

### 修改名称

- **PATCH** `/households/:householdId`
- **Body**：`{ "name": "新名称" }`
- **语义**：仅家庭创建者可改（与云函数 `updateHouseholdName` 一致）。

### 摘要（创建者判断等）

- **GET** `/households/:householdId/summary`
- **Response（JSON）**
  - `name`：家庭名称
  - `createdBy`：创建者 openid（或你方用户主键，须与小程序 `getUserId()` 一致）
  - `dissolvedAt`：已解散时为非 null，否则 null

### 解散（仅创建者）

- **POST** `/households/:householdId/dissolve`
- **Body**：可为空 `{}`
- **语义**：移除该家庭下全部成员关系；创建者字段由你方校验；小程序在成功后若已无 `householdId` 会 `reLaunch` onboarding。

## 错误

HTTP **4xx/5xx** 时响应体建议包含 **`message`** 字符串，小程序会 `reject(new Error(message))`。
