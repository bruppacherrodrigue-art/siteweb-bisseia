/* ============================================================
   BISSE IA — Interactions
   ============================================================ */

// === NAV / BURGER ===
const burger = document.getElementById('navBurger');
const navLinks = document.getElementById('navLinks');

function closeNav() {
  burger.classList.remove('is-open');
  navLinks.classList.remove('is-open');
  document.body.classList.remove('nav-locked');
  burger.setAttribute('aria-expanded', 'false');
}
function openNav() {
  burger.classList.add('is-open');
  navLinks.classList.add('is-open');
  document.body.classList.add('nav-locked');
  burger.setAttribute('aria-expanded', 'true');
}
burger?.addEventListener('click', () => {
  burger.classList.contains('is-open') ? closeNav() : openNav();
});
navLinks?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && navLinks.classList.contains('is-open')) closeNav();
});

// === REVEAL ON SCROLL ===
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0, rootMargin: '0px 0px -80px 0px' });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// === SMOOTH ANCHOR SCROLL ===
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const id = link.getAttribute('href');
    if (id.length <= 1) return;
    const target = document.querySelector(id);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// === FAQ ACCORDION ===
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.parentElement;
    const isActive = item.classList.contains('active');
    document.querySelectorAll('.faq-item').forEach(i => {
      i.classList.remove('active');
      i.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
    });
    if (!isActive) {
      item.classList.add('active');
      btn.setAttribute('aria-expanded', 'true');
    }
  });
});

// === CASE FILTERS ===
const caseFilters = document.querySelectorAll('.case-filter');
const caseCards = document.querySelectorAll('.case-card');
caseFilters.forEach(btn => {
  btn.addEventListener('click', () => {
    const filter = btn.dataset.filter;
    caseFilters.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    caseCards.forEach(card => {
      const tags = (card.dataset.tags || '').split(' ');
      const show = filter === 'all' || tags.includes(filter);
      card.style.display = show ? '' : 'none';
    });
  });
});

// === ROI CALCULATOR ===
const hoursEl = document.getElementById('roi-hours');
const rateEl = document.getElementById('roi-rate');
const hoursVal = document.getElementById('roi-hours-val');
const rateVal = document.getElementById('roi-rate-val');
const resultEl = document.getElementById('roi-result');
const hoursPerYearEl = document.getElementById('roi-hours-year');
const monthlyEl = document.getElementById('roi-monthly');

function formatCHF(n) {
  return Math.round(n).toLocaleString('fr-CH').replace(/\u202F|\u00A0/g, "'");
}

let displayedAnnual = 0;
let raf = null;
function animateNumberTo(target) {
  cancelAnimationFrame(raf);
  const start = displayedAnnual;
  const startTime = performance.now();
  const duration = 600;
  function step(now) {
    const t = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    displayedAnnual = start + (target - start) * eased;
    resultEl.textContent = formatCHF(displayedAnnual);
    if (t < 1) raf = requestAnimationFrame(step);
    else displayedAnnual = target;
  }
  raf = requestAnimationFrame(step);
}

function calcRoi() {
  const h = parseFloat(hoursEl.value) || 0;
  const r = parseFloat(rateEl.value) || 0;
  const weeks = 48;
  const annual = h * r * weeks;
  const hoursYear = h * weeks;
  const monthly = annual / 12;

  if (hoursVal) hoursVal.textContent = h + ' h';
  if (rateVal) rateVal.textContent = r + ' CHF';

  animateNumberTo(annual);
  if (hoursPerYearEl) hoursPerYearEl.textContent = formatCHF(hoursYear) + ' h';
  if (monthlyEl) monthlyEl.textContent = formatCHF(monthly) + ' CHF';
}
hoursEl?.addEventListener('input', calcRoi);
rateEl?.addEventListener('input', calcRoi);
if (hoursEl) calcRoi();

