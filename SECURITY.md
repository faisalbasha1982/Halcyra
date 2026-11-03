# Security

Found a vulnerability in this website? Email the address in
[/.well-known/security.txt](https://www.example.com/.well-known/security.txt).
Please do not open a public issue. We aim to acknowledge reports within two working days.

## How this site is protected

- Static pages on Cloudflare Pages; the only server code is `functions/api/contact.js`.
- Strict Content-Security-Policy with no inline scripts or styles, and no third-party code
  except Cloudflare Turnstile. Fonts are self-hosted.
- The contact API accepts same-origin JSON only, validates every field, checks Turnstile,
  rate-limits by hashed IP (hash kept 24 hours) and uses parameterised D1 queries.
- No secrets in the repo: Cloudflare and Resend keys live in GitHub environment secrets
  and Cloudflare Pages secrets. CI runs a secret scan and a dependency audit on every change.
- Production deploys only from `main`, through a protected GitHub environment.
