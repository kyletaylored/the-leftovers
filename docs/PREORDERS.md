# Pre-orders: how the drop form works

Replaces collecting orders as comments on a Facebook post.

The thing the comment thread actually got wrong wasn't data entry — it was
**certainty**. A buyer couldn't tell whether their order was counted, what they
owed, or whether the drop hit its goal. So the form is built around removing
that, not around looking like a checkout:

- a running total as you add jerseys,
- a confirmation screen stating the amount and the payment handles,
- and one blunt sentence: **your spot isn't held until payment arrives.**

**No payment is taken on the site.** Payment stays a person-to-person Venmo /
Zelle / cash arrangement, exactly as it works today. The form's job is to
produce one unambiguous order request per buyer.

---

## Running a drop (no code)

In Pages CMS → **Pre-order drops** → Add entry.

| Field | Notes |
|---|---|
| **Status** | `draft` while you're writing it — draft drops aren't built into the site at all. Flip to `open` to go live |
| **Orders close** | The deadline. Drives the countdown, and **auto-closes the form** — you don't have to remember to shut it off |
| **Price / price note** | e.g. `125` and "shipped anywhere in the US" |
| **Variants** | One per cut or colourway (V1, V2…), each with a mockup image and required alt text |
| **Sizes** | The size list the form offers |
| **Customisation** | Whether to collect a name and number for the back |
| **Cause** | Optional. Charity name, donation per jersey, goal in jerseys, and **units sold so far** |
| **Payment methods** | The labels and handles shown on the confirmation screen |

### About the progress bar

`unitsSold` is **typed in by hand.** Nothing on the site counts orders, and a
progress bar that invented its own number would be worse than no progress bar
— people donate against that figure. Update it as orders come in; the bar and
the "£X raised" line both derive from it.

If nobody is going to keep it current, leave the cause section off entirely
rather than show a stale bar.

---

## Wiring up the form (one-time, needs a developer)

The form posts to whatever endpoint `preorderForm.endpoint` in site settings
gives it. **With no endpoint set it renders a "not connected" notice** rather
than silently swallowing orders.

Two supported options.

### Option A — a free form relay (works today, on GitHub Pages)

Sign up for a relay that accepts a plain `POST` and emails you the submission
(Web3Forms, Formspree, Basin and similar all do). Put its endpoint in site
settings and you're done.

- **Works right now**, no hosting change.
- **100% our design** — this is a real form on our page, not an iframe, so it
  matches the site exactly.
- Data arrives by email, and most relays can also push to a Google Sheet.

**The catch:** free tiers cap submissions per month, and a 40-jersey drop plus
mistakes and duplicates can get close. Check the cap before a big drop.
Bot protection is the honeypot and timing check below plus whatever the relay
does server-side — a Turnstile key alone won't help here, because nothing
verifies the token.

### Option B — Cloudflare Pages Function (better, needs the Cloudflare move)

Once the site is on Cloudflare Pages (see [DEPLOY.md](DEPLOY.md) — it's also
what activates the security headers), add a function at
`functions/api/preorder.ts` that:

1. reads the submitted `FormData`,
2. **verifies the Turnstile token server-side** against
   `https://challenges.cloudflare.com/turnstile/v0/siteverify`,
3. writes the order somewhere durable — D1, or an append to a Google Sheet,
4. emails the captain a formatted copy.

Then set `preorderForm.endpoint` to `/api/preorder` and
`preorderForm.turnstileSiteKey` to your Turnstile site key.

- **Real bot protection**, because the token is actually checked.
- **No submission cap** worth worrying about (100k requests/day free).
- No third-party form service in the loop.

**This is the recommended end state.** Option A exists so orders can stop
going through Facebook comments this week rather than after a hosting
migration.

---

## Bot protection as shipped

Two server-free measures, both in `PreorderForm.tsx`:

- **Honeypot** — a `company` field positioned off-screen (`left: -9999px`
  rather than `display: none`, which some bots skip). Any submission that
  fills it is dropped silently.
- **Minimum fill time** — submissions faster than three seconds after mount
  are rejected with a friendly message.

These stop naive bots. They do not stop a determined human, and they are not a
substitute for Option B's server-side verification. A Turnstile widget renders
whenever a site key is configured, but **understand that it is decorative
until an endpoint verifies the token** — that's why the site key and the
endpoint are separate settings.

---

## What a submission looks like

Jersey rows are flattened into readable lines, because the person reading this
is the captain in an email client, not a database:

```
campaign:      Pink Jersey Drop
jerseyCount:   2
orderTotal:    $250
jerseys:       #1 · V1 · size L · name "ENGLES" · number 22
               #2 · V2 · size M · name "TAYLOR" · number 7
fullName:      …
email:         …
phone:         …
address:       …
paymentMethod: Venmo
notes:         …
acknowledged:  yes
```

---

## If a drop needs real checkout later

PRD §8.2 compared the options. Bonfire remains the right answer for evergreen
merch, and it's still wired up via `shop.bonfireUrl`. But Bonfire **can't
collect a name and number per jersey**, which is the whole reason this form
exists — so drops that need customisation belong here, and plain items belong
there. Snipcart only becomes worth its monthly fee if the team wants real
in-brand card payment badly enough.
