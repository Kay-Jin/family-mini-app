# Family Mini App Test Cases

## 1. Scope

- Product: `family-mini-app` WeChat mini program
- Version under test: commit `344340e` and later
- Coverage target: F-M1 ~ F-M5, runtime API config, role/senior behavior, visibility rules, request/auth behavior

## 2. Test Environment Matrix

- ENV-A: WeChat DevTools + `USE_MOCK=true`
- ENV-B: WeChat DevTools + `USE_MOCK=false` + valid `API Base URL`
- ENV-C: WeChat DevTools + `USE_MOCK=false` + invalid URL / timeout
- ENV-D: WeChat DevTools + `USE_MOCK=false` + auth token (valid/invalid)
- ENV-E: Android/iOS real device smoke (recommended for release gate)

## 3. Functional Test Cases

### 3.1 F-M1 / F-M2 Today (Morning Brief + Check-In)

| TC ID | Title | Preconditions | Steps | Expected |
|---|---|---|---|---|
| TC-TOD-001 | Today page loads brief | ENV-A | Open `今日` tab | Brief card shown with date + summary |
| TC-TOD-002 | One-tap check-in success | ENV-A | Tap check-in button | Success toast, check-in list updates with latest item |
| TC-TOD-003 | Check-in failure handling | ENV-C | Tap check-in button | Error toast shown, page remains stable |
| TC-TOD-004 | Pull-to-refresh | ENV-A or B | Pull down on `今日` | Data refreshed without crash |
| TC-TOD-005 | Hide morning brief by visibility | ENV-A, set `include_in_morning_brief=false` | Return to `今日` | Brief/summary card hidden |
| TC-TOD-006 | Hide check-in records by visibility | ENV-A, set `share_last_checkin_time=false` | Return to `今日` | Check-in history card hidden |
| TC-TOD-007 | Show weather when enabled | ENV-A, `share_city_weather=true` | Open `今日` | Weather line shown in brief card |
| TC-TOD-008 | Role-based senior prompt | ENV-A, role `senior` | Open `今日` | Senior helper text shown |

### 3.2 F-M3 Health

| TC ID | Title | Preconditions | Steps | Expected |
|---|---|---|---|---|
| TC-HEA-001 | Health page loads snapshots | ENV-A | Open `健康` tab | List renders health records |
| TC-HEA-002 | Pull-to-refresh health | ENV-A/B | Pull down on health page | Data refresh succeeds |
| TC-HEA-003 | Hide step band | ENV-A, `share_step_band=false` | Open `健康` | Step row hidden |
| TC-HEA-004 | Hide sleep summary | ENV-A, `share_sleep_summary=false` | Open `健康` | Sleep row hidden |
| TC-HEA-005 | Hide all health sharing | ENV-A, both false | Open `健康` | Placeholder text shown: health sharing disabled |
| TC-HEA-006 | Error rendering on network failure | ENV-C | Open `健康` | Error card shown, no page crash |

### 3.3 F-M4 Memories (Album)

| TC ID | Title | Preconditions | Steps | Expected |
|---|---|---|---|---|
| TC-MEM-001 | Album list loads | ENV-A | Open `回忆` tab | Existing album items shown |
| TC-MEM-002 | Upload photo success | ENV-A | Tap upload -> choose image | Success toast + new item appears at top |
| TC-MEM-003 | Upload canceled by user | ENV-A | Tap upload then cancel picker | No crash, no stale loading |
| TC-MEM-004 | Upload blocked by visibility | ENV-A, `share_album_contribute=false` | Tap upload | Upload prevented with toast |
| TC-MEM-005 | Senior view hides upload button | ENV-A, role `senior` | Open `回忆` | Upload button hidden; read-only hint shown |
| TC-MEM-006 | Network upload failure | ENV-C | Upload image | Error toast shown; app remains stable |

### 3.4 F-M5 Profile / Household / Visibility

