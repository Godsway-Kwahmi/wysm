#!/usr/bin/env python3
"""
Build the When You See Me content guide: a designed PDF, from one HTML source.

    python docs/build-guide.py
    python docs/build-guide.py --studio-url https://whatever.sanity.studio --contact you@example.com
    python docs/build-guide.py --selftest

The source is docs/content-guide.html, laid out on thirteen A4 sheets in
docs/guide.css using the website's own colours, faces and hairlines. This script
does three things that pressing "Print to PDF" in a browser does not.

  1. It fills in what the guide knows. --studio-url and --contact are written
     into the placeholders. A value that has not been supplied yet becomes a
     labelled dashed band rather than a blank line, so the PDF is honest about
     what is missing and still readable end to end.

  2. It puts the screenshots in. Drop a file at docs/studio-screens/<name>.png
     (or .jpg / .webp) for each SHOT marker in the source and it is typeset as a
     figure with its caption. Absent ones become dashed frames that say what was
     meant to go there.

  3. It proves the result. Every sheet is height-fixed with overflow:hidden,
     which is a frame, not a safety net: copy taller than its sheet is cut off
     without warning and simply does not appear in the PDF. So after printing,
     the build reads the PDF back and checks that every word in the HTML is in
     it, that there are exactly as many pages as sheets, that nothing is drawn
     outside the page, and how much of each sheet the copy used.

     --selftest then proves that check works, by printing a deliberate overflow
     and requiring the checker to fail on it. Without that, a green build only
     means the checker ran.

Exit code 0 means the PDF is on disk and every check passed.
"""

import argparse
import datetime as dt
import html as htmlmod
import os
import re
import shutil
import subprocess
import sys
import tempfile
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent                     # the site itself, whose fonts are reused
SRC = HERE / "content-guide.html"
SHOTS_DIR = HERE / "studio-screens"
DEFAULT_PDF = HERE / "When-You-See-Me-Content-Guide.pdf"
SHOT_EXT = (".png", ".jpg", ".jpeg", ".webp")

CHROME = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
]

PT_PER_MM = 72 / 25.4
PAGE_W_PT = 210 * PT_PER_MM          # A4, and @page margin is 0
PAGE_H_PT = 297 * PT_PER_MM
FOOT_BAND_MM = 20                    # guide.css --pad-foot: the signature band

KEEP_BUILD = False                   # set from --keep-build-file in main()


def die(msg):
    print("FAIL  " + msg)
    sys.exit(1)


def find_chrome(override=None):
    for cand in (override, os.environ.get("GUIDE_CHROME")):
        if cand and Path(cand).exists():
            return str(cand)
    for c in CHROME:
        if Path(c).exists():
            return c
    die("No Chrome or Edge found. Pass --chrome /path/to/chrome.exe")


# ------------------------------------------------------ the faces, made static

# The site's three faces are variable files, and Chrome cannot put a variable
# font into a PDF as real outlines: it draws every glyph as a bitmap (a Type3
# font). That survives a 600 dpi print, but it goes soft the moment you zoom,
# and it near-triples the file. So the print build instantiates the weights this
# document actually uses out of the same OFL files, hands Chrome plain static
# TTFs, and the PDF comes back with vector outlines and the real family names in
# it. check() insists on that: a Type3 font in the output is a failure.
#
# Needs:  pip install fonttools brotli
FACES = [
    ("Bricolage Grotesque", "bricolage-grotesque-latin.woff2", (400, 500, 600, 700)),
    ("Literata", "literata-latin.woff2", (400, 450, 500, 600, 700)),
    ("Bodoni Moda", "bodoni-moda-latin.woff2", (400, 600, 700)),
]
FONT_DIR = HERE / ".print-fonts"


def static_faces():
    """Write the static instances, and return the @font-face CSS that names them."""
    try:
        from fontTools.ttLib import TTFont
        from fontTools.varLib import instancer
    except ImportError:
        die("the print build needs the font toolchain:  pip install fonttools brotli")
    shutil.rmtree(FONT_DIR, ignore_errors=True)
    # On Windows a folder Dropbox is busy with does not always go, and an
    # existing folder is not a problem here: the names are the same every run
    # and every one of them is overwritten below.
    FONT_DIR.mkdir(exist_ok=True)
    for stale in FONT_DIR.glob("*.ttf"):
        try:
            stale.unlink()
        except OSError:
            pass                      # every one of these is overwritten below
    rules = []
    for family, filename, weights in FACES:
        src = ROOT / "assets" / "fonts" / filename
        if not src.exists():
            die("missing " + str(src))
        for w in weights:
            f = TTFont(str(src))
            if "fvar" in f:
                # pin every axis, not just weight, or the file stays variable
                axes = {a.axisTag: (w if a.axisTag == "wght" else a.defaultValue)
                        for a in f["fvar"].axes}
                f = instancer.instantiateVariableFont(f, axes, inplace=False)
                if "fvar" in f:
                    die("%s at %d still has an fvar: the instancer left an axis live"
                        % (family, w))
            out = FONT_DIR / ("%s-%d.ttf" % (filename.rsplit(".", 1)[0], w))
            f.save(str(out))
            rules.append("@font-face{font-family:'%s';font-style:normal;font-weight:%d;"
                         "src:url('%s') format('truetype');}"
                         % (family, w, out.relative_to(HERE).as_posix()))
    return "\n".join(rules)


