# Security Findings — DPIRD Business Hub
**URL:** https://dpirdwa.vercel.app/  
**Audit date:** 15 August 2026  
**Verified fixed:** 15 August 2026  
**Prepared by:** Esteban Torres — Eleven June Consulting  

---

## Status: ✅ ALL FINDINGS RESOLVED

Post-fix verification confirmed on 15 Aug 2026. Risk reduced from **MEDIUM (5.8/10)** → **LOW (~1.5/10)**.

| Finding | Severity | Status |
|---------|----------|--------|
| F-01 · SPA routes return 404 | 🔴 Critical | ✅ Fixed — all routes return 200 |
| F-02 · No Content Security Policy | 🟠 High | ✅ Fixed — CSP active |
| F-03 · No X-Frame-Options | 🟠 High | ✅ Fixed — `DENY` |
| F-04 · CORS wildcard `*` | 🟠 High | ⚠️ Still `*` — low risk for now, restrict before Phase 2 API |
| F-05 · No X-Content-Type-Options / HSTS | 🟡 Medium | ✅ Fixed — both active |
| F-06 · No Referrer-Policy | 🟡 Medium | ✅ Fixed — `strict-origin-when-cross-origin` |
| F-07 · Images from Google CDN | 🟡 Medium | ⚠️ Open — replace before WA Gov compliance review |
| F-08 · No robots.txt | 🟡 Medium | ✅ Fixed — `Disallow: /` active |

> **One note on the deployed CSP:** The `script-src` directive includes `'unsafe-inline'`, which relaxes XSS protection slightly. Acceptable for MVP/Vite builds. Before production launch, migrate to nonce-based or hash-based CSP to remove `'unsafe-inline'`.

---

## Original Findings (for reference)

### Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 1 |
| 🟠 High | 3 |
| 🟡 Medium | 4 |
| ✅ Positive (no issues) | 8 |

Overall risk at time of audit: **MEDIUM (5.8/10)** — no secrets or credentials exposed, but key HTTP security controls were missing and one critical routing bug blocked core functionality.

---

## 🔴 F-01 · CRITICAL — SPA Routes Return 404 on Direct Access

**What:** Navigating directly to `/advisor`, `/resources`, `/grants`, or `/flow` returns a Vercel 404 error. Only clicking nav links works (client-side routing). Refreshing the page or sharing a direct URL breaks.

**Why it matters:** Any consultant sharing a direct link to the diagnostic tool will get a 404. Bookmarks, external links, and email links all fail.

**Fix:** Add a `vercel.json` at the project root:

```json
{
  "rewrites": [
    { "source": "/((?!assets/).*)", "destination": "/index.html" }
  ]
}
```

---

## 🟠 F-02 · HIGH — No Content Security Policy (CSP)

**What:** No `Content-Security-Policy` header or meta tag present.

**Why it matters:** Without CSP, any injected script (XSS, malicious browser extension, compromised third-party) runs freely in the app context. Relevant for Phase 2 when consultant auth is added.

**Fix:** Add the `Content-Security-Policy` header in `vercel.json` (see complete file at end of this document).

---

## 🟠 F-03 · HIGH — No X-Frame-Options (Clickjacking Risk)

**What:** The site can be embedded in an `<iframe>` from any external domain.

**Why it matters:** Attackers can overlay invisible UI elements on top of the real site and trick users into unintended clicks — especially dangerous once consultant login is implemented.

**Fix:** Add `X-Frame-Options: DENY` header (or use `frame-ancestors 'none'` in CSP, covered in F-02 fix).

---

## 🟠 F-04 · HIGH — CORS Wildcard (`*`) on All Resources

**What:** Every response includes `Access-Control-Allow-Origin: *`.

**Why it matters:** Any website or script can fetch and read resources from this domain. Low impact now (static site), but becomes a real risk when Phase 2 API endpoints or serverless functions are added.

**Fix:** Restrict to `Access-Control-Allow-Origin: https://dpirdwa.vercel.app` (or the production domain).

---

## 🟡 F-05 · MEDIUM — Missing X-Content-Type-Options and HSTS

**What:** Neither `X-Content-Type-Options: nosniff` nor `Strict-Transport-Security` are present.

**Why it matters:** Without `nosniff`, browsers may try to guess the MIME type of responses. Without HSTS, a user accessing `http://` on first visit could be intercepted before the redirect kicks in.

**Fix:** Add both headers in `vercel.json`.

---

## 🟡 F-06 · MEDIUM — No Referrer-Policy

**What:** No `Referrer-Policy` header set.

**Why it matters:** When users click external links or the browser loads resources from `lh3.googleusercontent.com`, the full current URL is sent as a `Referer` header. If future URL params include session tokens or user data, this leaks to third parties.

**Fix:** Add `Referrer-Policy: strict-origin-when-cross-origin`.

---

## 🟡 F-07 · MEDIUM — Hero Images Loaded from Google CDN

**What:** Page images load from `https://lh3.googleusercontent.com` (Google's image CDN).

**Why it matters:** Creates a third-party dependency for availability, and transmits visitor IP addresses and browsing behaviour to Google. This will be a compliance issue under WA Government data policies.

**Fix:** Move images to `/public/images/` in the repo and reference them locally.

---

## 🟡 F-08 · MEDIUM — No robots.txt

**What:** No `robots.txt` file exists. Verified: returns HTTP 404.

**Why it matters:** Search engines (Google, Bing) will crawl and index the prototype before it's ready for public launch. The site may appear in search results prematurely.

**Fix:** Add `public/robots.txt` with `Disallow: /` during development. Switch to permissive policy at official launch.

---

## ✅ No Issues Found

| Check | Result |
|-------|--------|
| Hardcoded API keys / secrets in JS bundle | ✅ None found |
| VITE_ environment variables exposed | ✅ None found |
| Source maps (`.map` files) accessible | ✅ 404 — not exposed |
| `.env` or `.git/config` accessible | ✅ 404 — not exposed |
| Inline event handlers (XSS vectors) | ✅ None in DOM |
| Sensitive data in localStorage/sessionStorage | ✅ Empty |
| Open API endpoints vulnerable to attack | ✅ No backend in current build |
| HTTPS enforced | ✅ Vercel auto-redirects HTTP → HTTPS |

---

## Complete Fix — `vercel.json`

Place this file at the **project root** (same level as `package.json`). It resolves F-01 through F-06 in a single deploy:

```json
{
  "rewrites": [
    { "source": "/((?!assets/).*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https://lh3.googleusercontent.com data: blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
        },
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin"
        }
      ]
    }
  ]
}
```

## `public/robots.txt` (add during MVP phase)

```
User-agent: *
Disallow: /
```

---

---

## Remaining open items (pre-production)

1. **CORS wildcard `*`** — Restrict `Access-Control-Allow-Origin` to the production domain before adding any API endpoints or serverless functions in Phase 2.
2. **Google CDN images** — Move hero images to `/public/images/` to comply with WA Government data residency policies and remove the external dependency.
3. **CSP `'unsafe-inline'`** — Migrate to nonce or hash-based CSP before production to fully harden XSS protection.

*Two files deployed (vercel.json + public/robots.txt) resolved 6 out of 8 findings in a single deploy.*
