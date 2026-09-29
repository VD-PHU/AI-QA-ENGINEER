# Bug Report BUG-002

## Title
A valid 8-character password (the documented minimum) is incorrectly rejected

## Linked Test Case
**TC-13** (Boundary) — Password exactly at minimum length (8 chars)

## Environment
* Application: `app/register.html`
* Browser: Chromium (headless) via Playwright 1.56
* Test data: `email = min8@example.com`, `password = Str0ng!a` (8 characters, contains upper, lower,
  digit, and special character — otherwise fully compliant with the password policy)

## Steps to Reproduce
1. Open the registration form.
2. Enter a valid email.
3. Enter an 8-character password that satisfies every complexity rule, e.g. `Str0ng!a`.
4. Enter the same value in Confirm Password.
5. Click **Create account**.

## Expected Result
Per the stated policy ("8–64 characters, with at least one uppercase, one lowercase, one digit, one
special character"), an 8-character password meeting all complexity rules should be **accepted** and
the success message should be shown.

## Actual Result
The form rejects the password with the inline error *"Password must be at least 8 characters long."*
— even though the password is exactly 8 characters, i.e. exactly at the documented minimum.

## Evidence
Screenshot: `test-results/screenshots/TC-13.png` (shows the red validation error under the password
field despite an 8-character, fully-compliant password).
Automated log: `test-results/console-log.txt`, entry `[TC-13] ❌ FAIL`.
Cross-check: TC-14 (7-character password) is correctly rejected with the same message, which is what
first pointed to a boundary/off-by-one issue rather than a broken message string.

## Severity Suggestion
**Medium-High.** This is a functional defect that blocks legitimate users who choose an 8-character
password — a common, encouraged length — from registering at all. It doesn't cause data loss, but it
directly breaks an explicit, documented acceptance boundary of the feature.

## Possible Cause
Code inspection of `app/register.html`, `validatePassword()`:

```js
// BUG: should be value.length < 8 (i.e. require >= 8), but implemented as <= 8 (requires >= 9)
if (value.length <= 8) return "Password must be at least 8 characters long.";
```

**Root cause:** classic off-by-one / fencepost error. The comparison operator should be `<` (reject
strictly less than 8) but is implemented as `<=` (rejects 8 as well, effectively requiring 9+
characters). This is exactly the class of bug boundary-value testing is designed to catch — neither
an equivalence-class test with a "clearly short" or "clearly long" password would have exposed it.

## Suggested Fix
Change the condition to `if (value.length < 8) return "...";` and keep TC-13/TC-14 as permanent
regression tests for this exact boundary.