# ------------------------------------------------------------- fill the source

def find_shot(name):
    """The screenshot file for this marker, if the project has sent one."""
    if not SHOTS_DIR.is_dir():
        return None
    for ext in SHOT_EXT:
        for cand in (SHOTS_DIR / (name + ext), SHOTS_DIR / (name + ext.upper())):
            if cand.exists():
                return cand.relative_to(HERE).as_posix()
    return None


def put_shots(text, missing):
    """<!--SHOT:name:caption--> becomes a figure, or the same figure with an
    empty plate. The two states are the same height on purpose: a sheet that
    measures well today still measures well the day the picture arrives."""

    def repl(m):
        name, caption = m.group(1).strip(), m.group(2).strip()
        esc = htmlmod.escape(caption, quote=True)
        src = find_shot(name)
        if src:
            plate = '<div class="plate"><img src="%s" alt="%s"></div>' % (src, esc)
        else:
            missing.append(name)
            # What the plate says is for the person reading the guide, not for
            # whoever has to send the picture: the filename and the folder are
            # printed in the build's own report below.
            plate = ('<div class="plate empty"><b>Screenshot to come</b>'
                    'The picture for this step is not in this copy yet &mdash; '
                    'the words underneath are the instruction.</div>')
        return ('<figure class="shot">%s<figcaption>%s</figcaption></figure>'
                % (plate, caption))

    return re.sub(r"<!--\s*SHOT:([^:\s]+)\s*:\s*(.*?)-->", repl, text, flags=re.S)


def put_value(text, token, value, wrapper_re, band):
    """Replace {{token}} inside its own element. With no value, that element is
    replaced by the dashed band instead, so a gap never reads as a mistake."""
    if value:
        escaped = htmlmod.escape(value, quote=False)
        if token == "STUDIO_URL" and value.lower().startswith(("http://", "https://")):
            escaped = '<a href="%s">%s</a>' % (htmlmod.escape(value, quote=True), escaped)
        if ("{{" + token + "}}") not in text:
            die("{{%s}} is not in the source" % token)
        return text.replace("{{" + token + "}}", escaped)
    out, n = re.subn(wrapper_re, lambda m: band, text)
    if n == 0:
        die("{{%s}} is not wrapped the way this script expects: %s" % (token, wrapper_re))
    return out


STUDIO_BAND = ('<div class="fill-missing"><b>The Studio address is not in this copy yet</b>'
               'Ask whoever set the website up for the address of the Studio that belongs '
               'to this project, then rebuild the guide with it. Everything in here is done '
               'inside that address.</div>')
CONTACT_BAND = ('<div class="fill-missing"><b>Ask your website developer</b>'
                'Their email address is put here when the guide is built. Until then, '
                'whoever gave you access to the Studio is the right person to ask.</div>')


def put_writein(text, values):
    """The two write-in rules on the tear-out card.

    They are empty rules when the guide is built without the answers, so the
    card is still useful on the day it is printed: whoever gets it writes the
    Studio address and the contact on it by hand. Built with --studio-url and
    --contact, the same two rules print filled."""
    for token, value in values.items():
        holder = '<span class="fill-line" data-token="%s"></span>' % token
        if holder not in text:
            die("the card has no write-in line for " + token)
        text = text.replace(holder,
                            '<span class="filled">%s</span>'
                            % htmlmod.escape(value or "", quote=False))
    return text


