/* ═══════════════════════════════════════════════════════════
   HOMEFRONT MARKETS — ARCHIVE BUILD

   Turns the .html files in posts/dispatch/ and
   posts/craftsmans_letter/ into:
     1. a published page at /archive/<branch>/<slug>/
     2. an entry in assets/posts.js (consumed by the three
        archive listing pages)

   Run locally with `node build.js` to preview before you push.
   Netlify also runs this automatically on every deploy
   (see netlify.toml), so a bad post file fails the build
   instead of shipping a broken archive.

   See posts/README.md for the authoring workflow.
   ═══════════════════════════════════════════════════════════ */

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const POSTS_ROOT = path.join(ROOT, "posts");
const ARCHIVE_ROOT = path.join(ROOT, "archive");
const POSTS_JS_PATH = path.join(ROOT, "assets", "posts.js");
const SITE_URL = "https://homefrontmarkets.com";

const BRANCHES = {
  dispatch: {
    name: "The Dispatch",
    accent: "#922B3E",
    home: "/archive/dispatch/"
  },
  craftsmans_letter: {
    name: "The Craftsman's Letter",
    accent: "#1B3A5C",
    home: "/archive/craftsmans_letter/"
  }
};

function fail(message) {
  console.error("\nARCHIVE BUILD FAILED\n" + message + "\n");
  process.exit(1);
}

function formatDate(iso) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function roman(n) {
  const table = [[1000,"M"],[900,"CM"],[500,"D"],[400,"CD"],[100,"C"],[90,"XC"],
                 [50,"L"],[40,"XL"],[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]];
  let out = "", rem = n;
  for (const [v, s] of table) { while (rem >= v) { out += s; rem -= v; } }
  return out;
}

function slugify(base) {
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

/* ── 1. Read every post source file ── */

function readPosts() {
  const posts = [];

  for (const branch of Object.keys(BRANCHES)) {
    const dir = path.join(POSTS_ROOT, branch);
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir)
      .filter((f) => f.endsWith(".html") && !f.startsWith("_") && !f.startsWith("."));

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const raw = fs.readFileSync(fullPath, "utf8");
      const rel = path.relative(ROOT, fullPath);

      const match = raw.replace(/^﻿/, "").match(/^\s*<!--([\s\S]*?)-->/);
      if (!match) {
        fail(`${rel}\nMissing the metadata block. Every post must start with:\n<!--\n{ "title": "...", "deck": "...", "date": "YYYY-MM-DD", "readMins": 5 }\n-->`);
      }

      let meta;
      try {
        meta = JSON.parse(match[1]);
      } catch (e) {
        fail(`${rel}\nThe metadata block isn't valid JSON: ${e.message}`);
      }

      for (const field of ["title", "deck", "date", "readMins"]) {
        if (meta[field] === undefined || meta[field] === null || meta[field] === "") {
          fail(`${rel}\nMissing required field "${field}" in the metadata block.`);
        }
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date)) {
        fail(`${rel}\n"date" must be in YYYY-MM-DD format, got: ${meta.date}`);
      }
      if (typeof meta.readMins !== "number") {
        fail(`${rel}\n"readMins" must be a number, got: ${JSON.stringify(meta.readMins)}`);
      }
      if (meta.branch && meta.branch !== branch) {
        fail(`${rel}\nThis file lives in posts/${branch}/ but its metadata says branch "${meta.branch}". Move the file or fix the field — they must match.`);
      }
      if (meta.tags && (!Array.isArray(meta.tags) || meta.tags.length > 3)) {
        fail(`${rel}\n"tags" must be an array of at most 3 short strings.`);
      }

      const slug = slugify(meta.slug || path.basename(file, ".html"));
      if (!slug) fail(`${rel}\nCouldn't derive a URL slug from the filename — rename it to something like "my-post-title.html".`);

      const body = raw.slice(match[0].length).trim();
      if (!body) fail(`${rel}\nThe post body is empty — add the article content below the metadata block.`);

      posts.push({
        branch,
        slug,
        vol: typeof meta.vol === "number" ? meta.vol : 1,
        title: meta.title,
        deck: meta.deck,
        date: meta.date,
        readMins: meta.readMins,
        tags: meta.tags || [],
        body,
        sourceFile: rel
      });
    }
  }

  return posts;
}

