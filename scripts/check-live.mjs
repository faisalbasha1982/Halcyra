// Post-deploy smoke test: node scripts/check-live.mjs https://www.yourdomain.com
// Fails (exit 1) if a page is down or a security header is missing.
const base = (process.argv[2] || "").replace(/\/$/, "");
const local = base.startsWith("http://localhost");
if (!base.startsWith("https://") && !local) { console.error("Usage: check-live.mjs https://your.domain"); process.exit(2); }

const required = {
  "content-security-policy": /default-src 'none'/,
  "strict-transport-security": /max-age=\d{7,}/,
  "x-content-type-options": /nosniff/,
  "x-frame-options": /DENY/,
  "referrer-policy": /strict-origin/,
  "permissions-policy": /camera=\(\)/,
};
let failed = 0;
const fail = (m) => { console.error("✗", m); failed++; };

for (const path of ["/", "/ae/", "/in/", "/privacy/", "/.well-known/security.txt", "/robots.txt", "/sitemap.xml"]) {
  const res = await fetch(base + path, { redirect: "manual" });
  if (res.status !== 200) { fail(`${path} returned ${res.status}`); continue; }
  if (path.endsWith("/")) {
    for (const [h, re] of Object.entries(required)) {
      const v = res.headers.get(h);
      if (local && h === "strict-transport-security") continue;
      if (!v || !re.test(v)) fail(`${path} header ${h} missing or weak: ${v}`);
    }
    if (res.headers.get("x-robots-tag")?.includes("noindex")) fail(`${path} is marked noindex on the live domain`);
  }
  console.log("✓", path, res.status);
}

if (!local) {
const http = await fetch(base.replace("https://", "http://") + "/", { redirect: "manual" });
if (![301, 308].includes(http.status)) fail(`http:// did not redirect to https (got ${http.status})`);
else console.log("✓ http → https redirect");
}

const api = await fetch(base + "/api/contact");
if (api.status !== 405) fail(`/api/contact GET returned ${api.status}, expected 405`);
else console.log("✓ /api/contact rejects GET");

const cross = await fetch(base + "/api/contact", { method: "POST", headers: { Origin: "https://evil.example", "Content-Type": "application/json" }, body: "{}" });
if (cross.status !== 403) fail(`cross-origin POST returned ${cross.status}, expected 403`);
else console.log("✓ /api/contact rejects other origins");

if (failed) { console.error(`\n${failed} check(s) failed`); process.exit(1); }
console.log("\nAll live checks passed");
