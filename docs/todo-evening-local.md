# 今晚本地联调（到家后执行）

- [ ] 拉取最新代码：`git pull origin main`
- [ ] 打开 **`docs/smoke-test-lian-tiao.md`**，自 **A→B→C→D** 逐项勾选
- [ ] 有云函数报错：复制 **云开发 → 云函数 → family → 日志** 中的错误栈

**当前分支预期能力摘要（便于对齐预期）**

- Onboarding：创建/加入家庭、`maxUses` 邀请码、`household_members` 多家庭、onboarding 选家庭
- **可选**：审计集合 `family_audit_logs`（见 `docs/security-hardening.md`）
