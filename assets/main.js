(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Mobile menu */
  var nav = document.querySelector('.nav'), mb = document.querySelector('.menu-btn');
  if (nav && mb) mb.addEventListener('click', function () {
    var open = nav.classList.toggle('open'); mb.setAttribute('aria-expanded', String(open)); mb.textContent = open ? '✕' : '☰';
  });

  /* Scroll progress */
  var bar = document.querySelector('.progress');
  function prog() { var h = document.documentElement; if (bar) bar.style.setProperty('--p', Math.min(1, h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight))); }
  window.addEventListener('scroll', prog, { passive: true }); prog();

  /* Reveal */
  var els = document.querySelectorAll('.rv, .rv-l, .rv-r, .swatches');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (e) { io.observe(e); });
    setTimeout(function () { els.forEach(function (e) { e.classList.add('in'); }); }, 7000);
  } else els.forEach(function (e) { e.classList.add('in'); });

  /* Rotating words */
  var rot = document.getElementById('rot');
  if (rot && !reduce) {
    var words = rot.getAttribute('data-words').split('|'), wi = 0;
    setInterval(function () { rot.classList.add('out'); setTimeout(function () { wi = (wi + 1) % words.length; rot.textContent = words[wi]; rot.classList.remove('out'); }, 350); }, 2400);
  }

  /* Count up */
  if (!reduce) document.querySelectorAll('[data-count]').forEach(function (b) {
    var n = +b.getAttribute('data-count'); if (n < 2) return; var t = 0; b.textContent = '0';
    var iv = setInterval(function () { t++; b.textContent = t; if (t >= n) clearInterval(iv); }, 120);
  });

  /* Live website previews: click to load the real site, scaled to fit */
  function fit(screen) {
    var f = screen.querySelector('iframe'); if (!f) return;
    var mobile = screen.classList.contains('mobile');
    var w = mobile ? 390 : 1440, h = mobile ? 844 : 900;
    if (mobile) {
      var sm = screen.clientHeight / h;
      f.style.transform = 'scale(' + sm + ')'; f.style.height = h + 'px';
      f.style.left = ((screen.clientWidth - w * sm) / 2) + 'px';
    } else {
      var s = screen.clientWidth / w;
      f.style.transform = 'scale(' + s + ')'; f.style.height = (screen.clientHeight / s) + 'px'; f.style.left = '0px';
    }
  }
  function load(screen) {
    if (screen.querySelector('iframe')) return;
    var src = screen.getAttribute('data-src');
    /* External sites can't be shown inside a claude.ai preview; open them in a new tab there */
    if (/^https?:/.test(src) && /claude|anthropic|usercontent/.test(location.hostname)) {
      var a = document.createElement('a'); a.href = src; a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove(); return;
    }
    var ld = document.createElement('div'); ld.className = 'loading'; ld.textContent = 'Loading live website…'; screen.appendChild(ld);
    var f = document.createElement('iframe');
    f.src = src; f.title = screen.getAttribute('data-title') || 'Live website'; f.setAttribute('loading', 'lazy');
    f.addEventListener('load', function () { ld.remove(); });
    setTimeout(function () { if (ld.parentNode) ld.remove(); }, 8000);
    screen.appendChild(f); fit(screen);
    var p = screen.querySelector('.play'); if (p) p.remove();
    var img = screen.querySelector(':scope > img'); if (img) img.style.visibility = 'hidden';
    var br = screen.closest('.browser'); if (br) br.classList.add('is-live');
  }
  document.querySelectorAll('.screen[data-src]').forEach(function (sc) {
    var p = sc.querySelector('.play'); if (p) p.addEventListener('click', function () { load(sc); });
  });
  document.querySelectorAll('.viewtoggle').forEach(function (vt) {
    var sc = document.getElementById(vt.getAttribute('data-for'));
    vt.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        vt.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        sc.classList.toggle('mobile', b.getAttribute('data-v') === 'mobile');
        load(sc); fit(sc);
      });
    });
  });
  window.addEventListener('resize', function () { document.querySelectorAll('.screen').forEach(fit); });

  /* Thumbnails swap the preview image */
  document.querySelectorAll('.thumbs').forEach(function (th) {
    var sc = document.getElementById(th.getAttribute('data-for'));
    th.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        var ifr = sc.querySelector('iframe'); if (ifr) { ifr.remove(); var br = sc.closest('.browser'); if (br) br.classList.remove('is-live'); }
        var img = sc.querySelector(':scope > img'); img.style.visibility = 'visible';
        img.style.opacity = '0'; setTimeout(function () { img.src = b.querySelector('img').src; img.alt = b.querySelector('img').alt; img.style.opacity = '1'; }, 180);
        img.style.transition = 'opacity .3s';
        if (!sc.querySelector('.play') && sc.getAttribute('data-src')) {
          var p = document.createElement('button'); p.type = 'button'; p.className = 'play'; p.innerHTML = '<span>Try the live website</span>';
          p.addEventListener('click', function () { load(sc); }); sc.appendChild(p);
        }
      });
    });
  });

  /* Tabs */
  document.querySelectorAll('[role="tablist"]').forEach(function (tl) {
    var tabs = tl.querySelectorAll('[role="tab"]');
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        tabs.forEach(function (x) { var on = x === t; x.setAttribute('aria-selected', String(on)); document.getElementById(x.getAttribute('aria-controls')).hidden = !on; });
      });
    });
  });

  /* Copy colour swatches */
  var toast = document.querySelector('.toast');
  document.querySelectorAll('.sw[data-hex]').forEach(function (s) {
    s.addEventListener('click', function () {
      var hex = s.getAttribute('data-hex');
      function done(msg) { if (!toast) return; toast.textContent = msg; toast.classList.add('show'); setTimeout(function () { toast.classList.remove('show'); }, 1400); }
      try { navigator.clipboard.writeText(hex).then(function () { done('Copied ' + hex); }, function () { done(hex); }); } catch (e) { done(hex); }
    });
  });

  /* Typewriter in the hero */
  var ty = document.getElementById('typed');
  if (ty && !reduce) {
    var tw = ty.getAttribute('data-words').split('|'), ti = 0, tc = tw[0].length, del = false;
    setTimeout(function step() {
      var w = tw[ti];
      if (!del) { tc++; if (tc > w.length) { del = true; return setTimeout(step, 1800); } }
      else { tc--; if (tc === 0) { del = false; ti = (ti + 1) % tw.length; } }
      ty.textContent = tw[ti].slice(0, tc) || '\u00a0';
      setTimeout(step, del ? 35 : 70);
    }, 2200);
  }
  /* Ring follows the mouse a little */
  var rs = document.getElementById('ringstage');
  if (rs && !reduce && window.matchMedia('(hover: hover)').matches) {
    rs.addEventListener('pointermove', function (e) { var r = rs.getBoundingClientRect(); var x = (e.clientX - r.left) / r.width - .5; rs.style.perspectiveOrigin = (50 + x * 30) + '% 40%'; });
  }

  /* Copy contact details */
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.getAttribute('data-copy'), lbl = b.textContent;
      function ok(m) { b.textContent = m; setTimeout(function () { b.textContent = lbl; }, 1500); }
      function sel() { var el = b.closest('.cway').querySelector('.sel'); var r = document.createRange(); r.selectNodeContents(el); var s = getSelection(); s.removeAllRanges(); s.addRange(r); ok('Selected'); }
      try { navigator.clipboard.writeText(v).then(function () { ok('Copied ✓'); }, sel); } catch (e) { sel(); }
    });
  });
})();