// === CONTACT FORM ===
const contactForm = document.getElementById('contactForm');
contactForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const ok = document.getElementById('formSuccess');
  ok.classList.add('show');
  contactForm.reset();
  setTimeout(() => ok.classList.remove('show'), 6000);
});

// === HERO SCENARIO ROTATOR ===
(function scenarioRotator() {
  const rotator = document.getElementById('scenarioRotator');
  if (!rotator) return;
  const scenarios = Array.from(rotator.querySelectorAll('.scenario'));
  const dots = Array.from(document.querySelectorAll('#scenarioDots .s-dot'));
  if (!scenarios.length) return;

  const STEP_MS = 2000;           // each step beat
  const STEPS_PER_SCENARIO = 5;   // 4 steps + 1 "all done" pause
  let activeIdx = 0;
  let stepBeat = 0;
  let timer = null;

  function renderSteps() {
    const sc = scenarios[activeIdx];
    const steps = sc.querySelectorAll('.agent-step');
    steps.forEach((s, idx) => {
      s.classList.remove('current', 'done');
      if (idx < stepBeat) s.classList.add('done');
      else if (idx === stepBeat) s.classList.add('current');
    });
  }

  function setActive(idx, { restartProgress = true } = {}) {
    activeIdx = ((idx % scenarios.length) + scenarios.length) % scenarios.length;
    stepBeat = 0;
    scenarios.forEach((s, i) => s.classList.toggle('active', i === activeIdx));
    if (dots.length) {
      dots.forEach((d, i) => {
        d.classList.toggle('active', i === activeIdx);
        if (restartProgress && i === activeIdx) {
          // Restart the CSS progress bar animation
          d.style.setProperty('--reset', Date.now());
          // Force reflow trick:
          d.classList.remove('active');
          void d.offsetWidth;
          d.classList.add('active');
        }
      });
    }
    // Reset other scenarios' step state
    scenarios.forEach((s, i) => {
      if (i !== activeIdx) {
        s.querySelectorAll('.agent-step').forEach(st => {
          st.classList.remove('current', 'done');
        });
      }
    });
    renderSteps();
  }

  function tick() {
    stepBeat++;
    if (stepBeat >= STEPS_PER_SCENARIO) {
      // Move to next scenario
      setActive(activeIdx + 1);
    } else {
      renderSteps();
    }
  }

  function startTimer() {
    stopTimer();
    timer = setInterval(tick, STEP_MS);
  }
  function stopTimer() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  // Dot clicks — jump to scenario, restart cycle
  dots.forEach((d, i) => {
    d.addEventListener('click', () => {
      setActive(i);
      startTimer();
    });
  });

  // Live clocks
  function pad(n) { return String(n).padStart(2, '0'); }
  function updateTimes() {
    const d = new Date();
    document.querySelectorAll('.agent-time').forEach(el => {
      el.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    });
  }
  updateTimes();
  setInterval(updateTimes, 1000);

  // Initial
  setActive(0);
  startTimer();
})();


/* ============================================================
   HERO MOTION — canvas water flow + mouse parallax + fade-in
   ============================================================ */
