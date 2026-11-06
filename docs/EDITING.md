# Editing the site

For whoever's running the site. **You don't need to install anything, and you
can't break the site by typing in the wrong box** — if something's badly wrong
the build fails and the live site just stays as it was.

Everything below happens at **[app.pagescms.org](https://app.pagescms.org)**.
Sign in with GitHub, pick the `the-leftovers` repo, and you'll see a sidebar
with Team Members, Events, Shop items, Sponsors, Page copy, Landing pages, FAQs
and Site settings.

**Every save goes live in about a minute.** There's no publish button and no
separate deploy step — hitting Save is publishing.

---

## Team members

**Team Members** lists the people who run The Leftovers, not players, who rotate
by event. They aren't shown on the site yet; they'll appear on the planned About
page. **Add an entry** with a **Name** and **Role**. The **Bio** is free text.

**Contact email** and everything under **Socials** (Instagram, Facebook, TikTok,
YouTube, Website) are optional, and only the ones you fill in will show. Anything
here is public, so use an email address that's fine to share.

**Photo alt text** is required. Describe what's in the photo; until there's a
photo, the person's name is fine. **Sort order** sets who comes first.

---

## Adding an event

**Events → Add entry.** Name and start date are required. Add the location as
soon as you know it, with the full address: Google needs a venue and city before
it can show the event in search, so an event without one is left out.

**Include the year in the name**, like *Lone Star Open 2026*, so you can tell the
same event apart across seasons in this list.

Players never sign up through the league link. *League event page* is for details
and results; the card's **Request a spot** button goes to the join form, and
the event captain registers each squad. Requests close the day after the
*Late through* date in **Fee deadlines**.

**Fees:** copy the rows from the league's fee table into **League fees (per
team)**, only for the divisions we enter. Enter whole dollars, and add the three
dates in **Fee deadlines**. The Events page shows the next event that has fees.

**Squads:** add every Leftovers squad from the league's team list, with its
division. The site counts them for you.

**Requests stay open until the event ends.** The **Request a spot** button doesn't
depend on the league's fee deadlines. To stop taking players sooner, tick **Closed
to new players** and the button is replaced with a note saying so.

**You do not need to mark an event as past.** Leave *Status override* empty and
the site works it out from the date — an event stays "upcoming" through the end
of its last day and moves itself to "Played" after that. The override field is
only there for the odd case where reality disagrees with the calendar.

After the event, come back to the same entry and fill in each squad's **Final
place** and **Teams in the division** from the league's Places page. The card
works out the best finish from those. Optionally add:

- **Finish** — replaces the worked-out best finish, e.g. `2nd of 12`
- **Result summary** — a sentence or two

To change the numbered steps on the Events and Join pages, go to **Site settings
→ How event sign-up works**.

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

## Homepage photo slider

Every photo in **Photo galleries** shows on the [Gallery](/gallery) page, one gallery
per event, so to add one there, add it to a gallery with its alt text. Visitors can
click any photo to see it full size and zoom in. To remove a photo from the site,
delete it from its gallery.

**Photo galleries → Game day.** Every photo in this gallery shows in the
homepage slider, in list order.

- **Alt text** is required. Describe what's visible and name nobody.
- **Headline** is the big line on that photo, like *"Off the break"*. Keep it
  to two or three words: on a phone it fills the width.
- **Kicker** is the small gold line above it, like *"NXL · 2026"*. Leave it
  empty and the slide uses the gallery title instead.
- A photo with no headline shows only its kicker, so leaving both empty
  gives you the gallery title ("Game day") on that slide.

---

## Site settings

**Site settings** holds the things that aren't content: nav labels, social
links, the contact email, the Discord invite, the mailing-list endpoint and the
Bonfire store URL. Changing a social URL here changes it in the footer, the
community page and the contact page at once.

Two fields control how the site shows up in Google:

- **Homepage search title** is the blue headline Google shows for the
  homepage. Keep it under about 60 characters, brand first.
- **Default meta description** is the grey text under it, used by any page
  that doesn't have its own. Keep it under about 155 characters, or Google
  cuts it off with "…".

