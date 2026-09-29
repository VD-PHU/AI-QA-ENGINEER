# AI Explorer Report (Bonus Feature)

**Target:** `file://D:\DuAnNho\ai-qa-engineer\ai-qa-engineer\app\register.html`

**Forms found:** 1 · **Interactive elements found:** 4

This report was generated automatically by driving a real headless browser to the page and
applying a rule-based QA heuristics engine to every input/button discovered — no test cases
were hand-written for this step; they were *suggested* by inspecting the live DOM.

Annotated screenshot of everything the explorer found: `test-results/screenshots/ai-explorer-annotated.png`

## Suggested test areas, by element

### `Email address` (input[type=text])
- data-testid: `email-input`

**Suggested test ideas:**
- Positive: valid email formats (standard, plus-addressing, subdomains)
- Negative: malformed email (missing @, missing TLD, spaces)
- Boundary: very long email (e.g. 254 chars, RFC max) and one char over
- Validation: duplicate/already-registered value should be rejected server-side

### `Password` (input[type=password])
- data-testid: `password-input`

**Suggested test ideas:**
- Boundary: shortest and longest accepted password length (check both ends)
- Negative: missing each required character class (upper/lower/digit/special) one at a time
- Validation: input is masked (type=password), not echoed in plaintext anywhere (DOM, network, logs)
- Validation: paired confirm-field mismatch is rejected

### `Confirm password` (input[type=password])
- data-testid: `confirm-password-input`

**Suggested test ideas:**
- Boundary: shortest and longest accepted password length (check both ends)
- Negative: missing each required character class (upper/lower/digit/special) one at a time
- Validation: input is masked (type=password), not echoed in plaintext anywhere (DOM, network, logs)
- Validation: paired confirm-field mismatch is rejected

### `submitBtn` (button[type=submit])
- data-testid: `submit-button`

**Suggested test ideas:**
- Validation: button becomes disabled / shows a loading state immediately after first click (no double-submit)
- Negative: rapid double-click does not create two records / two success messages

