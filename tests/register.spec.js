/**
 * Automated regression suite for register.html
 * Implements all 21 test cases from test-cases/test-cases.md using Playwright (core API).
 *
 * Run with: node tests/register.spec.js
 */
const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");

const APP_URL = "file://" + path.resolve(__dirname, "../app/register.html");
const SCREENSHOT_DIR = path.resolve(__dirname, "../test-results/screenshots");
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

function repeat(str, targetLen) {
  let s = "";
  while (s.length < targetLen) s += str;
  return s.slice(0, targetLen);
}

// Build a valid-complexity password of an exact length (upper, lower, digit, special guaranteed)
function complexPassword(len) {
  const base = "Aa1!"; // guarantees all 4 classes
  if (len < 4) throw new Error("len must be >=4");
  return base + repeat("aA1!", len - 4).slice(0, len - 4);
}

async function fillForm(page, { email, password, confirm }) {
  if (email !== undefined) {
    await page.fill('[data-testid="email-input"]', email);
    await page.locator('[data-testid="email-input"]').blur();
  }
  if (password !== undefined) {
    await page.fill('[data-testid="password-input"]', password);
    await page.locator('[data-testid="password-input"]').blur();
  }
  if (confirm !== undefined) {
    await page.fill('[data-testid="confirm-password-input"]', confirm);
    await page.locator('[data-testid="confirm-password-input"]').blur();
  }
}

async function submit(page) {
  await page.click('[data-testid="submit-button"]');
  await page.waitForTimeout(400); // allow the simulated async submit to resolve
}

async function textOf(page, testId) {
  return (await page.locator(`[data-testid="${testId}"]`).textContent() || "").trim();
}

async function isVisible(page, testId) {
  return page.locator(`[data-testid="${testId}"]`).isVisible();
}

const results = [];

function record(id, category, title, expected, outcome) {
  results.push({ id, category, title, expected, ...outcome });
  const status = outcome.status === "PASS" ? "✅ PASS" : "❌ FAIL";
  console.log(`[${id}] ${status} — ${title}`);
  if (outcome.status === "FAIL") {
    console.log(`    expected: ${expected}`);
    console.log(`    actual  : ${outcome.actual}`);
  }
}

