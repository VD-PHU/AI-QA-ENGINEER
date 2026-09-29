# Demo Walkthrough

This walks through the full workflow exactly as it was executed for this submission.

## Step 1 — Input the requirement
```
As a user, I can register using email and password.
```
The AI assistant expands this into explicit acceptance criteria (email format/length/uniqueness,
password length/complexity, confirm-password match) — see `docs/test-strategy.md`, section 2 — since
that's the implicit spec any QA engineer would need before writing test cases.

## Step 2 — AI generates test cases
From that requirement, the assistant produced **21 test cases** across all four required categories
(3 positive, 8 negative, 5 boundary, 5 validation/UX) — see `test-cases/test-cases.md`. Each row has
an ID, category, steps, concrete test data, and an expected result, so it can be handed directly to an
automation engineer (or, here, automated directly).

## Step 3 — Execute tests (Playwright)
All 21 cases were automated in `tests/register.spec.js` using the Playwright core API (`chromium.launch`
+ `page` interactions) against the sample app, run headless:

```
$ node tests/register.spec.js
Running 21 automated test cases against file:///.../app/register.html

[TC-01] ✅ PASS — Register with valid email + strong password
[TC-02] ✅ PASS — Register with plus-addressed / subdomain email
[TC-03] ✅ PASS — Register with password at max valid length (64 chars, complex)
[TC-04] ✅ PASS — Empty email
[TC-05] ✅ PASS — Empty password
[TC-06] ✅ PASS — Confirm password does not match
[TC-07] ✅ PASS — Malformed email (missing @)
[TC-08] ✅ PASS — Malformed email (missing domain suffix)
[TC-09] ❌ FAIL — Register with an already-registered email
    expected: Form-level error "An account with this email already exists.", registration blocked
    actual  : Registration succeeded (success message shown) — duplicate email was NOT rejected.
[TC-10] ✅ PASS — Password missing special character
[TC-11] ✅ PASS — Password missing uppercase letter
[TC-12] ✅ PASS — Password missing digit
[TC-13] ❌ FAIL — Password exactly at minimum length (8 chars)
    expected: Accepted — success message shown
    actual  : Registration rejected. Inline error shown: "Password must be at least 8 characters long."
[TC-14] ✅ PASS — Password one below minimum (7 chars)
[TC-15] ✅ PASS — Password exactly at maximum length (64 chars)
[TC-16] ✅ PASS — Password one above maximum (65 chars)
[TC-17] ✅ PASS — Email at max allowed length (254 chars)
[TC-18] ✅ PASS — Email whitespace is trimmed
[TC-19] ✅ PASS — Password field masks input
[TC-20] ✅ PASS — Submit button disabled during submission (no double-submit)
[TC-21] ✅ PASS — Successful registration resets the form

=== SUMMARY: 19/21 passed, 2 failed ===
```
(full log: `test-results/console-log.txt`; structured data: `test-results/results.json`)

For every failure, the runner automatically captured a full-page screenshot before moving on —
no manual reproduction needed.

### TC-09 evidence — duplicate email silently accepted
`test-results/screenshots/TC-09.png` — the green "Account created!" banner appears even though the
email `existing@test.com` was seeded as already registered.

### TC-13 evidence — valid 8-char password rejected
`test-results/screenshots/TC-13.png` — a fully policy-compliant 8-character password (`Str0ng!a`) is
rejected with "Password must be at least 8 characters long."

## Step 4 — Analyze failures
For each failure, the assistant cross-referenced the expected vs. actual behavior against the
**application source**, not just the symptom:
* TC-09 → found the duplicate-check block present in the code but commented out (a disabled guard,
  not a missing feature — a regression).
* TC-13 → found a one-character comparison operator error (`<=` instead of `<`), a classic
  boundary/fencepost bug that only boundary-value testing (not equivalence-class testing) would catch.

## Step 5 — Bug reports generated
Two full bug reports were generated, each with test case, expected result, actual result, evidence
(linked screenshot), severity suggestion, and possible cause traced to a specific line of code:
* `bug-reports/BUG-001-duplicate-email-not-rejected.md` (Severity: High)
* `bug-reports/BUG-002-password-min-length-off-by-one.md` (Severity: Medium-High)

## End-to-end traceability
```
Requirement
  └─ docs/test-strategy.md          (assumptions + strategy)
       └─ test-cases/test-cases.md  (21 test cases, 4 categories)
            └─ tests/register.spec.js       (Playwright automation, 100% of cases automated)
                 └─ test-results/           (pass/fail log, JSON, screenshots)
                      └─ bug-reports/       (2 bug reports for the 2 real, seeded defects found)
```
