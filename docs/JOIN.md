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

Our field names, for the `fieldMap`: `firstName`, `lastName`, `playerClass`,
`country`, `email`, `phone`, `facebookProfile`, `event`, `division`,
`position`, `teamSize`, `paymentMethod`, `notes`.

**The site's option lists mirror the Google Form word for word** (Nov 2026).
The site posts those strings as the answers, and Google can drop a choice the
form doesn't list. If you change an option on the form, change it in
`JoinRequestForm.tsx` too (and the `FormOptions` story). Today:

| Form question | Site label | Options |
|---|---|---|
| Current Player Ranking | Current player ranking | Beginner / Unranked, D5, D4, D3, D2, D1 |
| Division | Division | D6, D5, D4, D3, D2, D1, Semi-Pro, Pro |
| Preferred position | Preferred position | checkboxes, at least one, shown as a checklist dropdown: Snake Front, Snake Support, Dorito Front, Dorito Support, Home / Fill, Middle, Versatile / Any |
| Playing Format Requested | Playing format requested | checkboxes, at least one, shown as a checklist dropdown: 3v3, 5v5, X-Ball, 10v10, Mechanical |
| Country | Country | short text on the Google Form; a searchable picker on the site (see below) |
| Facebook Profile Link | Facebook profile link | free text, optional |
| Event | Event | `join.events` in `site.yml` |
| Payment Method | Preferred method | `join.paymentMethods` in `site.yml` |

**Ranking vs. division are two separate PBLeagues concepts:** ranking is what
the requester is, division is what they want to play. A player can play up a
division, so it is asked separately rather than derived. The ranking list has
"Beginner / Unranked" and no D6 or Pro; the division list has all eight.

**Preferred position** and **Playing Format Requested** are checkbox questions,
so a player can tick several. The site shows each as a checklist dropdown
(`src/components/form/ChecklistDropdown.tsx`), posts one `entry.NNN` per ticked
box, which is how Google Forms encodes checkboxes, and won't submit with none
ticked. Keep both as checkbox questions on the form: a dropdown or multiple-choice
question only takes one answer.

**Country** stays a short-text question on the Google Form, and the site
fills it from a searchable list (`src/components/form/CountryCombobox.tsx`,
data in `src/lib/countries.ts`). The site always posts the country's English
name ("United States", "United Kingdom"), so the Sheet column only ever holds
names from that list. It is pre-filled from the browser's language
("en-GB" → United Kingdom); the requester can change it. Leave the Google
Form question as short text: a 250-option dropdown there would add nothing,
and the site's list would have to match it word for word.

**Event** is not drawn from the events collection (the Events page is hidden,
and its entry is a placeholder). It is `join.events` in `site.yml`, which you
keep in step with the form's Event dropdown by hand. "Not sure yet / general
interest" is offered on the site only; it is posted as a blank Event because
the form has no such option.

### Setting up the Google Form

One form, kept current rather than one per event:

1. Create a Google Form with a question per field above.
2. **Event** is a dropdown (multiple choice) you maintain by hand in the
   Google Form directly — add the option when a new event goes up, remove
   it once it's passed. Deliberately manual: it keeps the Sheet's Event
   column to a fixed set of exact strings instead of whatever a requester
   might type, at the cost of someone remembering to keep the list current.
   Word each option the same way the site's own event dropdown shows it
   (title + dates, e.g. "Series Finals — Nov 14–15, 2026") so responses
   read the same whichever side sent them — the site posts that same
   string to this question's `entry.NNN`, and Google's `formResponse`
   endpoint doesn't hard-validate free-form POSTs against the option list,
   so matching wording is a legibility choice, not a strict requirement.
3. **Current Player Ranking** and **Division** are each their own dropdown or
   multiple-choice question, with the options listed above. **Preferred
   position** and **Playing Format Requested** are checkbox questions with the
   options listed above. **Country** and **Facebook Profile Link** are short
   text.
4. Every response lands in a linked Google Sheet as a new row — that's the
   list you filter and sort.
5. Add three columns to that Sheet by hand, filled in as requests are
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