def build_html(studio_url, contact, edition, overflow_into=None, face_css=None):
    src = SRC.read_text(encoding="utf-8")
    missing = []
    src = put_shots(src, missing)
    src = put_value(src, "STUDIO_URL", studio_url,
                    r'<p class="studio-url">\{\{STUDIO_URL\}\}</p>', STUDIO_BAND)
    src = put_value(src, "CONTACT", contact,
                    r'<p class="mono">\{\{CONTACT\}\}</p>', CONTACT_BAND)
    src = put_writein(src, {"STUDIO_URL": studio_url, "CONTACT": contact})
    src = src.replace("{{DATE}}", edition)
    if face_css:
        # The variable faces go, and the static ones replace them. This is not
        # tidiness: measured on this document, declaring both makes Chrome take
        # the static file for some runs and the variable one for others, and
        # every run it takes from the variable file comes out of the PDF as a
        # Type3 bitmap. With the link removed the whole guide prints as Type0
        # outlines. Printed here so the next person to wonder knows why.
        stripped = re.sub(r'<link rel="stylesheet" href="\.\./assets/css/fonts\.css">\n?',
                          "", src)
        if stripped == src:
            die("the print build expected to remove the variable-face link from the "
                "guide and could not find it")
        src = stripped.replace("</head>", "<style>\n%s\n</style>\n</head>" % face_css)

    # --selftest only: make one sheet deliberately too tall so the checker has
    # something real to catch.
    if overflow_into is not None:
        marks = list(re.finditer(r'<section class="sheet[^"]*">', src))
        if overflow_into >= len(marks):
            die("overflow_into %d, only %d sheets" % (overflow_into, len(marks)))
        at = marks[overflow_into].end()
        src = src[:at] + "<p>" + ("This line exists only to make the sheet too tall. " * 40) \
            + "</p>" + src[at:]

    leftover = sorted(set(re.findall(r"\{\{[A-Z_]+\}\}", src)))
    if leftover:
        die("Unfilled placeholders in the source: " + ", ".join(leftover))
    return src, missing


# ----------------------------------------------------------------- print it

def chrome_cmd(chrome, page, profile, out_pdf, headless_flag):
    return [
        chrome, headless_flag,
        "--disable-gpu",
        "--no-sandbox",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-extensions",
        "--disable-background-networking",
        "--disable-default-apps",
        "--disable-sync",
        "--disable-translate",
        "--metrics-recording-only",
        "--mute-audio",
        "--safebrowsing-disable-auto-update",
        "--allow-file-access-from-files",
        "--user-data-dir=" + str(profile),
        "--virtual-time-budget=5000",
        "--no-pdf-header-footer",
        "--print-to-pdf=" + str(out_pdf),
        page.as_uri(),
    ]


def print_pdf(html_text, out_pdf, chrome):
    """Print with headless Chrome.

    The HTML is written into docs/ rather than a scratch folder, because the
    page links guide.css and ../assets/css/fonts.css by relative path. Written
    anywhere else, both miss, and Chrome prints thirteen sheets of raw
    unstyled text on US Letter with no complaint at all. The page-size check in
    check() is what catches that class of failure.
    """
    profile = Path(tempfile.mkdtemp(prefix="wysm-guide-profile-"))
    page = HERE / ".guide-build.html"
    try:
        page.write_text(html_text, encoding="utf-8")
        if out_pdf.exists():
            out_pdf.unlink()
        last = None
        for flag in ("--headless=new", "--headless"):
            try:
                last = subprocess.run(chrome_cmd(chrome, page, profile, out_pdf, flag),
                                      capture_output=True, text=True, timeout=180)
            except subprocess.TimeoutExpired:
                die("Chrome timed out printing")
            if out_pdf.exists() and out_pdf.stat().st_size > 1000:
                return
        print((last.stdout or "")[-1500:])
        print((last.stderr or "")[-1500:])
        die("Chrome printed no PDF")
    finally:
        shutil.rmtree(profile, ignore_errors=True)
        if page.exists() and not KEEP_BUILD:
            page.unlink()


# -------------------------------------------------------------- read it back

WORD = re.compile(r"[A-Za-z0-9][A-Za-z0-9'\-]*")


def squash(text):
    """Lowercase, letters and digits only.

    Two things make a plain word comparison lie on this document. Tracked
    uppercase Bodoni comes out of the PDF as 'B E F O R E  A N Y T H I N G',
    and a period that ends a sentence in a table cell is a line break in the
    PDF. Squashing both sides removes both, and a clipped line is still absent,
    because its characters are simply not in the page."""
    return re.sub(r"[^a-z0-9]", "", text.lower())


def text_of(markup):
    body = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", markup, flags=re.S)
    body = re.sub(r"<!--.*?-->", " ", body, flags=re.S)
    body = re.sub(r"<[^>]+>", " ", body)
    return htmlmod.unescape(body)


def split_sheets(markup):
    """One chunk of HTML per sheet, in the order they print."""
    parts = re.split(r'(?=<section class="sheet)', markup)
    return [p for p in parts if p.lstrip().startswith('<section class="sheet')]


