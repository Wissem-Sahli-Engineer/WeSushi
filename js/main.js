(() => {
  const CFG = window.WESSUSHI || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = !!window.gsap;
  const waLink = text => `https://wa.me/${(CFG.whatsapp || '').replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
  const BOXES = (CFG.boxes && CFG.boxes.length ? CFG.boxes : [{ pieces: 8, price: 12 }, { pieces: 10, price: 15 }]);
  const dt = n => `${n} DT`;

  /* ---------- prices everywhere come from config.js ---------- */
  const fillPrices = () => {
    $('#heroPrices').innerHTML = BOXES.map(b => `<span class="price-chip">${b.pieces} pièces <b>${dt(b.price)}</b></span>`).join('');
    const facts = $$('.fact');
    BOXES.slice(0, 2).forEach((b, i) => {
      const n = $('.count', facts[i]);
      n.dataset.to = b.price;
      n.textContent = b.price;
      $('.fact__small', facts[i]).textContent = `Box de ${b.pieces} pièces`;
    });
    $('#stickybar span').textContent = `Commander · dès ${dt(Math.min(...BOXES.map(b => b.price)))}`;
  };

  /* ---------- contact and map ---------- */
  const fillContact = () => {
    const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5M8 5h11v11"/></svg>';
    const row = (label, href, sub) => href
      ? `<a class="biglink" href="${href}" target="_blank" rel="noopener"><span>${label}</span>${arrow}</a>`
      : `<p class="biglink biglink--off"><span>${label}</span><small>${sub}</small></p>`;
    const num = (CFG.whatsapp || '').replace(/\D/g, '');
    const ig = (CFG.instagram || '').replace(/^@/, '');
    $('#bigLinks').innerHTML =
      row('WhatsApp', num && waLink('Bonjour WesSushi !'), 'Bientôt en ligne') +
      row('Instagram', ig && `https://instagram.com/${encodeURIComponent(ig)}`, 'Bientôt en ligne');
    $('#mapZone').textContent = CFG.zone || '';
    $('#mapAddr').textContent = CFG.address || '';
    const q = encodeURIComponent(CFG.mapQuery || CFG.zone || '');
    $('#mapLink').href = CFG.mapUrl || `https://www.google.com/maps/search/?api=1&query=${q}`;
    $('#mapLoad').addEventListener('click', () => {
      const f = document.createElement('iframe');
      f.src = `https://www.google.com/maps?q=${q}&output=embed`;
      f.title = 'Carte : où récupérer ta box WesSushi';
      f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      $('#map').replaceChildren(f);
    });
    $('#year').textContent = new Date().getFullYear();
  };

  /* ---------- order: several box sizes, each with its own quantity ---------- */
  const initOrder = () => {
    const MAX = CFG.maxPerBox || 10;
    const qty = BOXES.map((_, i) => (i === 0 ? 1 : 0));
    const form = $('#orderForm');
    const send = $('#orderSend');
    const name = $('#orderName');
    $('#boxes').innerHTML = BOXES.map((b, i) => `
      <div class="boxopt" data-i="${i}">
        <div><p class="boxopt__name">${b.pieces} pièces</p><p class="boxopt__price">${dt(b.price)}</p></div>
        <div class="qty" role="group" aria-label="Box de ${b.pieces} pièces">
          <button type="button" data-d="-1" aria-label="Retirer une box de ${b.pieces}">−</button>
          <output aria-live="polite">0</output>
          <button type="button" data-d="1" aria-label="Ajouter une box de ${b.pieces}">+</button>
        </div>
      </div>`).join('');
    const totals = () => ({
      boxes: qty.reduce((a, n) => a + n, 0),
      pieces: qty.reduce((a, n, i) => a + n * BOXES[i].pieces, 0),
      price: qty.reduce((a, n, i) => a + n * BOXES[i].price, 0),
    });
    const message = () => {
      const t = totals();
      const mode = form.elements.mode.value;
      const lines = ['Bonjour WesSushi ! Je voudrais commander :'];
      qty.forEach((n, i) => { if (n) lines.push(`• ${n} box de ${BOXES[i].pieces} pièces (${dt(n * BOXES[i].price)})`); });
      lines.push(`Total : ${t.boxes} box, ${t.pieces} pièces, ${dt(t.price)}`);
      lines.push(`• ${mode === 'Livraison' ? 'En livraison' : 'Je viens la chercher'}`);
      lines.push(`• Prénom : ${name.value.trim()}`);
      const addr = $('#orderAddr').value.trim();
      const note = $('#orderNote').value.trim();
      if (mode === 'Livraison' && addr) lines.push(`• Adresse : ${addr}`);
      if (note) lines.push(`• Précision : ${note}`);
      return lines.join('\n');
    };
    const sync = () => {
      $$('.boxopt').forEach((el, i) => {
        $('output', el).textContent = qty[i];
        el.classList.toggle('is-on', qty[i] > 0);
        $('[data-d="-1"]', el).disabled = qty[i] <= 0;
        $('[data-d="1"]', el).disabled = qty[i] >= MAX;
      });
      const t = totals();
      $('#totalDetail').textContent = t.boxes ? `${t.boxes} box · ${t.pieces} pièces` : 'Aucune box';
      $('#totalPrice').textContent = dt(t.price);
      $('#splitHint').hidden = t.boxes < 2;
      if (t.boxes) $('#emptyErr').hidden = true;
      $('#addrField').hidden = form.elements.mode.value !== 'Livraison';
      send.href = waLink(message());
    };
    $('#boxes').addEventListener('click', e => {
      const b = e.target.closest('button[data-d]');
      if (!b) return;
      const i = +b.closest('.boxopt').dataset.i;
      qty[i] = Math.max(0, Math.min(MAX, qty[i] + +b.dataset.d));
      sync();
    });
    form.addEventListener('input', () => { if (name.value.trim()) $('#orderErr').hidden = true; sync(); });
    form.addEventListener('submit', e => e.preventDefault());
    send.addEventListener('click', e => {
      if (!totals().boxes) {
        e.preventDefault();
        $('#emptyErr').hidden = false;
        return;
      }
      if (name.value.trim()) return;
      e.preventDefault();
      $('#orderErr').hidden = false;
      name.focus();
    });
    sync();
  };

  /* ---------- reviews ---------- */
  const initReviews = () => {
    const KEY = 'wessushi-my-review';
    const wall = $('#reviewsWall');
    const form = $('#reviewForm');
    const send = $('#revSend');
    const err = $('#revErr');
    const name = $('#revName');
    const text = $('#revText');
    const read = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
    const write = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* private mode */ } };
    const card = (r, own) => {
      const el = document.createElement('article');
      el.className = 'rev';
      const stars = document.createElement('p');
      stars.className = 'rev__stars';
      stars.textContent = '★'.repeat(r.stars) + '☆'.repeat(5 - r.stars);
      stars.setAttribute('aria-label', `${r.stars} sur 5`);
      const body = document.createElement('p');
      body.textContent = r.text;
      const who = document.createElement('p');
      who.className = 'rev__name';
      who.textContent = r.name;
      el.append(stars, body, who);
      if (own) {
        const tag = document.createElement('p');
        tag.className = 'rev__own';
        tag.textContent = 'Ton avis, visible ici pour toi jusqu\'à sa publication';
        el.append(tag);
      }
      return el;
    };
    const render = () => {
      const list = (CFG.reviews || []).filter(r => r && r.text);
      const mine = read();
      wall.replaceChildren(...list.map(r => card(r)), ...(mine ? [card(mine, true)] : []));
      $('#reviewsLead').textContent = list.length ? 'Ce que nos clients en pensent.' : 'Les premiers avis arrivent. Le tien peut être le premier.';
    };
    const payload = () => ({ name: name.value.trim(), text: text.value.trim(), stars: +form.elements.stars.value });
    const sync = () => {
      const r = payload();
      send.href = waLink(`Mon avis sur WesSushi : ${'★'.repeat(r.stars)}\n${r.text}\n\n${r.name}`);
    };
    form.addEventListener('input', () => { if (name.value.trim() && text.value.trim()) err.hidden = true; sync(); });
    form.addEventListener('submit', e => e.preventDefault());
    send.addEventListener('click', e => {
      const r = payload();
      if (!r.name || !r.text) {
        e.preventDefault();
        err.hidden = false;
        (r.name ? text : name).focus();
        return;
      }
      write(r);
      render();
    });
    render();
    sync();
  };

  const initMenu = () => {
    const burger = $('#burger');
    const menu = $('#menu');
    const set = open => {
      menu.hidden = !open;
      burger.setAttribute('aria-expanded', open);
      $('.sr', burger).textContent = open ? 'Fermer le menu' : 'Ouvrir le menu';
      document.documentElement.style.overflow = open ? 'hidden' : '';
      if (window.__lenis) open ? window.__lenis.stop() : window.__lenis.start();
      $('#nav').classList.toggle('is-solid', open || scrollY > innerHeight * .7);
    };
    burger.addEventListener('click', () => set(menu.hidden));
    $$('a', menu).forEach(a => a.addEventListener('click', () => set(false)));
    addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { set(false); burger.focus(); } });
  };

  fillPrices();
  fillContact();
  initOrder();
  initReviews();
  initMenu();

  if (!hasGsap) { $('.loader')?.remove(); return; }

  gsap.registerPlugin(ScrollTrigger);
  gsap.config({ nullTargetWarn: false });
  ScrollTrigger.config({ ignoreMobileResize: true });

  let lenis = null;
  if (!RM && window.Lenis) {
    lenis = new Lenis({ lerp: .11 });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const t = $(id);
    if (!t) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(t, { offset: id === '#top' ? 0 : -8, duration: 1.2 });
    else t.scrollIntoView();
  }));

  /* ---------- hero ---------- */
  const hero = $('.hero');
  const ttl = $('.ttl');
  ttl.innerHTML = [...ttl.dataset.word].map(c => `<span class="ttl__m"><span class="ttl__c">${c}</span></span>`).join('');
  const letters = $$('.ttl__c');
  const bowl = $('.c-bowl .mv');
  const pieceA = $('.c-pa .mv');
  const pieceB = $('.c-pb .mv');

  if (!RM) {
    gsap.to('.c-bowl img', { y: -8, rotation: 1.6, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    gsap.to('.c-pa img', { y: 14, rotation: -7, duration: 2.8, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    gsap.to('.c-pb img', { y: -14, rotation: 7, duration: 3.1, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    gsap.to('.waves svg', { xPercent: -50, duration: 14, ease: 'none', repeat: -1 });
    gsap.to('#stage', { yPercent: 10, scale: .9, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero__sun', { yPercent: 30, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  }
  if (FINE && !RM) {
    const parts = $$('.par').map(el => ({
      d: +el.dataset.depth,
      x: gsap.quickTo(el, 'xPercent', { duration: 1, ease: 'power3' }),
      y: gsap.quickTo(el, 'yPercent', { duration: 1, ease: 'power3' }),
    }));
    hero.addEventListener('pointermove', e => {
      const nx = e.clientX / innerWidth - .5;
      const ny = e.clientY / innerHeight - .5;
      parts.forEach(p => { const k = p.d > 25 ? .9 : .16; p.x(-nx * p.d * k); p.y(-ny * p.d * k); });
    });
    $$('.btn, .nav__cta').forEach(b => {
      const x = gsap.quickTo(b, 'x', { duration: .5, ease: 'power3' });
      const y = gsap.quickTo(b, 'y', { duration: .5, ease: 'power3' });
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        x((e.clientX - r.left - r.width / 2) * .18);
        y((e.clientY - r.top - r.height / 2) * .28);
      });
      b.addEventListener('pointerleave', () => { x(0); y(0); });
    });
  }

  /* ---------- nav and phone order bar ---------- */
  const nav = $('#nav');
  let last = 0;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate(st) {
      const y = st.scroll();
      const past = y > innerHeight * .7;
      if ($('#menu').hidden) nav.classList.toggle('is-solid', past);
      nav.classList.toggle('is-away', past && y > last + 2 && $('#menu').hidden);
      if (y < last - 2) nav.classList.remove('is-away');
      last = y;
    },
  });
  const sticky = $('#stickybar');
  const sb = { past: false, inOrder: false };
  const stickySync = () => sticky.classList.toggle('is-on', sb.past && !sb.inOrder);
  ScrollTrigger.create({ trigger: hero, start: 'bottom 60%', endTrigger: '#avis', end: 'top 90%', onToggle: t => { sb.past = t.isActive; stickySync(); } });
  ScrollTrigger.create({ trigger: '#commander', start: 'top 80%', end: 'bottom 40%', onToggle: t => { sb.inOrder = t.isActive; stickySync(); } });

  /* ---------- essentials: tiles rise, prices count up ---------- */
  if (!RM) {
    gsap.from('.fact', { y: 50, autoAlpha: 0, duration: .8, stagger: .08, ease: 'power3.out', clearProps: 'transform,opacity,visibility', scrollTrigger: { trigger: '#facts', start: 'top 88%', once: true } });
    $$('.count').forEach(n => {
      const o = { v: 0 };
      gsap.to(o, { v: +n.dataset.to, duration: 1.1, ease: 'power2.out', onUpdate: () => { n.textContent = Math.round(o.v); }, scrollTrigger: { trigger: '#facts', start: 'top 88%', once: true } });
    });
  }

  /* ---------- the box in 3D: it opens as you scroll ---------- */
  const rows = $$('#legend li');
  const setRow = i => rows.forEach((r, k) => r.classList.toggle('is-on', k <= i));
  const webgl = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } })();
  if (!RM && webgl) {
    const ex = $('.explode');
    ex.classList.add('is-scrub');
    let box = null, prog = 0, seen = false;
    ScrollTrigger.create({
      trigger: ex, start: 'top 180%', once: true,
      onEnter: () => import('./box3d.js?v=7')
        .then(m => {
          box = m.createBox3D($('#exScene'), { onReady: () => ex.classList.add('is-3d') });
          box.setProgress(prog);
          box.setVisible(seen);
        })
        .catch(() => { ex.classList.remove('is-scrub'); setRow(2); }),
    });
    ScrollTrigger.create({
      trigger: ex, start: 'top top', end: 'bottom bottom',
      onUpdate(st) {
        prog = st.progress;
        if (box) box.setProgress(prog);
        setRow(prog < .4 ? -1 : prog < .52 ? 0 : prog < .64 ? 1 : 2);
      },
    });
    ScrollTrigger.create({ trigger: ex, start: 'top bottom', end: 'bottom top', onToggle: st => { seen = st.isActive; if (box) box.setVisible(seen); } });
  } else {
    setRow(2);
  }

  /* ---------- reveals ---------- */
  if (!RM) {
    $$('.order__head, .boxes, .total, .about__photo, .about__text, .kitchen li, .reviews__head, .review-form, .biglink, .map').forEach(el => {
      gsap.from(el, { y: 36, autoAlpha: 0, duration: .9, ease: 'power3.out', clearProps: 'transform,opacity,visibility', scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
    });
    gsap.from('.foot__logo', { rotation: -120, scale: .6, ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'center bottom', scrub: true } });
  }

  /* ---------- opening ---------- */
  const loader = $('.loader');
  const dots = $$('.loader__dots i');
  const assets = ['box-crispy.webp', 'morceau-avocat.webp', 'morceau-crevette.webp', 'logo-embleme.png'];
  const intro = () => {
    if (RM) { loader?.remove(); return; }
    gsap.set(letters, { yPercent: 112 });
    gsap.set([bowl, pieceA, pieceB], { scale: .6, autoAlpha: 0, rotation: -25 });
    gsap.set('.hero__sun', { scale: 0 });
    gsap.set('.hero__copy > *, .hero__jp', { autoAlpha: 0, y: 12 });
    gsap.timeline()
      .to(loader, { yPercent: -100, duration: .55, ease: 'expo.inOut', onComplete: () => loader.remove() })
      .to('.hero__sun', { scale: 1, duration: .8, ease: 'back.out(1.6)' }, .2)
      .to(letters, { yPercent: 0, duration: .7, stagger: .03, ease: 'expo.out' }, .24)
      .to(bowl, { scale: 1, autoAlpha: 1, rotation: 0, duration: .8, ease: 'back.out(1.3)' }, .3)
      .to([pieceA, pieceB], { scale: 1, autoAlpha: 1, rotation: 0, duration: .7, stagger: .05, ease: 'back.out(1.5)' }, .4)
      .to('.hero__copy > *, .hero__jp', { autoAlpha: 1, y: 0, duration: .45, stagger: .05, ease: 'power3.out' }, .5);
  };
  if (lenis) window.scrollTo(0, 0);
  let done = 0;
  let fired = false;
  const started = performance.now();
  const once = () => {
    if (fired) return;
    fired = true;
    gsap.delayedCall(Math.max(0, 350 - (performance.now() - started)) / 1000, intro);
  };
  assets.forEach(a => {
    const im = new Image();
    const tick = () => {
      done++;
      dots.slice(0, Math.round(done / assets.length * dots.length)).forEach(d => d.classList.add('on'));
      if (done === assets.length) once();
    };
    im.onload = tick;
    im.onerror = tick;
    im.src = `assets/img/${a}`;
  });
  setTimeout(once, 4000);
  addEventListener('load', () => ScrollTrigger.refresh());
})();
