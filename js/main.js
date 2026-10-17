(function () {
  'use strict';
  var root = document.documentElement, body = document.body;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Reveals (hero waits for the intro) ---------- */
  var hero = $('#home');
  function reveal(el) { el.classList.add('is-in'); }
  function startHero() {
    $$('.rv', hero).forEach(function (el) { el.style.setProperty('--rd', el.getAttribute('data-d') || 0); reveal(el); });
  }
  setTimeout(startHero, root.classList.contains('intro-on') ? 3250 : 60);
  var rest = $$('.rv').filter(function (el) { return !hero.contains(el); });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    rest.forEach(function (el) { io.observe(el); });
    var fieldObserver = new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.target.classList.toggle('field-active', e.isIntersecting); });
    }, { rootMargin: '120px 0px' });
    $$('.hero, .exhibit__stage').forEach(function (el) { fieldObserver.observe(el); });
  } else {
    rest.forEach(reveal);
    $$('.hero, .exhibit__stage').forEach(function (el) { el.classList.add('field-active'); });
  }

  /* ---------- Menu ---------- */
  var toggle = $('.menu-toggle'), menu = $('#menu'), scrim = $('.menu-scrim');
  function setMenu(open) {
    menu.classList.toggle('is-open', open);
    body.classList.toggle('menu-open', open);
    scrim.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) setTimeout(function () { var a = $('a', menu); if (a) a.focus({ preventScroll: true }); }, 60);
  }
  toggle.addEventListener('click', function () { setMenu(!menu.classList.contains('is-open')); });
  scrim.addEventListener('click', function () { setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (!menu.classList.contains('is-open')) return;
    if (e.key === 'Escape') { setMenu(false); toggle.focus(); return; }
    if (e.key === 'Tab') { // keep focus inside the open panel and its close button
      var f = $$('a,button', menu).concat([toggle]);
      var i = f.indexOf(document.activeElement);
      if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
  // Close the panel when an in-page link is used; the browser handles the scroll (scroll-padding clears the bar).
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function () {
      if (menu.classList.contains('is-open')) { setMenu(false); }
    });
  });

  /* ---------- Scroll variable + avatar pointer parallax ---------- */
  var ticking = false, resizePending = false, lastScrollY = -1;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      if (resizePending) { resizePending = false; size(); }
      var scrollY = Math.round(window.pageYOffset);
      if (scrollY !== lastScrollY) {
        lastScrollY = scrollY;
        root.style.setProperty('--scroll', String(scrollY));
      }
      updateExhibit();
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { resizePending = true; onScroll(); });

  var frame = $('[data-parallax]');
  if (frame && !reduced && window.matchMedia('(pointer:fine)').matches) {
    var raf = 0, tx = 0, ty = 0, pointerX = 0, pointerY = 0;
    hero.addEventListener('pointermove', function (e) {
      pointerX = e.clientX; pointerY = e.clientY;
      if (!raf) raf = requestAnimationFrame(function () {
        raf = 0;
        var r = hero.getBoundingClientRect();
        tx = (pointerX - r.left) / r.width - 0.5; ty = (pointerY - r.top) / r.height - 0.5;
        frame.style.setProperty('--px', (tx * 2).toFixed(3));
        frame.style.setProperty('--py', (ty * 2).toFixed(3));
        hero.style.setProperty('--field-px', (tx * 10).toFixed(2) + 'px');
        hero.style.setProperty('--field-py', (ty * 10).toFixed(2) + 'px');
        hero.style.setProperty('--field-back-x', (tx * -6).toFixed(2) + 'px');
        hero.style.setProperty('--field-back-y', (ty * -6).toFixed(2) + 'px');
      });
    });
    hero.addEventListener('pointerleave', function () {
      if (raf) cancelAnimationFrame(raf);
      raf = 0; tx = 0; ty = 0;
      frame.style.setProperty('--px', '0');
      frame.style.setProperty('--py', '0');
      hero.style.setProperty('--field-px', '0');
      hero.style.setProperty('--field-py', '0');
      hero.style.setProperty('--field-back-x', '0');
      hero.style.setProperty('--field-back-y', '0');
    });
  }

  /* ---------- Live previews: scale each iframe to its frame ---------- */
  var previews = $$('.preview');
  function fit(p) {
    var f = $('iframe', p), w = parseFloat(p.getAttribute('data-w')) || 1440;
    if (!f || !p.clientWidth) return;
    var s = p.clientWidth / w;
    f.style.width = w + 'px'; f.style.height = (p.clientHeight / s) + 'px'; f.style.transform = 'scale(' + s + ')';
  }
  if ('ResizeObserver' in window) { var ro = new ResizeObserver(function (es) { es.forEach(function (e) { fit(e.target); }); }); previews.forEach(function (p) { ro.observe(p); }); }
  else { previews.forEach(fit); window.addEventListener('resize', function () { previews.forEach(fit); }); }

  /* ---------- Design Showcase: one artwork at a time, driven by scroll ---------- */
  var ex = $('[data-exhibit]'), pieces = $$('.piece'), hud = $('.hud'), stage = $('.exhibit__stage');
  var N = pieces.length, per = 0, stageHeight = 0, on = false, lastPos = null, preparedIndex = -1;
  var idxEl = $('.hud__idx'), titleEl = $('.hud__title'), lastIdx = -1;
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function clamp(v) { return Math.max(0, Math.min(1, v)); }
  function size() {
    if (!on) return;
    stageHeight = stage.getBoundingClientRect().height;
    per = stageHeight * (window.innerWidth <= 860 ? .75 : .85);
    ex.style.height = (stageHeight + per * (N - 1)) + 'px';
    lastPos = null;
  }
  function prepareImages(index) {
    for (var i = index; i < Math.min(index + 2, N); i++) {
      var image = $('img', pieces[i]);
      if (image.loading === 'lazy') image.loading = 'eager';
    }
  }
  function updateExhibit() {
    if (!on || !per) return;
    var top = ex.getBoundingClientRect().top, pos = -top;
    if (pos === lastPos) return;
    lastPos = pos;
    var total = per * (N - 1);
    var cur = Math.max(0, Math.min(N - 1, Math.floor(pos / per + 0.3)));
    pieces.forEach(function (p, i) {
      var u = pos / per - i;
      if (u <= -0.3 || (i !== N - 1 && u >= 1)) {
        if (p.style.visibility !== 'hidden') p.style.visibility = 'hidden';
        if (p.classList.contains('is-active')) p.classList.remove('is-active');
        return;
      }
      var art = p.firstElementChild, img = art.firstElementChild;
      if (p.style.visibility !== 'visible') p.style.visibility = 'visible';
      if (!p.classList.contains('is-active')) p.classList.add('is-active');
      if (p.style.zIndex !== String(i + 1)) p.style.zIndex = String(i + 1);
      var e = clamp((u + 0.3) / 0.3), x = i === N - 1 ? 0 : clamp((u - 0.7) / 0.3);
      var ee = ease(e), xx = ease(x);
      art.style.clipPath = 'inset(' + ((1 - ee) * 100).toFixed(2) + '% 0 ' + (xx * 100).toFixed(2) + '% 0 round 6px)';
      art.style.opacity = String(1 - xx * .85);
      art.style.transform = 'translateY(' + ((1 - ee) * 36 - xx * 5).toFixed(2) + 'px) scale(' + (0.94 + 0.06 * ee - xx * .06).toFixed(4) + ')';
      img.style.transform = 'scale(' + (1.12 - 0.12 * ee).toFixed(4) + ')';
    });
    if (cur !== lastIdx) {
      lastIdx = cur; idxEl.textContent = (cur + 1) + ' / ' + N;
      titleEl.textContent = pieces[cur].getAttribute('data-title') + ' · ' + pieces[cur].getAttribute('data-kind');
    }
    if (top < window.innerHeight * 1.5 && pos < total + per && cur !== preparedIndex) {
      preparedIndex = cur;
      prepareImages(cur);
    }
    var prog = clamp(pos / total);
    stage.style.setProperty('--prog', prog.toFixed(4));
    stage.style.setProperty('--lx', (25 + prog * 50).toFixed(1));
    stage.style.setProperty('--ly', (35 + Math.sin(prog * 6.28) * 12).toFixed(1));
    stage.style.setProperty('--gy', (pos * -0.15).toFixed(1));
  }
  function enableExhibit() {
    if (on || reduced || !ex) return;
    on = true; ex.classList.add('is-pinned'); root.classList.add('exhibit-on');
    ex.parentNode.classList.add('is-pinned'); size(); updateExhibit();
  }
  // CSS hooks both on the section and the exhibit, so either selector works
  enableExhibit();
  window.addEventListener('load', function () { size(); updateExhibit(); });
})();
