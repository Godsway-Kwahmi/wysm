/* ==============================================================
   WHEN YOU SEE ME — Sanity content layer
   One config, one fetch helper, and the handful of writers the
   pages need. Each page holds its own GROQ query, so a page only
   pulls what it shows.

   Body copy comes back as plain text with blank lines between
   paragraphs. The schema stores it as one field because it is one
   piece of writing; how many paragraphs land in which drawn column
   is a layout decision, so it is made here.
   ============================================================== */
window.SANITY = (function () {
  var PROJECT_ID  = "6071id0c";
  var DATASET     = "production";
  var API_VERSION = "v2026-03-01";

  /* params is optional: { slug: "nightbloom" } becomes $slug in the GROQ.
     A slow CDN used to leave a page on its built-in copy forever with nothing
     said after the first warning; the eight-second abort at least bounds how
     long a request can hold a page open. */
  function query(groq, params) {
    var url = "https://" + PROJECT_ID + ".apicdn.sanity.io/" + API_VERSION +
              "/data/query/" + DATASET + "?query=" + encodeURIComponent(groq);
    Object.keys(params || {}).forEach(function (k) {
      url += "&" + encodeURIComponent("$" + k) + "=" + encodeURIComponent(JSON.stringify(params[k]));
    });
    var opts = {};
    if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) opts.signal = AbortSignal.timeout(8000);
    return fetch(url, opts)
      .then(function (r) { return r.json(); })
      .then(function (j) { return j.result; })
      .catch(function (err) {
        console.warn('Sanity fetch unavailable — showing built-in preview content.', err);
        return null;
      });
  }

  /* CMS links are typed by people: allow web, mail, phone and on-site paths,
     never script URLs. */
  function safeUrl(u) {
    u = String(u || '').trim();
    return u && !/^\s*(javascript|data|vbscript):/i.test(u) ? u : '';
  }

  function el(id) { return document.getElementById(id); }

  /* Every writer is a no-op on empty values, so an unfinished document
     leaves the drawn placeholder in place rather than blanking the page. */
  function text(id, value) {
    if (!value) return;
    var e = el(id);
    if (e) e.textContent = value;
  }
  function href(id, value) {
    value = safeUrl(value);
    if (!value) return;
    var e = el(id);
    if (e) e.href = value;
  }
  /* image field: { url, alt, w, h } */
  function image(id, field) {
    if (!field || !field.url) return;
    var e = el(id);
    if (!e) return;
    e.src = field.url;
    if (field.alt) e.alt = field.alt;
    /* Every drawn image now carries the authored file's intrinsic size, because
       the reflow tiers give a photo its height from that ratio. A CMS picture
       with different dimensions has to move them too, or the browser reserves a
       box the new picture does not fill. */
    if (field.w && field.h) { e.width = field.w; e.height = field.h; }
  }

  function split(value) {
    return String(value || '')
      .split(/\n\s*\n/)
      .map(function (s) { return s.trim(); })
      .filter(Boolean);
  }

  function fill(e, parts) {
    e.innerHTML = '';
    parts.forEach(function (t) {
      var p = document.createElement('p');
      p.textContent = t;          // never innerHTML: CMS copy is not markup
      e.appendChild(p);
    });
  }

  /** One text field into one container, a paragraph per blank line. */
  function paragraphs(id, value) {
    var parts = split(value);
    if (!parts.length) return;
    var e = el(id);
    if (e) fill(e, parts);
  }

  /** One text field dealt across the columns the comp draws for it. */
  function columns(ids, value) {
    var parts = split(value);
    if (!parts.length) return;
    var per = Math.ceil(parts.length / ids.length);
    ids.forEach(function (id, i) {
      var e = el(id);
      if (e) fill(e, parts.slice(i * per, (i + 1) * per));
    });
  }

  /** Rebuild a link stack from the CMS list. An entry with no usable URL is
   *  dropped rather than written as `#`: a name that looks like a link and goes
   *  nowhere is worse for the person reading it than the name not being there,
   *  and `supporters()` already treats a missing URL the same way. */
  function links(id, list) {
    if (!list || !list.length) return;
    var e = el(id);
    if (!e) return;
    var made = list.map(function (item) {
      var url = safeUrl(item.url);
      if (!url || !(item.platform || item.title)) return null;
      var a = document.createElement('a');
      a.href = url;
      a.textContent = item.platform || item.title;
      a.rel = 'noopener';
      a.target = '_blank';
      return a;
    }).filter(Boolean);
    if (!made.length) return;
    e.innerHTML = '';
    made.forEach(function (a) { e.appendChild(a); });
  }

  /** Press coverage as rows of the thumbnail component: the linked page's own
   *  lead image, the outlet as the row's name, and the article's headline with
   *  the publisher's copyright line in the row's meta — which is what the drawn
   *  list on the about page is, so a rebuild from the CMS looks like the page.
   *
   *  None of that can come from the CMS: `mediaCoverage` holds `outlet` and
   *  `url` only, an article's og:image is not something a browser may read
   *  cross-origin, and neither the picture nor its headline is ours to re-key.
   *  So the page supplies a `{_key: {image, headline, credit}}` registry and
   *  this joins the two meta fields the one way they are ever written —
   *  `headline · credit`, the middot the publications rows already use.
   *
   *  An entry the page has no picture for still gets its row — as `.row--plain`,
   *  without the tile track — rather than dropping off the list, so a curator's
   *  fourth link is never silently lost. */
  function mediaRows(id, list, labelKey, byKey) {
    if (!list || !list.length) return;
    var e = el(id);
    if (!e) return;
    e.innerHTML = '';
    var rows = document.createElement('div');
    rows.className = 'rows';
    list.forEach(function (item) {
      var url = safeUrl(item.url);
      if (!url || !item[labelKey]) return;
      var entry = (byKey && byKey[item._key]) || {};

      var row = document.createElement('div');
      row.className = 'row' + (entry.image ? '' : ' row--plain');

      if (entry.image) {
        var t = document.createElement('a');
        t.className = 'tile';
        t.href = url;
        t.target = '_blank';
        t.rel = 'noopener';
        t.tabIndex = -1;
        t.setAttribute('aria-hidden', 'true');
        var img = document.createElement('img');
        img.src = entry.image;
        img.loading = 'lazy';
        img.alt = '';
        t.appendChild(img);
        row.appendChild(t);
      }

      var name = document.createElement('div');
      var h3 = document.createElement('h3');
      h3.className = 't';
      var a = document.createElement('a');
      a.href = url;
      a.textContent = item[labelKey];
      a.target = '_blank';
      a.rel = 'noopener';
      h3.appendChild(a);
      name.appendChild(h3);

      var meta = [entry.headline, entry.credit].filter(Boolean).join(' \u00B7 ');
      if (meta) {
        var s = document.createElement('span');
        s.className = 't body meta';
        s.textContent = meta;
        name.appendChild(s);
      }

      row.appendChild(name);
      rows.appendChild(row);
    });
    e.appendChild(rows);
    if (window.fitStage) window.fitStage();
  }

  /** The funding row. The page draws each funder as a plate — the name
   *  now, a supplied mark later — so this rebuilds that structure instead
   *  of a plain run of links. A supporter document that carries a `logo`
   *  image puts the mark above the name inside the same plate; the ones
   *  live now do not, so they render as names, which is what UKRI's rule
   *  actually asks for. */
  function supporters(id, list) {
    if (!list || !list.length) return;
    var e = el(id);
    if (!e) return;
    e.innerHTML = '';
    list.forEach(function (item) {
      var url = safeUrl(item.url);
      if (!url || !item.name) return;
      var a = document.createElement('a');
      a.className = 'funder';
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
      var mark = item.logo && (item.logo.url || (item.logo.asset && item.logo.asset.url));
      if (mark) {
        var img = document.createElement('img');
        img.className = 'funder__mark';
        img.src = mark;
        img.alt = item.logo.alt || item.name;
        a.appendChild(img);
      }
      var name = document.createElement('span');
      name.className = 'funder__name';
      name.textContent = item.name;
      a.appendChild(name);
      e.appendChild(a);
    });
  }

  /* One publication's own page. The page ships with its content written in,
     so this only replaces what the CMS actually has for that slug. */
  function publicationPage(slug) {
    return query('*[_type == "publication" && slug.current == $slug][0]{\n' +
      '  title, kind, summary, abstract, citation, doi, downloadUrl, externalUrl,\n' +
      '  "year": string::split(publishedAt, "-")[0],\n' +
      '  "image": image{ "url": asset->url + "?w=1200&fit=max&auto=format",\n' +
      '    "raw": asset->url, alt,\n' +
      '    "w": asset->metadata.dimensions.width, "h": asset->metadata.dimensions.height }\n' +
      '}', { slug: slug }).then(function (p) {
      if (!p) return;

      text('pub-title', p.title);
      if (p.title) {
        /* The page owns its own house style: the brand after the work's name on
           four of them, and on the one whose title IS the brand, the form and
           the author instead. The document supplies the work's name only, so
           renaming a work in Studio can never restyle the title or strand the
           link card behind the old wording. */
        var cut = document.title.lastIndexOf(' \u2014 ');
        head({ title: p.title + (cut === -1 ? '' : document.title.slice(cut)) });
      }
      text('pub-meta', [p.kind, p.year].filter(Boolean).join(' \u00B7 '));
      image('pub-cover', p.image);
      /* The card a shared link draws has to show the same cover the page shows.
         Written only when the asset carries its real dimensions, so a card never
         ends up claiming a size the picture is not. */
      head({ image: p.image });
      // The abstract block takes the document's abstract, never its one-line
      // summary: the summary is what the row on Publications is for, and writing
      // it over this block twice meant the client's own abstract could not reach
      // the page even once. The field is empty on all five documents today, and
      // paragraphs() returns on an empty value, so the text written into the HTML
      // stands until someone fills the field in Studio.
      paragraphs('pub-abstract', p.abstract);

      var cite = el('pub-citation');
      var doi = safeUrl(p.doi);
      if (cite && (p.citation || doi)) {
        cite.innerHTML = '';
        if (p.citation) cite.appendChild(document.createTextNode(p.citation));
        if (doi) {
          if (p.citation) cite.appendChild(document.createTextNode(' DOI: '));
          var a = document.createElement('a');
          a.href = doi;
          a.textContent = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
          a.target = '_blank';
          a.rel = 'noopener';
          cite.appendChild(a);
        }
      }

      var cta = el('pub-cta');
      if (cta) {
        var file = safeUrl(p.downloadUrl), ext = safeUrl(p.externalUrl);
        if (file) {
          cta.href = file;
          cta.textContent = 'Download PDF';
          cta.removeAttribute('target');
        } else if (ext) {
          cta.href = ext;
          cta.textContent = 'View at publisher';
          cta.target = '_blank';
          cta.rel = 'noopener';
        }
      }
    });
  }

  /* The head is one statement with three mirrors: <title> for the browser,
     og:* for the link card, twitter:* for the card on X. Writing only the first
     two meant a CMS edit moved the tab and left the card quoting the previous
     sentence — and the card is what almost everyone who arrives from a shared
     link actually reads. Anything that changes one changes all three. */
  function setMeta(key, value, content) {
    var m = document.querySelector('meta[' + key + '="' + value + '"]');
    if (m) m.setAttribute('content', content);
  }

  function head(node) {
    if (node.title) {
      document.title = node.title;
      setMeta('property', 'og:title', node.title);
      setMeta('name', 'twitter:title', node.title);
    }
    if (node.description) {
      setMeta('name', 'description', node.description);
      setMeta('property', 'og:description', node.description);
      setMeta('name', 'twitter:description', node.description);
    }
    /* The card takes the asset's own URL, not the tile's. The tile asks for
       auto=format so a browser can be handed webp by content negotiation, but a
       social scraper sends no Accept header and gets whatever the negotiation
       falls back to. The card is only ever read by a scraper, so it gets the
       file as it is, at the size the asset reports. */
    var card = node.image;
    if (card && (card.raw || card.url) && card.w && card.h) {
      var src = card.raw || card.url;
      setMeta('property', 'og:image', src);
      setMeta('property', 'og:image:width', String(card.w));
      setMeta('property', 'og:image:height', String(card.h));
      setMeta('name', 'twitter:image', src);
      if (card.alt) {
        setMeta('property', 'og:image:alt', card.alt);
        setMeta('name', 'twitter:image:alt', card.alt);
      }
    }
  }

  /** Standfirst and the whole head for a page document. */
  function meta(page) {
    if (!page) return;
    text('page-summary', page.summary);
    var s = page.seo || {};
    head({ title: s.title, description: s.description });
    /* seo.noIndex is not in the schema yet — the seo object on every page
       document holds title and description only — so a curator cannot pull a
       page out of the index from Studio. search.html is noindex in the markup. */
  }

  /* Site-wide details. Every page asks for them, so it is the one
     query that lives here rather than on a page. Fetched by fixed
     document ID, which is the cheapest way to read a singleton. */
  function settings() {
    return query('*[_id == "siteSettings"][0]{\n' +
      '  contactEmail, contactPhone, copyrightHolder,\n' +
      '  socialLinks[]{ _key, platform, url },\n' +
      '  supporters[]{ _key, name, url, logo{ "url": asset->url, alt } }\n' +
      '}').then(function (s) {
      if (!s) return;

      /* Three of these writes used to aim at ids that exist on no page:
         contact-email, contact-phone and contact-social. The contact page's own
         address IS the footer's, so the footer ids are the only targets, and
         every one of them is on all thirteen pages. */
      if (s.contactEmail) {
        text('footer-email', s.contactEmail);
        href('footer-email', 'mailto:' + s.contactEmail);
      }
      if (s.contactPhone) {
        var tel = 'tel:' + s.contactPhone.replace(/[^\d+]/g, '');
        text('footer-phone', s.contactPhone);
        href('footer-phone', tel);
      }

      supporters('supporters-list', s.supporters);

      links('footer-social', s.socialLinks);

      if (s.copyrightHolder) {
        text('legal-copyright',
          '\u00A9 ' + new Date().getFullYear() + ' ' + s.copyrightHolder + '. All rights reserved.');
      }
      /* No funderName here any more. The footer's acknowledgement sentence
         was retired on 2026-10-14 — the `supporters` plates above name the
         funders in full — so `funderName` and `funderAcronym` are projected
         by nothing and read by nothing. They stay in the schema in case the
         sentence comes back with a grant reference; until then this is the
         only place that would have written to #legal-funder. */
    });
  }

  return {
    query: query,
    text: text, href: href, image: image,
    paragraphs: paragraphs, columns: columns, links: links, meta: meta,
    mediaRows: mediaRows, supporters: supporters, publicationPage: publicationPage,
    settings: settings,
  };
})();

window.SANITY.settings();
