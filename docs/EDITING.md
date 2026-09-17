# Editing the site

For whoever's running the roster. **You don't need to install anything, and you
can't break the site by typing in the wrong box** — if something's badly wrong
the build fails and the live site just stays as it was.

Everything below happens at **[app.pagescms.org](https://app.pagescms.org)**.
Sign in with GitHub, pick the `the-leftovers` repo, and you'll see a sidebar
with Roster, Events, Results, Shop items, Sponsors, Page copy, FAQs and Site
settings.

**Every save goes live in about a minute.** There's no publish button and no
separate deploy step — hitting Save is publishing.

---

## Adding a player

**Roster → Add entry.**

- **Name**, **Position** and **Status** are the only required fields.
- **Jersey number** gets the gold ribbed-numeral treatment. If there's no photo
  yet, the number becomes the whole card, which looks deliberate — so it's
  worth filling in even before you have a picture.
- **Photo alt text** is required whenever you add a photo. Write what's in the
  picture: *"Dani Okafor in the back corner, marker raised"*. Blind visitors
  hear it and Google Images reads it, so it's worth ten seconds.
- **Show on the homepage** puts them in the homepage roster row. The homepage
  shows the first three, by sort order.
- **Bio** is free text and appears under "Player Notes" on the roster page.

### Open slots

An open slot is just a Roster entry with **Status: Open slot**. It renders as
the dashed "OPEN SLOT — JOIN THE ROSTER" card with the mascot, and the roster
page counts them automatically. To close one, delete the entry (or flip it to
Active and put the new player's details in).

---

## Adding an event

**Events → Add entry.** Name, start date and location are required.

**You do not need to mark an event as past.** Leave *Status override* empty and
the site works it out from the date — an event stays "upcoming" through the end
of its last day and moves itself to "Played" after that. The override field is
only there for the odd case where reality disagrees with the calendar.

After the event, come back to the same entry and fill in:

- **Finish** — e.g. `2nd of 12`
- **Result summary** — a sentence or two

That's what shows on the event card once it's in the past.

---

## Entering results after a tournament

This is the one genuinely fiddly job, and there's no way around it: PBLeague
exports results to the event organiser, not as a feed anyone can plug into. So
after each event someone types the sheet in.

**Results → Add entry.**

1. Pick the **Event** from the dropdown.
2. Fill in **Final placement**, **Teams in the bracket**, and the
   **Win-loss record** (like `4-1`).
3. Add one **Player stat line** per person who played, with raw counts:
   games played, eliminations, times eliminated, flag pulls, flag hangs,
   penalties.

**Only enter counts.** Don't try to work out win rates, elimination ratios or
per-game averages — the site calculates all of those, on both the stats page
and the homepage numbers. If you enter a rate by hand it will eventually
disagree with the raw numbers, and then nobody knows which one is lying.

If you type a number wrong, fix that one field and save. Everything downstream
recalculates.

---

## Shop items

**Shop items → Add entry.** These are teaser cards only — the actual checkout
happens on Bonfire. The **Buy link** is the Bonfire campaign or product URL.

- **Status: Pre-order** puts it in "Open Pre-Orders" at the top of the shop
  page and, if you set **Pre-order window closes**, drives a countdown.
- **Status: Available** puts it under "Always Available".
- **Status: Sold out** greys it out and removes the buy button, so a closed
  batch stays visible without taking orders it can't fill.

When a batch closes, flip the item to **Sold out** rather than deleting it.

---

## Site settings

**Site settings** holds the things that aren't content: nav labels, social
links, the contact email, the Discord invite, the mailing-list endpoint and the
Bonfire store URL. Changing a social URL here changes it in the footer, the
community page and the contact page at once.

Two fields unlock features that are currently showing link-out cards instead:

- **Discord server ID** — paste the numeric ID and the Community page renders
  Discord's live widget (member count and an inline invite) instead of a
  button. Your server has to be public, and the widget has to be enabled in
  Discord's own Server Settings → Widget.
- **Instagram feed widget** — Instagram has no usable live-feed API, so a photo
  grid needs a third-party service (Elfsight, Juicer, SnapWidget all have free
  tiers). Paste its script URL and element class here. **Tell whoever maintains
  the code**, because the site has a strict security policy that has to
  allowlist the new script or the browser will block it.

The **Facebook group has no equivalent** — Facebook doesn't allow embedding
group posts at all, by anyone. The group button is the most that's possible, so
please don't plan a page section around a group feed.

---

## Page copy

**Page copy** holds the body text and SEO fields for About, Contact, Shop and
Community.

The **SEO** section is worth filling in properly:

- **Search-result title** — up to about 60 characters. This is the blue link
  text on Google.
- **Meta description** — up to about 155 characters. This is the grey text
  under it. Write it as a pitch, not a summary of the page structure.

Leave them blank and the site falls back to the page title and the site
description, which is fine but generic.

---

## What to do if something looks wrong

1. **Check you saved.** Then give it 60 seconds and hard-refresh.
2. **Still wrong after a couple of minutes?** The build probably failed, which
   means something didn't match what the site expects. The live site is
   untouched — it's still serving the last good version, so nothing is broken
   for visitors. Tell whoever maintains the code and mention what you edited.
3. **Numbers look off on the stats page?** They're calculated from the Results
   entries, so the mistake is almost always a typo in a stat line. Find the
   event and check its counts.
