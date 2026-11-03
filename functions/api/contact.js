// POST /api/contact — receives the scoping-call form.
// Checks: same-origin, size limit, honeypot, field validation, Turnstile,
// per-IP rate limit (hashed IP, kept 24h). Stores the lead in D1, then emails you.
//
// Bindings (see wrangler.toml and README):
//   DB                 D1 database
//   TURNSTILE_SECRET   secret
//   IP_SALT            secret (any long random string)
//   RESEND_API_KEY     secret (optional: without it, leads are stored but not emailed)
//   NOTIFY_TO          var: where lead emails go
//   NOTIFY_FROM        var: verified sender, e.g. "Website <leads@yourdomain.com>"

const MAX_BODY = 16 * 1024;
const RATE_LIMIT = 5; // submissions per IP per hour
const REGIONS = new Set(["ae", "in"]);
const SERVICES = new Set([
  "Penetration testing / VAPT", "ISO 27001", "ISO 42001 / AI governance",
  "Regulatory compliance", "Programme delivery / vCISO",
]);

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });

const clean = (v, max) => String(v ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max);
const oneLine = (v) => v.replace(/[\r\n]+/g, " ");

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyTurnstile(secret, token, ip) {
  if (!secret || !token) return false;
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
    if (!res.ok) return false;
    const out = await res.json();
    return out.success === true;
  } catch (e) {
    console.error("turnstile_unreachable", e.message);
    return false; // fail closed
  }
}

export async function onRequestPost(ctx) {
  try {
    return await handle(ctx);
  } catch (e) {
    console.error("contact_error", e.message);
    return json(500, { error: "Something went wrong on our side. Please email us instead." });
  }
}

async function handle({ request, env }) {
  // 1. Same-origin only (works on production and preview URLs alike).
  const origin = request.headers.get("Origin");
  if (!origin || new URL(origin).host !== new URL(request.url).host) return json(403, { error: "Forbidden." });
  if (!(request.headers.get("Content-Type") || "").startsWith("application/json")) return json(415, { error: "Unsupported content type." });

  // 2. Size limit, then parse.
  const raw = await request.text();
  if (raw.length > MAX_BODY) return json(413, { error: "Your message is too long." });
  let body;
  try { body = JSON.parse(raw); } catch { return json(400, { error: "Invalid request." }); }

  // 3. Honeypot: bots fill hidden fields. Pretend success so they learn nothing.
  if (clean(body.website, 200)) return json(200, { ok: true });

  // 4. Validate fields.
  const lead = {
    region: clean(body.region, 4),
    name: oneLine(clean(body.name, 120)),
    email: oneLine(clean(body.email, 200)).toLowerCase(),
    company: oneLine(clean(body.company, 160)),
    service: clean(body.service, 60),
    message: clean(body.message, 4000),
  };
  if (!REGIONS.has(lead.region) || !SERVICES.has(lead.service)) return json(400, { error: "Invalid request." });
  if (!lead.name || !lead.message) return json(400, { error: "Please add your name and a short message." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lead.email)) return json(400, { error: "Please enter a valid work email." });
  if (body.consent !== "yes") return json(400, { error: "Please tick the consent box so we can reply." });

  // 5. Bot check.
  const ip = request.headers.get("CF-Connecting-IP") || "";
  if (!(await verifyTurnstile(env.TURNSTILE_SECRET, clean(body.token, 2048), ip))) {
    return json(400, { error: "The bot check failed. Please try again." });
  }

  // 6. Rate limit by hashed IP; purge hashes older than 24h.
  const ipHash = await sha256((env.IP_SALT || "") + ip);
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare("DELETE FROM rate_events WHERE created_at < ?").bind(now - 86400).run();
  const { n } = await env.DB.prepare("SELECT COUNT(*) AS n FROM rate_events WHERE ip_hash = ? AND created_at > ?")
    .bind(ipHash, now - 3600).first();
  if (n >= RATE_LIMIT) return json(429, { error: "Too many requests. Please email us instead." });

  // 7. Store.
  const id = crypto.randomUUID();
  await env.DB.batch([
    env.DB.prepare("INSERT INTO rate_events (ip_hash, created_at) VALUES (?, ?)").bind(ipHash, now),
    env.DB.prepare(
      "INSERT INTO leads (id, created_at, region, name, email, company, service, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    ).bind(id, now, lead.region, lead.name, lead.email, lead.company, lead.service, lead.message),
  ]);

  // 8. Notify. A failed email must not lose the lead: it is already stored.
  if (env.RESEND_API_KEY && env.NOTIFY_TO && env.NOTIFY_FROM) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: env.NOTIFY_FROM,
          to: [env.NOTIFY_TO],
          reply_to: lead.email,
          subject: `[${lead.region.toUpperCase()}] ${lead.service} — ${lead.name}`,
          text: `New scoping request (${id})\n\nRegion: ${lead.region}\nName: ${lead.name}\nEmail: ${lead.email}\nCompany: ${lead.company || "-"}\nService: ${lead.service}\n\n${lead.message}\n`,
        }),
      });
      if (!res.ok) console.error("resend_failed", res.status, id);
    } catch (e) {
      console.error("resend_error", id, e.message);
    }
  }

  return json(200, { ok: true });
}

export const onRequest = () => json(405, { error: "Method not allowed." });