def content_extents(doc):
    """For each page, the lowest pt that real copy is drawn at.

    The signature line is guide.css's own ::after content, not copy, and the
    page field is a fill the size of the sheet; both sit at the bottom of every
    page by design, so both are left out. Without that the measurement reads as
    though every sheet were full.
    """
    out = []
    for p in doc:
        page_area = p.rect.width * p.rect.height
        ys = [b[3] for b in p.get_text("blocks")
              if "updating the website" not in b[4].lower()]
        for x in p.get_images(full=True):
            ys += [r.y1 for r in p.get_image_rects(x[0])]
        ys += [d["rect"].y1 for d in p.get_drawings()
               if d["rect"].height > 1 and d["rect"].get_area() < page_area * 0.6]
        out.append(max(ys) if ys else 0)
    return out


def check(pdf_path, markup, sheet_count, verbose=True):
    import pymupdf
    doc = pymupdf.open(str(pdf_path))
    problems = []
    pages = [p.get_text() for p in doc]

    # guide.css asks for A4 with @page size, and margin 0. If the stylesheet did
    # not load, Chrome prints unstyled US Letter and the sheets are meaningless,
    # so the size is the first thing measured, not assumed.
    r = doc[0].rect
    if abs(r.width - PAGE_W_PT) > 1 or abs(r.height - PAGE_H_PT) > 1:
        problems.append("the pages are %.2f x %.2f mm, not A4 210 x 297 mm; guide.css's "
                        "@page size did not reach the print" %
                        (r.width / PT_PER_MM, r.height / PT_PER_MM))
    w_pt, h_pt = r.width, r.height

    fonts = [f for p in doc for f in p.get_fonts()]
    faces = " ".join(f[3] for f in fonts)
    wanted = [f for f in ("Literata", "Bricolage", "Bodoni") if f in faces]
    kinds = sorted(set(f[2] for f in fonts))
    if "Type3" in kinds:
        problems.append("the PDF draws its type as bitmaps (Type3), not outlines: the "
                        "static faces never reached Chrome, so this is not a vector "
                        "document and it will go soft when zoomed")
    if len(wanted) < 3:
        problems.append("the faces are not all in the PDF: found %s, wanted Literata, "
                        "Bricolage Grotesque and Bodoni Moda (assets/css/fonts.css "
                        "may not have loaded)" % (", ".join(wanted) or "none"))

    if len(pages) != sheet_count:
        problems.append("the PDF has %d pages but the source has %d sheets"
                        % (len(pages), sheet_count))

    # Every word of a sheet has to be found on its own page, not somewhere in
    # the document: that is what localises a clip to the sheet that caused it.
    sheets = split_sheets(markup)
    if len(sheets) != sheet_count:
        problems.append("the source splits into %d sheets, not %d"
                        % (len(sheets), sheet_count))
    lost, checked = [], 0
    for i, (sheet_html, page_text) in enumerate(zip(sheets, pages), 1):
        sq = squash(page_text)
        words = {squash(w) for w in WORD.findall(text_of(sheet_html))}
        words = {w for w in words if len(w) > 1}
        checked += len(words)
        miss = sorted(w for w in words if w not in sq)
        if miss:
            lost.append((i, miss))
    if lost:
        problems.append("%d word(s) in the HTML never reached the PDF: %s"
                        % (sum(len(m) for _, m in lost),
                           "; ".join("sheet %d: %s" % (i, ", ".join(m[:8]))
                                     for i, m in lost)))

    outside = [b for p in doc for b in p.get_text("blocks")
               if b[0] < -0.5 or b[1] < -0.5 or b[2] > w_pt + 0.5 or b[3] > h_pt + 0.5]
    if outside:
        problems.append("%d text block(s) drawn outside the page box" % len(outside))

    used = content_extents(doc)
    limit = h_pt - FOOT_BAND_MM * PT_PER_MM      # copy stops above the signature band
    room = [ (limit - v) / PT_PER_MM for v in used ]
    for i, left in enumerate(room):
        if left < 0:
            problems.append("sheet %d has copy in the %d mm signature band, %.1f mm past "
                            "where it should stop" % (i + 1, FOOT_BAND_MM, -left))
        elif left < 4:
            problems.append("sheet %d leaves only %.1f mm before the signature band; the "
                            "next edit there will be cut off" % (i + 1, left))

    if verbose:
        print("  pages          %d, source sheets %d" % (len(pages), sheet_count))
        print("  page box       %.2f x %.2f mm, %s"
              % (w_pt / PT_PER_MM, h_pt / PT_PER_MM,
                 "nothing drawn outside it" if not outside else "%d BLOCK(S) OUTSIDE" % len(outside)))
        print("  faces          %s, embedded as %s"
              % (", ".join(wanted) or "NONE", "+".join(kinds) or "nothing"))
        # The arrow and a couple of other glyphs are outside the subset the site
        # ships, so Chrome brings in a system face for those alone. Listing what
        # is in the file is how you tell that apart from a face that failed to
        # load and took the whole design's type with it.
        print("  in the file    " + ", ".join(sorted({f[3].split("+")[-1] for f in fonts if f[3]})))
        print("  words          %d checked sheet by sheet, %s"
              % (checked,
                 "every one of them in the PDF"
                 if not lost else "%d MISSING on sheet(s) %s"
                 % (sum(len(m) for _, m in lost), ",".join(str(i) for i, _ in lost))))
        print("  spare room     " + " ".join("%d:%.0fmm" % (i + 1, v)
                                            for i, v in enumerate(room)))
    doc.close()
    return problems


