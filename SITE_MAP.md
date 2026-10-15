# SITE_MAP.md — structure of the When You See Me website

A map of what is in this repository and how the pieces fit, for anyone
opening the project cold. Written 2026-10-04 against the current tree.

---

## 1. What it is

A hand-built static site: **no framework, no build step, no package.json,
no bundler**. Browsers load the `.html` files and three asset files and
that is the whole thing. Content is authored in Sanity and read over a
CDN query API at runtime; every page also carries its copy written
directly into the HTML, so the site renders complete with Sanity turned
off.

Deployed to Vercel (`vercel.json`: `cleanUrls:true`, `trailingSlash:false`).
Repo: `github.com/Godsway-Kwahmi/wysm`. Because `cleanUrls` is on, every
`canonical`, `og:url` and sitemap entry is written in the extensionless form
(`/publications`, not `/publications.html`), and `/index.html` redirects to `/`.
The origin is `https://wysm.vercel.app`; if a custom domain is pointed at the
deployment, `robots.txt`, `sitemap.xml` and the two meta tags on each of the 12
pages are what has to change.

```
assets/css/site.css      the entire design system, one file
assets/js/site.js        shared behaviour: header, stage sizing, galleries
assets/sanity/sanity.js  read-only Sanity client + content-writing helpers
assets/studio/           Sanity Studio schema (one document type only)
assets/img/              photography, grouped by page
assets/img/og-cover.jpg  the hero flattened to 1200x630, for link cards
assets/img/favicon*.png  the wordmark's own W at 32 / 64 / 180 / 512
assets/pdf/publications/  the four downloadable papers
*.html                   12 pages, flat in the project root, plus 404.html
robots.txt  sitemap.xml  for crawlers; 404.html is out of both
```

`404.html` is drawn on the same comp grid as the rest of the site and is
`noindex`, so it is outside the page count and the sitemap. Vercel serves it
for any path the site does not have.

---

## 2. Pages

| File | Drawn height | Sanity document | What it holds |
|---|---|---|---|
| `index.html` | 7400 | `homePage` | Hero, welcome lede, Featured, then Publications / Creative Works / Programs previews, a contact block, newsletter sign-up and supporters |
| `about.html` | 3550 | `aboutPage` | Programme description, activities and outputs, press list |
| `publications.html` | 3020 | `publicationsPage` | Featured publication + the `publication` list |
| `publication-when-you-see-me.html` | 1800 | `publication` slug `when-you-see-me` | Cover, citation, abstract, PDF |
| `publication-nightbloom.html` | 1800 | slug `nightbloom` | as above |
| `publication-introduction-women-gender-change-in-africa.html` | 1800 | slug `introduction-women-gender-and-change-in-africa` | as above |
| `publication-women-and-violence-in-africa.html` | 1800 | slug `women-and-violence-in-africa` | as above |
| `publication-rape-reporting-cote-divoire.html` | 1800 | slug `rape-reporting-in-post-conflict-cote-divoire` | as above |
| `creative-works.html` | 5120 | `creativeWorksPage` + `intervention` | Three strands, book cover, scroll gallery of the theatre production |
| `programs.html` | 4567 | `programsPage` | Three convenings, each with a 9–10 frame photo strip. Each entry is a jump target: `#program-training`, `#program-policy`, `#program-launch` |
| `contact.html` | 1650 | `contactPage` | Enquiry form, contact details |
| `search.html` | 1717 | `publication` + `intervention` | Client-side index of the whole site |
| `404.html` | 1200 | none, and `noindex` | The missing-path page Vercel serves, drawn on the comp grid with a link to every section |

Every page carries exactly one `<h1>`. On the ten pages with a set title it is
that title; on `about.html` it is the drawn "About" label; on `index.html`,
whose wordmark is an image, it is a `.visually-hidden` heading so the page still
has an outline.

Every page repeats the same header and footer markup — there is no
templating, so a nav change is 12 edits. The header carries the
five-item navbar and the footer's stack carries those five plus
`Search`; the footer's email, phone, social links, copyright line and
funder credit are filled from `siteSettings` by `sanity.js` on every
page.

---

## 3. The layout system

The comp is drawn at **1920 design pixels wide** and reproduced 1:1.
Nothing is laid out with normal flow; every element is absolutely placed
from inline custom properties.

```
--px: calc(100vw / 1920)     the unit. 1 design px at a 1920 viewport.
.a                           position:absolute; left:--x; top:--y
.box / .tw                   width:--w (and height:--h for .box)
.t                           font-size:--fs; line-height:--lh (both design px)
```

So `<div class="a box" style="--x:140;--y:700;--w:800;--h:560">` is a
block drawn at 140,700 measuring 800×560. A page's total height is
`--stage` on `.stage`; the footer is one absolutely placed band with its
own `--y`.

