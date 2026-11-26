/* SONIX — interactions
   1. Cinematic intro: "</>" → particle portrait → "Let's bring your IDEA live!!" → SONIX
   2. Hero sequence: PORTFOLIO → greeting → name + role → tagline → strip
   3. Word ticker · 4. Diary beside the portrait (horizontal flips, stops on Digital Solutions)
   5. Scroll reveals · 6. Scroll-spy nav · 7. Live preview scaling
   8. Design showcase (pinned) · 9. Portrait pointer parallax · 10. Folio parallax
   11. Technical ambient background · 12. Skill-tile pointer glow
   All vanilla, reduced-motion aware, no continuous heavy loops. */
(function () {
  'use strict';
  var html = document.documentElement, body = document.body;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /* ================= timeline registry ================= */
  var booting = html.classList.contains('booting');
  var TIMELINE = [];
  function T(fn, ms) { var id = setTimeout(fn, ms); TIMELINE.push(id); return id; }
  function clearTimers() { TIMELINE.forEach(clearTimeout); TIMELINE.length = 0; }

  /* ================= typing engine ================= */
  function typer(el) {
    if (!el) return null;
    var full = (el.getAttribute('data-text') || el.textContent).replace(/\s+/g, ' ').trim();
    var aria = el.getAttribute('data-aria') || full;
    var o = { el: el, full: full, out: null, done: false };
    o.build = function () {
      if (this.out) return;
      el.textContent = '';
      el.setAttribute('aria-label', aria);
      var s = document.createElement('span'); s.className = 't-sizer'; s.setAttribute('aria-hidden', 'true'); s.textContent = full;
      var t = document.createElement('span'); t.className = 't-out'; t.setAttribute('aria-hidden', 'true');
      el.appendChild(s); el.appendChild(t);
      this.out = t;
    };
    o.fill = function () {
      this.build();
      this.out.textContent = full;
      el.classList.add('is-typed');
      this.done = true;
    };
    o.type = function (speed, done) {
      this.build();
      if (this.done) { if (done) done(); return; }
      var self = this, i = 0;
      if (!full.length) { this.done = true; el.classList.add('is-typed'); if (done) done(); return; }
      (function step() {
        if (self.done) return;
        i++;
        self.out.textContent = full.slice(0, i);
        if (i < full.length) T(step, speed + Math.floor(Math.random() * 8));
        else { self.done = true; self.el.classList.add('is-typed'); if (done) done(); }
      })();
    };
    return o;
  }
  function segTyper(el) {
    if (!el) return null;
    var full = (el.textContent || '').replace(/\s+/g, ' ').trim();
    var tokens = full.split(' ');
    var obj = { el: el, full: full, out: null, spans: [], tokens: tokens, done: false };
    obj.build = function () {
      if (this.out) return;
      el.textContent = '';
      el.setAttribute('aria-label', full);
      var s = document.createElement('span'); s.className = 't-sizer'; s.setAttribute('aria-hidden', 'true'); s.textContent = full;
      var t = document.createElement('span'); t.className = 't-out'; t.setAttribute('aria-hidden', 'true');
      var self = this;
      tokens.forEach(function (tok, i) {
        var sp = document.createElement('span');
        if (tok === '\u2190') sp.className = 'strip-arrow';
        t.appendChild(sp);
        if (i < tokens.length - 1) t.appendChild(document.createTextNode(' '));
        self.spans.push(sp);
      });
      el.appendChild(s); el.appendChild(t);
      this.out = t;
    };
    obj.fill = function () {
      var self = this;
      this.build();
      this.tokens.forEach(function (tok, i) { self.spans[i].textContent = tok; });
      el.classList.add('is-typed');
      this.done = true;
    };
    obj.type = function (speed, done) {
      this.build();
      if (this.done) { if (done) done(); return; }
      var self = this, si = 0, ci = 0, finished = false;
      if (!full.length) { this.done = true; if (done) done(); return; }
      (function step() {
        if (finished || self.done) return;
        var tok = self.tokens[si];
        ci++;
        self.spans[si].textContent = tok.slice(0, ci);
        if (ci < tok.length) { T(step, speed); return; }
        si++; ci = 0;
        if (si >= self.spans.length) { finished = true; self.done = true; self.el.classList.add('is-typed'); if (done) done(); return; }
        T(step, speed);
      })();
    };
    return obj;
  }

  /* ================= particle portrait engine ================= */
  var runs = [];
  function samplePixels(imgEl, grid) {
    if (!imgEl || !imgEl.naturalWidth) return null;
    var G = grid || 130, off = document.createElement('canvas');
    off.width = G; off.height = G;
    var octx = off.getContext('2d', { willReadFrequently: true });
    if (!octx) return null;
    octx.drawImage(imgEl, 0, 0, G, G);
    var data;
    try { data = octx.getImageData(0, 0, G, G).data; } catch (e) { return null; }
    var pts = [], x, y, i, r, g, b, lum, br, bg, bb;
    for (y = 0; y < G; y++) for (x = 0; x < G; x++) {
      i = (y * G + x) * 4;
      r = data[i]; g = data[i + 1]; b = data[i + 2];
      lum = (r + g + b) / 3;
      if (lum > 16) {
        /* the artwork sits on black, so lift the sampled tones for the particle pass */
        br = Math.min(255, Math.round(r * 1.65 + 32));
        bg = Math.min(255, Math.round(g * 1.5 + 26));
        bb = Math.min(255, Math.round(b * 1.5 + 26));
        pts.push({ x: x / G, y: y / G, c: 'rgb(' + br + ',' + bg + ',' + bb + ')', l: lum });
      }
    }
    pts.sort(function (a, b2) { return b2.l - a.l; });
    return pts;
  }
  function runParticles(canvas, imgEl, opts, done) {
    opts = opts || {};
    if (!canvas || !canvas.getContext) { if (done) done(); return null; }
    var pts = samplePixels(imgEl, opts.grid);
    if (!pts || !pts.length) { if (done) done(); return null; }
    var rect = (opts.sizeEl || canvas).getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round((rect.width || 280) * dpr));
    canvas.height = Math.max(1, Math.round((rect.height || 280) * dpr));
    var ctx = canvas.getContext('2d');
    if (!ctx) { if (done) done(); return null; }
    var cw = canvas.width, ch = canvas.height, cx = cw / 2, cy = ch / 2;
    var max = opts.max || 3400;
    if (pts.length > max) pts = pts.slice(0, max);
    var parts = pts.map(function (p) {
      var ang = Math.random() * Math.PI * 2, rad = (0.45 + Math.random() * 0.9) * cw * 0.72;
      return {
        sx: cx + Math.cos(ang) * rad, sy: cy + Math.sin(ang) * rad,
        tx: p.x * cw, ty: p.y * ch, c: p.c,
        d: Math.random() * 0.22 + (p.y * 0.4),
        s: dpr > 1.4 ? 2.9 : 2.1
      };
    });
    var t0 = performance.now(), dur = opts.duration || 1400, alive = true, raf = 0;
    function ease(t) { return 1 - Math.pow(1 - t, 3); }
    function frame(now) {
      if (!alive) return;
      var el = now - t0;
      ctx.clearRect(0, 0, cw, ch);
      var all = true;
      for (var k = 0; k < parts.length; k++) {
        var p = parts[k];
        var t = clamp((el / 1000 - p.d) * (1000 / dur), 0, 1);
        if (t < 1) all = false;
        var e = ease(t);
        var x = p.sx + (p.tx - p.sx) * e, y = p.sy + (p.ty - p.sy) * e;
        var a = e * (opts.fade === false ? 1 : (1 - Math.max(0, t - 0.94) / 0.06)) * 0.95;
        ctx.globalAlpha = a;
        ctx.fillStyle = p.c;
        ctx.fillRect(x - p.s / 2, y - p.s / 2, p.s, p.s);
      }
      if (!all && el < dur + 2400) { raf = requestAnimationFrame(frame); return; }
      alive = false;
      if (!opts.hold) ctx.clearRect(0, 0, cw, ch);
      else ctx.globalAlpha = 1;
      if (done) done();
    }
    raf = requestAnimationFrame(frame);
    var stop = function () {
      alive = false;
      if (raf) cancelAnimationFrame(raf);
      try { ctx.clearRect(0, 0, cw, ch); } catch (e) {}
    };
    runs.push(stop);
    return stop;
  }
  function stopParticles() {
    runs.forEach(function (stop) { try { stop(); } catch (e) {} });
    runs.length = 0;
  }

  /* ================= refs ================= */
  var wrap = $('[data-avatar]');
  var avatarImg = wrap ? $('.avatar__img', wrap) : $('.avatar__img');
  var navEl = $('.nav'), heroTagline = $('.hero__tagline');
  var tickerWord = $('.ticker__word');

  var tyGreet = typer($('.identity__hi'));
  var tyName = typer($('.identity__name'));
  var tyRoleC = typer($('.identity__role-c'));
  var tyRoleD = typer($('.identity__role-d'));
  var tyTag = typer($('.tag-in'));
  var tyStrip = segTyper($('.hero__strip'));
  var typers = [tyGreet, tyName, tyRoleC, tyRoleD, tyTag].filter(Boolean);

  var introSettled = false, heroVisible = true, diaryStarted = false;

  function revealAll() {
    var f = $('.hero__folio'); if (f) f.classList.add('in');
    $$('.st').forEach(function (el) { el.classList.add('in'); });
    if (navEl) navEl.classList.add('in');
    typers.forEach(function (t) { t.fill(); });
    if (tyStrip) tyStrip.fill();
    if (heroTagline) heroTagline.classList.add('is-done');
  }

  /* ================= hero sequence ================= */
  function stage3() {
    if (!tyGreet) { stage4(); return; }
    tyGreet.type(42, stage4);
  }
  function stage4() {
    if (!tyName) { stage4done(); return; }
    tyName.type(74, function () {
      if (tyRoleC) tyRoleC.type(52, function () {
        if (tyRoleD) tyRoleD.type(38, stage4done); else stage4done();
      }); else stage4done();
    });
  }
  function stage4done() {
    if (navEl) navEl.classList.add('in');
    var cta = $('.cta--single'); if (cta) cta.classList.add('in');
    T(stage5, 240);
  }
  function stage5() {
    if (!tyTag) { stage6(); return; }
    tyTag.type(15, function () {
      if (heroTagline) heroTagline.classList.add('is-done');
      startTickerSequence();
      T(stage6, 300);
    });
  }
  function stage6() {
    var strip = $('.hero__strip');
    if (strip) strip.classList.add('in');
    if (!tyStrip) { settle(); return; }
    tyStrip.type(16, function () { T(settle, 360); });
  }
  function settle() {
    if (introSettled) return;
    introSettled = true;
    html.classList.add('intro-done');
    startDiary();
    if (!tickerSequencing) startTickCycle();
  }

  function finishBoot() {
    clearTimers();
    stopParticles();
    booting = false;
    if (wrap) wrap.classList.add('is-solid');
    html.classList.remove('booting', 's-mark', 's-form', 's-idea', 's-sign', 's-out');
    revealAll();
    setTick(true);
    introSettled = true;
    html.classList.add('intro-done');
    startDiary();
    if (!tickerSequencing) startTickCycle();
  }

  /* ================= 1. cinematic intro ================= */
  function playIntro() {
    typers.forEach(function (t) { t.build(); });
    if (tyStrip) tyStrip.build();

    var veil = $('#veil'), veilCanvas = $('#veilCanvas');
    var stop = false;

    function skip() {
      if (stop) return;
      stop = true;
      finishBoot();
    }

    T(function () { html.classList.add('s-mark'); }, 160);

    /* the "</>" gives way to the portrait assembling from particles */
    T(function () {
      if (stop) return;
      html.classList.add('s-form');
      if (veilCanvas) runParticles(veilCanvas, avatarImg, { max: 7200, grid: 178, duration: 1700, hold: true, fade: false, sizeEl: veilCanvas.parentElement.parentElement }, null);
    }, 1400);

    T(function () { if (!stop) html.classList.add('s-idea'); }, 2150);
    T(function () { if (!stop) html.classList.add('s-sign'); }, 3150);

    /* compose the hero under the veil, then dissolve it */
    T(function () {
      if (stop) return;
      if (wrap) wrap.classList.add('is-solid');
      var f = $('.hero__folio'); if (f) f.classList.add('in');
      if (navEl) navEl.classList.add('in');
    }, 4600);

    T(function () { if (!stop) html.classList.add('s-out'); }, 5150);

    T(function () {
      if (stop) return;
      stop = true;
      html.classList.remove('booting', 's-mark', 's-form', 's-idea', 's-sign');
      booting = false;
      if (wrap) wrap.classList.add('is-solid');
      html.classList.add('intro-done');
      if (veil) veil.setAttribute('hidden', '');
      stage3();
      T(startDiary, 500);
    }, 6000);

    var skipBtn = $('#veilSkip');
    if (skipBtn) skipBtn.addEventListener('click', skip);
    function onKey(e) {
      if (e.key === 'Escape' || e.key === 'Enter') {
        skip();
        document.removeEventListener('keydown', onKey);
      }
    }
    document.addEventListener('keydown', onKey);

    T(function () { if (html.classList.contains('booting')) skip(); }, 10000);
  }

  var introWanted = !!window.__SONIX_INTRO && booting && !reduced;
  window.__SONIX_INTRO_RUNNING = true;
  try {
    if (introWanted) playIntro(); else finishBoot();
  } catch (e) { finishBoot(); }

  /* ================= 3. word ticker ================= */
  var WORDS = ['Website', 'Application', 'Designs', 'Digital Solution'];
  var wIdx = WORDS.indexOf(tickerWord ? tickerWord.textContent.replace('\u00a0', ' ') : '');
  if (wIdx < 0) wIdx = WORDS.length - 1;
  var tickTimer = 0, tickFast = true, tickerSequencing = false;
  function setTick(normal) { tickFast = !normal; }
  function swapWord(text) {
    if (!tickerWord) return;
    tickerWord.classList.add('out');
    setTimeout(function () {
      if (!document.hidden) tickerWord.textContent = text;
      tickerWord.classList.remove('out');
    }, 310);
  }
  function startTickerSequence() {
    tickerSequencing = true;
    swapWord(WORDS[0]); wIdx = 0;
    var i = 1;
    var seq = setInterval(function () {
      if (i >= WORDS.length) { clearInterval(seq); tickerSequencing = false; startTickCycle(); return; }
      swapWord(WORDS[i]); wIdx = i; i++;
    }, 1000);
  }
  function startTickCycle() {
    clearInterval(tickTimer);
    if (reduced || !tickerWord) return;
    tickTimer = setInterval(function () {
      if (document.hidden || !heroVisible) return;
      wIdx = (wIdx + 1) % WORDS.length;
      swapWord(WORDS[wIdx]);
    }, tickFast ? 1000 : 2400);
  }

  /* ================= 4. the diary beside the portrait ================= */
  var book = $('[data-diary-book]'), pages = $$('.diary__page');
  var nextBtn = $('#diaryNext'), nowEl = $('#diaryNow'), liveEl = $('#diaryLive');
  var NB = pages.length, flips = 0, diaryTimer = 0, diaryVisible = false;
  var NAMES = ['Websites', 'Applications', 'Designs', 'Digital Solutions'];

  function applyZ() {
    pages.forEach(function (p, i) {
      p.style.zIndex = i < flips ? String(10 + i) : String(100 - i);
    });
  }
  function updateDiaryUI() {
    var idx = clamp(flips, 0, NB - 1);
    if (nowEl) nowEl.textContent = String(idx + 1).padStart(2, '0');
    if (nextBtn) {
      var last = flips >= NB - 1;
      nextBtn.disabled = last;
      nextBtn.innerHTML = last ? 'End of notes <span aria-hidden="true">\u00b7</span>' : 'Turn page <span aria-hidden="true">\u21bb</span>';
    }
    if (liveEl) liveEl.textContent = NAMES[idx] + ' — page ' + (idx + 1) + ' of ' + NB;
  }
  function flipNext(instant) {
    if (flips >= NB - 1) return false;
    var p = pages[flips];
    flips++;
    if (instant) p.classList.add('instant');
    p.style.zIndex = '200';
    requestAnimationFrame(function () { p.classList.add('flipped'); });
    setTimeout(function () {
      p.classList.remove('instant');
      applyZ();
      updateDiaryUI();
    }, instant ? 30 : 1050);
    updateDiaryUI();
    return true;
  }
  function stopDiaryAuto() {
    if (diaryTimer) { clearInterval(diaryTimer); diaryTimer = 0; }
  }
  function startDiary() {
    if (diaryStarted || reduced || !book || !pages.length) return;
    diaryStarted = true;
    applyZ();
    updateDiaryUI();
    var n = 0;
    diaryTimer = setInterval(function () {
      if (document.hidden || !diaryVisible) return;
      if (!flipNext(false)) { stopDiaryAuto(); return; }
      n++;
      if (n >= NB - 1) stopDiaryAuto();
    }, 2100);
  }
  if (book && pages.length) {
    applyZ();
    updateDiaryUI();
    if (nextBtn) nextBtn.addEventListener('click', function () {
      stopDiaryAuto();
      flipNext(false);
    });
    book.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      stopDiaryAuto();
      flipNext(false);
    });
  }

  /* visibility gates: hero drives ticker + ambient; diary drives its own flips */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { heroVisible = e.isIntersecting; });
    }, { threshold: 0.12 }).observe($('#home') || body);
    var diaryEl = $('.diary');
    if (diaryEl) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { diaryVisible = e.isIntersecting; });
      }, { threshold: 0.2 }).observe(diaryEl);
    } else diaryVisible = true;
  } else diaryVisible = true;

  /* ================= 5. scroll reveals ================= */
  var rest = $$('.rv').filter(function (el) { return !el.closest('#home'); });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    rest.forEach(function (el) { io.observe(el); });
  } else rest.forEach(function (el) { el.classList.add('is-in'); });

  /* ================= 6. scroll-spy nav ================= */
  var spyLinks = $$('[data-spy]');
  if (spyLinks.length && 'IntersectionObserver' in window) {
    var map = { works: 'works', designs: 'works' };
    var current = '';
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          var name = e.target.id;
          var want = map[name] || name;
          if (want !== current) {
            current = want;
            spyLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('data-spy') === want); });
          }
        }
      });
    }, { rootMargin: '-42% 0px -52% 0px' });
    ['home', 'about', 'skills', 'works', 'designs', 'contact'].forEach(function (id) {
      var s = document.getElementById(id); if (s) spy.observe(s);
    });
  }

  /* ================= 7. live preview scaling ================= */
  var previews = $$('.preview');
  function fit(p) {
    var f = $('iframe', p), w = parseFloat(p.getAttribute('data-w')) || 1440;
    if (!f || !p.clientWidth) return;
    var s = p.clientWidth / w;
    f.style.width = w + 'px';
    f.style.height = (p.clientHeight / s) + 'px';
    f.style.transform = 'scale(' + s + ')';
  }
  if ('ResizeObserver' in window) {
    var ro = new ResizeObserver(function (es) { es.forEach(function (e) { fit(e.target); }); });
    previews.forEach(function (p) { ro.observe(p); });
  } else {
    previews.forEach(fit);
    window.addEventListener('resize', function () { previews.forEach(fit); });
  }

  /* ================= 8. design showcase (scroll-pinned, motion allowed) ================= */
  var ex = $('[data-exhibit]'), pieces = $$('.piece'), stage = $('.exhibit__stage');
  var N = pieces.length, per = 0, stageH = 0, pinned = false, lastPos = null, prepared = -1;
  var idxEl = $('.hud__idx'), titleEl = $('.hud__title'), lastIdx = -1;
  function easeOut(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function size() {
    if (!pinned || !stage) return;
    stageH = stage.getBoundingClientRect().height;
    per = stageH * (window.innerWidth <= 860 ? .72 : .82);
    ex.style.height = (stageH + per * (N - 1)) + 'px';
    lastPos = null;
  }
  function prepareImages(index) {
    for (var i = index; i < Math.min(index + 2, N); i++) {
      var im = $('img', pieces[i]);
      if (im && im.loading === 'lazy') im.loading = 'eager';
    }
  }
  function updateExhibit() {
    if (!pinned || !per || !stage) return;
    var top = ex.getBoundingClientRect().top, pos = -top;
    if (pos === lastPos) return;
    lastPos = pos;
    var total = per * (N - 1);
    /* while the section heading is still on screen the stage has not reached the
       top yet — show the first piece instead of an empty pinned stage */
    var visiblePos = Math.max(0, pos);
    var cur = clamp(Math.floor(visiblePos / per + 0.3), 0, N - 1);
    pieces.forEach(function (p, i) {
      var u = visiblePos / per - i;
      if (u <= -0.35 || (i !== N - 1 && u >= 1)) {
        if (p.style.visibility !== 'hidden') p.style.visibility = 'hidden';
        return;
      }
      var art = p.firstElementChild, img2 = art.firstElementChild;
      if (p.style.visibility !== 'visible') p.style.visibility = 'visible';
      if (p.style.zIndex !== String(i + 1)) p.style.zIndex = String(i + 1);
      var eA = easeOut(clamp((u + 0.3) / 0.3, 0, 1)), xA = easeOut(i === N - 1 ? 0 : clamp((u - 0.7) / 0.3, 0, 1));
      art.style.clipPath = 'inset(' + ((1 - eA) * 100).toFixed(2) + '% 0 ' + (xA * 100).toFixed(2) + '% 0 round 8px)';
      art.style.opacity = String(1 - xA * .85);
      art.style.transform = 'translateY(' + ((1 - eA) * 34 - xA * 4).toFixed(2) + 'px) scale(' + (0.94 + 0.06 * eA - xA * .06).toFixed(4) + ')';
      img2.style.transform = 'scale(' + (1.12 - 0.12 * eA).toFixed(4) + ')';
    });
    if (cur !== lastIdx) {
      lastIdx = cur;
      if (idxEl) idxEl.textContent = (cur + 1) + ' / ' + N;
      if (titleEl) {
        var pc = pieces[cur];
        titleEl.textContent = (pc.getAttribute('data-title') || '') + ' \u00b7 ' + (pc.getAttribute('data-kind') || '');
      }
    }
    if (top < window.innerHeight * 1.5 && pos < total + per && cur !== prepared) {
      prepared = cur; prepareImages(cur);
    }
    stage.style.setProperty('--prog', clamp(pos / (total || 1), 0, 1).toFixed(4));
  }
  function enableExhibit() {
    if (pinned || reduced || !ex || N < 2) return;
    pinned = true;
    ex.classList.add('is-pinned');
    size(); updateExhibit();
  }
  enableExhibit();
  window.addEventListener('load', function () { size(); updateExhibit(); });

  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { ticking = false; updateExhibit(); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { size(); updateExhibit(); });

  /* ================= 9. portrait pointer parallax ================= */
  if (wrap && !reduced && window.matchMedia('(pointer:fine)').matches) {
    var heroEl = $('#home'), raf = 0;
    heroEl.addEventListener('pointermove', function (e) {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        var r = heroEl.getBoundingClientRect();
        wrap.style.setProperty('--px', (((e.clientX - r.left) / r.width - .5) * 1.6).toFixed(3));
        wrap.style.setProperty('--py', (((e.clientY - r.top) / r.height - .5) * 1.6).toFixed(3));
      });
    });
    heroEl.addEventListener('pointerleave', function () {
      wrap.style.setProperty('--px', '0');
      wrap.style.setProperty('--py', '0');
    });
  }

  /* ================= 10. folio scroll parallax ================= */
  var folioWord = $('#folioWord');
  if (folioWord && !reduced) {
    var fTicking = false;
    window.addEventListener('scroll', function () {
      if (fTicking || !heroVisible) return; fTicking = true;
      requestAnimationFrame(function () {
        fTicking = false;
        var y = window.scrollY || window.pageYOffset || 0;
        if (y > window.innerHeight * 1.2) return;
        folioWord.style.transform = 'translate3d(0,' + (y * 0.16).toFixed(1) + 'px,0)';
      });
    }, { passive: true });
  }

  /* ================= 11. technical ambient background ================= */
  var ambient = $('#ambientCanvas');
  if (ambient && !reduced && ambient.getContext) {
    var actx = ambient.getContext('2d');
    var anodes = [], aW = 0, aH = 0, aRunning = false, aRaf = 0, aLast = 0;

    function ambientResize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var rect = ambient.parentElement.getBoundingClientRect();
      aW = Math.round(rect.width * dpr);
      aH = Math.round(rect.height * dpr);
      ambient.width = aW;
      ambient.height = aH;
      var target = window.innerWidth < 760 ? 20 : 34;
      if (anodes.length !== target) {
        anodes = [];
        for (var i = 0; i < target; i++) {
          anodes.push({
            x: Math.random() * aW, y: Math.random() * aH,
            vx: (Math.random() - .5) * .12 * dpr, vy: (Math.random() - .5) * .12 * dpr,
            r: (1 + Math.random() * 1.6) * dpr,
            a: .12 + Math.random() * .26
          });
        }
      }
    }

    function ambientFrame(now) {
      if (!aRunning) return;
      var dt = Math.min(32, now - (aLast || now)); aLast = now;
      actx.clearRect(0, 0, aW, aH);
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var LINK = 130 * dpr;
      for (var i = 0; i < anodes.length; i++) {
        var n = anodes[i];
        n.x += n.vx * dt * .06; n.y += n.vy * dt * .06;
        if (n.x < -10) n.x = aW + 10; else if (n.x > aW + 10) n.x = -10;
        if (n.y < -10) n.y = aH + 10; else if (n.y > aH + 10) n.y = -10;
      }
      for (var a = 0; a < anodes.length; a++) {
        for (var b = a + 1; b < anodes.length; b++) {
          var dx = anodes[a].x - anodes[b].x, dy = anodes[a].y - anodes[b].y;
          var d2 = dx * dx + dy * dy;
          if (d2 < LINK * LINK) {
            var al = (1 - Math.sqrt(d2) / LINK) * .18;
            actx.strokeStyle = 'rgba(143,36,56,' + al.toFixed(3) + ')';
            actx.lineWidth = 1;
            actx.beginPath();
            actx.moveTo(anodes[a].x, anodes[a].y);
            actx.lineTo(anodes[b].x, anodes[b].y);
            actx.stroke();
          }
        }
      }
      for (var k = 0; k < anodes.length; k++) {
        var nd = anodes[k];
        actx.globalAlpha = nd.a;
        actx.fillStyle = '#E8D9C3';
        actx.beginPath();
        actx.arc(nd.x, nd.y, nd.r, 0, Math.PI * 2);
        actx.fill();
      }
      actx.globalAlpha = 1;
      aRaf = requestAnimationFrame(ambientFrame);
    }
    function ambientStart() {
      if (aRunning) return;
      aRunning = true; aLast = 0;
      aRaf = requestAnimationFrame(ambientFrame);
    }
    function ambientStop() {
      aRunning = false;
      if (aRaf) cancelAnimationFrame(aRaf);
      aRaf = 0;
    }
    ambientResize();
    window.addEventListener('resize', function () { ambientResize(); }, { passive: true });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { e.isIntersecting ? ambientStart() : ambientStop(); });
      }, { threshold: 0 }).observe(ambient.parentElement || ambient);
    } else ambientStart();
  }

  /* ================= 12. skill-tile pointer glow ================= */
  if (window.matchMedia('(pointer:fine)').matches && !reduced) {
    $$('[data-glow]').forEach(function (tile) {
      tile.addEventListener('pointermove', function (e) {
        var r = tile.getBoundingClientRect();
        tile.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 100).toFixed(1) + '%');
        tile.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 100).toFixed(1) + '%');
      });
    });
  }
})();
