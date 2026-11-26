/* =========================================================
   Portfólio · Everton Dias
   Animações: GSAP + ScrollTrigger + Lenis (rolagem suave)
   ========================================================= */

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const hasGSAP = !!(window.gsap && window.ScrollTrigger);

/* ---------------------------------------------------------
   Funções comuns (funcionam com ou sem animação)
   --------------------------------------------------------- */

// Link ativo no menu
const navLinks = $$('.nav-links a');
const secIO = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) navLinks.forEach((a) => a.classList.toggle('active', a.dataset.sec === e.target.id));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
$$('section[id]').forEach((s) => secIO.observe(s));

// Comparador rascunho x final
const compare = $('#compare');
let dragging = false, autoSweep = true;
const setPos = (x) => {
  const r = compare.getBoundingClientRect();
  const pct = Math.max(0, Math.min(100, ((x - r.left) / r.width) * 100));
  compare.style.setProperty('--pos', pct + '%');
};
compare.addEventListener('pointerdown', (e) => { dragging = true; autoSweep = false; compare.setPointerCapture(e.pointerId); setPos(e.clientX); });
compare.addEventListener('pointermove', (e) => dragging && setPos(e.clientX));
compare.addEventListener('pointerup', () => (dragging = false));
let sweepT = 0;
(function sweep() {
  if (!autoSweep) return;
  sweepT += 0.012;
  compare.style.setProperty('--pos', (50 + Math.sin(sweepT) * 32) + '%');
  requestAnimationFrame(sweep);
})();

// Formulário rápido
$('#form').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = e.target.querySelector('input');
  window.location.href = 'mailto:evertonkauandias@gmail.com?subject=Contato pelo portfólio&body=' + encodeURIComponent(input.value);
  $('.form-msg').hidden = false;
  input.value = '';
});

// Filtro + busca de projetos
const cards = $$('.card');
const search = $('#search');
const empty = $('.empty');
let filter = 'todos';
function matches(c) {
  const q = search.value.trim().toLowerCase();
  return (filter === 'todos' || c.dataset.cat === filter) &&
    (!q || c.dataset.name.includes(q) || c.textContent.toLowerCase().includes(q));
}
function applyFilter(animate) {
  const show = () => {
    let shown = 0;
    cards.forEach((c) => {
      const ok = matches(c);
      c.classList.toggle('hide', !ok);
      if (ok) shown++;
    });
    empty.hidden = shown > 0;
    if (animate && hasGSAP) {
      gsap.fromTo(cards.filter((c) => !c.classList.contains('hide')),
        { y: 40, opacity: 0, filter: 'blur(8px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: .7, stagger: .08, ease: 'expo.out', clearProps: 'filter' });
      ScrollTrigger.refresh();
    }
  };
  if (animate && hasGSAP) {
    gsap.to(cards.filter((c) => !c.classList.contains('hide')), { y: -20, opacity: 0, duration: .25, stagger: .03, ease: 'power2.in', onComplete: show });
  } else show();
}
$$('.tab').forEach((t) => t.addEventListener('click', () => {
  $$('.tab').forEach((x) => x.classList.remove('active'));
  t.classList.add('active');
  filter = t.dataset.filter;
  applyFilter(true);
}));
search.addEventListener('input', () => applyFilter(false));

/* ---------------------------------------------------------
   Sem GSAP ou com "reduzir movimento": versão simples
   --------------------------------------------------------- */
// Obs.: as animações rodam mesmo com "reduzir movimento" ligado no sistema.
if (!hasGSAP) {
  const loader = $('.loader');
  if (loader) loader.remove();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: .15 });
  $$('.reveal').forEach((el) => io.observe(el));
  $$('[data-count]').forEach((el) => { el.textContent = el.dataset.count + (el.dataset.suffix || ''); });
} else {
  cinema();
}

/* ---------------------------------------------------------
   Versão cinematográfica
   --------------------------------------------------------- */