**Type scale.** `--ts: .6667` — all type is two thirds of its drawn size,
set from one knob. Leading is *not* scaled by the same factor (smaller
type needs proportionally more of it), so each role carries a `--lead`
correction. Running text is capped by measure, not by the drawn column:
`.body{max-width:62ch}`, `.lede{max-width:52ch}`.

**Z-layers are semantic**, and only these five values are used:
`.deco` 1 (flat blocks) → `.photo` 2 → `.panel` 3 (blocks over photos) →
`.content` 4 (all text) → `.site-header` 50 → `.lightbox` 9999.

**Breakpoints.** At ≥2400px `--px` pins to `1.25px` so the design stops
ballooning. Below **1651px** the absolute grid is abandoned: `.a` goes
`position:static`, the page reflows as a single column in DOM order, and
type steps down to readable sizes with floors (nothing below 11px). The
comp's flat blocks are compositional — they sit behind text at drawn
coordinates — so `.deco`/`.panel` hide and the reflow carries their work:
`.rule` stays a real hairline, and `.panel + .content` keeps its block
ground as background plus padding. Mobile is a real second layout, not a
squeeze, so DOM order matters as much as the drawn coordinates.

Inside the reflow there are two tiers. **≤900px** is the phone: a 24px
gutter on every section, the header sticks as a slim bar that sheds its
wordmark once scrolled, and anchor offsets are measured at runtime
(`--hdr` in `site.js`). **901–1650px** is the wide band:
`--gutter: max(40px, calc((100vw - 1160px)/2))` is the shared inset for
sections, header and footer alike; type scales back up toward the comp's
sizes via `clamp()`; list rows and the footer recover their multi-column
tracks; the header returns to the comp's single line. In both tiers
exactly one thing bleeds — the legal strip, via its own negative margin —
so every text block on every page lands on the same two edges at any
width. The sticky header's own close padding is kept small (26px) so the
bar never grows tall enough to cover what it scrolls over.

**`fitStage()`** (`site.js`) measures every `.a`, `.thumbs` and `.rows`
in the stage and grows it when content runs past the drawn height, pushing
the footer band down with it. It holds the drawn position exactly whenever
content fits above it, so a page that fits stays a 1:1 reproduction.
Exposed as `window.fitStage` for pages that add rows after load.

---

## 4. The CMS contract

`assets/sanity/sanity.js` builds a GET to
`https://6071id0c.apicdn.sanity.io/v2026-03-01/data/query/production?query=…`
and exposes `window.SANITY`:

`query` `text` `href` `src` `image` `hide` `paragraphs` `columns` `links`
`meta` `mediaRows` `supporters` `publicationPage` `settings`

Rules the whole site follows:

- **Content ships in the HTML.** The writers are no-ops when a value comes
  back empty, so a failed fetch, an empty field or a deleted document
  leaves the designed page standing. `SANITY.settings()` runs on every
  page automatically.
- **All body copy goes in via `textContent`.** Never `innerHTML`.
- **`safeUrl()` blocks `javascript:`, `data:` and `vbscript:`** on every
  URL the CMS supplies.
- **`mediaRows()` takes a `{_key: path}` registry from the page.** Press
  pictures cannot come through the CMS — `mediaCoverage` has only `outlet`
  and `url`, and an article's og:image is not readable cross-origin from a
  browser — so `about.html` names the local copy for each entry. An entry
  with no key there still gets its row, without the tile.
- Each page issues one GROQ query for its own document id. A failed fetch
  logs `Sanity fetch unavailable — showing built-in preview content.`
  Note the CDN rejects cross-origin requests from `127.0.0.1`, so a local
  preview always shows the fallback path — that is expected, not a bug.

**Schema in this repo is incomplete.** Only
`assets/studio/schemaTypes/documents/intervention.ts` exists here. The
`publication` type and the `siteSettings`, `homePage`, `aboutPage`,
`publicationsPage`, `creativeWorksPage` and `contactPage` singletons are
defined in a Studio outside this tree, so field names can only be read
off the queries.

---

## 5. Assets

```
assets/img/hero.webp  publication.webp  intervention.webp  convening.webp
assets/img/Homepage/                3   slide stills, none of them wired (see §7)
assets/img/About/                  10   + Images-for-activities-and-output-section/ (2)
                                       + Media/ (2 press og:images) + Media/web/ (2)
assets/img/Publications/            10  covers (+ 4 duplicate PDFs, see §7)
assets/img/Creative-Works/
    cover-for-short-story.jpg  community-theatre-hero-image.jpg
    community-theatre-production/       11  camera originals: 1 lead + 10 frames
        community-theatre-production/web/  11  the set the page draws on
    community-theatre-photo-gallery/    16  raw export of the same shoot
assets/img/Programs/
    Training-workshops-photo-gallery/   23 originals + web/ (10)
    Policy-workshop-photo-gallery/      18 originals + web/ (10)
    Short-story-launch-photo-gallery/   15 originals + web/  (9)
assets/pdf/publications/            4   the linked copies
```

