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
| `index.html` | 7170 | `homePage` | Hero, welcome lede, Featured, then Publications / Creative Works / Programs previews, a contact block, newsletter sign-up and supporters |
| `about.html` | 2986 | `aboutPage` | Programme description, activities and outputs, press list |
| `publications.html` | 3020 | `publicationsPage` | Featured publication + the `publication` list |
| `publication-when-you-see-me.html` | 1702 | `publication` slug `when-you-see-me` | Cover, her abstract, citation, PDF |
| `publication-nightbloom.html` | 1863 | slug `nightbloom` | as above, with the publisher link in place of the PDF |
| `publication-introduction-women-gender-change-in-africa.html` | 1778 | slug `introduction-women-gender-and-change-in-africa` | as above |
| `publication-women-and-violence-in-africa.html` | 2390 | slug `women-and-violence-in-africa` | as above; the tallest of the five because her abstract is 2,463 characters |
| `publication-rape-reporting-cote-divoire.html` | 1804 | slug `rape-reporting-in-post-conflict-cote-divoire` | as above |
| `creative-works.html` | 4900 | `creativeWorksPage` + `intervention` | Two strands (Theatre, Short Story) and a comic placeholder, book cover, 16-frame gallery of the theatre production |
| `programs.html` | 4567 | `programsPage` | Three convenings, each with a gallery of every frame from it — 21, 16, 9. Each entry is a jump target: `#program-training`, `#program-policy`, `#program-launch` |
| `contact.html` | 1837 | `contactPage` | Enquiry form, contact details |
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
`.body{max-width:62ch}`, `.lede{max-width:52ch}`. `.lede-cols` is the one
place that cap is deliberately lifted: the homepage welcome block is placed
at the full 1640 between the two rules that bracket it and sets
`column-count:2` above 1650, so the lede reads as a two-column spread at the
comp and collapses back to one capped column in the reflow.

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
- **`mediaRows()` takes a `{_key: {image, headline, credit}}` registry from
  the page.** Press pictures, headlines and credits cannot come through the
  CMS — `mediaCoverage` has only `outlet` and `url`, an og:image is not
  readable cross-origin from a browser, and none of the three is ours to
  re-key — so `about.html` names the local copy and quotes the article for
  each entry, and the writer joins `headline · credit` into the row's meta.
  An entry with no image there still gets its row, without the tile.
- Each page issues one GROQ query for its own document id. A failed fetch
  logs `Sanity fetch unavailable — showing built-in preview content.`
  Note the CDN rejects cross-origin requests from `127.0.0.1`, so a local
  preview always shows the fallback path — that is expected, not a bug.
  To see the binding path locally, `wysm-type/cdnbind.py` intercepts the page's
  CDN requests over CDP, replays them server-side and answers them with a
  permissive CORS header; that is how the publication pages were checked against
  the live dataset rather than only against their own HTML.
- **A publication page's abstract block takes `abstract`, never `summary`.**
  It used to be written from `p.summary`, the one-line description the row on
  `publications.html` carries, so the client's own abstract could not reach the
  page even once. The field is empty on all five documents today and
  `paragraphs()` returns on an empty value, so her text — written into the HTML —
  stands until someone fills the field in Studio. The projection asks for
  `abstract` explicitly; a field a query does not name never arrives.

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
assets/img/Homepage/                 3  the drop from the client (Header Image,
     └ web/                         2     Community theatre, Training Workshop)
                                        + the two copies the page actually draws
assets/img/About/                      Header.jpg + the activities trio
     Images-for-activities-and-output-section/   2 originals
       └ web/                                   2  Creative-Works, Programs
     Media/                                 2  press og:images
       └ web/                               2
assets/img/Publications/                   10  covers (+ 4 duplicate PDFs, see §7)
assets/img/Creative-Works/
    cover-for-short-story.jpg  community-theatre-hero-image.jpg
    community-theatre-production/        11  the edited 11-frame set
      └ web/                             11  01 and 02 are drawn; 03–11 orphaned (see §7)
    community-theatre-photo-gallery/     16  the full export of the same shoot
      └ web/                             16  all of them: the gallery on the page
assets/img/Programs/
    Training-workshops-photo-gallery/    22 + web/ 22  21 in the strip + its lead
    Policy-workshop-photo-gallery/       17 + web/ 17  16 in the strip + its lead
    Short-story-launch-photo-gallery/    14 + web/ 10   9 in the strip + its lead
