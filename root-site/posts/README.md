# Adding a new issue

Each post file is your fully integrated archive-template HTML (the trimmed,
long-term-relevant version — not the email send) with one small metadata
block pasted at the very top. The build publishes everything after that
block **verbatim** as the page; it doesn't rewrite or wrap your HTML.

1. Save your integrated archive-template file into `posts/dispatch/<year>/` or
   `posts/craftsmans_letter/<year>/` (year = the post's own date — keeps the
   folder browsable as the archive grows), named `YYYY-MM-DD_slug.html` — the
   date prefix is just for your own browsing/sorting in the folder and must
   match the `date` in the metadata block (the build checks this and
   fails if they disagree); everything after the date becomes the URL
   slug. e.g.:
   `posts/craftsmans_letter/2026/2026-07-29_on-the-origin-of-homefront-markets.html` → published at
   `/archive/craftsmans_letter/on-the-origin-of-homefront-markets/`
   Use zero-padded month/day (`07`, not `7`) so filenames sort chronologically
   in a plain alphabetical folder listing. (The build scans subfolders at any
   depth, so this is just a convention, not a requirement.)
2. Paste this at the very top of the file, above your `<!DOCTYPE html>`, and fill it in:
   ```html
   <!--
   {
     "title": "On the Origin of Homefront Markets",
     "deck": "Why we do all of this — and how to join us.",
     "date": "2026-07-29",
     "readMins": 8,
     "vol": 1,
     "no": 1,
     "tags": ["Origin", "Mission"]
   }
   -->
   ```
   - `title`, `deck`, `date` (`YYYY-MM-DD`), `readMins`, `vol`, `no` — all required.
   - `vol`/`no` must match whatever issue number is already written into the
     page itself (e.g. "Letter No. 1") — the build does **not** compute this
     for you, so the summary card and the page always agree.
   - `tags` — optional, up to 3.
   - Do not set `branch` — it's derived from which folder the file is in.
3. Use **absolute** paths for any images/assets in the page (e.g.
   `/assets/craftsmans_letter/2026/photo.jpg`), not relative ones
   (`../../assets/...`). The published page lives two folders deeper than
   the site root (`/archive/<branch>/<slug>/`), so relative paths resolve
   from the wrong place and 404. The build will warn you if it spots one.
4. The build publishes your file exactly as written — it does not remove or
   judge any content, links, or sections. The one thing worth checking
   yourself: unresolved Beehiiv merge tags (`{{unsubscribe_url}}`,
   `{{rp_num_referrals}}`, etc.) render as literal text on a webpage since
   there's no Beehiiv send happening to fill them in — strip those if your
   archive template still has any live (not commented out).
5. Run `node build.js` from `root-site/` to generate the page and update the
   archive listings locally, then check it in a browser.
6. Commit and push. Netlify runs the same build automatically before every
   deploy — if a post file is malformed (bad JSON, missing field, duplicate
   `vol`/`no`, filename date that disagrees with the metadata date), the
   deploy fails loudly instead of shipping a broken archive. It'll also warn
   (without failing) about relative asset paths or files that look like they
   were saved with the wrong text encoding (a classic Windows gotcha: saving
   or generating a file without explicitly forcing UTF-8 can silently
   corrupt em dashes, smart quotes, and bullets into garbled characters).

Files starting with `_` (like `_example.html`) are ignored by the build.
