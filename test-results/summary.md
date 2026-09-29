# Test Execution Summary

**Suite:** `tests/register.spec.js`
**Target:** `app/register.html` (Chromium, headless, Playwright 1.56)
**Date:** 2026-09-25
**Result:** 19 / 21 passed · **2 failed**

| ID | Category | Title | Result |
|----|----------|-------|--------|
| TC-01 | POS | Register with valid email + strong password | ✅ PASS |
| TC-02 | POS | Register with plus-addressed / subdomain email | ✅ PASS |
| TC-03 | POS | Register with password at max valid length (64 chars) | ✅ PASS |
| TC-04 | NEG | Empty email | ✅ PASS |
| TC-05 | NEG | Empty password | ✅ PASS |
| TC-06 | NEG | Confirm password does not match | ✅ PASS |
| TC-07 | NEG | Malformed email (missing @) | ✅ PASS |
| TC-08 | NEG | Malformed email (missing domain suffix) | ✅ PASS |
| **TC-09** | **NEG** | **Register with an already-registered email** | **❌ FAIL** |
| TC-10 | NEG | Password missing special character | ✅ PASS |
| TC-11 | NEG | Password missing uppercase letter | ✅ PASS |
| TC-12 | NEG | Password missing digit | ✅ PASS |
| **TC-13** | **BND** | **Password exactly at minimum length (8 chars)** | **❌ FAIL** |
| TC-14 | BND | Password one below minimum (7 chars) | ✅ PASS |
| TC-15 | BND | Password exactly at maximum length (64 chars) | ✅ PASS |
| TC-16 | BND | Password one above maximum (65 chars) | ✅ PASS |
| TC-17 | BND | Email at max allowed length (254 chars) | ✅ PASS |
| TC-18 | VAL | Email whitespace is trimmed | ✅ PASS |
| TC-19 | VAL | Password field masks input | ✅ PASS |
| TC-20 | VAL | Submit button disabled during submission | ✅ PASS |
| TC-21 | VAL | Successful registration resets the form | ✅ PASS |

## Failures → Bug Reports
* **TC-09** → [BUG-001-duplicate-email-not-rejected.md](../bug-reports/BUG-001-duplicate-email-not-rejected.md)
* **TC-13** → [BUG-002-password-8char-boundary-rejected.md](../bug-reports/BUG-002-password-min-length-off-by-one.md)

Raw machine-readable results: `test-results/results.json`
Console log: `test-results/console-log.txt`
Failure screenshots: `test-results/screenshots/TC-09.png`, `test-results/screenshots/TC-13.png`

## Bonus — AI Explorer
An automated DOM-exploration pass (`tools/ai-explorer.js`) independently suggested testing the
email-uniqueness and password-length-boundary scenarios *before* seeing this failure list — see
`docs/ai-explorer-report.md` and the annotated screenshot
`test-results/screenshots/ai-explorer-annotated.png`.
