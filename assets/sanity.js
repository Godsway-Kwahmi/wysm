/* ==============================================================
   WHEN YOU SEE ME — Sanity content layer
   One config, one fetch helper. Each page holds its own GROQ
   query and its own mapping, so a page only pulls what it shows.
   ============================================================== */
window.SANITY = (function () {
  var PROJECT_ID = "YOUR_SANITY_PROJECT_ID";
  var DATASET    = "production";
  var API_VERSION= "v2026-03-01";

  function query(groq) {
    var url = "https://" + PROJECT_ID + ".api.sanity.io/" + API_VERSION +
              "/data/query/" + DATASET + "?query=" + encodeURIComponent(groq);
    return fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (j) { return j.result; })
      .catch(function (err) {
        console.warn('Sanity fetch unavailable — showing built-in preview content.', err);
        return null;
      });
  }

  /* Only overwrite the drawn placeholder when the CMS actually has
     something, so an empty dataset never blanks the page. */
  function text(id, value) {
    if (!value) return;
    var el = document.getElementById(id);
    if (el) el.innerText = value;
  }
  function src(id, value) {
    if (!value) return;
    var el = document.getElementById(id);
    if (el) el.src = value;
  }
  function href(id, value) {
    if (!value) return;
    var el = document.getElementById(id);
    if (el) el.href = value;
  }

  /* Footer contact details are global, so every page asks for them. */
  function settings() {
    return query('*[_type == "globalSettings"][0]{ contactEmail, contactPhone }')
      .then(function (s) {
        if (!s) return;
        text('footer-email', s.contactEmail);
        text('footer-phone', s.contactPhone);
        if (s.contactEmail) href('footer-email', 'mailto:' + s.contactEmail);
        if (s.contactPhone) href('footer-phone', 'tel:' + s.contactPhone.replace(/[^\d+]/g, ''));
      });
  }

  return { query: query, text: text, src: src, href: href, settings: settings };
})();

window.SANITY.settings();
