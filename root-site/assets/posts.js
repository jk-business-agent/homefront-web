/* ═══════════════════════════════════════════════════════════
   HOMEFRONT MARKETS — PUBLICATION RECORD
   GENERATED FILE — do not edit by hand, your changes will be
   overwritten on the next build.

   To add or change an issue: edit the .html files in
   posts/dispatch/ or posts/craftsmans_letter/, then run
   "node build.js" (Netlify also runs it automatically on
   every deploy). See posts/README.md.
   ═══════════════════════════════════════════════════════════ */

const HFM_POSTS = [
  {
    branch: "craftsmans_letter",
    vol: 1, no: 1,
    title: "On the Origin of Homefront Markets",
    deck: "Why we do all of this — and how to join us.",
    date: "2026-07-29",
    readMins: 8,
    url: "/archive/craftsmans_letter/on-the-origin-of-homefront-markets/",
    tags: ["Origin", "Mission"]
  },
  {
    branch: "craftsmans_letter",
    vol: 1, no: 3,
    title: "250 Years of Excellence in Commerce",
    deck: "Twenty-five pivotal moments: one for nearly every decade since 1776 — that built the American marketplace we inherited.",
    date: "2026-07-29",
    readMins: 10,
    url: "/archive/craftsmans_letter/250-years-of-excellence/",
    tags: ["History", "American Commerce"]
  },
  {
    branch: "dispatch",
    vol: 1, no: 2,
    title: "Evaluating American Made: It's Complicated",
    deck: "What counts as American made? Who decides? What is the HFM Standard?",
    date: "2026-07-29",
    readMins: 6,
    url: "/archive/dispatch/how-we-evaluate/",
    tags: ["Evaluation", "Manufacturing", "Craftsmanship"]
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
