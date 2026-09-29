/**
 * BONUS FEATURE — "AI Explorer"
 *
 * Instead of a human QA engineer manually reading the page to decide what to test,
 * this script drives a real browser to the target page, inspects every interactive
 * element (inputs, buttons, forms) and its attributes/labels, and applies a rule-based
 * "QA heuristics engine" to suggest concrete test ideas per element — the same
 * reasoning an experienced tester applies when exploring an unfamiliar form:
 *   - "this is type=email"        -> format / boundary / injection-safety tests
 *   - "this is type=password"     -> complexity / length boundary / masking tests
 *   - "this has a required attr"  -> empty-field negative test
 *   - "this has minlength/maxlength/pattern" -> exact boundary tests at each limit
 *   - "this is a submit button"   -> double-submit / disabled-state tests
 *
 * Output: tools/exploration-report.json (machine-readable) and
 *         docs/ai-explorer-report.md (human-readable, ready to paste into a test plan)
 *
 * Run with: node tools/ai-explorer.js [path-or-url]
 */
const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");

const target = process.argv[2]
  ? process.argv[2]
  : "file://" + path.resolve(__dirname, "../app/register.html");

const SUGGESTION_RULES = [];

function rule(matchFn, suggestions) {
  SUGGESTION_RULES.push({ matchFn, suggestions });
}

function looksLikeEmailField(el) {
  const haystack = `${el.type || ""} ${el.name || ""} ${el.id || ""} ${el.label || ""} ${el.placeholder || ""}`.toLowerCase();
  return haystack.includes("email");
}

// --- Heuristic rulebook (this IS the "AI reasoning" applied per element) ---
// Note: matched by semantic signal (type/name/id/label), not just the literal type="email"
// attribute — real-world forms often use type="text" for an email field, and a good
// explorer should still recognize intent instead of only pattern-matching HTML attributes.
rule((el) => looksLikeEmailField(el), (el) => [
  "Positive: valid email formats (standard, plus-addressing, subdomains)",
  "Negative: malformed email (missing @, missing TLD, spaces)",
  el.maxlength ? `Boundary: exactly ${el.maxlength} chars (declared maxlength) and ${Number(el.maxlength) + 1}` : "Boundary: very long email (e.g. 254 chars, RFC max) and one char over",
  "Validation: duplicate/already-registered value should be rejected server-side",
]);

rule((el) => el.type === "password", (el) => [
  el.minlength ? `Boundary: exactly ${el.minlength} chars (declared minlength) and ${Number(el.minlength) - 1}` : "Boundary: shortest and longest accepted password length (check both ends)",
  el.maxlength ? `Boundary: exactly ${el.maxlength} chars (declared maxlength) and ${Number(el.maxlength) + 1}` : null,
  "Negative: missing each required character class (upper/lower/digit/special) one at a time",
  "Validation: input is masked (type=password), not echoed in plaintext anywhere (DOM, network, logs)",
  "Validation: paired confirm-field mismatch is rejected",
].filter(Boolean));

rule((el) => el.required, (el) => [
  `Negative: submit with "${el.label || el.name || el.id}" left empty -> should block submit with a clear inline error`,
]);

rule((el) => !!el.pattern, (el) => [
  `Validation: value must satisfy declared pattern \`${el.pattern}\` — test one value just inside and one just outside the pattern`,
]);

rule((el) => el.tag === "button" && (el.buttonType === "submit" || el.role === "submit"), (el) => [
  "Validation: button becomes disabled / shows a loading state immediately after first click (no double-submit)",
  "Negative: rapid double-click does not create two records / two success messages",
]);

rule((el) => el.tag === "input" && el.type === "text" && !looksLikeEmailField(el), (el) => [
  `Negative: leading/trailing whitespace handling for "${el.label || el.name}"`,
  `Boundary: very short (1 char) and very long input for "${el.label || el.name}"`,
]);

