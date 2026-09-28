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

  /** A list of outbound links, one paragraph each: press coverage and the like. */
  function linkList(id, list, labelKey) {
    if (!list || !list.length) return;
    var e = el(id);
    if (!e) return;
    e.innerHTML = '';
    list.forEach(function (item) {
      var url = safeUrl(item.url);
      if (!url || !item[labelKey]) return;
      var p = document.createElement('p');
      var a = document.createElement('a');
      a.className = 'inline-link';
      a.href = url;
      a.textContent = item[labelKey];
      a.target = '_blank';
      a.rel = 'noopener';
      p.appendChild(a);
      e.appendChild(p);
    });
  }

  /** The "Supported by" row: same links, laid out inline. */
  function supporters(id, list) {
    if (!list || !list.length) return;
    var e = el(id);
    if (!e) return;
    e.innerHTML = '';
    list.forEach(function (item) {
      var url = safeUrl(item.url);
      if (!url || !item.name) return;
      var a = document.createElement('a');
      a.className = 'inline-link';
      a.href = url;
      a.textContent = item.name;
      a.target = '_blank';
      a.rel = 'noopener';
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
      '  contactEmail, contactPhone, copyrightHolder, funderName, funderAcronym,\n' +
      '  socialLinks[]{ _key, platform, url },\n' +
      '  supporters[]{ _key, name, url }\n' +
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
    linkList: linkList, supporters: supporters, publicationPage: publicationPage,
    settings: settings,
  };
})();

window.SANITY.settings();
