// Static site build: src/ → dist/. No framework, no runtime dependencies.
import { mkdir, rm, readFile, writeFile, copyFile, cp } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import cfg from "../site.config.mjs";
import { services, agents, credentials, regions } from "./content.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fill = (s, r) => s.replace(/\{\{(\w+)\}\}/g, (_, k) => (r && r[k]) || "Mapping to UAE and Indian regulations");

async function write(rel, body) {
  const p = join(dist, rel);
  await mkdir(dirname(p), { recursive: true });
  await writeFile(p, body);
}

// Content-hashed assets so they can be cached forever.
async function asset(name) {
  const buf = await readFile(join(root, "src/assets", name));
  const h = createHash("sha256").update(buf).digest("hex").slice(0, 10);
  const [base, ext] = name.split(".");
  const out = `assets/${base}.${h}.${ext}`;
  await write(out, buf);
  return "/" + out;
}

async function fonts() {
  const fs = join(root, "node_modules/@fontsource");
  const map = {
    "plex-sans-400": "ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2",
    "plex-sans-500": "ibm-plex-sans/files/ibm-plex-sans-latin-500-normal.woff2",
    "plex-sans-600": "ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2",
    "plex-cond-600": "ibm-plex-sans-condensed/files/ibm-plex-sans-condensed-latin-600-normal.woff2",
    "plex-cond-700": "ibm-plex-sans-condensed/files/ibm-plex-sans-condensed-latin-700-normal.woff2",
    "jbmono-400": "jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2",
    "jbmono-600": "jetbrains-mono/files/jetbrains-mono-latin-600-normal.woff2",
  };
  await mkdir(join(dist, "assets/fonts"), { recursive: true });
  for (const [k, v] of Object.entries(map)) await copyFile(join(fs, v), join(dist, `assets/fonts/${k}.woff2`));
}

const logo = `<svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><path d="M13 2 23 6v7c0 6-4.3 9.6-10 11C7.3 22.6 3 19 3 13V6z" fill="none" stroke="currentColor" stroke-width="2"/><path class="tick" d="M8 13.5l3.2 3.2L18.5 9" fill="none" stroke-width="2.4" stroke-linecap="square"/></svg>`;

