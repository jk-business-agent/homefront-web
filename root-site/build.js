/* ═══════════════════════════════════════════════════════════
   HOMEFRONT MARKETS — ARCHIVE BUILD

   Turns the .html files in posts/dispatch/ and
   posts/craftsmans_letter/ into:
     1. a published page at /archive/<branch>/<slug>/ — your
        source file is published verbatim (it's already a
        complete, styled page); only <title>/description/
        canonical tags get patched in from the metadata block
        so the page can never disagree with its own summary card.
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
const crypto = require("crypto");

const ROOT = __dirname;
const POSTS_ROOT = path.join(ROOT, "posts");
const ARCHIVE_ROOT = path.join(ROOT, "archive");
const POSTS_JS_PATH = path.join(ROOT, "assets", "posts.js");
const SITE_URL = "https://homefrontmarkets.com";

const BRANCHES = {
  dispatch: { name: "The Dispatch" },
  craftsmans_letter: { name: "The Craftsman's Letter" }
};

function fail(message) {
  console.error("\nARCHIVE BUILD FAILED\n" + message + "\n");
  process.exit(1);
}

function warn(message) {
  console.warn("  warning: " + message);
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

function isSpaceCode(code) {
  return code === 32 || code === 9 || code === 10 || code === 13;
}

/* Detects text that was UTF-8 encoded, then read back in using the wrong
   single-byte encoding (Windows-1252/Latin-1), then saved as UTF-8 again —
   the classic "double-encoding" bug. Three signatures, all by character
   code so nothing ambiguous ends up embedded in this source file:
     1. C1 control characters (0x80-0x9f) — never legitimate in prose.
     2. 0xC2 ("Â") or 0xC3 ("Ã") immediately followed by a Latin-1
        Supplement character (0x80-0xbf) — e.g. a middle dot "·" (which is
        UTF-8 bytes C2 B7) misread as Latin-1 becomes "Â" + "·".
     3. A lone char 0xE2 ("â") standing as its own word — almost always a
        collapsed em dash from the same corruption, not the letter itself. */
function hasEncodingCorruption(str) {
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code >= 128 && code <= 159) return true;
    if ((code === 0xc2 || code === 0xc3) && i + 1 < str.length) {
      const next = str.charCodeAt(i + 1);
      if (next >= 128 && next <= 191) return true;
    }
    if (code === 0xe2) {
      const prev = i === 0 ? 32 : str.charCodeAt(i - 1);
      const next = i + 1 >= str.length ? 32 : str.charCodeAt(i + 1);
      if (isSpaceCode(prev) && isSpaceCode(next)) return true;
    }
  }
  return false;
}

/* Pulls a leading "YYYY-M-D_" or "YYYY-MM-DD-" date off a filename (for
   your own browsing/sorting in posts/), returning the date (normalized to
   YYYY-MM-DD) and the remainder to use as the URL slug. Returns null if
   the filename doesn't start with a date. */
function extractDatePrefix(basename) {
  const m = basename.match(/^(\d{4})-(\d{1,2})-(\d{1,2})[_-](.+)$/);
  if (!m) return null;
  const [, y, mo, d, rest] = m;
  const iso = `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  return { iso, rest };
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

      if (hasEncodingCorruption(raw)) {
        warn(rel + " looks like it was saved with the wrong encoding (e.g. Windows-1252 instead of UTF-8) — this shows up as garbled dashes/quotes/bullets on the live page. Re-save (or re-export from whatever tool produced it) as UTF-8.");
      }

      const match = raw.replace(/^﻿/, "").match(/^\s*<!--([\s\S]*?)-->/);
      if (!match) {
        fail(`${rel}\nMissing the metadata block. Every post must start with:\n<!--\n{ "title": "...", "deck": "...", "date": "YYYY-MM-DD", "readMins": 5, "vol": 1, "no": 1 }\n-->`);
      }

      let meta;
      try {
        meta = JSON.parse(match[1]);
      } catch (e) {
        fail(`${rel}\nThe metadata block isn't valid JSON: ${e.message}`);
      }

      for (const field of ["title", "deck", "date", "readMins", "vol", "no"]) {
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
      if (typeof meta.vol !== "number" || typeof meta.no !== "number") {
        fail(`${rel}\n"vol" and "no" must both be numbers — match whatever issue number is already written into the page itself.`);
      }
      if (meta.branch && meta.branch !== branch) {
        fail(`${rel}\nThis file lives in posts/${branch}/ but its metadata says branch "${meta.branch}". Move the file or fix the field — they must match.`);
      }
      if (meta.tags && (!Array.isArray(meta.tags) || meta.tags.length > 3)) {
        fail(`${rel}\n"tags" must be an array of at most 3 short strings.`);
      }

      const basename = path.basename(file, ".html");
      const datePrefix = extractDatePrefix(basename);
      if (datePrefix && datePrefix.iso !== meta.date) {
        fail(`${rel}\nThe date in the filename (${datePrefix.iso}) doesn't match "date" in the metadata block (${meta.date}). Fix whichever one is stale.`);
      }

      const slug = slugify(meta.slug || (datePrefix ? datePrefix.rest : basename));
      if (!slug) fail(`${rel}\nCouldn't derive a URL slug from the filename — rename it to something like "2026-07-29_my-post-title.html".`);

      const page = raw.slice(match[0].length).trim();
      if (!page) fail(`${rel}\nThe page content is empty — paste your integrated archive-template HTML below the metadata block.`);
      if (!/<html[\s>]/i.test(page)) {
        warn(`${rel} doesn't look like a complete HTML document (no <html> tag found) — the build publishes it as-is, so double check it's your full integrated template, not just a body fragment.`);
      }
      if (/src=["']\.\.\//.test(page)) {
        warn(`${rel} uses a relative path (src="../...") for an image or asset. This page will publish at /archive/${branch}/${slug}/, so relative paths resolve from there — use an absolute path instead, e.g. src="/assets/${branch}/your-image.jpg", so it doesn't 404.`);
      }

      posts.push({
        branch,
        slug,
        vol: meta.vol,
        no: meta.no,
        title: meta.title,
        deck: meta.deck,
        date: meta.date,
        readMins: meta.readMins,
        tags: meta.tags || [],
        page,
        sourceFile: rel
      });
    }
  }

  return posts;
}

