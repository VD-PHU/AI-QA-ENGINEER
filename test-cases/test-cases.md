# AI-Generated Test Cases

**Requirement:** As a user, I can register using email and password.
**Target:** `app/register.html`
**Legend — Category:** POS = Positive · NEG = Negative · BND = Boundary · VAL = Validation/UI

| ID | Category | Title | Steps | Test Data | Expected Result | Priority |
|----|----------|-------|-------|-----------|------------------|----------|
| TC-01 | POS | Register with valid email + strong password | 1) Enter email 2) Enter password 3) Enter matching confirm password 4) Click Create account | email=`jane.doe@example.com`, password=`Str0ng!Pass` | Success message shown, form cleared | High |
| TC-02 | POS | Register with plus-addressed / subdomain email | Same as TC-01 | email=`jane+shop@mail.example.co.uk`, password=`Str0ng!Pass` | Success message shown | Medium |
| TC-03 | POS | Register with password at max valid length (64 chars, complex) | Same as TC-01 | email=`long.pw@example.com`, password = 64-char string with upper/lower/digit/special | Success message shown | Medium |
| TC-04 | NEG | Empty email | Leave email blank, fill others, submit | email=``, password=`Str0ng!Pass` | Inline error "Email is required.", no success message | High |
| TC-05 | NEG | Empty password | Leave password blank, fill email, submit | email=`user@example.com`, password=`` | Inline error "Password is required.", no success message | High |
| TC-06 | NEG | Confirm password does not match | Enter differing password/confirm | password=`Str0ng!Pass`, confirm=`Different!1` | Inline error "Passwords do not match.", no success message | High |
| TC-07 | NEG | Malformed email (missing @) | Enter invalid email | email=`janedoeexample.com` | Inline error "Please enter a valid email address.", no success message | High |
| TC-08 | NEG | Malformed email (missing domain suffix) | Enter invalid email | email=`jane@example` | Inline error "Please enter a valid email address.", no success message | Medium |
| TC-09 | NEG | Register with an already-registered email | Submit using a pre-seeded existing account email | email=`existing@test.com`, password=`Str0ng!Pass` | Form-level error "An account with this email already exists.", registration blocked | High |
| TC-10 | NEG | Password missing special character | Submit password without symbol | password=`StrongPass1` | Inline error "...at least one special character." | Medium |
| TC-11 | NEG | Password missing uppercase letter | Submit password without uppercase | password=`str0ng!pass` | Inline error "...at least one uppercase letter." | Medium |
| TC-12 | NEG | Password missing digit | Submit password without a number | password=`Strong!Pass` | Inline error "...at least one digit." | Medium |
| TC-13 | BND | Password exactly at minimum length (8 chars) | Submit an 8-character complex password | password=`Str0ng!a` (8 chars) | **Accepted** — success message shown | High |
| TC-14 | BND | Password one below minimum (7 chars) | Submit a 7-character complex password | password=`Str0ng!` (7 chars) | Rejected — "at least 8 characters" error | High |
| TC-15 | BND | Password exactly at maximum length (64 chars) | Submit a 64-character complex password | 64-char string | Accepted — success message shown | Medium |
| TC-16 | BND | Password one above maximum (65 chars) | Submit a 65-character complex password | 65-char string | Rejected — "at most 64 characters" error | Medium |
| TC-17 | BND | Email at max allowed length (254 chars) | Submit an email exactly 254 characters long, valid shape | 254-char email | Accepted — success message shown | Low |
| TC-18 | VAL | Email whitespace is trimmed | Enter email with leading/trailing spaces | email=`  jane@example.com  ` | Treated as `jane@example.com`; accepted | Low |
| TC-19 | VAL | Password field masks input | Inspect password input type | n/a | `type="password"` attribute present on password & confirm fields | Medium |
| TC-20 | VAL | Submit button disabled during submission (no double-submit) | Click submit and immediately re-check button state | valid data | Button becomes disabled ("Creating account...") until request completes | Medium |
| TC-21 | VAL | Successful registration resets the form | Complete TC-01, then inspect field values | valid data | Email/password/confirm fields are empty after success | Low |

**Total: 21 test cases** (exceeds the minimum of 15), covering 3 positive, 8 negative, 5 boundary, and 5 validation/UI scenarios.