(function () {
  const hero = document.querySelector('.hero-motion');
  if (!hero) return;

  const canvas = document.getElementById('hmCanvas');
  const wrap = document.getElementById('hmCanvasWrap');
  if (!canvas || !wrap) return;

  const ctx = canvas.getContext('2d');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // === Sizing ===
  let DPR = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0;
  function resize() {
    const rect = wrap.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  // === Water-line layers (parallax depths) ===
  // Each "wave" is a sinusoidal stream drawn as a stroked path, accumulating drift
  const palette = [
    'rgba(244, 237, 224, ',   // creme highlights
    'rgba(232, 185, 136, ',   // ocre-pale
    'rgba(201, 123, 63, ',    // ocre
    'rgba(107, 26, 46, ',     // grenat (deep)
  ];

  const waves = [];
  function buildWaves() {
    waves.length = 0;
    // Sky-light ribbons up top
    for (let i = 0; i < 4; i++) {
      waves.push({
        y: 0.18 + i * 0.04,
        amp: 28 + i * 6,
        freq: 0.0035 + i * 0.0008,
        speed: 0.15 + i * 0.05,
        thickness: 0.6 + Math.random() * 0.6,
        color: palette[0],
        alpha: 0.06 + i * 0.025,
        depth: 0.4 + i * 0.1,
        phase: Math.random() * Math.PI * 2,
      });
    }
    // Mid waves — main bisse current (ocre/cream)
    for (let i = 0; i < 9; i++) {
      const t = i / 8;
      waves.push({
        y: 0.42 + t * 0.22,
        amp: 14 + Math.random() * 18,
        freq: 0.0028 + Math.random() * 0.0035,
        speed: 0.35 + t * 0.5,
        thickness: 0.7 + Math.random() * 1.1,
        color: i % 2 === 0 ? palette[0] : palette[1],
        alpha: 0.08 + Math.random() * 0.12,
        depth: 0.6 + t * 0.4,
        phase: Math.random() * Math.PI * 2,
      });
    }
    // Deep current waves — grenat / ocre, slower, thicker
    for (let i = 0; i < 5; i++) {
      const t = i / 4;
      waves.push({
        y: 0.68 + t * 0.18,
        amp: 18 + t * 22,
        freq: 0.002 + Math.random() * 0.0025,
        speed: 0.6 + t * 0.4,
        thickness: 1.1 + Math.random() * 1.4,
        color: i % 2 === 0 ? palette[2] : palette[3],
        alpha: 0.14 + Math.random() * 0.16,
        depth: 0.85 + t * 0.15,
        phase: Math.random() * Math.PI * 2,
      });
    }
    // Highlight glints — short bright strokes on the surface
    for (let i = 0; i < 14; i++) {
      waves.push({
        glint: true,
        y: 0.4 + Math.random() * 0.45,
        amp: 6 + Math.random() * 14,
        freq: 0.005 + Math.random() * 0.004,
        speed: 0.4 + Math.random() * 0.6,
        thickness: 0.5 + Math.random() * 0.8,
        color: palette[0],
        alpha: 0.18 + Math.random() * 0.22,
        depth: 0.5 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        glintWidth: 60 + Math.random() * 120,
        glintX: Math.random(),
      });
    }
  }
  buildWaves();
  window.addEventListener('resize', buildWaves);

  // === Mouse parallax (gsap-style lerp w/o gsap) ===
  const parallax = {
    strength: 22,
    tx: 0, ty: 0,
    cx: 0, cy: 0,
  };
  function onMove(e) {
    const rect = hero.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    parallax.tx = ((e.clientX - rect.left - cx) / cx) * parallax.strength;
    parallax.ty = ((e.clientY - rect.top - cy) / cy) * parallax.strength;
  }
  hero.addEventListener('mousemove', onMove);
  hero.addEventListener('mouseleave', () => { parallax.tx = 0; parallax.ty = 0; });

  // === Animation loop ===
  let t0 = performance.now();
  let raf = 0;
  function frame(now) {
    const dt = Math.min(48, now - t0);
    t0 = now;

    // Smooth lerp parallax
    parallax.cx += (parallax.tx - parallax.cx) * 0.06;
    parallax.cy += (parallax.ty - parallax.cy) * 0.06;
    wrap.style.transform = `scale(1.08) translate3d(${parallax.cx}px, ${parallax.cy}px, 0)`;

    // Background gradient base — subtle drift
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(48, 32, 28, 1)');
    g.addColorStop(0.45, 'rgba(28, 20, 18, 1)');
    g.addColorStop(1, 'rgba(16, 12, 10, 1)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Soft warm glow at horizon (where mountains meet sky)
    const horizon = H * 0.55;
    const glow = ctx.createRadialGradient(W * 0.5, horizon, 0, W * 0.5, horizon, Math.max(W, H) * 0.7);
    glow.addColorStop(0, 'rgba(201, 123, 63, 0.18)');
    glow.addColorStop(0.35, 'rgba(107, 26, 46, 0.08)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Time advance
    const time = now * 0.001;

    // Draw waves
    ctx.lineCap = 'round';
    ctx.globalCompositeOperation = 'lighter';

    for (const w of waves) {
      ctx.beginPath();
      const baseY = H * w.y;
      const driftX = -time * w.speed * 60;
      const step = 6;

      if (w.glint) {
        // animate glint position
        w.glintX = (w.glintX + dt * 0.00012 * w.speed) % 1.2;
        const startX = w.glintX * W - 60;
        const endX = startX + w.glintWidth;
        for (let x = startX; x <= endX; x += step) {
          const yy = baseY + Math.sin(x * w.freq + driftX * w.freq + w.phase) * w.amp;
          if (x === startX) ctx.moveTo(x, yy);
          else ctx.lineTo(x, yy);
        }
        // fade alpha by glint envelope
        const env = Math.sin(((w.glintX) % 1) * Math.PI);
        ctx.strokeStyle = w.color + (w.alpha * env).toFixed(3) + ')';
      } else {
        for (let x = -20; x <= W + 20; x += step) {
          const yy = baseY +
            Math.sin(x * w.freq + driftX * w.freq + w.phase) * w.amp +
            Math.sin(x * w.freq * 2.7 + driftX * w.freq * 1.4 + w.phase * 1.3) * (w.amp * 0.25);
          if (x === -20) ctx.moveTo(x, yy);
          else ctx.lineTo(x, yy);
        }
        ctx.strokeStyle = w.color + w.alpha.toFixed(3) + ')';
      }
      ctx.lineWidth = w.thickness;
      ctx.stroke();
    }

    ctx.globalCompositeOperation = 'source-over';

    // Mountain silhouette at bottom — Valais profile
    ctx.beginPath();
    ctx.moveTo(0, H);
    const peaks = [
      [0.00, 0.84], [0.07, 0.78], [0.13, 0.82], [0.21, 0.70],
      [0.30, 0.78], [0.40, 0.66], [0.50, 0.55], [0.58, 0.68],
      [0.66, 0.62], [0.74, 0.74], [0.83, 0.66], [0.92, 0.78], [1.00, 0.74]
    ];
    ctx.lineTo(0, H * peaks[0][1]);
    for (let i = 1; i < peaks.length; i++) {
      const [x, y] = peaks[i];
      ctx.lineTo(x * W, H * y);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    const mtnGrad = ctx.createLinearGradient(0, H * 0.5, 0, H);
    mtnGrad.addColorStop(0, 'rgba(20, 14, 12, 0.88)');
    mtnGrad.addColorStop(1, 'rgba(10, 6, 6, 1)');
    ctx.fillStyle = mtnGrad;
    ctx.fill();

    // Distant ridge — slightly lighter, behind
    ctx.beginPath();
    const ridge = [
      [0.00, 0.78], [0.10, 0.73], [0.22, 0.76], [0.35, 0.68],
      [0.46, 0.72], [0.55, 0.62], [0.66, 0.70], [0.78, 0.65],
      [0.88, 0.72], [1.00, 0.70]
    ];
    ctx.moveTo(0, H);
    ctx.lineTo(0, H * ridge[0][1]);
    for (let i = 1; i < ridge.length; i++) {
      const [x, y] = ridge[i];
      ctx.lineTo(x * W, H * y);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fillStyle = 'rgba(58, 42, 38, 0.45)';
    ctx.globalCompositeOperation = 'screen';
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    raf = requestAnimationFrame(frame);
  }

  if (prefersReduced) {
    // single static frame
    frame(performance.now());
  } else {
    raf = requestAnimationFrame(frame);
  }

  // === Entry fade-in ===
  requestAnimationFrame(() => {
    requestAnimationFrame(() => hero.classList.add('is-mounted'));
  });

  // === Toggle body class when hero is on-screen so nav restyles ===
  document.body.classList.add('hero-on-screen');
  const heroObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      // hero "on-screen" when more than 40% of viewport intersects
      if (e.intersectionRatio > 0.25) {
        document.body.classList.add('hero-on-screen');
      } else {
        document.body.classList.remove('hero-on-screen');
      }
    });
  }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
  heroObs.observe(hero);

  // Cleanup safety
  window.addEventListener('beforeunload', () => { if (raf) cancelAnimationFrame(raf); });
})();


/* ============================================================
   SCROLL-DRIVEN MOTION — rail fill, section label,
   bisse-thread path generation + drop following the water
   ============================================================ */
(function () {
  const railFill = document.getElementById('railFill');
  const railLabel = document.getElementById('railLabel');
  const threadSvg = document.querySelector('.bisse-thread');
  const channel = document.getElementById('bisseChannel');
  const water = document.getElementById('bisseWater');
  const surface = document.getElementById('bisseSurface');
  const threadDot = document.getElementById('bisseThreadDot');

  const sections = [
    { sel: '.hero-motion',        label: '01 / Hero' },
    { sel: '.scenarios-section',  label: '02 / Agents' },
    { sel: '#flow',               label: '03 / Méthode' },
    { sel: '#cas-usage',          label: "04 / Cas d'usage" },
    { sel: '#securite',           label: '05 / Sécurité' },
    { sel: '#roi',                label: '06 / ROI' },
    { sel: '.bisse-story',        label: '07 / Bisse' },
    { sel: '#a-propos',           label: '08 / À propos' },
    { sel: '#faq',                label: '09 / FAQ' },
    { sel: '#contact',            label: '10 / Contact' },
  ].map(s => ({ ...s, el: document.querySelector(s.sel) })).filter(s => s.el);

  let pathLen = 0;
  let lastLabel = '';
  let lastSectionIdx = -1;
  let lastMicroSplashT = 0;
  const splashGroup = document.getElementById('bisseSplashes');
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function getSectionIdxAtAbsY(absY) {
    let idx = 0;
    for (let i = 0; i < sections.length; i++) {
      const top = sections[i].el.getBoundingClientRect().top + window.scrollY;
      if (top <= absY) idx = i;
    }
    return idx;
  }

  function spawnSplash(x, y, opts) {
    if (!splashGroup) return;
    const o = opts || {};
    const count = o.count != null ? o.count : (7 + Math.floor(Math.random() * 4));
    const speedBase = o.speed != null ? o.speed : 14;
    const speedRange = o.speedRange != null ? o.speedRange : 22;
    const sizeBase = o.size != null ? o.size : 1.4;
    const sizeRange = o.sizeRange != null ? o.sizeRange : 2.6;
    const fan = o.fan != null ? o.fan : 1.4;          // angular spread (× PI)
    const durBase = o.dur != null ? o.dur : 700;
    const durRange = o.durRange != null ? o.durRange : 500;
    const ring = o.ring !== false;

    for (let i = 0; i < count; i++) {
      const c = document.createElementNS(SVG_NS, 'circle');
      const angle = -Math.PI / 2 + (i / Math.max(1, count - 1) - 0.5) * Math.PI * fan + (Math.random() - 0.5) * 0.4;
      const speed = speedBase + Math.random() * speedRange;
      const r0 = sizeBase + Math.random() * sizeRange;
      const fill = i % 3 === 0 ? '#fbf6ec' : (i % 3 === 1 ? '#e8b988' : '#c97b3f');
      c.setAttribute('cx', x);
      c.setAttribute('cy', y);
      c.setAttribute('r', r0);
      c.setAttribute('fill', fill);
      c.setAttribute('opacity', '0.95');
      splashGroup.appendChild(c);

      const start = performance.now();
      const dur = durBase + Math.random() * durRange;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const gravity = 90;
      function step(now) {
        const p = (now - start) / dur;
        if (p >= 1) { c.remove(); return; }
        const eased = 1 - Math.pow(1 - p, 2);
        const cx2 = x + vx * eased;
        const cy2 = y + vy * eased + gravity * p * p;
        c.setAttribute('cx', cx2.toFixed(2));
        c.setAttribute('cy', cy2.toFixed(2));
        c.setAttribute('opacity', (0.95 * (1 - p * p)).toFixed(3));
        c.setAttribute('r', (r0 * (1 - p * 0.5)).toFixed(2));
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if (ring) {
      const ringEl = document.createElementNS(SVG_NS, 'circle');
      ringEl.setAttribute('cx', x);
      ringEl.setAttribute('cy', y);
      ringEl.setAttribute('r', 6);
      ringEl.setAttribute('fill', 'none');
      ringEl.setAttribute('stroke', '#e8b988');
      ringEl.setAttribute('stroke-width', '1.6');
      ringEl.setAttribute('opacity', '0.9');
      splashGroup.appendChild(ringEl);
      const rStart = performance.now();
      const rDur = 650;
      function ringStep(now) {
        const p = (now - rStart) / rDur;
        if (p >= 1) { ringEl.remove(); return; }
        ringEl.setAttribute('r', (6 + p * 28).toFixed(2));
        ringEl.setAttribute('opacity', (0.9 * (1 - p)).toFixed(3));
        ringEl.setAttribute('stroke-width', (1.6 * (1 - p * 0.6)).toFixed(2));
        requestAnimationFrame(ringStep);
      }
      requestAnimationFrame(ringStep);
    }
  }

  function buildPath() {
    if (!threadSvg || !water) return;
    const rect = threadSvg.getBoundingClientRect();
    const w = Math.max(40, rect.width);
    const h = Math.max(200, rect.height);
    // 1 viewBox unit = 1 actual pixel — fixes the non-uniform stretching bug
    threadSvg.setAttribute('viewBox', `0 0 ${w} ${h}`);

    const cx = w * 0.5;
    // gentle horizontal swing — capped so the channel never reads as a zig-zag
    const amp = Math.min(w * 0.32, 14);
    const segPx = 220;
    const segCount = Math.max(6, Math.floor(h / segPx));
    let d = `M ${cx.toFixed(2)} 0`;
    let prevX = cx, prevY = 0;
    for (let i = 1; i <= segCount; i++) {
      const y = (h * i) / segCount;
      const phase = i * 1.07;
      // primary sine + slow secondary harmonic for organic feel
      const x = cx
        + Math.sin(phase) * amp
        + Math.sin(phase * 0.43 + 1.3) * amp * 0.35;
      const midY = (prevY + y) / 2;
      d += ` C ${prevX.toFixed(2)} ${midY.toFixed(2)}, ${x.toFixed(2)} ${midY.toFixed(2)}, ${x.toFixed(2)} ${y.toFixed(2)}`;
      prevX = x; prevY = y;
    }
    [channel, water, surface].forEach(el => { if (el) el.setAttribute('d', d); });
    pathLen = water.getTotalLength();
  }
  buildPath();
  let resizeT;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(buildPath, 120);
  });

  function updateRail() {
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const progress = Math.max(0, Math.min(1, window.scrollY / docH));
    if (railFill) railFill.style.height = (progress * 100).toFixed(2) + '%';
    if (railLabel) {
      const vy = window.scrollY + window.innerHeight * 0.35;
      let current = sections[0];
      for (const s of sections) {
        const top = s.el.getBoundingClientRect().top + window.scrollY;
        if (top <= vy) current = s;
      }
      if (current && current.label !== lastLabel) {
        lastLabel = current.label;
        railLabel.textContent = current.label;
      }
    }
  }

  function tickThread() {
    if (!water || !threadDot || !threadSvg || pathLen === 0) return;
    const svgRect = threadSvg.getBoundingClientRect();
    const svgTop = svgRect.top + window.scrollY;
    const svgH = svgRect.height || 1;
    let local = (window.scrollY + window.innerHeight * 0.5 - svgTop) / svgH;
    local = Math.max(0, Math.min(1, local));

    // Continuous bob so the drop breathes even when idle
    const t = performance.now() * 0.001;
    const bobLocal = local + Math.sin(t * 0.7) * 0.0018;
    const clamped = Math.max(0, Math.min(1, bobLocal));
    const pt = water.getPointAtLength(clamped * pathLen);
    const ahead = water.getPointAtLength(Math.min(pathLen, clamped * pathLen + 1.5));
    const angle = Math.atan2(ahead.y - pt.y, ahead.x - pt.x) * 180 / Math.PI - 90;
    // tiny squash along the flow axis — sense of momentum
    const stretch = 1 + Math.abs(Math.sin(t * 1.3)) * 0.05;
    threadDot.setAttribute('transform',
      `translate(${pt.x.toFixed(2)} ${pt.y.toFixed(2)}) rotate(${angle.toFixed(1)}) scale(1, ${stretch.toFixed(3)})`);

    // Continuous micro-splash — tiny droplets emit from the drop along the whole bisse
    if (performance.now() - lastMicroSplashT > 110 + Math.random() * 80) {
      lastMicroSplashT = performance.now();
      spawnSplash(pt.x, pt.y, {
        count: 2,
        speed: 6,
        speedRange: 8,
        size: 0.8,
        sizeRange: 1.2,
        fan: 1.0,
        dur: 380,
        durRange: 260,
        ring: false,
      });
    }

    // Section crossing → big splash with ring shockwave
    const dropAbsY = svgTop + pt.y;
    const idx = getSectionIdxAtAbsY(dropAbsY);
    if (lastSectionIdx >= 0 && idx !== lastSectionIdx) {
      spawnSplash(pt.x, pt.y);
    }
    lastSectionIdx = idx;
  }

  function loop() {
    tickThread();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  window.addEventListener('scroll', updateRail, { passive: true });
  updateRail();
})();

/* ============================================================
   CASE CARDS — track mouse for ripple
   ============================================================ */
document.querySelectorAll('.case-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty('--mx', x + '%');
    card.style.setProperty('--my', y + '%');
  });
});

