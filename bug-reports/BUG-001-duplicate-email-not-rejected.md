# Bug Report BUG-001

## Title
Registration succeeds with an email address that is already registered

## Linked Test Case
**TC-09** (Negative) — Register with an already-registered email

## Environment
* Application: `app/register.html`
* Browser: Chromium (headless) via Playwright 1.56
* Test data: `email = existing@test.com` (seeded as a pre-existing account in the app), valid strong password

## Steps to Reproduce
1. Open the registration form.
2. Enter `existing@test.com` in the Email field.
3. Enter a valid, complexity-compliant password (e.g. `Str0ng!Pass`) in both Password and Confirm Password.
4. Click **Create account**.

## Expected Result
The system should recognize that `existing@test.com` is already registered and block the
registration, showing a form-level error such as *"An account with this email already exists."*
The success message must **not** appear.

## Actual Result
The form accepts the submission as if it were a brand-new account: the green confirmation message
*"Account created! Please check your email to verify your account."* is displayed and the form is
reset — there is no indication that the email was already taken.

## Evidence
Screenshot: `test-results/screenshots/TC-09.png` (shows the success banner after submitting the
pre-registered email, with no duplicate-account error present).
Automated log: `test-results/console-log.txt`, entry `[TC-09] ❌ FAIL`.

## Severity Suggestion
**High.** This allows silent "re-registration" over an existing account and, in a real backend,
would likely either (a) silently overwrite/duplicate a user record, or (b) mask a downstream
integrity error. It directly violates a core acceptance criterion of the user story ("register
using email and password" implies uniqueness of the account identifier) and is user-facing.

## Possible Cause
Code inspection of `app/register.html` shows the duplicate-check logic exists but is commented out
in the submit handler:

```js
// BUG: duplicate-email check is missing entirely (spec requires rejecting already-registered emails)
// if (EXISTING_USERS.has(email.toLowerCase())) {
//   document.getElementById("formError").textContent = "An account with this email already exists.";
//   ...
// }
```

The `EXISTING_USERS` set is still populated and updated on every successful registration, but
nothing ever reads from it before allowing a submission through. **Likely root cause:** the
duplicate-check block was disabled/removed during a refactor and never re-enabled — a regression
rather than a design gap, since the supporting data structure and error UI element are already in
place.

## Suggested Fix
Re-enable the `EXISTING_USERS.has(...)` guard before the success path executes, and add this
scenario as a permanent regression test (already covered by TC-09).