function layout({ path, lang = "en", title, description, body, css, js, current, turnstile = false, noindex = false }) {
  const url = cfg.domain + path;
  const alt = path === "/" || path.startsWith("/ae/") || path.startsWith("/in/")
    ? `<link rel="alternate" hreflang="en-AE" href="${cfg.domain}/ae/">
<link rel="alternate" hreflang="en-IN" href="${cfg.domain}/in/">
<link rel="alternate" hreflang="x-default" href="${cfg.domain}/">` : "";
  const nav = ["ae", "in"].map((k) =>
    `<a href="/${k}/"${current === k ? ' aria-current="page"' : ""}>${regions[k].label}</a>`).join("");
  const ctaHref = current ? "#contact" : "#regions";
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${url}">`}
${alt}
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${css}">
<script src="${js}" defer></script>
${turnstile ? '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>' : ""}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-head">
  <div class="wrap bar">
    <a class="brand" href="/">${logo}${esc(cfg.brand)}</a>
    <nav class="switch" aria-label="Choose your region">${nav}</nav>
    <a class="cta" href="${ctaHref}">${current ? "Book a scoping call" : "Choose your region"}</a>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="site-foot">
  <div class="wrap">
    <span>© ${new Date().getFullYear()} ${esc(cfg.brand)}${current ? " · " + esc(regions[current].foot) : ""}</span>
    <nav aria-label="Footer"><a href="/privacy/">Privacy</a><a href="/.well-known/security.txt">Report a vulnerability</a></nav>
  </div>
</footer>
</body>
</html>
`;
}

const hero = (eyebrow, h1, lead, cur, primary) => `
<section class="hero">
  <div class="wrap hero-grid">
    <div class="stack">
      <span class="mono">${esc(eyebrow)}</span>
      <h1>${esc(h1)}</h1>
      <p class="lead">${esc(lead)}</p>
      <div class="actions">${primary}</div>
    </div>
    <aside class="report" aria-label="Example pentest summary">
      <div class="report-head"><span class="mono">SAMPLE REPORT · WEB + API</span><span class="mono">${esc(cur)}</span></div>
      <div class="sev" aria-hidden="true"><span class="s-crit"></span><span class="s-high"></span><span class="s-med"></span><span class="s-low"></span></div>
      <div class="sevlist">
        <div class="b-crit"><strong>2</strong><span class="mono">Critical</span></div>
        <div class="b-high"><strong>5</strong><span class="mono">High</span></div>
        <div class="b-med"><strong>9</strong><span class="mono">Medium</span></div>
        <div class="b-low"><strong>6</strong><span class="mono">Low</span></div>
      </div>
      <div class="finding"><span class="pill p-crit">Crit</span><span>Broken object-level authorisation on <code>/api/v2/bookings/{id}</code>. Mapped to ISO 27001 A.8.26 and OWASP API1.</span></div>
      <div class="finding"><span class="pill p-high">High</span><span>LLM support bot leaks its system prompt through indirect prompt injection. Mapped to ISO 42001 A.6.2.</span></div>
      <span class="mono muted">Illustrative example. Every finding comes with proof, business impact and the fix.</span>
    </aside>
  </div>
</section>`;

const sec = (n, label, inner, id = "") => `
<section${id ? ` id="${id}"` : ""}>
  <div class="wrap reg">
    <div class="id mono"><b>${n}</b>${esc(label)}</div>
    <div class="stack">${inner}</div>
  </div>
</section>`;

const servicesBlock = (r) => `
<h2>Three practices, one accountable lead</h2>
<div class="cols">${services.map((s) => `
  <article class="svc"><span class="mono num">${esc(s.code)}</span><h3>${esc(s.title)}</h3>
  <ul>${s.items.map((i) => `<li>${esc(fill(i, r))}</li>`).join("")}</ul></article>`).join("")}
</div>
<p class="note"><strong>How certification works:</strong> ISO certificates are issued only by accredited certification bodies. We prepare you, run your internal audit, and support you through the certification body's audit.${r ? " " + esc(r.noteLocal) : ""}</p>`;

const agentsBlock = (r) => `
<h2>Agents do the legwork. A certified human signs off.</h2>
<p class="lead">That is why our engagements are faster and cheaper than a traditional consultancy, without lowering the standard of evidence.</p>
<div class="tbl agents"><table>
<thead><tr><th>Agent</th><th>What it does</th><th>Human checkpoint</th></tr></thead>
<tbody>${agents.map((a) => `<tr><td>${esc(a[0])}</td><td>${esc(a[1])}</td><td>${esc(a[2])}</td></tr>`).join("")}</tbody>
</table></div>
<p class="note"><strong>Your data:</strong> client data is processed only on self-hosted models or enterprise AI services that do not train on or keep your data.${r ? " " + esc(r.dataLocal) : ""}</p>`;

const aboutBlock = `
<h2>${esc(cfg.founder)}, founder</h2>
<p>More than ten years across cloud infrastructure, DevSecOps, cybersecurity and AI/ML in regulated industries, including aviation, banking and defence. ${esc(cfg.founder.split(" ")[0])} leads every engagement and signs every report.</p>
<div class="creds">${credentials.map((c) => `<span>${esc(c)}</span>`).join("")}</div>`;

function regionPage(r) {
  const primary = `<a class="cta" href="#contact">Book a scoping call</a><a class="cta ghost" href="#check">Take the 2-minute readiness check</a>`;
  const body = [
    hero(r.eyebrow, r.h1, r.lead, r.cur, primary),
    sec("01", "Services", servicesBlock(r), "services"),
    sec("02", "Frameworks", `<h2>${esc(r.fwTitle)}</h2>
<div class="tbl"><table><thead><tr><th>Framework</th><th>Who it applies to</th><th>What we deliver</th></tr></thead>
<tbody>${r.fw.map((f) => `<tr><td>${esc(f[0])}</td><td>${esc(f[1])}</td><td>${esc(f[2])}</td></tr>`).join("")}</tbody></table></div>`),
    sec("03", "Packages", `<h2>Fixed scope, fixed fee</h2><p class="lead">${esc(r.pkgLead)}</p>
<div class="cols">${r.pkg.map((p) => `<article class="pkg"><div class="meta mono"><span>PACKAGE</span><span>${esc(p[1])}</span></div><h3>${esc(p[0])}</h3><p class="muted">${esc(p[2])}</p></article>`).join("")}</div>`, "packages"),
    sec("04", "How we use AI", agentsBlock(r)),
    sec("05", "Free tool", `<h2>${esc(r.checkTitle)}</h2><p class="lead">Tick what is already true today. Your answers stay in your browser.</p>
<div class="check">
  <div id="qs">${r.questions.map((q, i) => `<label class="q" for="q${i}"><input type="checkbox" id="q${i}"><span><span class="mono">${esc(q[0])}</span>${esc(q[1])}</span></label>`).join("")}</div>
  <div class="score" aria-live="polite">
    <span class="mono">YOUR READINESS</span><span class="big" id="pct">0%</span>
    <div class="gauge"><i id="bar"></i></div>
    <h3 id="band">Starting out</h3><p id="advice" class="muted"></p>
    <a class="cta" href="#contact">Discuss my result</a>
  </div>
</div>`, "check"),
    sec("06", "Who you work with", aboutBlock, "about"),
    sec("07", "Contact", `<h2>Book a 30-minute scoping call</h2><p class="lead">${esc(r.contact)}</p>
<form id="contact-form" novalidate>
  <input type="hidden" name="region" value="${r.slug}">
  <label class="hp" aria-hidden="true">Leave this empty<input type="text" name="website" id="f-website" tabindex="-1" autocomplete="off"></label>
  <label for="f-name">Name<input type="text" name="name" id="f-name" required maxlength="120" autocomplete="name"></label>
  <label for="f-email">Work email<input type="email" name="email" id="f-email" required maxlength="200" autocomplete="email"></label>
  <label for="f-company">Company<input type="text" name="company" id="f-company" maxlength="160" autocomplete="organization"></label>
  <label for="f-service">Service
    <select name="service" id="f-service">
      <option>Penetration testing / VAPT</option><option>ISO 27001</option><option>ISO 42001 / AI governance</option>
      <option>Regulatory compliance</option><option>Programme delivery / vCISO</option>
    </select></label>
  <label class="full" for="f-message">What do you need, and by when?<textarea name="message" id="f-message" required maxlength="4000"></textarea></label>
  <label class="full consent" for="f-consent"><input type="checkbox" name="consent" id="f-consent" value="yes" required>I agree that ${esc(cfg.brand)} may use these details to reply to my request, as described in the <a href="/privacy/">privacy notice</a>.</label>
  <div class="full cf-turnstile" data-sitekey="${esc(cfg.turnstileSiteKey)}"></div>
  <div class="full actions"><button class="cta" type="submit">Send request</button><span class="mono muted">or email ${esc(cfg.contactEmail)}</span></div>
  <p class="full status" id="form-status" role="status"></p>
</form>`, "contact"),
  ].join("\n");
  return { body, title: `${r.title} | ${cfg.brand}`, description: r.description, lang: r.lang };
}

function homePage() {
  const primary = `<a class="cta" href="/ae/">United Arab Emirates</a><a class="cta ghost" href="/in/">India</a>`;
  const card = (r, line, tags) => `<a class="region" href="/${r.slug}/"><span class="mono">${esc(line)}</span><h3>${esc(r.name)}</h3><p>${esc(r.description)}</p><ul class="tags">${tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></a>`;
  const body = [
    hero("Offensive security · ISO 27001 & 42001 · GRC · AI governance",
      "Find the gaps before an attacker or an auditor does.",
      "Penetration testing, ISO readiness and AI governance, delivered by a certified practitioner and sped up by AI agents. Every finding is checked by a human before it reaches your report.",
      "Fixed fee", primary),
    sec("00", "Where are you?", `<h2>Choose your region</h2><p class="lead">Regulators, pricing and reporting duties differ, so each market has its own page.</p>
<div class="choose">${card(regions.ae, "Sharjah · Dubai · Abu Dhabi · AED", ["UAE IA Standard", "Dubai ISR", "ADHICS", "UAE PDPL", "ISO 27001", "ISO 42001"])}
${card(regions.in, "Remote-first · INR", ["DPDP Act", "CERT-In", "RBI", "SEBI CSCRF", "SOC 2", "ISO 27001"])}</div>`, "regions"),
    sec("01", "Services", servicesBlock(null), "services"),
    sec("02", "How we use AI", agentsBlock(null)),
    sec("03", "Who you work with", aboutBlock, "about"),
  ].join("\n");
  return { body, title: `${cfg.brand} | Penetration testing, ISO 27001 & AI governance`, description: "VAPT, ISO 27001 and ISO 42001 readiness, GRC and AI governance for organisations in the UAE and India." };
}

function privacyPage() {
  const body = sec("§", "Privacy", `<div class="prose">
<h1>Privacy notice</h1>
<p class="note"><strong>Draft.</strong> Have a lawyer review this before launch, and fill in the bracketed details.</p>
<p>${esc(cfg.legalName)} ("we") runs this website. This notice explains what we collect through it and why.</p>
<h2>What we collect</h2>
<p>Only what you type into the contact form: your name, work email, company, the service you are interested in and your message. We also keep a one-way hash of your IP address for up to 24 hours to stop spam. The readiness check runs in your browser and sends us nothing. We use no analytics or advertising cookies.</p>
<h2>Why, and on what basis</h2>
<p>To reply to your request and prepare a proposal, based on your consent when you submit the form. We do not sell your data or use it for marketing without asking.</p>
<h2>Where it is stored and for how long</h2>
<p>Form submissions are stored with Cloudflare and delivered to our mailbox by our email provider. We delete enquiries that do not become engagements after 12 months.</p>
<h2>Your rights</h2>
<p>Under the UAE Personal Data Protection Law and India's Digital Personal Data Protection Act you can ask to access, correct or delete your data, or withdraw consent. Email ${esc(cfg.contactEmail)} and we will reply within 30 days.</p>
<h2>Contact</h2>
<p>${esc(cfg.legalName)}, [registered address]. ${esc(cfg.contactEmail)}</p>
</div>`);
  return { body, title: `Privacy notice | ${cfg.brand}`, description: `How ${cfg.brand} handles the personal data you send through this website.` };
}

async function main() {
  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });
  await fonts();
  const css = await asset("site.css");
  const js = await asset("site.js");
  const pages = [
    ["/", "index.html", { ...homePage() }],
    ["/ae/", "ae/index.html", { ...regionPage(regions.ae), current: "ae", turnstile: true }],
    ["/in/", "in/index.html", { ...regionPage(regions.in), current: "in", turnstile: true }],
    ["/privacy/", "privacy/index.html", { ...privacyPage() }],
  ];
  for (const [path, file, p] of pages) await write(file, layout({ path, css, js, ...p }));
  await write("404.html", layout({ path: "/404", css, js, noindex: true, title: `Page not found | ${cfg.brand}`, description: "Page not found",
    body: sec("404", "Not found", `<h1>That page does not exist.</h1><p class="lead">Pick your region to continue.</p><div class="actions"><a class="cta" href="/ae/">UAE</a><a class="cta ghost" href="/in/">India</a></div>`) }));

  const today = new Date().toISOString().slice(0, 10);
  await write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(([p]) => `  <url><loc>${cfg.domain}${p}</loc><lastmod>${today}</lastmod></url>`).join("\n")}
</urlset>
`);
  await write("robots.txt", `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${cfg.domain}/sitemap.xml\n`);
  const expires = new Date(Date.now() + 330 * 864e5).toISOString().replace(/\.\d+Z$/, "Z");
  await write(".well-known/security.txt", `Contact: mailto:${cfg.securityEmail}\nExpires: ${expires}\nPreferred-Languages: en\nCanonical: ${cfg.domain}/.well-known/security.txt\n`);
  await cp(join(root, "public"), dist, { recursive: true });
  console.log("Built", pages.length + 1, "pages →", dist);
}

main().catch((e) => { console.error(e); process.exit(1); });