# ---------------------------------------------------------------------- run

def main():
    ap = argparse.ArgumentParser(description="Build the WYSM content guide PDF.")
    ap.add_argument("--studio-url", default=os.environ.get("GUIDE_STUDIO_URL", "https://wysm.sanity.studio"),
                    help="address of the Sanity Studio for this project")
    ap.add_argument("--contact", default=os.environ.get("GUIDE_CONTACT", "Jude Nyoagbe • projects@rdvs.studio, jude_nyoagbe@rdvs.studio"),
                    help="who to ask, printed on the last sheet")
    ap.add_argument("--date", default=None, help="edition line on the cover")
    ap.add_argument("--out", default=str(DEFAULT_PDF), help="where to write the PDF")
    ap.add_argument("--chrome", default=None)
    ap.add_argument("--selftest", action="store_true",
                    help="print a deliberately overflowing copy and require the checker to catch it")
    ap.add_argument("--keep-build-file", action="store_true",
                    help="leave docs/.guide-build.html on disk to open in a browser")
    a = ap.parse_args()
    global KEEP_BUILD
    KEEP_BUILD = a.keep_build_file

    if not SRC.exists():
        die("missing " + str(SRC))

    if a.date:
        edition = a.date
    else:
        today = dt.date.today()
        edition = "%d %s %d" % (today.day, today.strftime("%B"), today.year)

    sheet_count = SRC.read_text(encoding="utf-8").count('<section class="sheet')
    chrome = find_chrome(a.chrome)
    print("Chrome    " + os.path.basename(chrome))
    print("Sheets    %d" % sheet_count)
    face_css = static_faces()
    print("Faces     " + ", ".join(f for f, _, _ in FACES) + ", made static")

    markup, missing = build_html(a.studio_url or None, a.contact or None, edition,
                                 face_css=face_css)

    # Chrome resolves --print-to-pdf against its own working directory, not
    # yours, so a relative --out silently prints nothing at all.
    out = Path(a.out).resolve()
    print("Printing  " + str(out))
    print_pdf(markup, out, chrome)
    print("Checks")
    problems = check(out, markup, sheet_count)

    if missing:
        print("  %d screenshot(s) still to come: %s"
              % (len(missing), ", ".join(m + ".png" for m in missing)))
        print("    drop them in %s and run this again" % SHOTS_DIR)
    if not a.studio_url:
        print("  the Studio address is not filled in: pass --studio-url")
    if not a.contact:
        print("  the contact line is not filled in: pass --contact")
    if problems:
        for p in problems:
            print("  !! " + p)
        die("the guide did not build cleanly")
    print("OK        %s (%d bytes)" % (out.name, out.stat().st_size))

    if a.selftest:
        print("Selftest  deliberately overflowing sheet 4")
        bad_markup, _ = build_html(a.studio_url or None, a.contact or None, edition,
                                   overflow_into=3, face_css=face_css)
        bad = out.parent / ".selftest-overflow.pdf"
        try:
            print_pdf(bad_markup, bad, chrome)
            bad_problems = check(bad, bad_markup, sheet_count, verbose=False)
            caught = [p for p in bad_problems if "never reached the PDF" in p]
            if not caught:
                die("the word check did NOT catch a sheet that is deliberately too tall "
                    "(the other complaints were: %s). The guard is broken; a green build "
                    "means nothing." % "; ".join(bad_problems))
            print("OK        the checker caught it: " + caught[0][:180])
        finally:
            if bad.exists():
                bad.unlink()

    if not KEEP_BUILD:
        shutil.rmtree(FONT_DIR, ignore_errors=True)


if __name__ == "__main__":
    main()