**Search engines & AI crawlers** holds the Google Search Console and Bing
verification codes (usually not needed: see `docs/SEO.md`) and whether AI
bots like ChatGPT and Claude may read the site. "Allow all" gives the most
visibility; Google and Bing search are allowed whatever you pick.

The image shown when someone shares a link (on Facebook, iMessage, Discord)
is a designed card, not a setting. If it needs changing, ask whoever
maintains the code.

Two fields unlock features that are currently showing link-out cards instead:

- **Discord server ID** — *the team doesn't run a Discord right now, so leave
  the Discord invite and this field blank, and all Discord buttons and
  sections stay hidden.* If a server starts: add the invite link, then paste
  the numeric ID here, and the Community page renders Discord's live widget
  (member count and an inline invite) instead of a button. The server has to
  be public, and the widget has to be enabled in Discord's own Server
  Settings → Widget.
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

**Page copy** holds the body text and SEO fields for Contact, Shop and
Community.

The **SEO** section is worth filling in properly:

- **Search-result title** — up to about 60 characters. This is the blue link
  text on Google.
- **Meta description** — up to about 155 characters. This is the grey text
  under it. Write it as a pitch, not a summary of the page structure.

Leave them blank and the site falls back to the page title and the site
description, which is fine but generic.

**Hide from search engines** keeps a page out of Google: it's left out of the
sitemap and the AI summary (`/llms.txt`) too. The page still works for anyone
with the link. Shop and Community are ticked right now; untick
one (and add it back to the nav in Site settings) to bring it back. Pre-order
drops have the same box.

---

## Building a landing page

**Landing pages** is the page builder. You stack ready-made sections, and the
site handles the design, so a page always looks like the rest of the site.

1. Open **Landing pages** and click **Add an entry**. The **Page title** sets
   the address (a page called "Summer Camp" lives at `/summer-camp`), so pick
   it carefully. It can't reuse an existing address like `/join`: the site
   won't update until you rename it.
2. Leave **Status** on **Draft**.
3. Choose a **Hero**. It always comes first and holds the page's main heading.
   Leave **Ornate** to the homepage, and use **Logo**, **Photo background** or
   **Text only** elsewhere.
4. Under **Sections**, add sections and fill them in. Drag the handle on a
   section to move it.
5. Save, wait about two minutes, then open `/preview/your-page-title` to see it.
   There's no live preview in the editor, so this is how you check your work.
   Search engines can't see drafts, but anyone with the link can.
6. When it looks right, set **Status** to **Published** and save. The page moves
   to `/your-page-title`. Nothing links to it until you add it to the nav in
   Site settings or link to it from another page.

| Section | Use it for |
|---|---|
| **Photo band** | A big action photo with bold copy. The strongest section |
| **Big statement** | A few large lines of text, centred, with optional decorative rules |
| **Quote** | Someone's exact words with their name, plus an optional line for where or when and a link to the original. Get their OK before quoting them by name |
| **Divider** | A decorative rule between two sections on the same background |
| **Photo gallery** | A slider of one of your Photo galleries |
| **Photo and text** | A calm boxed section, with numbered steps if you need them |
| **Announcement panel** | A boxed notice, with league logos if you want them |
| **Three columns** | Three short points side by side |
| **Feature row** | One photo beside a short pitch |
| **Text** | Plain paragraphs. Leave a blank line between them |
| **Call to action strip** | A full-width band asking people to do one thing |
| **Newsletter signup** | The mailing-list form |
| **FAQs** | The questions from the FAQs section |

Two rules keep pages looking right:

- **Don't put two full-width photo sections in a row** (Photo band, Photo
  gallery). Put something calmer between them, like Photo and text.
- **Every photo needs alt text** describing what's in it.

---

## What to do if something looks wrong

1. **Check you saved.** Then give it 60 seconds and hard-refresh.
2. **Still wrong after a couple of minutes?** The build probably failed, which
   means something didn't match what the site expects. The live site is
   untouched — it's still serving the last good version, so nothing is broken
   for visitors. Tell whoever maintains the code and mention what you edited.