async function runCase(browser, def) {
  const page = await browser.newPage();
  await page.goto(APP_URL);
  let outcome;
  try {
    const actual = await def.run(page);
    outcome = { status: "PASS", actual, screenshot: null };
  } catch (err) {
    const screenshotPath = path.join(SCREENSHOT_DIR, `${def.id}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    outcome = {
      status: "FAIL",
      actual: err.actual !== undefined ? err.actual : err.message,
      error: err.message,
      screenshot: path.relative(path.resolve(__dirname, ".."), screenshotPath),
    };
  } finally {
    await page.close();
  }
  record(def.id, def.category, def.title, def.expected, outcome);
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    const e = new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    e.actual = actual;
    throw e;
  }
}

const cases = [
  {
    id: "TC-01", category: "POS", title: "Register with valid email + strong password",
    expected: "Success message shown, form cleared",
    run: async (page) => {
      await fillForm(page, { email: "jane.doe@example.com", password: "Str0ng!Pass", confirm: "Str0ng!Pass" });
      await submit(page);
      const visible = await isVisible(page, "success-message");
      assertEqual(visible, true, "success message visible");
      const emailVal = await page.inputValue('[data-testid="email-input"]');
      assertEqual(emailVal, "", "email field reset");
      return "success message shown; form cleared";
    },
  },
  {
    id: "TC-02", category: "POS", title: "Register with plus-addressed / subdomain email",
    expected: "Success message shown",
    run: async (page) => {
      await fillForm(page, { email: "jane+shop@mail.example.co.uk", password: "Str0ng!Pass", confirm: "Str0ng!Pass" });
      await submit(page);
      assertEqual(await isVisible(page, "success-message"), true, "success message visible");
      return "success message shown";
    },
  },
  {
    id: "TC-03", category: "POS", title: "Register with password at max valid length (64 chars, complex)",
    expected: "Success message shown",
    run: async (page) => {
      const pw = complexPassword(64);
      await fillForm(page, { email: "long.pw@example.com", password: pw, confirm: pw });
      await submit(page);
      assertEqual(await isVisible(page, "success-message"), true, "success message visible");
      return "success message shown";
    },
  },
  {
    id: "TC-04", category: "NEG", title: "Empty email",
    expected: 'Inline error "Email is required.", no success message',
    run: async (page) => {
      await fillForm(page, { email: "", password: "Str0ng!Pass", confirm: "Str0ng!Pass" });
      await submit(page);
      const err = await textOf(page, "email-error");
      assertEqual(err, "Email is required.", "email error text");
      assertEqual(await isVisible(page, "success-message"), false, "success message hidden");
      return `email error shown: "${err}"`;
    },
  },
  {
    id: "TC-05", category: "NEG", title: "Empty password",
    expected: 'Inline error "Password is required.", no success message',
    run: async (page) => {
      await fillForm(page, { email: "user@example.com", password: "", confirm: "" });
      await submit(page);
      const err = await textOf(page, "password-error");
      assertEqual(err, "Password is required.", "password error text");
      return `password error shown: "${err}"`;
    },
  },
  {
    id: "TC-06", category: "NEG", title: "Confirm password does not match",
    expected: 'Inline error "Passwords do not match.", no success message',
    run: async (page) => {
      await fillForm(page, { email: "user@example.com", password: "Str0ng!Pass", confirm: "Different!1" });
      await submit(page);
      const err = await textOf(page, "confirm-password-error");
      assertEqual(err, "Passwords do not match.", "confirm error text");
      return `confirm error shown: "${err}"`;
    },
  },
  {
    id: "TC-07", category: "NEG", title: "Malformed email (missing @)",
    expected: 'Inline error "Please enter a valid email address."',
    run: async (page) => {
      await fillForm(page, { email: "janedoeexample.com", password: "Str0ng!Pass", confirm: "Str0ng!Pass" });
      await submit(page);
      const err = await textOf(page, "email-error");
      assertEqual(err, "Please enter a valid email address.", "email error text");
      return `email error shown: "${err}"`;
    },
  },
  {
    id: "TC-08", category: "NEG", title: "Malformed email (missing domain suffix)",
    expected: 'Inline error "Please enter a valid email address."',
    run: async (page) => {
      await fillForm(page, { email: "jane@example", password: "Str0ng!Pass", confirm: "Str0ng!Pass" });
      await submit(page);
      const err = await textOf(page, "email-error");
      assertEqual(err, "Please enter a valid email address.", "email error text");
      return `email error shown: "${err}"`;
    },
  },
  {
    id: "TC-09", category: "NEG", title: "Register with an already-registered email",
    expected: 'Form-level error "An account with this email already exists.", registration blocked',
    run: async (page) => {
      await fillForm(page, { email: "existing@test.com", password: "Str0ng!Pass", confirm: "Str0ng!Pass" });
      await submit(page);
      const formErrorVisible = await isVisible(page, "form-error");
      const successVisible = await isVisible(page, "success-message");
      if (successVisible) {
        const e = new Error('Expected duplicate-email to be rejected with form-error, but registration succeeded instead.');
        e.actual = "Registration succeeded (success message shown) — duplicate email was NOT rejected.";
        throw e;
      }
      assertEqual(formErrorVisible, true, "form-level duplicate-email error visible");
      return "duplicate email correctly rejected";
    },
  },
  {
    id: "TC-10", category: "NEG", title: "Password missing special character",
    expected: 'Inline error "...at least one special character."',
    run: async (page) => {
      await fillForm(page, { email: "user@example.com", password: "StrongPass1", confirm: "StrongPass1" });
      await submit(page);
      const err = await textOf(page, "password-error");
      assertEqual(err, "Password must contain at least one special character.", "password error text");
      return `password error shown: "${err}"`;
    },
  },
  {
    id: "TC-11", category: "NEG", title: "Password missing uppercase letter",
    expected: 'Inline error "...at least one uppercase letter."',
    run: async (page) => {
      await fillForm(page, { email: "user@example.com", password: "str0ng!pass", confirm: "str0ng!pass" });
      await submit(page);
      const err = await textOf(page, "password-error");
      assertEqual(err, "Password must contain at least one uppercase letter.", "password error text");
      return `password error shown: "${err}"`;
    },
  },
  {
    id: "TC-12", category: "NEG", title: "Password missing digit",
    expected: 'Inline error "...at least one digit."',
    run: async (page) => {
      await fillForm(page, { email: "user@example.com", password: "Strong!Pass", confirm: "Strong!Pass" });
      await submit(page);
      const err = await textOf(page, "password-error");
      assertEqual(err, "Password must contain at least one digit.", "password error text");
      return `password error shown: "${err}"`;
    },
  },
  {
    id: "TC-13", category: "BND", title: "Password exactly at minimum length (8 chars)",
    expected: "Accepted — success message shown",
    run: async (page) => {
      const pw = complexPassword(8);
      assertEqual(pw.length, 8, "generated password length");
      await fillForm(page, { email: "min8@example.com", password: pw, confirm: pw });
      await submit(page);
      const successVisible = await isVisible(page, "success-message");
      if (!successVisible) {
        const err = await textOf(page, "password-error");
        const e = new Error(`Expected an 8-character password (spec minimum) to be accepted, but it was rejected.`);
        e.actual = `Registration rejected. Inline error shown: "${err}"`;
        throw e;
      }
      return "8-char password accepted";
    },
  },
  {
    id: "TC-14", category: "BND", title: "Password one below minimum (7 chars)",
    expected: 'Rejected — "at least 8 characters" error',
    run: async (page) => {
      const pw = complexPassword(7);
      assertEqual(pw.length, 7, "generated password length");
      await fillForm(page, { email: "min7@example.com", password: pw, confirm: pw });
      await submit(page);
      const err = await textOf(page, "password-error");
      assertEqual(err, "Password must be at least 8 characters long.", "password error text");
      return `7-char password correctly rejected: "${err}"`;
    },
  },
  {
    id: "TC-15", category: "BND", title: "Password exactly at maximum length (64 chars)",
    expected: "Accepted — success message shown",
    run: async (page) => {
      const pw = complexPassword(64);
      await fillForm(page, { email: "max64@example.com", password: pw, confirm: pw });
      await submit(page);
      assertEqual(await isVisible(page, "success-message"), true, "success message visible");
      return "64-char password accepted";
    },
  },
  {
    id: "TC-16", category: "BND", title: "Password one above maximum (65 chars)",
    expected: 'Rejected — "at most 64 characters" error',
    run: async (page) => {
      const pw = complexPassword(65);
      await fillForm(page, { email: "max65@example.com", password: pw, confirm: pw });
      await submit(page);
      const err = await textOf(page, "password-error");
      assertEqual(err, "Password must be at most 64 characters long.", "password error text");
      return `65-char password correctly rejected: "${err}"`;
    },
  },
  {
    id: "TC-17", category: "BND", title: "Email at max allowed length (254 chars)",
    expected: "Accepted — success message shown",
    run: async (page) => {
      const local = "a".repeat(240);
      const email = `${local}@example.com`; // 240 + 13 = 253; pad to 254
      const email254 = email.length === 254 ? email : email + "x".repeat(254 - email.length);
      assertEqual(email254.length, 254, "generated email length");
      await fillForm(page, { email: email254, password: "Str0ng!Pass", confirm: "Str0ng!Pass" });
      await submit(page);
      assertEqual(await isVisible(page, "success-message"), true, "success message visible");
      return "254-char email accepted";
    },
  },
  {
    id: "TC-18", category: "VAL", title: "Email whitespace is trimmed",
    expected: "Treated as trimmed email; accepted",
    run: async (page) => {
      await fillForm(page, { email: "  jane@example.com  ", password: "Str0ng!Pass", confirm: "Str0ng!Pass" });
      await submit(page);
      assertEqual(await isVisible(page, "success-message"), true, "success message visible");
      return "whitespace-padded email accepted";
    },
  },
  {
    id: "TC-19", category: "VAL", title: "Password field masks input",
    expected: 'type="password" attribute present on password & confirm fields',
    run: async (page) => {
      const pwType = await page.getAttribute('[data-testid="password-input"]', "type");
      const confirmType = await page.getAttribute('[data-testid="confirm-password-input"]', "type");
      assertEqual(pwType, "password", "password input type");
      assertEqual(confirmType, "password", "confirm input type");
      return "both fields correctly masked";
    },
  },
  {
    id: "TC-20", category: "VAL", title: "Submit button disabled during submission (no double-submit)",
    expected: 'Button becomes disabled ("Creating account...") until request completes',
    run: async (page) => {
      await fillForm(page, { email: "nodupe@example.com", password: "Str0ng!Pass", confirm: "Str0ng!Pass" });
      await page.click('[data-testid="submit-button"]');
      const disabledImmediately = await page.isDisabled('[data-testid="submit-button"]');
      await page.waitForTimeout(400);
      assertEqual(disabledImmediately, true, "button disabled right after click");
      return "submit button correctly disabled during processing";
    },
  },
  {
    id: "TC-21", category: "VAL", title: "Successful registration resets the form",
    expected: "Email/password/confirm fields are empty after success",
    run: async (page) => {
      await fillForm(page, { email: "reset@example.com", password: "Str0ng!Pass", confirm: "Str0ng!Pass" });
      await submit(page);
      const emailVal = await page.inputValue('[data-testid="email-input"]');
      const pwVal = await page.inputValue('[data-testid="password-input"]');
      assertEqual(emailVal, "", "email reset");
      assertEqual(pwVal, "", "password reset");
      return "form fields cleared after success";
    },
  },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  console.log(`Running ${cases.length} automated test cases against ${APP_URL}\n`);
  for (const def of cases) {
    await runCase(browser, def);
  }
  await browser.close();

  const pass = results.filter((r) => r.status === "PASS").length;
  const fail = results.filter((r) => r.status === "FAIL").length;

  fs.writeFileSync(
    path.resolve(__dirname, "../test-results/results.json"),
    JSON.stringify({ total: results.length, pass, fail, results }, null, 2)
  );

  console.log(`\n=== SUMMARY: ${pass}/${results.length} passed, ${fail} failed ===`);
  process.exit(fail > 0 ? 1 : 0);
})();
