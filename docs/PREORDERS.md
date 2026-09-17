# Pre-orders: how the drop form works

Replaces collecting orders as comments on a Facebook post.

The thing the comment thread actually got wrong wasn't data entry — it was
**certainty**. A buyer couldn't tell whether their order was counted, what they
owed, or whether the drop hit its goal. So the form is built around removing
that, not around looking like a checkout:

- a running total as you add jerseys,
- a confirmation screen stating the amount and the payment handles,
- and one blunt sentence: **your spot isn't held until payment arrives.**

**No payment is taken on the site**, and **no third-party tool is required.**
Payment stays a person-to-person Venmo / Zelle / cash arrangement, exactly as
it works today. The form's job is to produce one unambiguous, priced order
request per buyer — everything after that is still as informal as the team
wants it to be.

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

## How submission works

The form does the valuable part regardless of tooling: it validates the order,
prices it, and formats it. What happens next has three tiers, and **the
default requires no accounts, no signups and no commitment to any tool.**

### Default — hand the order back to the buyer (nothing to set up)

With `preorderForm.endpoint` empty, which is how it ships:

1. The buyer fills in the form and hits **Place pre-order**.
2. They get a **review screen** with the finished order as selectable text,
   the total, and the payment handles.
3. They send it themselves — **Email this order** (a prefilled `mailto:` to the
   team address) or **Copy to clipboard** to paste into Discord, Messenger, or
   wherever the team already talks.

Nothing leaves the browser. No third-party service, no monthly cap, no vendor
to migrate off later, and no data sitting in someone's SaaS account.

It is still a large improvement on a comment thread, because the thing the
comment thread got wrong was never the sending — it was that orders arrived
incomplete, unpriced and ambiguous. Here every order arrives with sizes, names,
numbers and a total, in the same format every time.

**The tradeoff, stated plainly:** the buyer has to complete the send, so some
will drop off between the review screen and their mail client. If that starts
costing real orders, that's the signal to move to a tier below — not before.

### Connected now — the Breast Cancer Awareness Google Form

`preorderForm` in site settings is wired to the live form
(`1FAIpQLSf…FRjWOxFLw`). The nine `entry.NNN` ids were read off the form's own
published definition, not guessed, and **every question on it is optional**, so
a blank value can't cause a silent rejection.

#### One response per jersey

The form asks for one size, one name and one number, so it is shaped
**one jersey per response**. A two-jersey order therefore submits **two
responses**, with the contact details and address repeated.

That's the right shape rather than a workaround: the Sheet ends up as one row
per garment, which is the list you hand a printer.

#### ⚠️ Two questions the form is missing

| Missing | Impact |
|---|---|
| **Jersey version (V1 / V2)** | **This one matters.** The drop sells both, and the form has no question for it — so responses can't tell you which cut to print. The site collects it and currently has nowhere to send it |
| Payment method | Minor, since payment is arranged personally anyway. Collected on-site and shown on the receipt |

To capture version, add a **multiple choice** question to the form titled
e.g. "Jersey Version" with options exactly `V1` and `V2`, then take a fresh
pre-filled link, find its new `entry.NNN`, and add to site settings:

```yaml
    variant: entry.NNNNNNNNN
```

The code already sends `variant` per jersey — it's only unmapped, so adding
the id is the entire change. Same pattern for `paymentMethod` and `notes`.

#### ⚠️ Multiple-choice values must match EXACTLY

Google silently discards a multiple-choice answer it doesn't recognise. The
form offers `Small / Medium / Large / X-Large / 2XL / 3XL`, so the drop's
`sizes` list uses those exact strings — **not** `S / M / L`. Same for
`deliveryOptions` against `Ship to my address / Pick up at the team field`.

Note the form has **no youth sizes**; add the questions first if the team
wants to offer them.

#### Testing it

Nothing was submitted while wiring this up — the outgoing requests were
intercepted and inspected rather than sent, so there are no test rows in your
responses. To verify for real: place one order on the site, check the Sheet,
delete the row. Do that again after **any** edit to the form, because
recreating a question changes its `entry.NNN`.

