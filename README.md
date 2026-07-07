# Homefront Markets — Web Deployment Guide

One GitHub repo, two Netlify sites, one domain.

## Architecture

```
homefrontmarkets.com            → Netlify Site A ("hfm-root")       → /root-site
newsletter.homefrontmarkets.com → Netlify Site B ("hfm-newsletter") → /newsletter-site
Beehiiv                         → sending + tracking only (form/embed posts to it)
```

Why two sites instead of one: a single Netlify static site serves identical content to every domain attached to it. Separate sites give each domain its own content, deploy history, and analytics — and later, the marketplace replaces `/root-site` without touching the newsletter.

## Repo structure

```
homefront-web/
├── README.md
├── .gitignore
├── root-site/                  # homefrontmarkets.com
│   ├── index.html              # coming-soon page (placeholder — replace with your design)
│   ├── netlify.toml            # redirects /newsletter → subdomain, headers
│   └── assets/
│       └── hfm-logo.png
└── newsletter-site/            # newsletter.homefrontmarkets.com
    ├── index.html              # your landing page
    ├── about.html              # your about page
    ├── netlify.toml            # /about clean URL, headers
    └── assets/
        ├── hfm-logo.png
        └── hfm-logo-craftsman.png
```

Rules going forward: every page is an `.html` file in the site folder it belongs to; shared images go in that site's `assets/`; each site keeps its own `netlify.toml`.

---

## Step-by-step

### 1. Push to GitHub (~10 min)

1. Create a repo at github.com (e.g., `homefront-web`, private is fine).
2. From inside the `homefront-web` folder:
   ```bash
   git init
   git add .
   git commit -m "Initial site: root coming-soon + newsletter landing"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/homefront-web.git
   git push -u origin main
   ```

### 2. Create Netlify Site A — root (~5 min)

1. Netlify dashboard → **Add new site → Import an existing project** → pick the `homefront-web` repo.
2. Settings:
   - **Base directory:** `root-site`
   - **Build command:** (leave empty)
   - **Publish directory:** `root-site`
3. Deploy. You'll get a temporary URL like `random-name.netlify.app` — verify the coming-soon page loads.
4. Rename the site to something recognizable: Site settings → **Change site name** → `hfm-root`.

### 3. Create Netlify Site B — newsletter (~5 min)

Repeat step 2 with the **same repo**, but:
- **Base directory:** `newsletter-site`
- **Publish directory:** `newsletter-site`
- Name it `hfm-newsletter`.

Verify the landing page and `/about` load on its `.netlify.app` URL.

### 4. Attach domains (~10 min + DNS propagation)

**Site A:** Domain management → Add domain → `homefrontmarkets.com` (also add `www.homefrontmarkets.com`; Netlify redirects www → apex automatically).

**Site B:** Domain management → Add domain → `newsletter.homefrontmarkets.com`.

Then at your DNS provider (wherever the domain is registered — or move nameservers to Netlify DNS, which is simplest):

| Record | Host | Value |
|---|---|---|
| A (or ALIAS/ANAME) | `@` | `75.2.60.5` (Netlify's load balancer) |
| CNAME | `www` | `hfm-root.netlify.app` |
| CNAME | `newsletter` | `hfm-newsletter.netlify.app` |

If Netlify DNS: skip the table — Netlify creates records when you add the domains.

**Important:** if beehiiv previously verified `newsletter.homefrontmarkets.com` as its *website* custom domain, remove that in beehiiv (Settings → Publication → Domains) so it doesn't conflict. Keep any records beehiiv uses for **email sending** (usually on a different host like `mail.` or DKIM/SPF TXT records) — those don't conflict.

HTTPS: Netlify auto-provisions Let's Encrypt certificates once DNS resolves (minutes to ~24h).

### 5. Wire the signup form to beehiiv (~10 min)

`newsletter-site/index.html` has a placeholder: `action="REPLACE_WITH_BEEHIIV_FORM_ACTION"`.

Two options (the file's comments cover both):
- **Iframe embed (easiest):** beehiiv → Grow → Subscribe Forms → copy embed URL → swap it into the commented-out iframe and delete the placeholder form. Styling is beehiiv's, tracking is automatic.
- **Keep your custom form:** point `action` at your publication's subscribe endpoint and remove `onsubmit="return false;"`. Keeps your design pixel-perfect; test that submissions appear in beehiiv.

Also set beehiiv's post-signup redirect (thank-you page) if you want subscribers sent back to your site.

### 6. Test checklist

- [ ] `homefrontmarkets.com` shows coming-soon page, HTTPS padlock
- [ ] `homefrontmarkets.com/newsletter` redirects to the newsletter site
- [ ] `newsletter.homefrontmarkets.com` shows your landing page
- [ ] `newsletter.homefrontmarkets.com/about` loads the about page
- [ ] Signup form submission creates a subscriber in beehiiv
- [ ] Both pages render correctly on mobile
- [ ] Newsletter/ad links you distribute point at `newsletter.homefrontmarkets.com`

### 7. Ongoing workflow

Edit files locally → `git add . && git commit -m "..." && git push` → Netlify auto-deploys both sites in ~30 seconds. Netlify only redeploys a site when files in its base directory change.

When the marketplace is ready: replace `root-site/` contents (or point Site A at the marketplace's build output) — the newsletter site is untouched.

---

## Later (optional)

- **Beehiiv post archive on a subdomain:** if you want past issues at `read.homefrontmarkets.com`, add that as beehiiv's custom website domain — it doesn't conflict with Netlify.
- **Deploy previews:** open PRs in GitHub to get preview URLs before publishing changes.
- **Netlify Forms** for a contact form on the about page — add `netlify` attribute to a form, zero backend.
