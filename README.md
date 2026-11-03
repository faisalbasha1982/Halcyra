# Company website: launch runbook

Static site with separate UAE (`/ae/`) and India (`/in/`) pages, a contact form backed by a
Cloudflare Pages Function and a D1 database, and a GitHub Actions pipeline that checks every
change before it goes live.

```
GitHub (private repo) ──PR──▶ checks ──▶ preview URL (noindex)
        │
        └──merge to main──▶ checks ──▶ DB migrations ──▶ production ──▶ live header check
```

| Part | Tool | Why |
|---|---|---|
| Code, reviews, CI | GitHub | Branch protection, secret scanning, Dependabot |
| Hosting, TLS, CDN, WAF | Cloudflare Pages | Free, global, instant rollback |
| Form backend | Pages Function + D1 | No server to patch |
| Spam protection | Cloudflare Turnstile | No cookies, no puzzles |
| Lead emails | Resend | Simple API, domain-verified sending |

---

## Day 1: Accounts and baseline security

1. **GitHub:** turn on 2FA with a passkey or hardware key.
2. **Cloudflare:** create an account and turn on 2FA. Buy your `.com` through Cloudflare Registrar,
   or move the nameservers of a domain you already own to Cloudflare.
3. **Email:** set up Zoho Mail or Google Workspace on the domain. Create `hello@`, `security@`
   and a sending address such as `leads@`.
4. **Email DNS:** add the SPF and DKIM records your mail provider gives you, plus
   `_dmarc  TXT  "v=DMARC1; p=none; rua=mailto:you@yourdomain.com"`.
   After two clean weeks of reports, change `p=none` to `p=quarantine`, then `p=reject`.

## Day 2: Repository

1. Edit `site.config.mjs`: brand, domain, emails.
2. Create a **private** repo on GitHub and push:
   ```bash
   git init && git add . && git commit -m "Initial site"
   git branch -M main
   git remote add origin git@github.com:<you>/<repo>.git
   git push -u origin main
   ```
3. In **Settings → Rules → Rulesets**, add a ruleset for `main`:
   require a pull request, require the status check **verify**, block force pushes and deletion.
4. In **Settings → Code security**, turn on Dependabot alerts, secret scanning,
   push protection and CodeQL (default setup).

## Day 3: Cloudflare and secrets

```bash
npm ci
npx wrangler login
npx wrangler pages project create halcyra-site --production-branch main
npx wrangler d1 create halcyra-leads        # copy the database_id into wrangler.toml
```

1. **Turnstile:** Dashboard → Turnstile → Add widget, with your domain as the hostname.
   Put the **site key** in `site.config.mjs` and keep the **secret** for the next step.
2. **Resend:** verify your domain (it adds DNS records), then create an API key with
   *sending access* for that domain only.
3. **Pages secrets** (stored encrypted by Cloudflare, never in git):
   ```bash
   npx wrangler pages secret put TURNSTILE_SECRET --project-name halcyra-site
   npx wrangler pages secret put IP_SALT          --project-name halcyra-site   # e.g. output of: openssl rand -hex 32
   npx wrangler pages secret put RESEND_API_KEY   --project-name halcyra-site
   ```
   Set `NOTIFY_TO` and `NOTIFY_FROM` in `wrangler.toml`.
4. **API token for GitHub:** Cloudflare → My Profile → API Tokens → Create custom token with only
   *Account → Cloudflare Pages → Edit* and *Account → D1 → Edit*, limited to your account.
5. **GitHub environments:** Settings → Environments → create `production` (deployment branch: `main` only)
   and `preview`. In both, add secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
   In `production`, add the variable `SITE_URL` = `https://www.yourdomain.com`.

## Day 4: Domain hardening

In Cloudflare for your domain:

- Pages project → Custom domains → add `www.yourdomain.com` and the bare domain, then redirect
  the bare domain to `www` (Rules → Redirect Rules).
- SSL/TLS: mode **Full (strict)**, **Always Use HTTPS** on, **Minimum TLS 1.2**.
- DNS → **DNSSEC** on.
- Security → WAF → **Rate limiting rule**: path `/api/contact`, 10 requests per minute per IP, block.
- Security → Bots → **Bot Fight Mode** on.

## Day 5: Test and launch

1. Make a small change on a branch and open a pull request. The pipeline posts a preview URL in the
   workflow log. Check both region pages and send yourself a test enquiry.
2. Merge. Production deploys, and `scripts/check-live.mjs` checks headers, HTTPS and the API.
3. Scan the live site with Mozilla Observatory, SSL Labs and securityheaders.com. Expect top grades.
4. Submit `https://www.yourdomain.com/sitemap.xml` in Google Search Console and Bing Webmaster Tools.

---

## Making changes after launch

```bash
git switch -c update-packages
# edit src/content.mjs (copy), src/assets/site.css (style) or src/build.mjs (layout)
npm run db:local        # first time only
cp .dev.vars.example .dev.vars   # first time only
npm run dev             # http://localhost:8788
git commit -am "Update packages" && git push -u origin update-packages
```
Open a pull request, check the preview, merge. Nothing reaches production without passing checks.

**Rollback:** Cloudflare dashboard → Pages → halcyra-site → Deployments → pick the last good one →
*Rollback*. Takes seconds. Then `git revert` the bad commit so `main` matches.

## Working with leads

```bash
# New leads
npx wrangler d1 execute halcyra-leads --remote --command \
  "SELECT datetime(created_at,'unixepoch') AS at, region, name, email, service FROM leads WHERE status='new' ORDER BY created_at DESC"

# Mark one as contacted
npx wrangler d1 execute halcyra-leads --remote --command "UPDATE leads SET status='contacted' WHERE id='<id>'"

# Monthly: delete enquiries older than 12 months that did not become clients (matches the privacy notice)
npx wrangler d1 execute halcyra-leads --remote --command \
  "DELETE FROM leads WHERE created_at < unixepoch('now','-12 months') AND status IN ('new','contacted','lost')"
```

## Before you go live, also

- Have a lawyer review `/privacy/` and fill in the company name and address.
- Replace the Turnstile **test key** in `site.config.mjs` (the test key accepts every request).
- Optional: give previews their own D1 database so test enquiries don't mix with real ones
  (`[env.preview]` block in `wrangler.toml`).
- Optional hardening: pin GitHub Actions to commit SHAs (the `pinact` tool does this);
  Dependabot will keep them updated.

## Project layout

```
site.config.mjs          brand, domain, emails, Turnstile site key
src/content.mjs          all page copy, per region
src/build.mjs            builds dist/ (pages, sitemap, robots, security.txt)
src/assets/              CSS and JS (content-hashed at build time)
public/_headers          security headers and caching
functions/api/contact.js contact form API
migrations/              D1 schema
scripts/check-live.mjs   post-deploy smoke test
.github/                 CI/CD and Dependabot
```