### Recommended next step — a Google Form as the backend (free, unlimited)

Worth being precise, because there are two very different ways to "use a
Google Form" and only one of them looks good.

**Embedding the form in an iframe cannot be made to match this site.** A
cross-origin iframe can't be restyled — no CSS reaches inside it. Google's own
theming is a header colour, a font choice and a background, so an embedded
form will always look like a Google Form sitting in a hole in the page. If the
goal is "make it look nice", this isn't the route.

**Posting our own form to a Google Form's endpoint is a different story**, and
it's a good fit here:

- **Free and effectively unlimited** — no submission cap to watch.
- **Responses land in a Google Sheet** automatically, which is a genuinely good
  place to run a 40-jersey drop from: sort, filter, tick people off as payment
  arrives, export.
- **You already have a Google account**, so there's no new tool to commit to.
- **The visible form stays 100% ours** — the on-brand form you already have.

Set it up:

1. Build a Google Form with one question per field you want as a **column**.
   Short answer for `fullName`, `email`, `phone`, `paymentMethod`,
   `orderTotal`, `jerseyCount`; **paragraph** for `address` and `summary`.
2. Click **⋮ → Get pre-filled link**, put junk in every field, and copy the
   generated URL. It contains `entry.123456789=junk` pairs — those numbers are
   the field ids.
3. In site settings set `provider: google-form`, set `endpoint` to the form's
   `.../formResponse` URL (take the `/viewform` URL and swap the last
   segment), and fill in `googleFormFields`:

   ```yaml
   preorderForm:
     provider: google-form
     endpoint: https://docs.google.com/forms/d/e/FORM_ID/formResponse
     googleFormFields:
       fullName: entry.111111111
       email: entry.222222222
       phone: entry.333333333
       address: entry.444444444
       paymentMethod: entry.555555555
       orderTotal: entry.666666666
       jerseyCount: entry.777777777
       summary: entry.888888888
   ```

Only map what you want columns for. `summary` is the important one — it holds
the full per-jersey breakdown (version, size, name, number) as formatted text,
so you don't need a column per jersey.

**Three honest caveats:**

1. **We can't confirm it worked.** Google serves no CORS headers on
   `formResponse`, so the request is necessarily fire-and-forget and the
   response is opaque to us. That's why the confirmation screen still shows the
   order text with a copy button — if a submission silently fails, the buyer
   hasn't lost anything. **Send a test order and check the Sheet after any
   change to the form.**
2. **Field ids break if you recreate a question.** Renaming a question is safe;
   deleting and re-adding it changes the `entry.NNN`. If orders stop appearing,
   re-read the prefill link first.
3. **Google's own spam protection doesn't apply**, because we're bypassing
   their UI. Bot protection is our honeypot and timing check below.

### Later — a form relay (one signup, ~5 minutes)

When the team wants orders to arrive automatically, sign up for any service
that accepts a plain `POST` and emails you the result (Web3Forms, Formspree,
Basin and similar). Put its URL in `preorderForm.endpoint` and the form starts
submitting directly. **The review screen stays as the fallback** if the request
fails, so a relay outage can't lose an order.

Still fully on-brand — a real form on our page, not an embedded iframe.
Watch the free-tier monthly submission cap before a big drop.

### Eventually — a Cloudflare Pages Function (the proper version)

Once the site is on Cloudflare Pages (see [DEPLOY.md](DEPLOY.md) — it's also
what activates the security headers), add a function at
`functions/api/preorder.ts` that:

1. reads the submitted `FormData`,
2. **verifies the Turnstile token server-side** against
   `https://challenges.cloudflare.com/turnstile/v0/siteverify`,
3. writes the order somewhere durable (D1, or an append to a spreadsheet),
4. emails the captain a formatted copy.

Then set `endpoint` to `/api/preorder` and `turnstileSiteKey` to your site key.
Real bot protection, no submission cap worth worrying about, no third party.

**None of this is required to start taking orders.** Tier 1 works today.

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
