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
  var PROJECT_ID  = "YOUR_SANITY_PROJECT_ID";
  var DATASET     = "production";
  var API_VERSION = "v2026-03-01";

  function query(groq) {
    var url = "https://" + PROJECT_ID + ".apicdn.sanity.io/" + API_VERSION +
              "/data/query/" + DATASET + "?query=" + encodeURIComponent(groq);
    return fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (j) { return j.result; })
      .catch(function (err) {
        console.warn('Sanity fetch unavailable — showing built-in preview content.', err);
        return null;
      });
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
      a.href = item.url || '#';
      a.textContent = item.platform || item.title || '';
      a.rel = 'noopener';
      e.appendChild(a);
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
      '  contactEmail, contactPhone, copyrightHolder, funderName, funderAcronym,\n' +
      '  socialLinks[]{ _key, platform, url }\n' +
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

      links('footer-social', s.socialLinks);
      links('contact-social', s.socialLinks);

      if (s.copyrightHolder) {
        text('legal-copyright',
          '\u00A9 ' + new Date().getFullYear() + ' ' + s.copyrightHolder + '. All rights reserved.');
      }
      if (s.funderName) {
        text('legal-funder',
          (s.funderName + (s.funderAcronym ? ' (' + s.funderAcronym + ')' : '')).toUpperCase());
      }
    });
  }

  return {
    query: query,
    text: text, href: href, src: src, image: image, hide: hide,
    paragraphs: paragraphs, columns: columns, links: links, meta: meta,
    settings: settings,
  };
})();

window.SANITY.settings();
