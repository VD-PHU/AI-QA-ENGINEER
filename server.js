// Dashboard server: node server.js  ->  http://localhost:3000
// Chi dung module co san cua Node.js, khong can cai them gi.
const http = require("http"), fs = require("fs"), path = require("path"), { spawn } = require("child_process");
const ROOT = __dirname, PORT = 3000;
const RESULTS = path.join(ROOT, "test-results/results.json");
const APP_SRC = path.join(ROOT, "app/register.html");

function testCases() {
  const md = fs.readFileSync(path.join(ROOT, "test-cases/test-cases.md"), "utf8");
  return md.split("\n").filter((l) => /^\| TC-\d+/.test(l)).map((l) => {
    const c = l.split("|").map((s) => s.trim());
    return { id: c[1], category: c[2], title: c[3], steps: c[4], data: c[5], expected: c[6], priority: c[7] };
  });
}

// Bug report tu dong: dua tren ket qua that + doc source app de goi y nguyen nhan (heuristic)
function possibleCause(tc) {
  const lines = fs.readFileSync(APP_SRC, "utf8").split("\n");
  const find = (re) => lines.map((t, i) => ({ t: t.trim(), n: i + 1 })).filter((x) => re.test(x.t));
  if (/already-registered|duplicate/i.test(tc.title)) {
    const g = find(/EXISTING_USERS\.has/);
    if (!g.length) return "Khong thay doan kiem tra email trung trong source: co the chua duoc cai dat.";
    if (g.every((x) => x.t.startsWith("//"))) return `Doan kiem tra email trung (dong ${g[0].n}) dang bi comment out, nen khong bao gio chay.`;
    return "Co doan kiem tra email trung nhung khong chan duoc dang ky; can xem lai dieu kien.";
  }
  if (tc.category === "BND") {
    const g = find(/value\.length\s*(<=|>=|<|>)/);
    return g.length ? "Nghi loi off-by-one o dieu kien do dai. Cac dong lien quan: " + g.map((x) => `dong ${x.n}: ${x.t}`).join(" | ")
      : "Nghi loi o dieu kien bien do dai; kiem tra toan tu so sanh trong ham validate.";
  }
  return "Logic validate cua truong nay co the khong khop spec; kiem tra cac ham validate* trong app/register.html.";
}
function severity(tc) {
  if (tc.category === "POS") return "High (luong chinh bi hong)";
  return { High: "High", Medium: "Medium", Low: "Low" }[tc.priority] || "Medium";
}
function bugReports(results, cases) {
  return results.filter((r) => r.status === "FAIL").map((r, i) => {
    const tc = cases.find((c) => c.id === r.id) || { id: r.id, title: r.title, category: r.category, priority: "" };
    return { bugId: "BUG-" + String(i + 1).padStart(3, "0"), testCase: `${r.id} - ${r.title}`, expected: r.expected,
      actual: r.actual, evidence: r.screenshot ? "/shots/" + path.basename(r.screenshot) : null,
      severity: severity(tc), possibleCause: possibleCause(tc) };
  });
}
function payload(log) {
  const cases = testCases();
  const data = JSON.parse(fs.readFileSync(RESULTS, "utf8"));
  return { log, total: data.total, pass: data.pass, fail: data.fail, results: data.results, bugs: bugReports(data.results, cases) };
}

const send = (res, code, body, type = "application/json") => { res.writeHead(code, { "Content-Type": type }); res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body)); };

http.createServer((req, res) => {
  try {
    if (req.url === "/api/testcases") return send(res, 200, testCases());
    if (req.url === "/api/last") return fs.existsSync(RESULTS) ? send(res, 200, payload("")) : send(res, 200, null);
    if (req.url === "/api/run" && req.method === "POST") {
      let log = "";
      const p = spawn(process.execPath, ["tests/register.spec.js"], { cwd: ROOT });
      p.stdout.on("data", (d) => (log += d)); p.stderr.on("data", (d) => (log += d));
      return p.on("close", () => { try { send(res, 200, payload(log)); } catch (e) { send(res, 500, { error: "Khong doc duoc ket qua: " + e.message, log }); } });
    }
    if (req.url.startsWith("/shots/")) {
      const f = path.join(ROOT, "test-results/screenshots", path.basename(req.url.split("?")[0]));
      return fs.existsSync(f) ? send(res, 200, fs.readFileSync(f), "image/png") : send(res, 404, "not found", "text/plain");
    }
    send(res, 200, fs.readFileSync(path.join(ROOT, "public/index.html")), "text/html; charset=utf-8");
  } catch (e) { send(res, 500, { error: e.message }); }
}).listen(PORT, () => console.log(`Dashboard dang chay: http://localhost:${PORT}  (Ctrl+C de tat)`));
