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

  /* params is optional: { slug: "nightbloom" } becomes $slug in the GROQ. */
  function query(groq, params) {
    var url = "https://" + PROJECT_ID + ".apicdn.sanity.io/" + API_VERSION +
              "/data/query/" + DATASET + "?query=" + encodeURIComponent(groq);
    Object.keys(params || {}).forEach(function (k) {
      url += "&" + encodeURIComponent("$" + k) + "=" + encodeURIComponent(JSON.stringify(params[k]));
    });
    return fetch(url)
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
  function src(id, value) {
    if (!value) return;
    var e = el(id);
    if (e) e.src = value;
  }
  /* image field: { url, alt } */
  function image(id, field) {
    if (!field || !field.url) return;
    var e = el(id);
    if (!e) return;
    e.src = field.url;
    if (field.alt) e.alt = field.alt;
  }
  function hide(id) {
    var e = el(id);
    if (e) e.style.display = 'none';
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

  /** Rebuild a link stack from the CMS list. */
  function links(id, list) {
    if (!list || !list.length) return;
    var e = el(id);
    if (!e) return;
    e.innerHTML = '';
    list.forEach(function (item) {
      var a = document.createElement('a');
      a.href = safeUrl(item.url) || '#';
      a.textContent = item.platform || item.title || '';
      a.rel = 'noopener';
      e.appendChild(a);
    });
  }

  /** Press coverage as rows of the thumbnail component: the linked page's own
   *  lead image, then the outlet as the row's name — which is what the drawn
   *  list on the about page is, so a rebuild from the CMS looks like the page.
   *
   *  The images cannot come from the CMS: `mediaCoverage` holds `outlet` and
   *  `url` only, and an article's og:image is not something a browser may read
   *  cross-origin, so the copies are drawn with the page and looked up here by
   *  the entry's `_key`. An entry the page has no picture for still gets its
   *  row — as `.row--plain`, without the tile track — rather than dropping off
   *  the list, so a curator's fourth link is never silently lost. */
  function mediaRows(id, list, labelKey, thumbs) {
    if (!list || !list.length) return;
    var e = el(id);
    if (!e) return;
    e.innerHTML = '';
    var rows = document.createElement('div');
    rows.className = 'rows';
    list.forEach(function (item) {
      var url = safeUrl(item.url);
      if (!url || !item[labelKey]) return;
      var thumb = thumbs && thumbs[item._key];

      var row = document.createElement('div');
      row.className = 'row' + (thumb ? '' : ' row--plain');

      if (thumb) {
        var t = document.createElement('a');
        t.className = 'tile';
        t.href = url;
        t.target = '_blank';
        t.rel = 'noopener';
        t.tabIndex = -1;
        t.setAttribute('aria-hidden', 'true');
        var img = document.createElement('img');
        img.src = thumb;
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
      '  title, kind, summary, citation, doi, downloadUrl, externalUrl,\n' +
      '  "year": string::split(publishedAt, "-")[0],\n' +
      '  "image": image{ "url": asset->url + "?w=1200&fit=max&auto=format", alt }\n' +
      '}', { slug: slug }).then(function (p) {
      if (!p) return;

      text('pub-title', p.title);
      if (p.title) document.title = p.title + ' \u2014 Publications \u2014 When You See Me';
      text('pub-meta', [p.kind, p.year].filter(Boolean).join(' \u00B7 '));
      image('pub-cover', p.image);
      paragraphs('pub-abstract', p.summary);

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

  /** Standfirst and <title>/<meta> for a page. */
  function meta(page) {
    if (!page) return;
    text('page-summary', page.summary);
    var s = page.seo || {};
    if (s.title) document.title = s.title;
    if (s.description) {
      var m = document.querySelector('meta[name="description"]');
      if (m) m.setAttribute('content', s.description);
    }
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

      if (s.contactEmail) {
        text('footer-email', s.contactEmail);
        href('footer-email', 'mailto:' + s.contactEmail);
        text('contact-email', s.contactEmail);
        href('contact-email', 'mailto:' + s.contactEmail);
      }
      if (s.contactPhone) {
        var tel = 'tel:' + s.contactPhone.replace(/[^\d+]/g, '');
        text('footer-phone', s.contactPhone);
        href('footer-phone', tel);
        text('contact-phone', s.contactPhone);
        href('contact-phone', tel);
      }

      supporters('supporters-list', s.supporters);

      links('footer-social', s.socialLinks);
      links('contact-social', s.socialLinks);

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
    text: text, href: href, src: src, image: image, hide: hide,
    paragraphs: paragraphs, columns: columns, links: links, meta: meta,
    mediaRows: mediaRows, supporters: supporters, publicationPage: publicationPage,
    settings: settings,
  };
})();

window.SANITY.settings();