/* ============================================================
   STAT COUNTER — animate numbers when about section enters
   ============================================================ */
(function () {
  const aboutStats = document.querySelector('.about-stats');
  if (!aboutStats) return;
  const targets = [
    { el: aboutStats.querySelectorAll('.stat-value')[0], from: 0, to: 100, suffix: '<em>%</em>' },
  ];
  let done = false;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting && !done) {
        done = true;
        targets.forEach(t => {
          if (!t.el) return;
          const dur = 1400;
          const start = performance.now();
          function step(now) {
            const p = Math.min(1, (now - start) / dur);
            const eased = 1 - Math.pow(1 - p, 3);
            const v = Math.round(t.from + (t.to - t.from) * eased);
            t.el.innerHTML = v + t.suffix;
            if (p < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
        });
      }
    });
  }, { threshold: 0.3 });
  obs.observe(aboutStats);
})();

/* ============================================================
   ROI — pulse the result number on change
   ============================================================ */
(function () {
  const resultWrap = document.querySelector('.roi-output-value');
  const result = document.getElementById('roi-result');
  if (!resultWrap || !result) return;
  const observer = new MutationObserver(() => {
    resultWrap.classList.add('is-pulsing');
    clearTimeout(resultWrap._t);
    resultWrap._t = setTimeout(() => resultWrap.classList.remove('is-pulsing'), 220);
  });
  observer.observe(result, { childList: true, characterData: true, subtree: true });
})();
