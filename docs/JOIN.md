# Join requests: how the /join form works

Replaces asking "who's in for the next event" in a Discord channel the team
doesn't currently run. The site can't hold a roster spot or verify a
payment — the form's actual job is to turn "I want to play" into one
unambiguous, complete request: who, which event, what division, what
they play, and how they intend to pay once confirmed.

**No payment is taken on the site.** Payment stays a person-to-person
Venmo / Zelle / PayPal arrangement, arranged directly with whoever runs
confirmations, exactly like the pre-order form (see `docs/PREORDERS.md`).

---

## Two modes, same as the pre-order form

- **Handoff (default, no `endpoint` configured)** — the form formats the
  request and hands it back to the requester to email or paste. Works with
  zero setup.
- **Post (Google Form)** — set `provider: google-form` and `endpoint` to a
  Google Form's `formResponse` URL in `src/data/site.yml`'s `join` block,
  with `fieldMap` mapping our field names to that form's `entry.NNN` ids.
  See `docs/PREORDERS.md`'s "reading the entry ids off a prefill link" for
  exactly how to find those ids — the process is identical.

Our field names, for the `fieldMap`: `fullName`, `email`, `phone`, `event`,
`division`, `playerClass`, `paymentMethod`, `notes`.

### Setting up the Google Form

One form, kept current rather than one per event:

1. Create a Google Form with a question per field above. For **Event**, use
   a short-answer question, not a dropdown — the form on the site sends the
   event's title and dates as plain text (e.g. "Series Finals — Nov 14–15,
   2026"), so a Forms dropdown with hardcoded options would just drift out
   of sync with the actual `events` content collection.
2. Every response lands in a linked Google Sheet as a new row — that's the
   list you filter and sort.
3. Add three columns to that Sheet by hand, filled in as requests are
   worked: **Paid** (yes/no), **Confirmed By** (name of whoever approved
   it), **Confirmed Date**. Nothing on the site writes to these — they're
   the actual confirmation record, and it's deliberately a manual step: see
   below for why.

## Payment methods

`src/data/site.yml`'s `join.paymentMethods` list drives the dropdown shown
on the form and the "send payment via" list on the confirmation screen.
Add, remove, or edit handles there — no code change needed.

---

## A real admin interface (researched, not built)

The ask that prompted this doc: "on the backend we can build our own
confirmation system on that same data... there is a name and a date for who
approved payment and when." Shipped for now as the three manual Sheet
columns above — zero code, consistent with this site having no backend or
server anywhere else (no PCI surface, no hosting cost, no auth to
maintain). Tracked here as the follow-up to actually research, not decided
against.

**The semantic point that matters more than the engineering:** whatever
reads the confirmation data needs to trust that "Confirmed By" was actually
typed by that person and "Confirmed Date" wasn't backfilled or fudged.
Manual Sheet columns anyone with edit access can change get that trust from
the honor system, same as `unitsSold` in the pre-order flow. A proper admin
tool doesn't remove that trust requirement — it just gives it a UI and,
if it's built with real auth, an actual access log.

**The engineering, if it's ever worth doing:**

- **Sheets API via a bare service account** is the well-documented, simple
  case — share the Sheet with the service account's email, no OAuth consent
  screen, no interactive refresh-token dance. This is the same approach
  `docs/PREORDERS.md` lands on for reading `unitsSold` automatically, and it
  generalizes here: a small serverless function (Cloudflare Worker /
  Function, since the rest of this stack already touches Cloudflare per
  `public/_redirects` and `public/_headers`) could read rows and expose a
  private "mark confirmed" action.
- **This is the site's first backend if built.** Every other integration
  here (mailing list, pre-orders, and now join requests) deliberately posts
  straight to a third party with no server in between. A confirmation
  admin tool needs *someone to type a name and click a button* — that's
  inherently a write, behind auth, which the current architecture has never
  needed. Whoever picks this up next should treat that as the real decision
  (what auth, what hosting, who maintains it), not the Sheets API call
  itself, which is the easy part.
- **Minimum viable version**, if/when this gets built: a single
  password- or magic-link-gated page listing rows where **Paid** is blank,
  a button that sets `Paid = yes`, `Confirmed By = <the logged-in name>`,
  `Confirmed Date = now`. No editing of any other column — keep the write
  surface as small as the thing it actually needs to do.