function suggestFor(el) {
  const out = [];
  for (const r of SUGGESTION_RULES) {
    if (r.matchFn(el)) out.push(...r.suggestions(el));
  }
  return [...new Set(out)];
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(target);

  // Pull every input/button/select/textarea with attributes + best-effort associated label text
  const elements = await page.evaluate(() => {
    function labelFor(el) {
      if (el.id) {
        const lbl = document.querySelector(`label[for="${el.id}"]`);
        if (lbl) return lbl.textContent.trim();
      }
      if (el.getAttribute("aria-label")) return el.getAttribute("aria-label");
      const parentLabel = el.closest("label");
      if (parentLabel) return parentLabel.textContent.trim();
      return null;
    }
    const nodes = Array.from(document.querySelectorAll("input, button, select, textarea"));
    return nodes.map((el) => ({
      tag: el.tagName.toLowerCase(),
      type: el.getAttribute("type") || null,
      buttonType: el.tagName.toLowerCase() === "button" ? (el.getAttribute("type") || "submit") : null,
      id: el.id || null,
      name: el.getAttribute("name") || null,
      required: el.hasAttribute("required"),
      minlength: el.getAttribute("minlength"),
      maxlength: el.getAttribute("maxlength"),
      pattern: el.getAttribute("pattern"),
      placeholder: el.getAttribute("placeholder"),
      testid: el.getAttribute("data-testid"),
      label: labelFor(el),
      email: el.getAttribute("type") === "email",
    }));
  });

  const forms = await page.evaluate(() =>
    Array.from(document.querySelectorAll("form")).map((f) => ({
      id: f.id || null,
      fieldCount: f.querySelectorAll("input, select, textarea").length,
    }))
  );

  // Highlight discovered elements and take an annotated screenshot as exploration evidence
  await page.evaluate(() => {
    document.querySelectorAll("[data-testid]").forEach((el) => {
      el.style.outline = "2px solid #ff5722";
      el.style.outlineOffset = "2px";
    });
  });
  fs.mkdirSync(path.resolve(__dirname, "../test-results/screenshots"), { recursive: true });
  await page.screenshot({
    path: path.resolve(__dirname, "../test-results/screenshots/ai-explorer-annotated.png"),
    fullPage: true,
  });

  await browser.close();

  const report = elements
    .filter((el) => el.tag !== "button" || el.buttonType === "submit")
    .map((el) => ({ element: el, suggestedTests: suggestFor(el) }))
    .filter((r) => r.suggestedTests.length > 0);

  fs.writeFileSync(
    path.resolve(__dirname, "exploration-report.json"),
    JSON.stringify({ target, forms, elementsFound: elements.length, report }, null, 2)
  );

  // Human-readable markdown report
  let md = `# AI Explorer Report (Bonus Feature)\n\n`;
  md += `**Target:** \`${target}\`\n\n`;
  md += `**Forms found:** ${forms.length} · **Interactive elements found:** ${elements.length}\n\n`;
  md += `This report was generated automatically by driving a real headless browser to the page and\n`;
  md += `applying a rule-based QA heuristics engine to every input/button discovered — no test cases\n`;
  md += `were hand-written for this step; they were *suggested* by inspecting the live DOM.\n\n`;
  md += `Annotated screenshot of everything the explorer found: \`test-results/screenshots/ai-explorer-annotated.png\`\n\n`;
  md += `## Suggested test areas, by element\n\n`;
  for (const r of report) {
    const label = r.element.label || r.element.name || r.element.id || r.element.testid || `${r.element.tag}[${r.element.type || ""}]`;
    md += `### \`${label}\` (${r.element.tag}${r.element.type ? `[type=${r.element.type}]` : ""})\n`;
    md += `- data-testid: \`${r.element.testid || "n/a"}\`\n`;
    if (r.element.required) md += `- required: yes\n`;
    if (r.element.minlength) md += `- minlength: ${r.element.minlength}\n`;
    if (r.element.maxlength) md += `- maxlength: ${r.element.maxlength}\n`;
    if (r.element.pattern) md += `- pattern: \`${r.element.pattern}\`\n`;
    md += `\n**Suggested test ideas:**\n`;
    for (const s of r.suggestedTests) md += `- ${s}\n`;
    md += `\n`;
  }
  fs.writeFileSync(path.resolve(__dirname, "../docs/ai-explorer-report.md"), md);

  console.log(`Explored ${target}`);
  console.log(`Found ${elements.length} interactive elements across ${forms.length} form(s).`);
  console.log(`${report.length} elements produced test suggestions.`);
  console.log(`Reports written:`);
  console.log(`  tools/exploration-report.json`);
  console.log(`  docs/ai-explorer-report.md`);
  console.log(`  test-results/screenshots/ai-explorer-annotated.png`);
})();