/* ── 2. Auto-number issues within each branch + volume, oldest first ── */

function assignIssueNumbers(posts) {
  const groups = {};
  for (const p of posts) {
    const key = p.branch + "::" + p.vol;
    (groups[key] = groups[key] || []).push(p);
  }
  for (const key of Object.keys(groups)) {
    groups[key]
      .sort((a, b) => (a.date === b.date ? a.slug.localeCompare(b.slug) : a.date < b.date ? -1 : 1))
      .forEach((p, i) => { p.no = i + 1; });
  }
}

/* ── 3. Shared page chrome ── */

function siteHeader(logo) {
  return `<header>
    <a href="https://newsletter.homefrontmarkets.com/"><img src="/assets/${logo}" alt="Homefront Markets"></a>
    <div class="tagline">Keep America Working</div>
    <nav aria-label="Site">
      <a href="https://newsletter.homefrontmarkets.com/">Home</a><span class="sep">|</span><a href="https://newsletter.homefrontmarkets.com/about">About</a><span class="sep">|</span><a href="/archive/" aria-current="page">Archive</a>
    </nav>
  </header>`;
}

function siteFooter(extraLink) {
  return `<footer>
  <div class="inner">
    <p class="ql">Quick Links</p>
    <p class="links">
      <a href="/">Marketplace (Coming Soon)</a><span class="sep">|</span><a href="https://newsletter.homefrontmarkets.com/">Subscribe</a><span class="sep">|</span><a href="/archive/">Full Archive</a><span class="sep">|</span>${extraLink}<span class="sep">|</span><a href="/terms/">Terms</a><span class="sep">|</span><a href="/privacy/">Privacy</a>
    </p>
    <p class="quote">"That business of America, by America, for America,<br>shall not perish from the earth."</p>
  </div>
</footer>`;
}

/* ── 4. Dispatch post template (red register) ── */

function renderDispatchPost(p) {
  const canonical = `${SITE_URL}/archive/dispatch/${p.slug}/`;
  const tags = p.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(p.title)} — The Dispatch — Homefront Markets</title>
<meta name="description" content="${escapeHtml(p.deck)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="article">
<meta property="og:title" content="${escapeHtml(p.title)}">
<meta property="og:description" content="${escapeHtml(p.deck)}">
<meta property="og:url" content="${canonical}">

<!-- Generated by build.js from posts/dispatch/${path.basename(p.sourceFile)} — do not edit directly. -->

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Lora:ital,wght@0,400;0,600;1,400;1,500&display=swap" rel="stylesheet">