assets/pdf/publications/            4   the linked copies
```

Every gallery, tile and section photograph draws on a `web/` copy and on
nothing else: 1600px on the long edge, JPEG q82, sRGB, no embedded profile —
73 drawn copies (17 MB) out of 82 on disk (20 MB). Programs carries 49 of
the drawn set, the creative-works gallery 16, and the homepage's six preview
slots plus the About activities trio take the rest. The camera
originals run to 5760px and several megabytes each, which a strip 300 design
pixels tall has no use for; they are kept untouched so the derivatives can be
regenerated by any pipeline. `mkweb.py` in the temp tree is the one-off that
made this set.

The one exception left is `About/Header.jpg`, still a 5760px original and
still the largest thing any page asks for.

Publication covers are the exception: they are drawn at full resolution
because they are the artwork, not photography — the list tile is the whole
cover scaled to its width (see §6), and Sanity resizes them for the browser at
query time (`?w=400&fit=max&auto=format`).

---

## 6. Behaviour worth knowing before editing

- **Galleries are declarative, and the whole set is in.** A strip is
  `.gallery` (an ordered row of `<img>`s, every frame from that event) inside a
  placed `.gallery-wrap`, which carries the two `.gallery-arrow` buttons and the
  right-edge fade. Its dot rail is
  `.gallery-pagination[data-gallery="<strip id>"]`. `site.js` builds the dots,
  wires scroll-spy, makes frames focusable, pages the arrows by 80% of one view,
  and drives the single `#lightbox` per page by event delegation. Add a strip
  and a rail and the script finds them; no inline handlers.
  The arrows report what the row can actually do: the wrapper carries
  `data-at-start` / `data-at-end`, and the CSS fades out the arrow — and, at the
  far end, the edge gradient — that has nowhere left to go. A strip that fits
  without scrolling therefore shows no arrows at all. Because the frames are
  lazy, the state is re-taken on every image `load` (capture phase: `load` does
  not bubble), when the row enters the viewport, on resize and on window load;
  measuring once would decide "nothing to scroll" from a row of empty boxes and
  hide the only control that reveals the rest.
  Below 901 the arrows go and the strip keeps its scrollbar, because an arrow
  competing with a swipe is worse than no arrow; 901–1650 puts them back.
- **The comp gallery is an accordion, and it says so.** Twenty-two frames in a
  1640 px strip are 74 px apiece, which is why the accordion went; it came back on
  2026-10-31 because the frames are not there to be read at rest, they are there to
  be opened. Each frame flexes to fill the strip and grows to 320 design px on
  hover or focus, the others giving up the width, and a `.gallery-hint` line under
  the strip tells visitors a frame opens full size. The open width is not a
  constant in CSS: `openRatio()` in `site.js` works out, per strip, how many times
  wider than its neighbours 320 px has to be for the set to fill the row exactly
  (5.926, 4.211 and 2.092 on the three Programs strips) and writes it to
  `--gal-open`, because a strip of nine frames and a strip of twenty-one cannot
  share one flex-grow. Below 1650 the accordion goes and the strip is a
  scroll-snap row of natural-aspect frames again — an opened panel does not work
  under a swipe.
- **The publications list shows whole covers.** `#pub-list .tile` keeps the
  comp's thumbnail width — 154 / 132 / 84 across the three tiers — and lets the
  height follow the artwork, because a book cover cropped into a 154×139 box has
  stopped being a cover. The rule is scoped to that one id, so the tile on
  `creative-works.html` and the `.thumbs` strips stay fixed boxes. Every cover
  declares its own ratio: in the markup for the built-in rows, and read off the
  Sanity asset URL (`-1748x2480.jpg`) for the CMS-built ones, so `fitStage`
  measures the list's true height before a single image has arrived.
- **The publications list is newest first, and her written order breaks a tie.**
  The brief says "arrange the publications according to date" and then lists the
  five. Two of them are 2019, and the dates and the list disagree: the Oxford
  Research Encyclopedia entry is 29 July 2019 and the African Affairs introduction
  is 21 November, but she puts the encyclopedia entry first. The list now sorts by
  year, and within a year by the order she wrote (`HER_ORDER` in
  `publications.html`), so a work she has not listed still sorts by date and a new
  2027 pamphlet still comes first. `search.html`'s index carries the same order.
- **A `.thumbs` strip is an `<img>` in the link, not a `background-image` on an
  empty span.** The anchor keeps the fixed box and the mat and carries the
  `aria-label` as the link's name; the image inside it fills the box with
  `object-fit: cover` and carries the `alt`. A cover painted in CSS has no image
  element for alt text to attach to, so anything that asked the strip what its
  pictures were — a screen reader's image list, an accessibility audit, a reader
  view — was handed the file path instead.
- **Photograph slots are keyed to the client's drop, not to whatever was
  already in the tree.** Every image on the pages comes from
  `FROM-CLIENT/Website Content 2 - 28 August/`, and the HTML comments name the
  file it came from — `SECTION 2` on `about.html`, the `PROGRAM ENTRIES` block
  on `programs.html`, the gallery blocks on `creative-works.html`. The audit
  that matched them is a hash comparison (dHash on a 9x8 grid, HEIC read
  through pillow-heif): a slot is right when the drawn file's hash is within
  8 of the sent file's, and the same test on the previous build put several
  slots 94–129 away. When she sends more, that is the test to re-run.
