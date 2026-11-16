/* Sumeeth's Portfolio — interactions
   1. Cinematic boot: typed mono → "/" pendulum → title → idea line → veil out
   2. Six-stage hero sequence (per sketches): PORTFOLIO → particle avatar →
      greeting → name+role → tagline → bottom strip (letter-by-letter)
   3. Word ticker · 4. Diary page flips (bottom-to-top) · 5. Scroll reveals
   6. Scroll-spy nav · 7. Live preview scaling · 8. Design showcase (pinned)
   9. Hero pointer parallax · 10. Folio scroll parallax
   11. Technical ambient background (drifting nodes + connection lines)
   All vanilla, reduced-motion aware, no continuous heavy loops. */
(function () {
  'use strict';
  var html = document.documentElement, body = document.body;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /* ================= intro timing registry ================= */
  var booting = html.classList.contains('booting');
  var TIMELINE = [];
  function T(fn, ms) { var id = setTimeout(fn, ms); TIMELINE.push(id); return id; }
  function clearTimers() { TIMELINE.forEach(clearTimeout); TIMELINE.length = 0; }

  /* ================= typing engine ================= */
  /* Letter-by-letter reveal. A hidden sizer span keeps the layout stable
     while the typed copy overlays it exactly. */
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
  /* word-segment typer: "←" separators are typed into crimson spans */
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

  /* ================= 1. PARTICLE AVATAR FORMATION ================= */
  var wrap = $('[data-avatar]'), canvas = $('.avatar__canvas'), img = $('.avatar__img', wrap) || $('.avatar__img');
  var particleState = { running: false, raf: 0 };
  function sampleAvatar() {
    if (!img || !img.naturalWidth || !canvas || !canvas.getContext) return null;
    var G = 128, off = document.createElement('canvas');
    off.width = G; off.height = G;
    var octx = off.getContext('2d', { willReadFrequently: true });
    octx.drawImage(img, 0, 0, G, G);
    var data;
    try { data = octx.getImageData(0, 0, G, G).data; } catch (e) { return null; }
    var pts = [], i, x, y, r, g, b, lum;
    for (y = 0; y < G; y++) for (x = 0; x < G; x++) {
      i = (y * G + x) * 4;
      r = data[i]; g = data[i + 1]; b = data[i + 2];
      lum = (r + g + b) / 3;
      if (lum > 34) pts.push({ x: x / G, y: y / G, c: 'rgb(' + r + ',' + g + ',' + b + ')', l: lum });
    }
    var MAX = 3600;
    if (pts.length > MAX) { /* thin out, keep brightest bias */
      pts.sort(function (a, b2) { return b2.l - a.l; });
      pts = pts.slice(0, MAX);
    }
    return pts;
  }
  function runParticles(done) {
    var pts = sampleAvatar();
    if (!pts || !pts.length) { done(); return; }
    var rect = wrap.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    var ctx = canvas.getContext('2d');
    var cw = canvas.width, chh = canvas.height, cx = cw / 2, cy = chh / 2;
    var parts = pts.map(function (p) {
      var ang = Math.random() * Math.PI * 2, rad = (0.4 + Math.random() * 0.9) * cw * 0.75;
      var tx = p.x * cw, ty = p.y * chh;
      return {
        sx: cx + Math.cos(ang) * rad, sy: cy + Math.sin(ang) * rad,
        tx: tx, ty: ty, c: p.c,
        d: Math.random() * 0.25 + ((ty / chh) * 0.45),
        s: (dpr > 1.4 ? 2.1 : 1.6)
      };
    });
    var T0 = performance.now(), D = 1250;
    particleState.running = true;
    function ease(t) { return 1 - Math.pow(1 - t, 3); }
    function frame(now) {
      if (!particleState.running) return;
      var el = now - T0;
      ctx.clearRect(0, 0, cw, chh);
      var all = true;
      for (var k = 0; k < parts.length; k++) {
        var p = parts[k];
        var t = clamp((el / 1000 - p.d) * (1000 / D), 0, 1);
        if (t < 1) all = false;
        var e = ease(t);
        var x = p.sx + (p.tx - p.sx) * e, y = p.sy + (p.ty - p.sy) * e;
        var a = e * (1 - Math.max(0, t - 0.94) / 0.06);
        ctx.globalAlpha = a;
        ctx.fillStyle = p.c;
        ctx.fillRect(x - p.s / 2, y - p.s / 2, p.s, p.s);
      }
      if (el < (D / 1000 + 0.55) * 1000 && !all) particleState.raf = requestAnimationFrame(frame);
      else { particleState.running = false; ctx.clearRect(0, 0, cw, chh); done(); }
    }
    particleState.raf = requestAnimationFrame(frame);
  }
  function stopParticles() {
    particleState.running = false;
    if (particleState.raf) cancelAnimationFrame(particleState.raf);
    particleState.raf = 0;
  }

  /* ================= 2. BOOT + SIX-STAGE HERO SEQUENCE ================= */
  var tickerEl = $('[data-ticker]'), tickerWord = $('.ticker__word');
  var navEl = $('.nav'), heroTagline = $('.hero__tagline');
  var introDone = false;

  var tyGreet = typer($('.identity__hi'));
  var tyName = typer($('.identity__name'));
  var tyRoleC = typer($('.identity__role-c'));
  var tyRoleD = typer($('.identity__role-d'));
  var tyTag = typer($('.tag-in'));
  var tyStrip = segTyper($('.hero__strip'));
  var typers = [tyGreet, tyName, tyRoleC, tyRoleD, tyTag].filter(Boolean);

  function revealAll() {
    var f = $('.hero__folio'); if (f) f.classList.add('in');
    $$('.st').forEach(function (el) { el.classList.add('in'); });
    if (navEl) navEl.classList.add('in');
    typers.forEach(function (t) { t.fill(); });
    if (tyStrip) tyStrip.fill();
    if (heroTagline) heroTagline.classList.add('is-done');
  }

  function finishBoot(instant) {
    clearTimers();
    stopParticles();
    booting = false;
    if (wrap) wrap.classList.add('is-solid');
    html.classList.remove('booting', 's-slash', 's-site', 's-idea', 's-out');
    revealAll();
    setTick(true);
    startDiaryAutos(true);
    if (!tickerSequencing) startTickCycle();
    introDone = true;
    html.classList.add('intro-done');
  }

  /* Stage 3–6, strictly in order; stage 6 only after stage 5 completes */
  function stage3() {
    if (!tyGreet) { stage4(); return; }
    tyGreet.type(52, stage4);            /* "Hii..!! I am" */
  }
  function stage4() {
    if (!tyName) { stage4done(); return; }
    tyName.type(92, function () {        /* SUMEETH — Bodoni, metallic glow */
      var next = tyRoleD ? function () { tyRoleD.type(58, stage4done); } : stage4done;
      if (tyRoleC) tyRoleC.type(66, next); else next(); /* Creative + Developer */
    });
  }
  function stage4done() {
    if (navEl) navEl.classList.add('in');
    var cta = $('.cta--single'); if (cta) cta.classList.add('in');
    T(stage5, 260);
  }
  function stage5() {
    if (!tyTag) { stage6(); return; }
    tyTag.type(17, function () {         /* tagline, bottom-right */
      if (heroTagline) heroTagline.classList.add('is-done');
      startTickerSequence();
      T(stage6, 320);
    });
  }
  function stage6() {
    var strip = $('.hero__strip');
    if (strip) strip.classList.add('in');
    if (!tyStrip) { settle(); return; }
    tyStrip.type(19, function () { T(settle, 420); });  /* bottom strip, last */
  }
  function settle() {
    if (introDone) return;
    introDone = true;
    html.classList.add('intro-done');
    startDiaryAutos(false);
    if (!tickerSequencing) startTickCycle();
  }

  function startAvatar() {
    var started = false;
    var begin = function () {
      if (started || introDone) return;
      started = true;
      if (!wrap) { stage3(); return; }
      runParticles(function () {
        if (introDone) return;
        wrap.classList.add('is-solid');   /* artwork takes over from particles */
        T(stage3, 280);
      });
    };
    if (img && (!img.complete || !img.naturalWidth)) img.addEventListener('load', begin, { once: true });
    T(begin, img && (!img.complete || !img.naturalWidth) ? 2600 : 0);
  }

  function runHeroSequence() {
    var folio = $('.hero__folio');
    /* Stage 1 — giant PORTFOLIO reveal */
    T(function () { if (folio) folio.classList.add('in'); }, 320);
    /* Stage 2 — particle avatar formation */
    T(startAvatar, 900);
  }

  function playIntro() {
    /* pre-build every typer so un-typed copy is hidden from the first frame
       (sizer holds the layout, nothing raw is ever visible behind the veil) */
    typers.forEach(function (t) { t.build(); });
    if (tyStrip) tyStrip.build();
    var veilCode = $('#veilCode'), veilSite = $('#veilSite'), veilIdea = $('#veilIdea');
    var LINES = [
      '> boot      : sumeeth.dev — portfolio',
      '> profile   : creative developer',
      '> practice  : websites · applications · designs',
      '> render    : </>'
    ];
    var full = LINES.join('\n');
    var SLASH_AT = full.indexOf('/'); /* the "/" in "</>" is the trigger */
    var stop = false;

    function skip() {
      if (stop) return;
      stop = true;
      finishBoot(true);
    }
    function typeLine(el, text, speed, done) {
      if (!el) { done(); return; }
      var i = 0;
      (function t() {
        if (stop) return;
        i++;
        el.textContent = text.slice(0, i);
        if (i < text.length) T(t, speed);
        else done();
      })();
    }
    function beginTyping() {
      if (!veilCode) { onSlash(); return; }
      var i = 0, out = '';
      (function tick() {
        if (stop || !booting) return;
        if (i >= full.length) { onSlash(); return; }
        var ch = full[i]; out += ch; veilCode.textContent = out;
        if (i === SLASH_AT) { onSlash(); return; } /* slash typed → reveal */
        i++;
        T(tick, 10 + (ch === '\n' ? 90 : 0) + Math.random() * 8);
      })();
    }
    function onSlash() {
      if (stop) return;
      html.classList.add('s-slash'); /* the "/" pendulum loading beat */
      T(function () {
        if (stop) return;
        html.classList.add('s-site'); /* "</ Sumeeth's Portfolio />" */
        typeLine(veilSite, '</ Sumeeth\u2019s Portfolio />', 22, function () {
          T(function () {
            if (stop) return;
            html.classList.add('s-idea'); /* "Let's bring your IDEA live!!" */
            typeLine(veilIdea, 'Let\u2019s bring your IDEA live!!', 22, function () {
              T(veilOut, 560);
            });
          }, 340);
        });
      }, 850);
    }
    function veilOut() {
      if (stop) return;
      html.classList.add('s-out'); /* veil fades while Stage 1 begins */
      T(function () {
        html.classList.remove('booting', 's-slash', 's-site', 's-idea');
        booting = false;
        runHeroSequence();
      }, 850);
    }

    var skipBtn = $('#veilSkip');
    if (skipBtn) {
      skipBtn.addEventListener('click', skip);
      skipBtn.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); skip(); }
      });
    }
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape' || e.key === 'Enter') { skip(); document.removeEventListener('keydown', esc); }
    });

    T(beginTyping, 350);
    /* failsafes: never leave the visitor on an empty screen.
       The first covers a stalled veil; the second is a last-resort
       completion if the whole sequence somehow never settles. */
    T(function () { if (html.classList.contains('booting')) skip(); }, 13500);
    T(function () { if (!introDone) skip(); }, 26000);
  }

  var introWasWanted = !!window.__SUMEETH_INTRO && booting && !reduced;
  window.__SUMEETH_INTRO_RUNNING = true; /* inline failsafe stands down */
  try {
    if (introWasWanted) playIntro();
    else finishBoot(true);
  } catch (e) { finishBoot(true); }

  /* ================= 3. WORD TICKER ================= */
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
  function startTickerSequence() { /* intro: the four words, one per second */
    tickerSequencing = true;
    swapWord(WORDS[0]); wIdx = 0;
    var i = 1;
    var seq = setInterval(function () {
      if (i >= WORDS.length) { clearInterval(seq); tickerSequencing = false; startTickCycle(); return; }
      swapWord(WORDS[i]); wIdx = i; i++;
    }, 1000);
  }
  function startTickCycle() { /* afterwards: keep cycling, one at a time */
    clearInterval(tickTimer);
    if (reduced || !tickerWord) return;
    tickTimer = setInterval(function () {
      if (document.hidden || !heroVisible) return;
      wIdx = (wIdx + 1) % WORDS.length;
      swapWord(WORDS[wIdx]);
    }, tickFast ? 1000 : 2400);
  }

  /* ================= 4. DIARY PAGE FLIPS (bottom-to-top) ================= */
  var book = $('.diary__book'), pages = $$('.diary__page');
  var NB = pages.length, flips = 0, diaryTimer = 0;
  var heroVisible = true, notesVisible = false;
  function zf(page, k) { page.style.zIndex = k; }
  function applyZ() {
    pages.forEach(function (p, i) {
      if (i < flips) zf(p, 10 + i);
      else zf(p, 100 - i);
    });
  }
  function flipNext(instant) {
    if (flips >= NB - 1) return false;
    var p = pages[flips];
    flips++;
    if (instant) p.classList.add('instant');
    zf(p, 200);
    requestAnimationFrame(function () { p.classList.add('flipped'); });
    setTimeout(function () { p.classList.remove('instant'); applyZ(); }, instant ? 30 : 950);
    return true;
  }
  function startDiaryAutos(instant) {
    if (!book || diaryTimer) return;
    if (reduced || instant) { /* jump straight to the settled state */
      while (flipNext(true)) {}
      return;
    }
    var n = 0;
    diaryTimer = setInterval(function () {
      if (document.hidden || !notesVisible) return;
      if (!flipNext(false) || ++n > NB) { clearInterval(diaryTimer); diaryTimer = 0; }
    }, 1900);
  }
  pages.forEach(function (p) {
    p.addEventListener('click', function () {
      if (reduced) return;
      flipNext(false);
    });
  });

  /* visibility gates: hero drives ticker + ambient; notes drives the diary */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { heroVisible = e.isIntersecting; });
    }, { threshold: 0.12 }).observe($('#home') || body);
    var notesEl = $('#notes');
    if (notesEl) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { notesVisible = e.isIntersecting; });
      }, { threshold: 0.1 }).observe(notesEl);
    } else notesVisible = true;
  } else notesVisible = true;

  /* ================= 5. SCROLL REVEALS ================= */
  var rest = $$('.rv').filter(function (el) { return !el.closest('#home'); });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    rest.forEach(function (el) { io.observe(el); });
  } else rest.forEach(function (el) { el.classList.add('is-in'); });

  /* ================= 6. SCROLL-SPY NAV ================= */
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

  /* ================= 7. LIVE PREVIEW SCALING ================= */
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

  /* ================= 8. DESIGN SHOWCASE (scroll-pinned, motion allowed) ================= */
  var ex = $('[data-exhibit]'), pieces = $$('.piece'), stage = $('.exhibit__stage');
  var N = pieces.length, per = 0, stageH = 0, pinned = false, lastPos = null, prepared = -1;
  var idxEl = $('.hud__idx'), titleEl = $('.hud__title'), lastIdx = -1;
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
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
    var cur = clamp(Math.floor(pos / per + 0.3), 0, N - 1);
    pieces.forEach(function (p, i) {
      var u = pos / per - i;
      if (u <= -0.35 || (i !== N - 1 && u >= 1)) {
        if (p.style.visibility !== 'hidden') p.style.visibility = 'hidden';
        return;
      }
      var art = p.firstElementChild, img2 = art.firstElementChild;
      if (p.style.visibility !== 'visible') p.style.visibility = 'visible';
      if (p.style.zIndex !== String(i + 1)) p.style.zIndex = String(i + 1);
      var eA = ease(clamp((u + 0.3) / 0.3, 0, 1)), xA = ease(i === N - 1 ? 0 : clamp((u - 0.7) / 0.3, 0, 1));
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

  /* single rAF-throttled listener for exhibit scroll updates */
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { ticking = false; updateExhibit(); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { size(); updateExhibit(); });

  /* ================= 9. HERO POINTER PARALLAX (fine pointers only) ================= */
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

  /* ================= 10. FOLIO SCROLL PARALLAX ================= */
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

  /* ================= 11. TECHNICAL AMBIENT BACKGROUND ================= */
  /* Drifting nodes with subtle connection lines — low-CPU, reduced-motion aware. */
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
      var target = window.innerWidth < 760 ? 22 : 36;
      if (anodes.length !== target) {
        anodes = [];
        for (var i = 0; i < target; i++) {
          anodes.push({
            x: Math.random() * aW, y: Math.random() * aH,
            vx: (Math.random() - .5) * .12 * dpr, vy: (Math.random() - .5) * .12 * dpr,
            r: (1 + Math.random() * 1.6) * dpr,
            a: .12 + Math.random() * .28
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
      /* connection lines (crimson, faint) */
      for (var a = 0; a < anodes.length; a++) {
        for (var b = a + 1; b < anodes.length; b++) {
          var dx = anodes[a].x - anodes[b].x, dy = anodes[a].y - anodes[b].y;
          var d2 = dx * dx + dy * dy;
          if (d2 < LINK * LINK) {
            var al = (1 - Math.sqrt(d2) / LINK) * .2;
            actx.strokeStyle = 'rgba(143,36,56,' + al.toFixed(3) + ')';
            actx.lineWidth = 1;
            actx.beginPath();
            actx.moveTo(anodes[a].x, anodes[a].y);
            actx.lineTo(anodes[b].x, anodes[b].y);
            actx.stroke();
          }
        }
      }
      /* nodes (warm beige dots) */
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
    /* run only while the hero is on screen */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { e.isIntersecting ? ambientStart() : ambientStop(); });
      }, { threshold: 0 }).observe(ambient.parentElement || ambient);
    } else ambientStart();
  }
})();