<style>
  :root{
    --red:#922B3E; --red-dark:#7A2333; --charcoal:#2C2824; --ink:#1A1A1A;
    --cream:#FAF8F5; --tint:#F0EDE8; --warm:#4A3728;
    --muted:#6B5E54; --muted2:#8A7E78; --divider:#E0DBD5;
  }
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--cream);color:var(--ink);font-family:'Lora',Georgia,serif;
       border-top:5px solid var(--red);-webkit-text-size-adjust:100%}
  .shell{max-width:720px;margin:0 auto;padding:0 24px}
  header{text-align:center;padding:34px 0 0}
  header img{width:280px;max-width:82%;height:auto}
  .tagline{font-size:14px;font-style:italic;color:var(--muted2);letter-spacing:.06em;margin-top:8px}
  nav{border-top:1px solid var(--divider);margin-top:16px;padding:12px 0;
      font-family:'Inter',sans-serif;font-size:11px;font-weight:500;
      letter-spacing:.07em;text-transform:uppercase}
  nav a{color:var(--muted);text-decoration:none}
  nav a:hover{color:var(--red)}
  nav a[aria-current]{color:var(--red);font-weight:700}
  nav .sep{color:#D5CECC;margin:0 9px}
  .strip{background:var(--tint);border-top:1px solid var(--divider);
      border-bottom:1px solid var(--divider);margin-top:0;padding:8px 0;text-align:center;
      font-family:'Inter',sans-serif;font-size:10px;font-weight:600;
      letter-spacing:.11em;text-transform:uppercase;color:var(--muted2)}
  .lbl{font-family:'Inter',sans-serif;font-size:10.5px;font-weight:700;
       letter-spacing:.15em;text-transform:uppercase;color:var(--red);
       display:block;margin-bottom:7px}
  .lbl-rule{width:40%;max-width:220px;height:1px;background:var(--red);margin-bottom:18px}
  .intro{padding:38px 0 8px}
  .intro h1{font-family:'Inter',sans-serif;font-size:clamp(26px,4.4vw,34px);
            font-weight:800;letter-spacing:-.022em;line-height:1.22;margin-bottom:14px}
  .intro .deck{font-size:16px;font-style:italic;color:var(--warm);line-height:1.65;max-width:60ch;margin-bottom:16px}
  .meta{font-family:'Inter',sans-serif;font-size:11px;font-weight:600;
        letter-spacing:.08em;text-transform:uppercase;color:var(--muted2);
        display:flex;flex-wrap:wrap;align-items:center;gap:0;margin-bottom:8px}
  .meta b{color:var(--muted)}
  .meta .dot{margin:0 7px;color:#D5CECC}
  .tag{display:inline-block;background:var(--tint);color:var(--warm);
       font-family:'Inter',sans-serif;font-size:10px;font-weight:600;
       letter-spacing:.06em;text-transform:uppercase;padding:4px 9px;
       border-radius:2px;margin:10px 6px 0 0}
  .article-body{padding:24px 0 6px;font-size:16.5px;line-height:1.78;color:var(--ink)}
  .article-body p{margin-bottom:19px}
  .article-body h2{font-family:'Inter',sans-serif;font-size:22px;font-weight:800;
        letter-spacing:-.02em;margin:36px 0 14px;color:var(--ink)}
  .article-body h3{font-family:'Inter',sans-serif;font-size:18px;font-weight:700;
        margin:28px 0 12px;color:var(--ink)}
  .article-body a{color:var(--red)}
  .article-body strong{color:var(--ink)}
  .article-body blockquote,.pull-quote{border-left:4px solid var(--red);
        padding:4px 0 4px 20px;margin:26px 0;font-style:italic;color:var(--warm);font-size:17px}
  .article-body img{max-width:100%;height:auto;margin:22px 0;border:1px solid var(--divider)}
  .article-body ul,.article-body ol{margin:0 0 19px 22px}
  .article-body li{margin-bottom:8px}
  .article-body hr{border:none;border-top:1px solid var(--divider);margin:36px 0}
  .back{display:block;margin:30px 0 0;font-family:'Inter',sans-serif;font-size:12px;
        font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);text-decoration:none}
  .back:hover{color:var(--red)}
  .subband{background:var(--charcoal);margin:40px 0 0;padding:28px;text-align:center}
  .subband .lbl{color:rgba(255,255,255,.52)}
  .subband .lbl-rule{background:rgba(255,255,255,.2);margin-left:auto;margin-right:auto}
  .subband p{font-size:15px;font-style:italic;color:rgba(255,255,255,.82);
        line-height:1.6;margin-bottom:16px}
  .btn-red{display:inline-block;background:var(--red);color:#fff;
        font-family:'Inter',sans-serif;font-size:11.5px;font-weight:700;
        letter-spacing:.08em;text-transform:uppercase;padding:12px 22px;
        text-decoration:none;border-radius:2px;transition:background .15s ease}
  .btn-red:hover{background:var(--red-dark)}
  footer{background:var(--ink);margin-top:46px}
  footer .inner{max-width:720px;margin:0 auto;padding:26px 24px 22px}
  footer .ql{font-family:'Inter',sans-serif;font-size:9.5px;font-weight:700;
        text-transform:uppercase;letter-spacing:.13em;color:rgba(255,255,255,.35);margin-bottom:9px}
  footer .links{font-family:'Inter',sans-serif;font-size:12px;line-height:1.7;margin-bottom:20px}
  footer .links a{color:rgba(255,255,255,.72);text-decoration:none;font-weight:500}
  footer .links a:hover{color:#fff}
  footer .links .sep{color:rgba(255,255,255,.2);margin:0 8px}
  footer .quote{font-size:13px;font-style:italic;color:rgba(255,255,255,.42);
        text-align:center;line-height:1.75;padding-top:18px;
        border-top:1px solid rgba(255,255,255,.08)}
</style>
</head>
<body>

<div class="shell">
  ${siteHeader("hfm-logo.png")}
</div>

<div class="strip">The Dispatch &nbsp;·&nbsp; Vol. ${p.vol}, No. ${p.no} &nbsp;·&nbsp; ${formatDate(p.date)}</div>

<div class="shell">
  <section class="intro">
    <span class="lbl">▸ The Dispatch</span>
    <div class="lbl-rule"></div>
    <h1>${escapeHtml(p.title)}</h1>
    <p class="deck">${escapeHtml(p.deck)}</p>
    <div class="meta"><b>Vol. ${p.vol}, No. ${p.no}</b><span class="dot">·</span>${formatDate(p.date)}<span class="dot">·</span>${p.readMins} min read</div>
    ${tags}
  </section>

  <article class="article-body">
    ${p.body}
  </article>

  <a class="back" href="/archive/dispatch/">&larr; Back to The Dispatch archive</a>

  <div class="subband">
    <span class="lbl">▸ Get the Next Briefing</span>
    <div class="lbl-rule"></div>
    <p>The Dispatch lands midweek. Numbers, finds, and deals —<br>free, in your inbox, before it hits the archive.</p>
    <a class="btn-red" href="https://newsletter.homefrontmarkets.com/">Subscribe Free →</a>
  </div>
</div>

${siteFooter('<a href="/archive/craftsmans_letter/">The Craftsman\'s Letter</a>')}

</body>
</html>
`;
}

/* ── 5. Craftsman's Letter post template (navy register) ── */

function renderLetterPost(p) {
  const canonical = `${SITE_URL}/archive/craftsmans_letter/${p.slug}/`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(p.title)} — The Craftsman's Letter — Homefront Markets</title>
<meta name="description" content="${escapeHtml(p.deck)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="article">
<meta property="og:title" content="${escapeHtml(p.title)}">
<meta property="og:description" content="${escapeHtml(p.deck)}">
<meta property="og:url" content="${canonical}">

<!-- Generated by build.js from posts/craftsmans_letter/${path.basename(p.sourceFile)} — do not edit directly. -->

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap" rel="stylesheet">

<style>
  :root{
    --navy:#1B3A5C; --navy-deep:#142C46; --charcoal:#2C2824; --ink:#1A1A1A;
    --cream:#FAFAF8; --tint:#F5F3EF; --quote:#EEF1F6; --warm:#4A3728;
    --muted:#6B5E54; --muted2:#8A7E78; --divider:#E0DBD5;
  }
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--cream);color:var(--ink);font-family:'Lora',Georgia,serif;
       border-top:5px solid var(--navy);-webkit-text-size-adjust:100%}
  .shell{max-width:680px;margin:0 auto;padding:0 24px}
  header{text-align:center;padding:32px 0 0}
  header img{width:200px;max-width:70%;height:auto}
  .tagline{font-size:12px;font-style:italic;color:var(--muted2);letter-spacing:.05em;margin-top:8px}
  nav{border-top:1px solid var(--divider);margin-top:16px;padding:12px 0;
      font-family:'Inter',sans-serif;font-size:10.5px;font-weight:500;
      letter-spacing:.07em;text-transform:uppercase}
  nav a{color:var(--muted);text-decoration:none}
  nav a:hover{color:var(--navy)}
  nav a[aria-current]{color:var(--navy);font-weight:700}
  nav .sep{color:#D5CECC;margin:0 9px}
  .lbl{font-family:'Inter',sans-serif;font-size:10px;font-weight:700;
       letter-spacing:.15em;text-transform:uppercase;color:var(--navy);
       display:block;margin-bottom:7px}
  .lbl-rule{width:40%;max-width:200px;height:1px;background:var(--navy);margin-bottom:18px}
  .intro{padding:40px 0 6px}
  .no{font-family:'Inter',sans-serif;font-size:10.5px;font-weight:700;
       letter-spacing:.16em;text-transform:uppercase;color:var(--navy);
       display:block;margin-bottom:12px}
  .intro h1{font-family:'Lora',Georgia,serif;font-size:clamp(26px,4.4vw,33px);
       font-weight:600;letter-spacing:-.015em;line-height:1.28;margin-bottom:14px}
  .intro .deck{font-size:16px;font-style:italic;color:var(--warm);line-height:1.7;max-width:60ch;margin-bottom:14px}
  .meta{font-family:'Inter',sans-serif;font-size:10.5px;font-weight:600;
       letter-spacing:.08em;text-transform:uppercase;color:var(--muted2);margin-bottom:6px}
  .meta .dot{margin:0 7px;color:#D5CECC}
  .article-body{padding:22px 0 6px;font-size:16.5px;line-height:1.85;color:var(--ink)}
  .article-body p{margin-bottom:20px}
  .article-body h2{font-family:'Lora',Georgia,serif;font-size:23px;font-weight:600;
        letter-spacing:-.01em;margin:36px 0 14px}
  .article-body h3{font-family:'Lora',Georgia,serif;font-size:19px;font-weight:600;margin:28px 0 12px}
  .article-body a{color:var(--navy)}
  .article-body strong{color:var(--ink)}
  .article-body blockquote,.pull-quote{border-left:4px solid var(--navy);
        padding:4px 0 4px 22px;margin:28px 0}
  .article-body blockquote p,.pull-quote p{font-size:17px;font-style:italic;color:#2A3D52;line-height:1.65;margin:0}
  .article-body img{max-width:100%;height:auto;margin:24px 0}
  .article-body ul,.article-body ol{margin:0 0 20px 22px}
  .article-body li{margin-bottom:9px}
  .article-body hr{border:none;border-top:1px solid var(--divider);margin:38px 0}
  .back{display:block;margin:32px 0 0;font-family:'Inter',sans-serif;font-size:11.5px;
        font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);text-decoration:none}
  .back:hover{color:var(--navy)}
  .closing{background:var(--tint);border-top:1px solid var(--divider);
       margin:40px -24px 0;padding:34px 24px}
  .closing .inner{max-width:632px;margin:0 auto}
  .closing p{font-size:15.5px;color:var(--ink);line-height:1.82;margin-bottom:14px;max-width:60ch}
  .closing .ps{font-size:14px;font-style:italic;color:var(--muted);margin-top:18px}
  .btn-navy-outline{display:inline-block;border:1.5px solid var(--navy);
       color:var(--navy);font-family:'Inter',sans-serif;font-size:12px;
       font-weight:600;letter-spacing:.04em;padding:10px 20px;
       text-decoration:none;border-radius:2px;transition:all .15s ease}
  .btn-navy-outline:hover{background:var(--navy);color:#fff}
  footer{background:var(--ink)}
  footer .inner{max-width:680px;margin:0 auto;padding:26px 24px 22px}
  footer .ql{font-family:'Inter',sans-serif;font-size:9.5px;font-weight:700;
       text-transform:uppercase;letter-spacing:.13em;color:rgba(255,255,255,.35);margin-bottom:9px}
  footer .links{font-family:'Inter',sans-serif;font-size:12px;line-height:1.7;margin-bottom:20px}
  footer .links a{color:rgba(255,255,255,.72);text-decoration:none;font-weight:500}
  footer .links a:hover{color:#fff}
  footer .links .sep{color:rgba(255,255,255,.2);margin:0 8px}
  footer .quote{font-size:13px;font-style:italic;color:rgba(255,255,255,.42);
       text-align:center;line-height:1.75;padding-top:18px;
       border-top:1px solid rgba(255,255,255,.08)}
</style>
</head>
<body>

<div class="shell">
  ${siteHeader("hfm-logo-craftsman.png")}

  <section class="intro">
    <span class="lbl">The Craftsman's Letter</span>
    <div class="lbl-rule"></div>
    <span class="no">Letter No. ${roman(p.no)} &nbsp;·&nbsp; ${formatDate(p.date)}</span>
    <h1>${escapeHtml(p.title)}</h1>
    <p class="deck">${escapeHtml(p.deck)}</p>
    <div class="meta">${p.readMins} min read</div>
  </section>

  <article class="article-body">
    ${p.body}
  </article>

  <a class="back" href="/archive/craftsmans_letter/">&larr; Back to The Collected Letters</a>
</div>

<div class="closing">
  <div class="inner">
    <span class="lbl">Before You Go</span>
    <div class="lbl-rule"></div>
    <p>If this letter landed with you, the next one can arrive the way the rest did — quietly, at the end of the week, written for someone who cares where things are made.</p>
    <a class="btn-navy-outline" href="https://newsletter.homefrontmarkets.com/">Receive the next letter →</a>
    <p class="ps">P.S. — In a hurry? <a href="/archive/dispatch/" style="color:var(--navy)">The Dispatch</a> is our midweek briefing: the same convictions, read in 90 seconds.</p>
  </div>
</div>

${siteFooter('<a href="/archive/dispatch/">The Dispatch</a>')}

</body>
</html>
`;
}

const RENDERERS = { dispatch: renderDispatchPost, craftsmans_letter: renderLetterPost };

/* ── 6. Write pages, prune stale ones ── */

function writePages(posts) {
  for (const branch of Object.keys(BRANCHES)) {
    const branchDir = path.join(ARCHIVE_ROOT, branch);
    const currentSlugs = new Set(posts.filter((p) => p.branch === branch).map((p) => p.slug));

    if (fs.existsSync(branchDir)) {
      for (const entry of fs.readdirSync(branchDir, { withFileTypes: true })) {
        if (entry.isDirectory() && !currentSlugs.has(entry.name)) {
          fs.rmSync(path.join(branchDir, entry.name), { recursive: true, force: true });
          console.log(`  removed stale page: archive/${branch}/${entry.name}/`);
        }
      }
    }
  }

  for (const p of posts) {
    const outDir = path.join(ARCHIVE_ROOT, p.branch, p.slug);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "index.html"), RENDERERS[p.branch](p));
  }
}

