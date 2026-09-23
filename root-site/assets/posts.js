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
    branch: "dispatch",
    vol: 1, no: 12,
    title: "Cheaper Box, Same Benefit",
    deck: "This is the part when you should put the overpriced Benadryl back.",
    date: "2026-09-22",
    readMins: 3,
    url: "/archive/dispatch/perrigo/",
    tags: ["Manufacturing", "Healthcare"]
  },
  {
    branch: "craftsmans_letter",
    vol: 1, no: 11,
    title: "The Patent Franklin Never Filed",
    deck: "The least he could do was pay it forward.",
    date: "2026-09-17",
    readMins: 4,
    url: "/archive/craftsmans_letter/franklin-patent-free/",
    tags: ["History", "American Founding"]
  },
  {
    branch: "dispatch",
    vol: 1, no: 10,
    title: "Ashes to Paper",
    deck: "Thirty of the plant's thirty-six buildings were gone, along with every converting line that turned raw paper rolls into something you could actually buy.",
    date: "2026-09-15",
    readMins: 4,
    url: "/archive/dispatch/marcal/",
    tags: ["Manufacturing", "Home Goods"]
  },
  {
    branch: "dispatch",
    vol: 1, no: 9,
    title: "Laid Off, Hired Back",
    deck: "Most apparel companies this size don't own a foot of factory floor.",
    date: "2026-09-08",
    readMins: 4,
    url: "/archive/dispatch/buck-mason/",
    tags: ["Apparel", "Manufacturing"]
  },
  {
    branch: "craftsmans_letter",
    vol: 1, no: 8,
    title: "Property: Founding an American Philosophy",
    deck: "What can we learn from beliefs about property ownership in 1787?",
    date: "2026-09-03",
    readMins: 3,
    url: "/archive/craftsmans_letter/right-to-property/",
    tags: ["History", "American Founding"]
  },
  {
    branch: "dispatch",
    vol: 1, no: 7,
    title: "Koia: The Independent Protein Drink",
    deck: "Sometimes, business on your own terms is worth the hard road",
    date: "2026-09-01",
    readMins: 4,
    url: "/archive/dispatch/koia/",
    tags: ["Food & Beverage", "Manufacturing"]
  },
  {
    branch: "craftsmans_letter",
    vol: 1, no: 6,
    title: "The Patent Clause and our Right to Create",
    deck: "This is the story of August 18th, 1787.",
    date: "2026-08-27",
    readMins: 3,
    url: "/archive/craftsmans_letter/the-patent-clause/",
    tags: ["History", "American Founding"]
  },
  {
    branch: "dispatch",
    vol: 1, no: 5,
    title: "Stripling's: Three Generations, One Recipe",
    deck: "Doing meat the right way - one whole hot hog at a time.",
    date: "2026-08-25",
    readMins: 4,
    url: "/archive/dispatch/striplings/",
    tags: ["Food & Beverage", "American Made"]
  },
  {
    branch: "craftsmans_letter",
    vol: 1, no: 4,
    title: "250 Years of Excellence in Commerce",
    deck: "Twenty-five pivotal moments: one for nearly every decade since 1776 — that built the American marketplace we inherited.",
    date: "2026-08-20",
    readMins: 10,
    url: "/archive/craftsmans_letter/250-years-of-excellence/",
    tags: ["History", "American Commerce"]
  },
  {
    branch: "dispatch",
    vol: 1, no: 3,
    title: "The Maker Questionnaire",
    deck: "From the first phone call to the questions we actually ask, here's how a business earns an HFM Certification.",
    date: "2026-08-18",
    readMins: 7,
    url: "/archive/dispatch/the-maker-questionnaire/",
    tags: ["Certification", "American Made"]
  },
  {
    branch: "craftsmans_letter",
    vol: 1, no: 2,
    title: "On the Origin of Homefront Markets",
    deck: "Why we do all of this — and how to join us.",
    date: "2026-08-13",
    readMins: 8,
    url: "/archive/craftsmans_letter/on-the-origin-of-homefront-markets/",
    tags: ["Origin", "Mission"]
  },
  {
    branch: "dispatch",
    vol: 1, no: 1,
    title: "Evaluating American Made: It's Complicated",
    deck: "What counts as American made? Who decides? What is the HFM Standard?",
    date: "2026-08-11",
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
