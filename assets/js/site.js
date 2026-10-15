/* ==============================================================
   WHEN YOU SEE ME — shared behaviour
   Header state, stage sizing, contact form, photo galleries.
   Every block is guarded by an element check so one file can
   serve every page.
   ============================================================== */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var stage   = document.querySelector('.stage');
  var header  = document.querySelector('.site-header');

  /* --- header: flip to the condensed, grounded state once the page moves --- */
  var ticking = false, wasScrolled = null;
  function sizeHeader() {
    if (!header) return;
    /* In the reflow the sticky bar is a different height in each of its two
       states and wraps differently at every width, so the anchor offset is
       measured rather than guessed. */
    document.documentElement.style.setProperty('--hdr', (header.offsetHeight + 12) + 'px');
  }
  function syncHeader() {
    var s = window.scrollY > 60;
    if (s !== wasScrolled) {
      wasScrolled = s;
      document.body.classList.toggle('is-scrolled', s);
      sizeHeader();
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(syncHeader); }
  }, { passive: true });
  syncHeader();

  /* --- hero glow ---------------------------------------------------
     A soft warm light trails the pointer across the wordmark. Its
     centre is clamped to the hero's box; coords are stage-relative,
     so scrolling never displaces it. The transform is written straight
     off the event — mousemove is already coalesced to frame rate, and
     rAF throttles to a standstill in background/headless contexts.
     Reduced-motion visitors get the static, centred light from the
     stylesheet.
     --------------------------------------------------------------- */
  var glow    = document.getElementById('hero-glow'),
      heroImg = document.getElementById('hero-image');

  if (glow && heroImg && !reduced && stage) {
    window.addEventListener('mousemove', function (ev) {
      var h = heroImg.getBoundingClientRect(),
          r = stage.getBoundingClientRect();
      var x = Math.min(Math.max(ev.clientX, h.left), h.right) - r.left,
          y = Math.min(Math.max(ev.clientY, h.top),  h.bottom) - r.top;
      glow.style.transform = 'translate(' + x + 'px,' + y + 'px) translate(-50%,-50%)';
    }, { passive: true });
  }

  /* --- section glows ------------------------------------------------
     The same light on the homepage's four entry sections. A pool starts
     dark, comes up while the pointer is inside its section, tracks the
     cursor, and fades out when it leaves — four always-on lights would
     spend the whole page in a haze.

     The comp's <section> is a zero-height grouping box: everything in it is
     placed against the stage, so the element itself has no area to test and
     no pointer events of its own. A section's extent is therefore measured
     as the union of the blocks it holds, taken from offsetLeft/Top/Width/
     Height — those ignore the reveal transforms, which getBoundingClientRect
     would not — and the pointer is tested against that in stage coordinates,
     so the glow answers to the empty field between the elements as well as
     to the elements themselves. Re-measured on resize and on load, when the
     reflow tiers change the geometry.

     Reduced-motion visitors keep the page still, as with the hero, and
     phones never see one: the stylesheet takes them out below 900.
     ----------------------------------------------------------------- */
  var pools = [];

  if (!reduced && stage) {
    [].forEach.call(document.querySelectorAll('.sec-glow'), function (el) {
      var anchor = document.getElementById(el.getAttribute('data-glow')),
          sec    = anchor && anchor.closest ? anchor.closest('section') : null;
      if (sec) pools.push({ el: el, sec: sec, box: null });
    });

    function measurePools() {
      pools.forEach(function (p) {
        var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        [].forEach.call(p.sec.children, function (e) {
          if (e.classList.contains('anchor') || e.classList.contains('sec-glow')) return;
          if (!e.offsetWidth || !e.offsetHeight) return;      /* hidden by the tier */
          x0 = Math.min(x0, e.offsetLeft);  y0 = Math.min(y0, e.offsetTop);
          x1 = Math.max(x1, e.offsetLeft + e.offsetWidth);
          y1 = Math.max(y1, e.offsetTop  + e.offsetHeight);
        });
        p.box = x0 === Infinity ? null : { l: x0, t: y0, r: x1, b: y1 };
      });
    }

    window.addEventListener('mousemove', function (ev) {
      var sr = stage.getBoundingClientRect(),
          x  = ev.clientX - sr.left,
          y  = ev.clientY - sr.top;
      for (var i = 0; i < pools.length; i++) {
        var p = pools[i], b = p.box;
        if (!b || x < b.l || x > b.r || y < b.t || y > b.b) { p.el.classList.remove('is-lit'); continue; }
        p.el.style.transform = 'translate(' + x + 'px,' + y + 'px) translate(-50%,-50%)';
        p.el.classList.add('is-lit');
      }
    }, { passive: true });

    window.addEventListener('resize', measurePools);
    window.addEventListener('load', measurePools);
    measurePools();
  }

  /* --- stage height ---------------------------------------------
     The comp gives each page a drawn height, held in data-stage, and
     the stage is clipped to it so reveal transforms never add scroll.
     Copy coming back from the CMS can run longer than the drawn
     height, so measure the placed elements and grow the stage to fit
     rather than clipping the tail off a section.
     ------------------------------------------------------------- */
  function fitStage() {
    if (!stage) return;
    var foot = stage.querySelector('.site-footer');

    if (window.innerWidth <= 1650) {
      stage.style.height = '';
      if (foot) foot.style.top = '';
      return;
    }

    var px    = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--px')) || 1;
    var drawn = parseFloat(getComputedStyle(stage).getPropertyValue('--stage')) * px || 0;
    var footH = foot ? foot.offsetHeight : 0;

    // offsetTop/offsetHeight ignore the reveal transforms, so this measures
    // where the placed elements actually come to rest.
    var bottom = 0;
    [].forEach.call(stage.querySelectorAll('.a, .thumbs, .rows'), function (el) {
      if (header && header.contains(el)) return;   // the fixed header is outside the flow
      if (foot && foot.contains(el)) return;       // the footer is what we are placing
      if (el.offsetParent !== stage) return;
      var b = el.offsetTop + el.offsetHeight;
      if (b > bottom) bottom = b;
    });

    // Hold the drawn position exactly whenever the content fits above it, so
    // a page that fits stays a 1:1 reproduction of the comp — on the home
    // page the contact block is flush to the footer by design. Only content
    // that overruns pushes the band down, and then it takes clearance with it.
    var drawnTop = drawn - footH;
    var footTop  = bottom <= drawnTop ? drawnTop : Math.ceil(bottom + 140 * px);
    if (foot) foot.style.top = footTop + 'px';
    stage.style.height = Math.ceil(footTop + footH) + 'px';
  }

  window.fitStage = fitStage;      // pages that add rows re-run this
  fitStage();
  sizeHeader();
  window.addEventListener('resize', fitStage);
  window.addEventListener('resize', sizeHeader);
  window.addEventListener('load', fitStage);
  window.addEventListener('load', sizeHeader);

  /* --- contact form ---------------------------------------------
     There is no endpoint yet, so submitting hands the message to the
     visitor's own email app — which is what the page tells them. The name
     and address they type go inside the body rather than as a Reply-To:
     a mailto cannot carry one, and the account their app sends from is
     the address a reply will actually reach.
     ------------------------------------------------------------- */
  var contactForm = document.getElementById('contact-form');

  if (contactForm) {
    contactForm.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var val  = function (id) { return ((document.getElementById(id) || {}).value || '').trim(); };
      var mail = (document.getElementById('footer-email') || {}).textContent || 'info@whenyouseeme.com';
      var body = val('message') + '\n\n—\n' +
                 'From: ' + (val('name') || '—') + '\n' +
                 'Reply to: ' + (val('email') || '—');
      window.location.href = 'mailto:' + mail.trim() +
        '?subject=' + encodeURIComponent('Website enquiry') +
        '&body=' + encodeURIComponent(body);
    });
  }

  /* --- newsletter signup -----------------------------------------
     Client-side only for now: checks the address looks right and
     lets the visitor know it was received. Point this at a real
     mailing list (Mailchimp, Buttondown, etc.) once one is wired up.
     ------------------------------------------------------------- */
  var newsletterForm   = document.getElementById('newsletter-form'),
      newsletterEmail  = document.getElementById('newsletter-email'),
      newsletterStatus = document.getElementById('newsletter-status');

  if (newsletterForm && newsletterEmail && newsletterStatus) {
    newsletterForm.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var value = newsletterEmail.value.trim();
      var looksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      if (!looksValid) {
        newsletterStatus.textContent = 'Please enter a valid email address.';
        return;
      }
      newsletterStatus.textContent = 'Thanks \u2014 you\u2019re on the list.';
      newsletterForm.reset();
    });
  }

  /* --- photo galleries ------------------------------------------------
     A page can hold several galleries; each dot rail names the gallery it
     belongs to with data-gallery. Frames are made focusable here rather
     than in the markup, so a gallery of thirty photos stays readable.

     At the comp the row is an accordion: it does not scroll, every frame
     is on show, and the rail marks whichever frame the pointer or the
     focus is holding open. Below 1650 the row is a strip again and the
     rail goes back to reporting how far along it is. Both write the same
     .active class through the one mark() below, so the rail can never
     hold two opinions at once. A dot puts the focus on its frame: at the
     comp that is what opens it, and in the reflow it is what scrolls the
     strip to it.
     ------------------------------------------------------------------ */
  var strips = [].slice.call(document.querySelectorAll('.gallery'));

  strips.forEach(function (strip) {
    var frames = [].slice.call(strip.querySelectorAll('img'));
    frames.forEach(function (frame) {
      frame.tabIndex = 0;
    });

    var rail = strip.id && document.querySelector(
      '.gallery-pagination[data-gallery="' + strip.id + '"]');
    if (!rail) return;

    function mark(i) {
      [].forEach.call(rail.children, function (dot, j) {
        dot.classList.toggle('active', j === i);
      });
    }

    frames.forEach(function (frame, i) {
      var dot = document.createElement('span');
      dot.className = 'dot' + (i ? '' : ' active');
      dot.addEventListener('click', function () {
        strip.scrollTo({ left: frame.offsetLeft - strip.offsetLeft, behavior: 'smooth' });
        frame.focus({ preventScroll: true });
      });
      rail.appendChild(dot);
    });

    // the frame the accordion is open on, mirrored onto the rail
    strip.addEventListener('pointerover', function (ev) {
      var i = frames.indexOf(ev.target);
      if (i > -1) mark(i);
    });
    strip.addEventListener('focusin', function (ev) {
      var i = frames.indexOf(ev.target);
      if (i > -1) mark(i);
    });

    // where the row scrolls (everything below the comp), how far along it is
    strip.addEventListener('scroll', function () {
      var centre = strip.scrollLeft + strip.clientWidth / 2, best = Infinity, at = 0;
      frames.forEach(function (frame, i) {
        var d = Math.abs(centre - (frame.offsetLeft - strip.offsetLeft + frame.clientWidth / 2));
        if (d < best) { best = d; at = i; }
      });
      mark(at);
    }, { passive: true });
  });

  var lightbox = document.getElementById('lightbox');
  if (lightbox) {
    var lbImg   = lightbox.querySelector('img');
    var lbClose = function () {
      lightbox.classList.remove('is-open');
      document.body.classList.remove('gallery-open');
    };
    var lbSet = [], lbAt = 0;

    function lbShow(i) {
      if (!lbSet.length) return;
      lbAt = (i + lbSet.length) % lbSet.length;
      lbImg.src = lbSet[lbAt].src;
      lbImg.alt = lbSet[lbAt].alt || '';
    }

    function lbOpen(frame) {
      lbSet = [].slice.call(frame.parentNode.querySelectorAll('img'));
      lbShow(lbSet.indexOf(frame));
      lightbox.classList.add('is-open');
      document.body.classList.add('gallery-open');
    }

    strips.forEach(function (strip) {
      strip.addEventListener('click', function (ev) {
        if (ev.target.tagName === 'IMG') lbOpen(ev.target);
      });
      strip.addEventListener('keydown', function (ev) {
        if (ev.target.tagName !== 'IMG') return;
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); lbOpen(ev.target); }
      });
    });

    lightbox.querySelector('.lightbox-close').addEventListener('click', lbClose);
    lightbox.querySelector('.lightbox-prev').addEventListener('click', function () { lbShow(lbAt - 1); });
    lightbox.querySelector('.lightbox-next').addEventListener('click', function () { lbShow(lbAt + 1); });

    // the backdrop closes it; the photograph and the controls do not
    lightbox.addEventListener('click', function (ev) {
      if (ev.target === lightbox) lbClose();
    });

    document.addEventListener('keydown', function (ev) {
      if (!lightbox.classList.contains('is-open')) return;
      if (ev.key === 'Escape') lbClose();
      else if (ev.key === 'ArrowLeft') lbShow(lbAt - 1);
      else if (ev.key === 'ArrowRight') lbShow(lbAt + 1);
    });
  }

  if (reduced) return;

  /* --- reveals: tag elements here so a no-JS page never hides content --- */
  if (!stage) return;
  var items = [].slice.call(stage.querySelectorAll(
    '.deco, .panel, .band, .photo, .content, .thumbs, .field, .rule'
  )).filter(function (el) {
    return (!header || !header.contains(el)) && !el.classList.contains('hero');
  });

  items.forEach(function (el) {
    el.classList.add('reveal');
    if (el.classList.contains('photo')) el.classList.add('reveal-photo');
    else if (el.classList.contains('rule')) el.classList.add('reveal-line');
    else if (el.classList.contains('content')) el.classList.add('reveal-up');
    else el.classList.add('reveal-block');
  });

  /* stagger within each section so a band arrives as one gesture */
  [].forEach.call(stage.querySelectorAll('.sec'), function (sec) {
    var i = 0;
    [].forEach.call(sec.querySelectorAll('.reveal'), function (el) {
      el.style.setProperty('--d', Math.min(i++ * 70, 420) + 'ms');
    });
  });

  var pending = items.slice();

  function sweep() {
    var vh = window.innerHeight;
    // at the foot of the page nothing can clear the trigger line any more,
    // so release whatever is left
    var atEnd = vh + window.scrollY >= document.documentElement.scrollHeight - 4;
    for (var i = pending.length - 1; i >= 0; i--) {
      var r = pending[i].getBoundingClientRect();
      // Three ways in: the page has bottomed out, the element has crossed the
      // trigger line, or it is sitting wholly inside the viewport. The last
      // one matters for the legal strip, which lives in the bottom 8% of the
      // page and so never crosses the trigger line, and for the blocks that
      // mobile hides outright and reports as a zero-size box.
      if (atEnd ||
          (r.top < vh * 0.92 && r.bottom > 0) ||
          (r.top >= 0 && r.bottom <= vh)) {
        pending[i].classList.add('is-in');
        pending.splice(i, 1);
      }
    }
    if (!pending.length) {
      window.removeEventListener('scroll', sweep);
      window.removeEventListener('resize', sweep);
    }
  }

  // Run straight off the scroll event rather than via requestAnimationFrame:
  // rAF gets throttled in background/headless contexts and would strand
  // elements at opacity 0. The list only shrinks, so the cost is trivial.
  window.addEventListener('scroll', sweep, { passive: true });
  window.addEventListener('resize', sweep);
  sweep();
  setTimeout(sweep, 400);        // again once the inline images have settled
  window.addEventListener('load', sweep);
})();
