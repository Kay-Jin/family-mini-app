# Family Mini App Test Report

## 1. Report Summary

- Date: 2026-04-01
- Build: `main` @ local workspace
- Scope: F-M1 ~ F-M5 and runtime API config
- Result: **Partial execution complete (DevTools-independent checks + static verification)**  
  Full pass/fail for all TCs requires WeChat DevTools and backend endpoint availability.

## 2. Executed in This Round

### 2.1 Static + Code-path Verification (Executed)

- Verified service routing logic between mock and HTTP in `services/familyService.js`
- Verified runtime config persistence and retrieval in `services/apiConfig.js`
- Verified auth header attachment for request/upload in `services/http.js`
- Verified visibility flags are consumed in:
  - `pages/today/index.*`
  - `pages/health/index.*`
  - `pages/memories/index.*`
- Verified role/senior behavior wiring in:
  - `pages/profile/index.*`
  - `pages/today/index.*`
  - `pages/memories/index.*`
- Verified household operations wiring:
  - role update
  - invite code generation/copy
- Lint/diagnostics check: no IDE lints reported

### 2.2 Runtime Device/DevTools Cases (Not Executed Here)

The following require interactive WeChat runtime:

- Camera/gallery picker flow actual UX
- Clipboard behavior in WeChat container
- Pull-to-refresh gesture behavior
- Real network integration with actual backend URL/token
- Android/iOS WeChat client compatibility

## 3. Current Risk Assessment

- High risk: real backend schema mismatch (if API shape differs from assumed routes)
- Medium risk: WeChat runtime-specific behavior (picker, clipboard, refresh gesture)
- Medium risk: token/auth policy mismatch (bearer vs custom header or session mode)
- Low risk: mock-mode core page flow regressions

## 4. Defects Found in This Round

- No blocking code defects found during static verification and lint pass.

## 5. Recommended Next Test Run (Required for Full Closure)

1. Run all `docs/test-cases.md` TCs in WeChat DevTools with `USE_MOCK=true`
2. Re-run P0/P1 with `USE_MOCK=false` + valid backend
3. Execute negative network/auth cases (invalid URL, invalid token, timeout)
4. Execute smoke on Android/iOS WeChat real devices
5. Record pass/fail by TC ID and reopen defects if any

## 6. Completion Status

- TC document creation: **Done**
- Test execution in this environment: **Partial**
- Full QA sign-off status: **Pending runtime execution**
