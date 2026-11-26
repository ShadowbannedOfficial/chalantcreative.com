/* =============================================================================
   BOOTS & BOOZE — SOCIAL PROGRESS REPORT
   Edit this file only. Do not change index.html, report.js, or report.css.

   The page draws itself from the values below.

   NUMBERS
     Bare number, no quotes:   114000
     Not recorded yet:         null      → the page shows Pending
     Do not type a guess, a sample, or 0 unless the real count is zero.

   DATES AND SENTENCES
     In quotes:                "October 30, 2026"
     Not written yet:          ""        → a date range shows Pending

   PERCENT CHANGE
     You do not enter it. Once postHalt.views is a number, the page computes
     the change from postingPeriod.views and redraws the bars.

   TOKENS you can use inside any sentence:
     {{postingViews}}  {{postHaltViews}}  {{changeSentence}}
     {{postingRange}}  {{postHaltRange}}
     {{client}}  {{audience}}  {{author}}  {{studio}}  {{place}}  {{platform}}
     {{handoffFirm}}  {{handoffDate}}  {{followUpDate}}
     A token whose value is null or blank shows Pending. It never invents a number.

   LINES FOR YOU TO REPLACE start with [Brian:
     They show on the page with a gold "For Brian" tag until you rewrite them.

   AFTER SAVING, refresh /bbreport/
   ============================================================================= */

window.BBREPORT_DATA = {

  studio: "Chalant Creative",
  client: "Boots & Booze",
  audience: "Sherry and David",
  author: "Brian Moore",
  authorRole: "Social media manager",
  place: "Dallas",
  platform: "Instagram",

  /* When Nativz took over direction, and when the second view count is expected. */
  handoffFirm: "Nativz",
  handoffDate: "October 30, 2026",
  followUpDate: "November 29, 2026",

  hero: {
    kicker: "For {{audience}}",
    /* Shown while postHalt.views is null. */
    dekPending: "The first window is the thirty days Chalant was posting to the {{client}} {{platform}}. The second is the thirty days when {{handoffFirm}} took over, and it is not in yet.",
    /* Shown once both view totals are numbers. {{changeSentence}} is computed. */
    dekComplete: "The first window is the thirty days Chalant was posting to the {{client}} {{platform}}. The second is the thirty days when {{handoffFirm}} took over."
  },

  /* The thirty days Brian was posting. Views are recorded. Dates are not yet. */
  postingPeriod: {
    label: "While Chalant was posting",
    span: "30 days",
    views: 114000,
    start: "",
    end: ""
  },

  /* The thirty days when Nativz took over. views stays null until the real count is in. */
  postHalt: {
    label: "When Nativz took over",
    span: "30 days",
    views: null,
    start: "",
    end: ""
  },

  /*
    Optional. Leave each one null until you have a real figure.
    avgViewsPerPost is a number or null.
    topPosts stays null until you have real posts, then becomes a list:
      topPosts: [
        { label: "The real post title", views: null }
      ]
    Put that post's real view count where null is.
    A blank label together with null views is skipped. Do not leave a sample row.
  */
  metrics: {
    followers: null,
    avgViewsPerPost: null,
    topPosts: null
  },

  comparison: {
    kicker: "Comparison",
    title: "Drawn to scale.",
    notePending: "Bar length follows the recorded view total. The window that is still open has no bar, so it is not read as zero.",
    noteComplete: "Each bar is that window’s share of whichever total is higher."
  },

  metricsSection: {
    kicker: "Also on the account",
    title: "Other figures.",
    dek: "Followers, average views per post, and top posts. Each stays pending until a real figure is entered. Nothing on this page is estimated."
  },

  /*
    Two claims Nativz has stated. Edit the sentences here.
    The 1 billion figure is their claim, not a Chalant measurement.
    A line that starts with [Brian: shows as a draft note until you replace it.
  */
  claims: {
    kicker: "Two claims",
    title: "On views and revenue.",
    paragraphs: [
      "{{handoffFirm}} has said that views do not equal revenue. That is fair. Views alone are not sales. Reach is what puts the bar in front of new customers in the first place.",
      "{{handoffFirm}} promotes having generated 1 billion views.",
      "Set side by side, the two claims leave a question that is reasonable to ask."
    ],
    questionLabel: "Worth asking",
    question: "If views do not equal revenue, which client was {{handoffFirm}}'s top-performing video for, and how much revenue did it generate?"
  },

  narrative: {
    kicker: "Notes",
    title: "What the two windows are.",
    paragraphs: [
      "This note is for {{audience}}, from {{author}} at {{studio}}. It covers the {{client}} {{platform}} account in {{place}}.",
      "Chalant posted for thirty days. In that window the account received {{postingViews}} views.",
      "[Brian: replace this with the dates of that posting window and anything you want Sherry and David to remember about the month.]",
      "Around {{handoffDate}}, {{handoffFirm}} took over direction of the account. The total for the thirty days when {{handoffFirm}} took over is {{postHaltViews}}.",
      "[Brian: replace this once the second total is in. Write what the comparison means, and what you recommend.]"
    ]
  },

  nextSteps: {
    kicker: "Next",
    title: "What happens next.",
    /* Delete a line by removing it. An empty list shows Pending. */
    items: [
      "[Brian: replace this with the first thing you want Sherry and David to do.]",
      "[Brian: replace this with a second step, or delete this line.]"
    ]
  },

  contact: {
    email: "",
    phone: "",
    note: "[Brian: replace this with the best way to reach you.]"
  },

  /* Footnote. The page picks one from whether the post-halt total is in. */
  sourcePending: "Instagram views. The thirty days when {{handoffFirm}} took over are still open. That total is expected around {{followUpDate}}.",
  sourceComplete: "Instagram views for the two thirty-day windows above."
};
