/* ==============================================================
   WHEN YOU SEE ME — shared behaviour
   Header state, scroll reveals, stage sizing, contact form.
   Every block is guarded by an element check so one file can
   serve every page.
   ============================================================== */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var stage   = document.querySelector('.stage');
  var header  = document.querySelector('.site-header');

  /* --- header: flip to the condensed, grounded state once the page moves --- */
  var ticking = false;
  function syncHeader() {
    document.body.classList.toggle('is-scrolled', window.scrollY > 60);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(syncHeader); }
  }, { passive: true });
  syncHeader();

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

    if (window.innerWidth <= 900) {
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
  window.addEventListener('resize', fitStage);
  window.addEventListener('load', fitStage);

  /* --- contact form ---------------------------------------------
     Wire these to your endpoint of choice; the mailto keeps the page
     working until there is one.
     ------------------------------------------------------------- */
  var message = document.getElementById('message'),
      reset   = document.getElementById('btn-reset'),
      send    = document.getElementById('btn-send');

  if (message && reset && send) {
    reset.addEventListener('click', function () {
      message.value = '';
      message.focus();
    });
    send.addEventListener('click', function () {
      var mail = (document.getElementById('footer-email') || {}).textContent || 'info@whenyouseeme.com';
      window.location.href = 'mailto:' + mail.trim() +
        '?subject=Website%20enquiry&body=' + encodeURIComponent(message.value);
    });
  }

  if (reduced) return;

  /* --- reveals: tag elements here so a no-JS page never hides content --- */
  if (!stage) return;
  var items = [].slice.call(stage.querySelectorAll(
    '.deco, .panel, .photo, .content, .thumbs, .field, .rule'
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