- **A text block's rhythm is a few numbers, repeated.** Measured at the comp in
  design px, block edge to block edge:
  **42** from a page title's foot to its summary (`#page-summary`, the five pages
  that have one);
  **35** from a title to the meta line under it (the three program entries, the
  featured publication, a publication page's kind-and-year);
  **29** from that meta line to the running text under it;
  **55** from a `--fs:36` heading to running text with no meta between (the three
  strand cards and the work detail on `creative-works.html`);
  **12** from a list row's title to its meta (`.row .meta`, so it is one CSS rule
  rather than a drawn number).
  The rule behind the numbers is that a small line hugs the line it belongs to:
  where a block was pinned at a drawn `--y` chosen for one line count, a longer or
  shorter title moved the gap and left the air where it was — which is what the
  publication detail pages did until 2026-10-31, when the kind-and-year line came
  to 35 under its title and the whole block below it, the footer and the drawn
  stage with it, came up by the difference.
- **A panel is drawn to what it carries, and there are two kinds.** On
  `programs.html` a panel and the photograph beside it share both horizontal
  edges: the photograph takes the panel's top and the pair's foot is the
  photograph's foot, which pulled the training and launch panels up 20 to 600
  tall. The policy panel keeps its foot at 2415 because its copy ends at 2388 and
  closing it to the photograph's 2380 would have put the last line outside the box
  it is written on — there the photograph grows down instead. On
  `publications.html` the featured panel is drawn to its copy with 40 px of panel
  outside the ink on all four sides (140 → 901 across, 660 → 1187 down) and the
  cover keeps its own edges; a cover is artwork, and the 2026-10-31 marks settled
  that the panel belongs to the words, not to the picture. Either way the distance
  from a block's foot to the next head is a consequence of the artwork, not a
  number to tune; only the gaps above are.
- **A publication page's citation and download link hug its abstract.** They used
  to sit at one fixed `--y` whatever the text did, which was safe only while every
  abstract was the one-line summary the CMS holds. They now carry the client's own
  abstracts — 228, 638, 1165, 553 and 520 px of column — and the citation was
  landing on top of the text on four of the five pages. Citation = abstract bottom
  + 55, link = citation + 80, footer = whichever of the cover and the link reaches
  lower, + 143, stage = footer + 417, measured at the comp and written into the
  markup page by page. The text column draws 681 px inside the 1060 px slot because
  `.body` caps the measure at 62 characters; that is what keeps a 2,400-character
  abstract readable.
- **Programs are deep-linkable.** The three entries carry `#program-training`,
  `#program-policy` and `#program-launch` on `.anchor` spans — the same device
  `index.html` uses — because a `<section>` is zero height on the comp, and
  `search.html` links to them.
- **`creative-works.html` deliberately does not render its CMS list.** The
  works list, detail block and gallery are hardcoded so the designed scroll
  gallery and book cover stay exactly as drawn; the query still runs, and the
  reason is commented in place at line ~343. Two fields the page stopped
  reading are recorded at ~309 — see §7.
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
- `assets/img/Homepage/` and `assets/img/About/Images-for-activities-and-output-section/`
  hold the client's own files beside the `web/` copies the pages draw on.
  `Header-Image.jpg` is the one to understand before touching: it is the five
  performers on the stage at the launch, 5760 px, and `hero.webp` is that same
  photograph with the wordmark knocked out of it so the image reads through the
  letterforms — the "header image (with the lattice effect)" the brief asks the
  homepage to open on. The hero is not a substitute for her file, it is her file
  treated. What the page does not use is the 5760 px original.
- `assets/img/Creative-Works/community-theatre-production/web/03–11` are now
  orphaned. The gallery on `creative-works.html` used to draw that edited
  10-frame set; it draws all 16 frames of `community-theatre-photo-gallery/web/`
  now, and only `01-lead-image.jpg` (the homepage and section leads) and
  `02-gallery.jpg` (the works-list tile) are still referenced. The nine are
  near-duplicates of frames in the 16 and can go once she confirms the set.
- `assets/img/About/creative-works.jpg` and `About/programs.jpg` are referenced
  by nothing. They were the two wrong photographs in the activities trio before
  the sent files replaced them.
- **The CMS holds fields the markup no longer reads.** `creativeWorksPage.introImage`
  and `creativeWorksPage.strands[]` are still in the document but were dropped
  from the page's query on 2026-10-31: the strands are now Theatre / Short Story /
  Illustrated comic (a placeholder) written in the HTML, while `strands[]` is
  still keyed theatre / comics / community, and `introImage`'s asset is the
  "Four women holding awards" frame rather than the production lead. Only
  `summary, seo, introduction, galleryHeading` are read now. `homePage.welcome`
  is no longer one of them to worry about: the CMS sentence and the page now say
  the same thing, the brief's own wording ("...when they prioritise and see
  victims of violence"), which the HTML had drifted off. There is no write token
  in this repo and none has ever existed, so `strands[]` and `introImage` can only
  be corrected by hand in Studio — and until they are, they are inert, not
  wrong-on-screen.
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