function cinema() {
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('gsap');
  $$('.reveal').forEach((el) => el.classList.remove('reveal'));
  $('.loader').style.animation = 'none';

  /* ---------- quebra texto em letras ou palavras ---------- */
  function split(el, mode = 'chars') {
    const out = [];
    const wrap = (txt) => {
      const o = document.createElement('span'); o.className = 'ch';
      const i = document.createElement('span'); i.className = 'ci'; i.textContent = txt;
      o.appendChild(i); out.push(i); return o;
    };
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            if (mode === 'words') frag.appendChild(wrap(p));
            else {
              const w = document.createElement('span'); w.className = 'wd';
              [...p].forEach((c) => w.appendChild(wrap(c)));
              frag.appendChild(w);
            }
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') {
          // mantém a pontuação (ex.: o "." vermelho) colada na palavra anterior
          const prev = n.previousSibling, first = n.firstChild;
          if (mode === 'chars' && prev && prev.classList && prev.classList.contains('wd') && first && first.nodeType === 3) {
            const lead = first.textContent.match(/^\S+/);
            if (lead && !/\s/.test(first.textContent)) {
              [...lead[0]].forEach((c) => { const ch = wrap(c); ch.firstChild.className += ' ' + n.className; prev.appendChild(ch); });
              n.remove();
              return;
            }
          }
          walk(n);
        }
      });
    };
    walk(el);
    el.classList.add('is-split');
    return out;
  }

  /* ---------- rolagem suave ---------- */
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: .085, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  document.documentElement.style.scrollBehavior = 'auto';
  window.scrollTo(0, 0);

  /* ---------- barra de progresso ---------- */
  gsap.to('.progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .3 } });

  /* ---------- menu some ao descer, volta ao subir ---------- */
  const nav = $('.nav');
  ScrollTrigger.create({
    start: 'top -120',
    end: 'max',
    onUpdate: (self) => gsap.to(nav, { yPercent: self.direction === 1 ? -100 : 0, duration: .45, ease: 'power3.out', overwrite: 'auto' }),
    onLeaveBack: () => gsap.to(nav, { yPercent: 0, duration: .45, overwrite: 'auto' }),
  });

  /* =====================================================
     ABERTURA + ENTRADA DO HERO
     ===================================================== */
  const heroWord = $('.hero-word');
  const wordChars = split(heroWord, 'chars');
  const nameChars = split($('.hero-name'), 'chars');
  gsap.set(heroWord, { x: 0, y: 0, xPercent: -50, yPercent: -50 });

  gsap.set(nav, { yPercent: -100 });
  gsap.set(wordChars, { yPercent: 115 });
  gsap.set(nameChars, { yPercent: 115 });
  gsap.set('.hero-photo', { opacity: 0, filter: 'brightness(0) blur(14px)' });
  gsap.set('.hero-photo img', { scale: 1.12, transformOrigin: '50% 100%' });
  gsap.set('.hero-glow', { opacity: 0, scale: .6 });
  gsap.set('.script', { clipPath: 'inset(-20% 100% -20% 0)' });
  gsap.set(['.role', '.hero-text', '.hero-left .btn', '.hero-left .tiny'], { y: 24, opacity: 0, filter: 'blur(6px)' });
  gsap.set(['.stats-lead', '.stat'], { x: 40, opacity: 0 });
  gsap.set(['.hero-top', '.hero-bottom'], { opacity: 0 });

  const counters = $$('[data-count]');
  counters.forEach((el) => { el.textContent = '0' + (el.dataset.suffix || ''); });

  const count = { v: 0 };
  const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });

  // contagem da abertura
  intro
    .from('.ld-mark', { yPercent: 100, opacity: 0, duration: .8 })
    .from('.ld-name', { opacity: 0, letterSpacing: '1.2em', duration: 1.2 }, '<.1')
    .to(count, {
      v: 100, duration: 1.7, ease: 'power2.inOut',
      onUpdate: () => { $('.ld-count').textContent = String(Math.round(count.v)).padStart(3, '0'); },
    }, 0)
    .to('.ld-bar i', { scaleX: 1, duration: 1.7, ease: 'power2.inOut' }, 0)
    // abertura sai
    .to(['.ld-inner', '.ld-count', '.ld-bar'], { opacity: 0, y: -20, duration: .5, ease: 'power2.in' }, '+=.1')
    .to('.ld-top', { yPercent: -100, duration: 1.2, ease: 'expo.inOut' }, '-=.1')
    .to('.ld-bot', { yPercent: 100, duration: 1.2, ease: 'expo.inOut' }, '<')
    .set('.loader', { display: 'none' })
    .addLabel('hero', '-=.75')
    // hero entra
    .to('.hero-glow', { opacity: 1, scale: 1, duration: 2.4, ease: 'power2.out' }, 'hero')
    .to(wordChars, { yPercent: 0, duration: 1.5, stagger: .055 }, 'hero')
    .to('.hero-photo', { opacity: 1, filter: 'brightness(1) blur(0px)', duration: 2, ease: 'power2.out' }, 'hero+=.35')
    .to('.hero-photo img', { scale: 1, duration: 2.4, ease: 'expo.out' }, '<')
    .to(nav, { yPercent: 0, duration: 1.1 }, 'hero+=.6')
    .to(['.hero-top', '.hero-bottom'], { opacity: 1, duration: 1.2 }, '<')
    .to('.script', { clipPath: 'inset(-20% 0% -20% 0)', duration: 1.1, ease: 'power2.inOut' }, 'hero+=.8')
    .to(nameChars, { yPercent: 0, duration: 1.2, stagger: .05 }, '<.25')
    .to(['.role', '.hero-text', '.hero-left .btn', '.hero-left .tiny'], { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.1, stagger: .09 }, '<.3')
    .to(['.stats-lead', '.stat'], { x: 0, opacity: 1, duration: 1.1, stagger: .1 }, '<')
    .add(() => {
      counters.forEach((el, i) => {
        const o = { v: 0 };
        gsap.to(o, {
          v: +el.dataset.count, duration: 1.6, delay: i * .12, ease: 'power3.out',
          onUpdate: () => { el.textContent = Math.round(o.v) + (el.dataset.suffix || ''); },
        });
      });
    }, '<.2')
    .add(() => {
      if (lenis) lenis.start();
      gsap.set(['.hero-photo', '.role', '.hero-text', '.hero-left .btn', '.hero-left .tiny'], { clearProps: 'filter' });
    });

  // brilho "respirando"
  gsap.to('.hero-glow', { scale: 1.12, opacity: .75, duration: 4, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 4 });

  /* ---------- hero: parallax ao rolar ---------- */
  const heroST = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
  gsap.to(heroWord, { y: -140, opacity: .25, ease: 'none', scrollTrigger: heroST });
  gsap.to('.hero-photo img', { y: 110, ease: 'none', scrollTrigger: { ...heroST } });
  gsap.to('.hero-left', { y: -80, opacity: 0, ease: 'none', scrollTrigger: { ...heroST, end: '70% top' } });
  gsap.to('.hero-stats', { y: -50, opacity: 0, ease: 'none', scrollTrigger: { ...heroST, end: '70% top' } });

  /* ---------- hero: parallax com o mouse ---------- */
  if (finePointer) {
    const wx = gsap.quickTo(heroWord, 'x', { duration: 1.2, ease: 'power3.out' });
    const px = gsap.quickTo('.hero-photo img', 'x', { duration: 1.2, ease: 'power3.out' });
    const gx = gsap.quickTo('.hero-glow', 'x', { duration: 2, ease: 'power3.out' });
    const gy = gsap.quickTo('.hero-glow', 'y', { duration: 2, ease: 'power3.out' });
    $('.hero').addEventListener('mousemove', (e) => {
      const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
      wx(nx * -40); px(nx * 22); gx(nx * 120); gy(ny * 80);
    });
  }

  /* =====================================================
     FAIXA (velocidade segue a rolagem)
     ===================================================== */
  const mq = gsap.to('.mq-track', { xPercent: -50, duration: 32, ease: 'none', repeat: -1 });
  let mqSpeed = 1, mqDir = 1;
  const skew = gsap.quickTo('.mq-track', 'skewX', { duration: .5, ease: 'power3.out' });
  ScrollTrigger.create({
    onUpdate: (self) => {
      const v = self.getVelocity();
      mqDir = self.direction;
      mqSpeed = mqDir * (1 + Math.min(Math.abs(v) / 220, 7));
      skew(gsap.utils.clamp(-10, 10, v / -250));
    },
  });
  gsap.ticker.add(() => {
    mq.timeScale(mqSpeed);
    mqSpeed += (mqDir - mqSpeed) * .045;
    if (Math.abs(mqSpeed - mqDir) < .05) skew(0);
  });
  gsap.from('.marquee', { yPercent: 60, rotation: 4, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.marquee', start: 'top 95%' } });

  /* =====================================================
     TÍTULOS (letras/palavras sobem de dentro de uma máscara)
     ===================================================== */
  $$('.section h2.big, .live h3.big').forEach((el) => {
    const chars = split(el, 'chars');
    gsap.from(chars, {
      yPercent: 115, rotate: 6, duration: 1.2, stagger: .025, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });
  $$('.title-line').forEach((el) => {
    const words = split(el, 'words');
    gsap.from(words, {
      yPercent: 115, duration: 1.1, stagger: .06, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });

  /* ---------- textos: entrada suave com desfoque ---------- */
  const soft = [
    '.section > .kicker', '.filters', '.split-text p', '.about-intro', '.about-grid h4',
    '.label', '.edu', '.tags', '.acc details', '.live .kicker', '.live a',
    '.contact .muted', '.contact .kicker', '.btn.ghost', '.channels li', '.quick-form',
    '.link-arrow', '.cap', '.tools .kicker',
  ];
  ScrollTrigger.batch(soft.join(','), {
    start: 'top 90%',
    once: true,
    onEnter: (els) => gsap.fromTo(els,
      { y: 30, opacity: 0, filter: 'blur(8px)' },
      { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.1, stagger: .07, ease: 'expo.out', clearProps: 'filter,transform' }),
  });
  gsap.set(soft.join(','), { opacity: 0 });

  /* =====================================================
     PROJETOS
     ===================================================== */
  cards.forEach((card, i) => {
    const mock = $('.mock', card);
    const inner = [...mock.children];
    const tl = gsap.timeline({ scrollTrigger: { trigger: card, start: 'top 88%' } });
    tl.from(mock, { clipPath: 'inset(100% 0% 0% 0% round 6px)', duration: 1.3, ease: 'expo.inOut', delay: i * .12 })
      .from(inner, { y: 50, opacity: 0, duration: 1.1, stagger: .08, ease: 'expo.out' }, '-=.6')
      .from($('footer', card), { y: 20, opacity: 0, duration: .9, ease: 'expo.out' }, '-=.9')
      .from($('.num', card), { yPercent: 100, opacity: 0, duration: .9, ease: 'expo.out' }, '<');
    const bars = $$('.bars i', card);
    if (bars.length) {
      gsap.set(bars, { scaleY: .1, transformOrigin: '50% 100%' });
      tl.to(bars, { scaleY: 1, duration: 1.2, stagger: .045, ease: 'expo.out' }, '-=.8');
    }
    const line = $('polyline', card);
    if (line) {
      const len = line.getTotalLength();
      gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
      tl.to(line, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut' }, '-=.8');
    }

    // inclinação 3D + brilho seguindo o mouse
    if (finePointer) {
      const rx = gsap.quickTo(mock, 'rotationX', { duration: .6, ease: 'power3.out' });
      const ry = gsap.quickTo(mock, 'rotationY', { duration: .6, ease: 'power3.out' });
      gsap.set(mock, { transformPerspective: 900 });
      card.addEventListener('mousemove', (e) => {
        const r = mock.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        ry((x - .5) * 10); rx((.5 - y) * 10);
        mock.style.setProperty('--mx', x * 100 + '%');
        mock.style.setProperty('--my', y * 100 + '%');
      });
      card.addEventListener('mouseleave', () => { rx(0); ry(0); });
    }
  });

  gsap.from('.tool-row img', {
    y: 40, opacity: 0, scale: .6, duration: 1, stagger: .07, ease: 'back.out(2)',
    scrollTrigger: { trigger: '.tool-row', start: 'top 92%' },
  });

  /* =====================================================
     RASCUNHO -> AO AR
     ===================================================== */
  gsap.from('.compare', {
    clipPath: 'inset(0% 0% 100% 0%)', scale: .94, duration: 1.6, ease: 'expo.inOut',
    scrollTrigger: { trigger: '.compare', start: 'top 85%' },
  });
  gsap.from('.compare .app.final .bubble', {
    y: 20, opacity: 0, duration: .8, stagger: .3, ease: 'expo.out',
    scrollTrigger: { trigger: '.compare', start: 'top 60%' },
  });
  gsap.to('.compare', {
    yPercent: -6, ease: 'none',
    scrollTrigger: { trigger: '#processo', start: 'top bottom', end: 'bottom top', scrub: true },
  });

  /* =====================================================
     SOBRE
     ===================================================== */
  gsap.from('.tags span', {
    scale: .7, opacity: 0, duration: .7, stagger: .04, ease: 'back.out(2.5)',
    scrollTrigger: { trigger: '.tags', start: 'top 92%' },
  });

  // linha vermelha do processo desenhada pela rolagem
  const steps = $('.steps');
  const sLine = document.createElement('i');
  sLine.className = 'steps-line';
  steps.prepend(sLine);
  gsap.fromTo(sLine, { scaleY: 0 }, {
    scaleY: 1, ease: 'none',
    scrollTrigger: { trigger: steps, start: 'top 75%', end: 'bottom 55%', scrub: .6 },
  });
  $$('.steps li').forEach((li) => {
    gsap.from(li.children, {
      x: -24, opacity: 0, duration: .9, stagger: .1, ease: 'expo.out',
      scrollTrigger: { trigger: li, start: 'top 82%' },
    });
  });

  // citação
  const quote = $('.quote');
  const qWords = split($('p', quote), 'words');
  const qtl = gsap.timeline({ scrollTrigger: { trigger: quote, start: 'top 80%' } });
  qtl.from(quote, { clipPath: 'inset(100% 0% 0% 0% round 6px)', duration: 1.4, ease: 'expo.inOut' })
    .from('.quote .q', { yPercent: 80, rotate: -20, opacity: 0, duration: 1, ease: 'expo.out' }, '-=.5')
    .from(qWords, { yPercent: 115, duration: 1, stagger: .04, ease: 'expo.out' }, '<')
    .from('.quote cite', { clipPath: 'inset(-30% 100% -30% 0)', duration: 1.1, ease: 'power2.inOut' }, '-=.5')
    .from('.quote small', { opacity: 0, y: 10, duration: .8 }, '<.3');
  gsap.to(quote, {
    y: -40, ease: 'none',
    scrollTrigger: { trigger: '#sobre', start: 'top bottom', end: 'bottom top', scrub: true },
  });

  /* =====================================================
     TRAJETÓRIA: sanfona com abertura suave
     ===================================================== */
  $$('.acc details').forEach((d) => {
    const s = $('summary', d), p = $('p', d);
    s.addEventListener('click', (e) => {
      e.preventDefault();
      if (d.open) {
        gsap.to(p, {
          height: 0, paddingBottom: 0, opacity: 0, duration: .5, ease: 'power3.inOut',
          onComplete: () => { d.open = false; gsap.set(p, { clearProps: 'all' }); ScrollTrigger.refresh(); },
        });
        gsap.to($('i', s), { rotate: 0, duration: .4 });
      } else {
        d.open = true;
        gsap.from(p, { height: 0, paddingBottom: 0, opacity: 0, duration: .65, ease: 'power3.out', onComplete: () => { gsap.set(p, { clearProps: 'all' }); ScrollTrigger.refresh(); } });
      }
    });
  });

  /* =====================================================
     CONTATO
     ===================================================== */
  const lc = $('.live-card');
  gsap.set(lc, { rotation: 4 });
  gsap.from(lc, {
    y: 160, rotation: 22, opacity: 0, duration: 1.6, ease: 'expo.out',
    scrollTrigger: { trigger: lc, start: 'top 92%' },
    onComplete: () => gsap.to(lc, { y: -12, rotation: 2, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1 }),
  });

  /* ---------- nome gigante do rodapé ---------- */
  const fb = split($('.foot-big'), 'chars');
  gsap.from(fb, {
    yPercent: 110, ease: 'none', stagger: .04,
    scrollTrigger: { trigger: '.foot-big', start: 'top bottom', end: 'bottom bottom', scrub: .8 },
  });

  /* =====================================================
     CURSOR + BOTÕES MAGNÉTICOS
     ===================================================== */
  if (finePointer) {
    document.documentElement.classList.add('has-cursor');
    const dot = $('.cursor'), ring = $('.cursor-ring'), ringTxt = $('span', ring);
    const dx = gsap.quickTo(dot, 'x', { duration: .1 }), dy = gsap.quickTo(dot, 'y', { duration: .1 });
    const rx = gsap.quickTo(ring, 'x', { duration: .45, ease: 'power3.out' }), ry = gsap.quickTo(ring, 'y', { duration: .45, ease: 'power3.out' });
    addEventListener('mousemove', (e) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); });
    document.addEventListener('mouseleave', () => gsap.to([dot, ring], { opacity: 0, duration: .3 }));
    document.addEventListener('mouseenter', () => gsap.to([dot, ring], { opacity: 1, duration: .3 }));

    $$('a, button, summary, input, .compare').forEach((el) => {
      el.addEventListener('mouseenter', () => ring.classList.add('hover'));
      el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
    });
    const labelOn = (txt) => () => { ringTxt.textContent = txt; ring.classList.add('label'); gsap.to(dot, { scale: 0, duration: .2 }); };
    const labelOff = () => { ring.classList.remove('label'); gsap.to(dot, { scale: 1, duration: .2 }); };
    cards.forEach((c) => { c.addEventListener('mouseenter', labelOn(c.tagName === 'A' ? 'ABRIR' : 'VER')); c.addEventListener('mouseleave', labelOff); });
    compare.addEventListener('mouseenter', labelOn('ARRASTE'));
    compare.addEventListener('mouseleave', labelOff);

    $$('.btn, .nav-cta, .play, .socials a, .circ, .quick-form button').forEach((el) => {
      const mx = gsap.quickTo(el, 'x', { duration: .6, ease: 'elastic.out(1, .4)' });
      const my = gsap.quickTo(el, 'y', { duration: .6, ease: 'elastic.out(1, .4)' });
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * .35);
        my((e.clientY - r.top - r.height / 2) * .35);
      });
      el.addEventListener('mouseleave', () => { mx(0); my(0); });
    });
  }

  /* =====================================================
     TRANSIÇÃO ENTRE SEÇÕES (cortina vermelha)
     ===================================================== */
  const curtain = $('.curtain'), cLabel = $('.curtain-label');
  const names = { topo: 'INÍCIO', projetos: 'PROJETOS', sobre: 'SOBRE', trajetoria: 'TRAJETÓRIA', contato: 'CONTATO', processo: 'PROCESSO' };
  let busy = false;
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      if (busy) return;
      busy = true;
      cLabel.textContent = names[id] || '';
      gsap.timeline({ onComplete: () => { busy = false; } })
        .set(curtain, { display: 'flex', yPercent: 100 })
        .to(curtain, { yPercent: 0, duration: .7, ease: 'expo.inOut' })
        .fromTo(cLabel, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .5, ease: 'expo.out' }, '-=.25')
        .add(() => {
          const y = id === 'topo' ? 0 : target.getBoundingClientRect().top + window.scrollY - 20;
          if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
          else window.scrollTo(0, y);
          ScrollTrigger.update();
          gsap.set(nav, { yPercent: 0 });
        })
        .to(cLabel, { yPercent: -100, opacity: 0, duration: .4, ease: 'power2.in' }, '+=.2')
        .to(curtain, { yPercent: -100, duration: .8, ease: 'expo.inOut' }, '-=.2')
        .set(curtain, { display: 'none' });
    });
  });

  addEventListener('load', () => ScrollTrigger.refresh());
}