| TC ID | Title | Preconditions | Steps | Expected |
|---|---|---|---|---|
| TC-PRO-001 | Toggle senior mode | ENV-A | In `我的` switch senior on/off | Setting persists and UI density changes |
| TC-PRO-002 | Role simulation switch | ENV-A | Change role adult/senior | Role persists and affects Today/Memories behavior |
| TC-PRO-003 | Navigate household | ENV-A | Tap household card | Household page opens |
| TC-PRO-004 | Navigate visibility | ENV-A | Tap visibility card | Visibility page opens |
| TC-HOU-001 | Household list loads | ENV-A | Open household page | Members rendered |
| TC-HOU-002 | Update member role success | ENV-A | Change member role picker | Success toast + role refreshed |
| TC-HOU-003 | Generate invite code | ENV-A | Select role + generate | Invite code displayed |
| TC-HOU-004 | Copy invite code | ENV-A with generated code | Tap copy | Clipboard updated + success toast |
| TC-VIS-001 | Toggle share_step_band | ENV-A | Switch setting | Persisted and reflected on health page |
| TC-VIS-002 | Toggle share_sleep_summary | ENV-A | Switch setting | Persisted and reflected on health page |
| TC-VIS-003 | Toggle share_city_weather | ENV-A | Switch setting | Persisted and reflected on today page |
| TC-VIS-004 | Toggle share_last_checkin_time | ENV-A | Switch setting | Persisted and reflected on today page |
| TC-VIS-005 | Toggle share_album_contribute | ENV-A | Switch setting | Persisted and reflected on memories page |
| TC-VIS-006 | Toggle include_in_morning_brief | ENV-A | Switch setting | Persisted and reflected on today page |

### 3.5 Runtime API Configuration + Auth

| TC ID | Title | Preconditions | Steps | Expected |
|---|---|---|---|---|
| TC-API-001 | Switch Mock ON | ENV-B | Enable `使用 Mock 数据` | Calls route to mock service immediately |
| TC-API-002 | Switch Mock OFF | ENV-A | Disable `使用 Mock 数据` | Calls route to HTTP backend |
| TC-API-003 | Save API base URL | Any | Enter URL and save | URL persisted and reused |
| TC-API-004 | Save bearer token | Any | Enter token and save | Token persisted and reused |
| TC-API-005 | Request includes auth header | ENV-D | Trigger data load/upload | Request carries `Authorization: Bearer ...` |
| TC-API-006 | Invalid base URL behavior | ENV-C | Set invalid URL and open pages | Error cards/toasts shown, no crash |

### 3.6 Cross-Cutting / Stability

| TC ID | Title | Preconditions | Steps | Expected |
|---|---|---|---|---|
| TC-STB-001 | App launch with empty storage | Fresh install | Open app | No crash, defaults applied |
| TC-STB-002 | Storage persistence across relaunch | Existing settings | Relaunch app | Senior/role/api settings retained |
| TC-STB-003 | Rapid tab switching | Any | Quickly switch tabs 20x | No white screen/crash |
| TC-STB-004 | Pull refresh across all data pages | Any | Repeated pull refresh | No memory leak symptoms / freeze |
| TC-STB-005 | Error then recovery | ENV-C then A | Fail a request then fix config | App recovers without reinstall |

## 4. Non-Functional Test Cases

| TC ID | Area | Preconditions | Steps | Expected |
|---|---|---|---|---|
| TC-NF-001 | Accessibility | Senior mode ON | Check font/button size on all pages | Readability and tap targets improved |
| TC-NF-002 | Performance | ENV-A | Launch + open all tabs | No obvious jank on devtools |
| TC-NF-003 | Security | ENV-B/D | Verify no token echo in UI | Sensitive token not rendered in UI labels |
| TC-NF-004 | Compatibility | ENV-E | Smoke on Android/iOS WeChat | Core flows pass on both platforms |

## 5. Exit Criteria

- All P0/P1 TCs pass
- No crash/blocker in core flows
- Visibility and role rules confirmed across pages
- Runtime API config and token header behavior verified in real backend environment