/* ── 2. Guard against duplicate issue numbers within a branch+volume ── */

function checkForDuplicateNumbers(posts) {
  const seen = {};
  for (const p of posts) {
    const key = `${p.branch}::vol ${p.vol}::no ${p.no}`;
    if (seen[key]) {
      fail(`${p.sourceFile}\nDuplicate issue number: ${seen[key]} is already Vol. ${p.vol}, No. ${p.no} in ${p.branch}. Each issue needs a unique vol/no pair.`);
    }
    seen[key] = p.sourceFile;
  }
}

/* ── 3. Patch <title>/description/canonical into the page's own <head> ── */

function patchHead(page, post) {
  const canonical = `${SITE_URL}/archive/${post.branch}/${post.slug}/`;
  const titleTag = `<title>${escapeHtml(post.title)} — ${BRANCHES[post.branch].name} — Homefront Markets</title>`;
  const metaTags = [
    `<meta name="description" content="${escapeHtml(post.deck)}">`,
    `<link rel="canonical" href="${canonical}">`,
    `<meta property="og:type" content="article">`,
    `<meta property="og:title" content="${escapeHtml(post.title)}">`,
    `<meta property="og:description" content="${escapeHtml(post.deck)}">`,
    `<meta property="og:url" content="${canonical}">`
  ].join("\n  ");

  let out = page.replace(/<meta\s+name=["']description["'][^>]*>\s*/i, "");

  if (/<title>[\s\S]*?<\/title>/i.test(out)) {
    out = out.replace(/<title>[\s\S]*?<\/title>/i, `${titleTag}\n  ${metaTags}`);
  } else if (/<head[^>]*>/i.test(out)) {
    out = out.replace(/<head[^>]*>/i, (m) => `${m}\n  ${titleTag}\n  ${metaTags}`);
  } else {
    warn(`${post.sourceFile} has no <head> tag — couldn't patch in the page title/description.`);
  }
  return out;
}

/* ── 4. Write pages, prune stale ones ── */

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
    fs.writeFileSync(path.join(outDir, "index.html"), patchHead(p.page, p));
  }
}

/* ── 5. Regenerate assets/posts.js ── */

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
  return crypto.createHash("sha1").update(content).digest("hex").slice(0, 10);
}

/* ── 6. Cache-bust the listing pages' <script src="/assets/posts.js"> tag ──
   /assets/* is served with a year-long immutable Cache-Control (see
   netlify.toml), which would otherwise freeze every visitor's browser on
   whatever snapshot of posts.js it first fetched. Appending a hash of the
   file's own content makes each change a new URL, so it's always fetched
   fresh — without touching the (correctly aggressive) caching for images. */

const LISTING_PAGES = [
  path.join(ARCHIVE_ROOT, "index.html"),
  path.join(ARCHIVE_ROOT, "dispatch", "index.html"),
  path.join(ARCHIVE_ROOT, "craftsmans_letter", "index.html")
];

function patchPostsJsVersion(version) {
  for (const file of LISTING_PAGES) {
    if (!fs.existsSync(file)) continue;
    const html = fs.readFileSync(file, "utf8");
    const patched = html.replace(
      /src="\/assets\/posts\.js(?:\?v=[a-f0-9]+)?"/,
      `src="/assets/posts.js?v=${version}"`
    );
    if (patched !== html) fs.writeFileSync(file, patched);
  }
}

/* ── Run ── */

function build() {
  const posts = readPosts();
  checkForDuplicateNumbers(posts);
  writePages(posts);
  const version = writePostsJs(posts);
  patchPostsJsVersion(version);

  const counts = Object.keys(BRANCHES).map((b) => `${posts.filter((p) => p.branch === b).length} ${BRANCHES[b].name}`);
  console.log(`Archive build OK — ${posts.length} post(s): ${counts.join(", ")}.`);
}

build();