The photo strips draw on the `web/` copies: 1600px long edge, JPEG q82.
Programs carries 29 of them (7.8 MB) and the creative-works production strip
now carries its own 11 (3.1 MB, made from the same 11 frames it used to draw
at full size). The camera originals run to 5760px and several megabytes each —
~85 MB unwired — which a strip 300 design pixels tall has no use for.
Originals are untouched, so the derivatives can be regenerated by any
pipeline.

Publication covers are the exception: they are drawn at full resolution
because they are the artwork, not photography — the list tile is the whole
cover scaled to its width (see §6), and Sanity resizes them for the browser at
query time (`?w=400&fit=max&auto=format`).

---

## 6. Behaviour worth knowing before editing

- **Galleries are declarative.** A strip is `.scroll-gallery`; its dot rail
  is `.gallery-pagination[data-gallery="<strip id>"]`. `site.js` builds the
  dots, wires scroll-spy, makes frames focusable, and drives the single
  `#lightbox` per page by event delegation. Add a strip and a rail and the
  script finds them; no inline handlers.
- **The publications list shows whole covers.** `#pub-list .tile` keeps the
  comp's thumbnail width — 154 / 132 / 84 across the three tiers — and lets the
  height follow the artwork, because a book cover cropped into a 154×139 box has
  stopped being a cover. The rule is scoped to that one id, so the tile on
  `creative-works.html` and the `.thumbs` strips stay fixed boxes. Every cover
  declares its own ratio: in the markup for the built-in rows, and read off the
  Sanity asset URL (`-1748x2480.jpg`) for the CMS-built ones, so `fitStage`
  measures the list's true height before a single image has arrived.
- **Programs are deep-linkable.** The three entries carry `#program-training`,
  `#program-policy` and `#program-launch` on `.anchor` spans — the same device
  `index.html` uses — because a `<section>` is zero height on the comp, and
  `search.html` links to them.
- **`creative-works.html` deliberately does not render its CMS list.** The
  works list, detail block and gallery are hardcoded so the designed scroll
  gallery and book cover stay exactly as drawn; the query still runs and
  the reason is commented in place at line ~210.
- **The contact form has no endpoint.** It composes a `mailto:` — see the
  note in `site.js` inviting you to wire it up.
- **The homepage newsletter form is inert** — it validates and reports
  status but posts nowhere.
- **The homepage hero carries a pointer-tracked glow.** `#hero-glow` is a
  soft radial gradient sitting behind the wordmark (the letterforms in
  `hero.webp` are transparent, so the light reads through them); `site.js`
  re-centres it on `mousemove`, clamped to the hero's box. Reduced-motion
  visitors get the static centred light; phones get none. In the reflow
  tiers `.stage` uses `overflow-x: clip` — clip, not `hidden`, which would
  turn the stage into a scroll container and strand the sticky header.

---

## 7. Known gaps

Not bugs in the current build; things the site does not have.

- The footer's four social links are `href="#"` on all 12 pages, and
  `siteSettings.socialLinks` comes back empty from Sanity, so nothing overwrites
  them in production either. The project's own account URLs have to be typed
  into the CMS or written into the markup — there is nothing in this tree to
  point them at.
- `sanity.js` writes `contact-email`, `contact-phone` and `contact-social`, but
  no page carries those ids: the Contact page reaches its address only through
  the shared footer. Giving it its own line is a layout decision, not a wiring
  fix.
- `assets/img/Homepage/` (three slide stills) is referenced by nothing: the
  homepage hero is `hero.webp` and its three feature cards use the root-level
  `.webp` crops.
- `assets/img/Creative-Works/community-theatre-photo-gallery/` is largely a raw
  duplicate of the wired `community-theatre-production/`: 10 of its 16 files are
  byte-identical. The other 6 (five camera frames plus a `lead-image.jpg`
  matching nothing in the tree) are unused, and were left out because the wired
  strip is a deliberate 10-frame edit.
- Four PDFs are duplicated byte-for-byte in `assets/img/Publications/` and
  `assets/pdf/publications/`; only the latter is linked. `nightbloom-cover.webp`
  and `nightbloom.webp` are the same file under two names.
- Four `.HEIC` files in `Short-story-launch-photo-gallery/` are unusable in
  browsers and unreferenced.
- The camera originals behind every strip are kept on purpose, so the `web/`
  copies can be regenerated — but nothing in the repo records the pipeline that
  made them. Both sets are 1600px on the long edge at JPEG q82, bicubic.
- `buildWorksList` and `selectWork` are referenced only in comments that no
  longer exist as code (`creative-works.html:224-225`).
- Header and footer markup is copy-pasted across 12 files with no
  templating step, so it can drift; it currently has not. The `canonical`,
  `og:url` and `theme-color` tags are pasted the same way, and are the other
  thing to change in all twelve places if the origin moves.
