/* ═══════════════════════════════════════════════════════════
   HOMEFRONT MARKETS — PUBLICATION RECORD
   Single source of truth for the archive pages.

   TO ADD A NEW ISSUE: copy an entry, paste it at the TOP of
   the array, fill in the fields, save, push. All three archive
   pages (/archive, /archive/dispatch, /archive/craftsmans_letter)
   update automatically.

   FIELDS
   ──────
   branch   : "dispatch" | "craftsmans_letter"
   vol      : volume number (int)
   no       : issue number within the volume (int)
   title    : the issue headline
   deck     : 1–2 sentence subhead shown under the title
   date     : "YYYY-MM-DD" (publish date)
   readMins : estimated read time (int, minutes)
   url      : link to the published issue on beehiiv
              (post URL, e.g. https://newsletter.homefrontmarkets.com/p/...
              or your beehiiv post permalink)
   tags     : optional, up to 3 short topic tags

   NOTE: The entries below are SAMPLE PLACEHOLDERS demonstrating
   the format. Replace with your real published issues.
   ═══════════════════════════════════════════════════════════ */

const HFM_POSTS = [
  {
    branch: "dispatch",
    vol: 1, no: 6,
    title: "The Cast-Iron Comeback: Why Lodge Can't Keep Up With Demand",
    deck: "A 130-year-old Tennessee foundry is outselling imports for the first time in decades — and the waiting lists tell the story.",
    date: "2026-07-01",
    readMins: 6,
    url: "REPLACE_WITH_BEEHIIV_POST_URL",
    tags: ["Manufacturing", "Kitchen & Home"]
  },
  {
    branch: "craftsmans_letter",
    vol: 1, no: 5,
    title: "On the Weight of a Good Hammer",
    deck: "What a fourth-generation Ohio toolmaker taught me about the difference between price and cost.",
    date: "2026-06-26",
    readMins: 8,
    url: "REPLACE_WITH_BEEHIIV_POST_URL",
    tags: ["Tools", "Heritage"]
  },
  {
    branch: "dispatch",
    vol: 1, no: 4,
    title: "Denim's Long Road Home: Three Mills Restarting American Selvedge",
    deck: "Cone Mills went dark in 2017. Here's who picked up the looms — and what their order books look like now.",
    date: "2026-06-24",
    readMins: 5,
    url: "REPLACE_WITH_BEEHIIV_POST_URL",
    tags: ["Apparel", "Textiles"]
  },
  {
    branch: "dispatch",
    vol: 1, no: 3,
    title: "By the Numbers: The Reshoring Report, Q2 2026",
    deck: "Announced factory investment, job postings in domestic manufacturing, and the sectors quietly leading the return.",
    date: "2026-06-17",
    readMins: 7,
    url: "REPLACE_WITH_BEEHIIV_POST_URL",
    tags: ["Data", "Reshoring"]
  },
  {
    branch: "craftsmans_letter",
    vol: 1, no: 2,
    title: "A Letter From the Last Tannery on the River",
    deck: "Horween has outlasted every neighbor it ever had. A walk through the smell, the steam, and the stubbornness of Chicago leather.",
    date: "2026-06-12",
    readMins: 9,
    url: "REPLACE_WITH_BEEHIIV_POST_URL",
    tags: ["Leather", "Heritage"]
  },
  {
    branch: "dispatch",
    vol: 1, no: 1,
    title: "Welcome to the Homefront: What We're Building and Why",
    deck: "The mission, the format, and the promise — plus the first reader-found brand worth your attention.",
    date: "2026-06-10",
    readMins: 4,
    url: "REPLACE_WITH_BEEHIIV_POST_URL",
    tags: ["Announcements"]
  }
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
