# Test Strategy — AI Testing Assistant Workflow

## 1. Objective
Demonstrate an end-to-end AI-assisted QA workflow:

```
Requirement → AI-Generated Test Cases → Automated Execution (Playwright)
           → Failure Analysis → Bug Report
```

using a real user story as input and a working, testable application as the target.

## 2. Requirement Under Test
> **User story:** As a user, I can register using email and password.

This was expanded (by the AI assistant) into an implicit acceptance-criteria set before test design, since
"register with email and password" implies rules a QA engineer would normally have to ask a product
owner about. The assumed rules, used as the oracle for "expected result" in every test case, are:

| Field | Rule |
|---|---|
| Email | Required. Must match a standard `local@domain.tld` shape. Max length 254 chars. Duplicate emails must be rejected. |
| Password | Required. 8–64 characters. Must contain ≥1 uppercase, ≥1 lowercase, ≥1 digit, ≥1 special character. |
| Confirm Password | Required. Must exactly match Password. |
| Submit | Disabled while request is "in flight" (no double submit). Successful submit shows a confirmation message and clears the form. |

Where the requirement was ambiguous, the assistant made the most conservative/standard assumption and
documented it above, rather than blocking test design on a clarification round-trip — the same way a QA
engineer would flag assumptions in a test plan for review.

## 3. Test Levels & Types
| Type | Purpose | Count |
|---|---|---|
| Positive | Confirm the feature works for valid, expected input | 3 |
| Negative | Confirm invalid input / disallowed states are rejected with the right message | 7 |
| Boundary | Confirm behavior exactly at and around field limits (length min/max) | 5 |
| Validation / UI-behavior | Confirm field-level validation UX and non-functional behaviors (masking, no double-submit, form reset) | 5 |
| **Total** | | **20** |

## 4. Test Environment
* **Application under test:** `app/register.html` — a small, self-contained registration form
  (see README for why a purpose-built sample app was used instead of a third-party public site).
* **Browser:** Chromium (headless), via Playwright 1.56.
* **Execution:** Node.js script using the Playwright core API (`chromium.launch()` / `page` API) as a
  lightweight custom test runner — functionally equivalent to `@playwright/test`, chosen because only the
  Playwright core library is available in this environment (no package-registry access needed).
* **Data:** All test data is inlined in the test file; no external services or network calls required, so
  the suite is fully deterministic and repeatable.

## 5. Automation Scope
All 20 designed test cases are automated in `tests/register.spec.js` (100% of the designed set), run
sequentially against a fresh page load per test to avoid state leakage between tests.

## 6. Failure Handling / Bug Report Pipeline
For every test that fails, the runner automatically:
1. Captures a full-page screenshot (`test-results/screenshots/<TEST_ID>.png`).
2. Records the expected vs. actual result and the raw exception message.
3. Writes a structured entry to `test-results/results.json`.

The AI assistant then reads `results.json`, and for each failure generates a bug report containing:
Test case, Expected result, Actual result, Evidence (screenshot path), Severity suggestion, and Possible
cause (root-caused by inspecting the application source, since this is a controlled sample app).

## 7. Entry / Exit Criteria
* **Entry:** Application loads locally; requirement and test cases reviewed.
* **Exit:** All 20 test cases executed; every failure has an accompanying bug report; results summarized
  in `test-results/summary.md`.

## 8. Out of Scope
* Cross-browser matrix (Firefox/WebKit) — noted as a follow-up, not required to demonstrate the workflow.
* Backend/API-level testing — the sample app has no real backend; all logic is client-side by design.
* Accessibility and performance testing.
