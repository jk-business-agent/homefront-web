# Adding a new issue

1. Copy `dispatch/_example.html` (or `craftsmans_letter/_example.html`) into the same
   folder, name it whatever you want the URL slug to be, e.g.:
   `posts/dispatch/cast-iron-comeback.html` → published at `/archive/dispatch/cast-iron-comeback/`
2. Edit the JSON block at the top of the file:
   - `title`, `deck`, `date` (`YYYY-MM-DD`), `readMins` — required
   - `tags` — optional, up to 3
   - `vol` — optional, defaults to 1. Bump it when you want to start a new volume.
   - Do **not** set `branch`, `no`, or `url` — branch comes from the folder the file
     is in, issue number is assigned automatically (oldest to newest within a
     branch + volume), and the page URL is derived from the filename.
3. Write the post body as plain HTML below the closing `-->`.
4. Run `node build.js` from `root-site/` to generate the page and update the
   archive listings locally, then check it in a browser.
5. Commit and push. Netlify runs the same build automatically before every
   deploy — if a post file is malformed, the deploy fails loudly instead of
   shipping a broken archive.

Files starting with `_` (like `_example.html`) are ignored by the build.