/* ── 7. Regenerate assets/posts.js ── */

function writePostsJs(posts) {
  const sorted = [...posts].sort((a, b) => (a.date < b.date ? 1 : -1));

  const entries = sorted.map((p) => {
    const tags = p.tags.length ? `[${p.tags.map((t) => JSON.stringify(t)).join(", ")}]` : "[]";
    return `  {
    branch: ${JSON.stringify(p.branch)},
    vol: ${p.vol}, no: ${p.no},
    title: ${JSON.stringify(p.title)},
    deck: ${JSON.stringify(p.deck)},
    date: ${JSON.stringify(p.date)},
    readMins: ${p.readMins},
    url: ${JSON.stringify(`/archive/${p.branch}/${p.slug}/`)},
    tags: ${tags}
  }`;
  }).join(",\n");

  const content = `/* ═══════════════════════════════════════════════════════════
   HOMEFRONT MARKETS — PUBLICATION RECORD
   GENERATED FILE — do not edit by hand, your changes will be
   overwritten on the next build.

   To add or change an issue: edit the .html files in
   posts/dispatch/ or posts/craftsmans_letter/, then run
   "node build.js" (Netlify also runs it automatically on
   every deploy). See posts/README.md.
   ═══════════════════════════════════════════════════════════ */

const HFM_POSTS = [
${entries}
];

/* ── Shared helpers used by the archive pages ── */
const HFM_BRANCH_META = {
  dispatch: {
    name: "The Dispatch",
    accent: "#922B3E",
    home: "/archive/dispatch/"
  },
  craftsmans_letter: {
    name: "The Craftsman's Letter",
    accent: "#1B3A5C",
    home: "/archive/craftsmans_letter/"
  }
};

function hfmFormatDate(iso) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function hfmMonthKey(iso) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function hfmRoman(n) {
  const table = [[1000,"M"],[900,"CM"],[500,"D"],[400,"CD"],[100,"C"],[90,"XC"],
                 [50,"L"],[40,"XL"],[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]];
  let out = "";
  for (const [v, s] of table) { while (n >= v) { out += s; n -= v; } }
  return out;
}

/* Sort newest first regardless of entry order in the array */
function hfmSorted(posts) {
  return [...posts].sort((a, b) => (a.date < b.date ? 1 : -1));
}
`;

  fs.writeFileSync(POSTS_JS_PATH, content);
}

/* ── Run ── */

function build() {
  const posts = readPosts();
  assignIssueNumbers(posts);
  writePages(posts);
  writePostsJs(posts);

  const counts = Object.keys(BRANCHES).map((b) => `${posts.filter((p) => p.branch === b).length} ${BRANCHES[b].name}`);
  console.log(`Archive build OK — ${posts.length} post(s): ${counts.join(", ")}.`);
}

build();
