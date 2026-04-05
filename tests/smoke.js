/**
 * Automated smoke tests for mockService + routing contracts.
 * Maps to docs/test-cases.md behaviors under ENV-A (mock) where applicable.
 */

const assert = require("assert");
const mock = require("../services/mockService");

function run(name, fn) {
  try {
    fn();
    console.log(`OK  ${name}`);
    return true;
  } catch (e) {
    console.error(`FAIL ${name}:`, e.message);
    return false;
  }
}

let passed = 0;
let failed = 0;

function ok(name, fn) {
  if (run(name, fn)) passed += 1;
  else failed += 1;
}

ok("TC-TOD-001 brief shape", () => {
  const b = mock.getMorningBrief();
  assert(b && b.date && b.summary_text);
});

ok("TC-TOD-002 check-in adds history", () => {
  const before = mock.getCheckIns().length;
  mock.createCheckIn();
  assert(mock.getCheckIns().length >= before);
});

ok("check-in policy roundtrip", () => {
  mock.updateCheckinPolicy({ threshold_minutes: 90 });
  assert.strictEqual(mock.getCheckinPolicy().threshold_minutes, 90);
  mock.updateCheckinPolicy({ threshold_minutes: 60 });
});

ok("care reminder CRUD", () => {
  const r = mock.addCareReminder({
    title: "测试提醒",
    note: "n",
    repeat_rule: "weekly",
    visibility: "self",
  });
  assert(r.id);
  mock.updateCareReminder(r.id, { title: "已改" });
  const list = mock.listCareReminders();
  assert(list.find((x) => x.id === r.id).title === "已改");
  mock.deleteCareReminder(r.id);
  assert(!mock.listCareReminders().find((x) => x.id === r.id));
});

ok("help request types + debounce data", () => {
  mock.createHelpRequest("companionship");
  mock.createHelpRequest("unwell");
  const h = mock.listHelpRequests();
  assert(h.length >= 2);
  const last = h[0];
  assert(last.type === "unwell" || last.type === "companionship");
});

ok("help cancel within window", () => {
  const x = mock.createHelpRequest("call_me");
  mock.cancelHelpRequest(x.id);
  const row = mock.listHelpRequests().find((r) => r.id === x.id);
  assert(row && row.status === "cancelled");
});

ok("weekly report generate + get", () => {
  mock.generateWeeklyReport();
  const w = mock.getWeeklyReport();
  assert(w && typeof w.checkin_count === "number");
});

ok("visibility toggles", () => {
  mock.updateVisibility({ share_step_band: false });
  assert.strictEqual(mock.getVisibility().share_step_band, false);
  mock.updateVisibility({ share_step_band: true });
});

ok("bootstrapHouseAdmin when no admin", () => {
  const backup = mock.listMembers().map((m) => ({ uid: m.uid, role: m.role }));
  mock.listMembers().forEach((m) => {
    mock.updateMemberRole(m.uid, "adult");
  });
  mock.bootstrapHouseAdmin();
  assert.strictEqual(mock.listMembers()[0].role, "admin");
  backup.forEach((b) => mock.updateMemberRole(b.uid, b.role));
});

console.log("\n---");
console.log(`Passed: ${passed}, Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
