'use strict';

/* ================================================================
   DRI Store — app.js  (single file, no split)
   1. Security
   2. Discord link injection
   3. Cursor
   4. Particle canvas
   5. Navbar scroll
   6. Hamburger
   7. Scroll reveal
   8. Interactive 3D card
   9. Card tilt on about/team cards
   10. FAQ — fetch & parse README.md
   11. Smooth anchor scroll
================================================================ */

/* ── 1. SECURITY ──────────────────────────────────────────── */
(function securityLayer() {
  // Disable right-click context menu
  document.addEventListener('contextmenu', e => e.preventDefault());

  // Block keyboard shortcuts for source/devtools
  document.addEventListener('keydown', e => {
    const k = e.key.toUpperCase();
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && ['I','J','C','K'].includes(k)) ||
      (e.ctrlKey && !e.shiftKey && ['U','S','P'].includes(k))
    ) { e.preventDefault(); return false; }
  }, true);

  // Disable drag on images
  document.addEventListener('dragstart', e => { if (e.target.tagName === 'IMG') e.preventDefault(); });

  // Override copy — replace clipboard content with attribution
  document.addEventListener('copy', e => {
    const sel = window.getSelection ? window.getSelection().toString() : '';
    if (sel && sel.length > 0) {
      e.clipboardData.setData('text/plain', sel + '\n\n© DRI Store 2026 — dristore');
      e.preventDefault();
    }
  });

  // Console warning
  try {
    const s = 'color:#f87171;font-size:15px;font-weight:bold';
    const s2 = 'color:#8888aa;font-size:12px';
    console.log('%c⛔ PERHATIAN', s);
    console.log('%cWebsite ini milik DRI Store. Aktivitas mencurigakan akan dilaporkan.', s2);
  } catch(_) {}
})();

/* ── 2. DISCORD LINK INJECTION ────────────────────────────── */
(function injectDiscordLinks() {
  // Stored as base64 so it's not a plain clickable URL in source
  const encoded = 'aHR0cHM6Ly9kaXNjb3JkLmdnL1VzN01IYjhWUUU=';
  const url = atob(encoded);

  const ids = ['discordNavBtn','discordMobileBtn','heroDiscordBtn','ctaDiscordBtn','footerDiscordBtn'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.setAttribute('href', url);
    el.setAttribute('target', '_blank');
    el.setAttribute('rel', 'noopener noreferrer');
  });
})();

/* ── 3. CUSTOM CURSOR ─────────────────────────────────────── */
(function initCursor() {
  // Only on pointer: fine (mouse) devices
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const ring = document.getElementById('cursor');
  const dot = document.getElementById('cursorDot');
  if (!ring || !dot) return;

  let mx = -100, my = -100, rx = -100, ry = -100;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top = my + 'px';
  });

  function tickCursor() {
    rx += (mx - rx) * 0.13;
    ry += (my - ry) * 0.13;
    ring.style.left = rx + 'px';
    ring.style.top = ry + 'px';
    requestAnimationFrame(tickCursor);
  }
  tickCursor();

  const hoverTargets = 'a, button, .faq-tab, .glass-card, .card3d';
  document.querySelectorAll(hoverTargets).forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('hover'));
    el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
  });

  // Hide when leaving window
  document.addEventListener('mouseleave', () => { ring.style.opacity = '0'; dot.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { ring.style.opacity = '1'; dot.style.opacity = '1'; });
})();

/* ── 4. PARTICLE CANVAS ───────────────────────────────────── */
(function initParticles() {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, pts = [];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const COLORS = ['108,99,255','167,139,250','56,189,248'];
  const COUNT = window.innerWidth < 600 ? 40 : 80;

  function mkParticle() {
    return {
      x: Math.random() * (W || 800),
      y: Math.random() * (H || 600),
      r: Math.random() * 1.4 + 0.3,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      a: Math.random() * 0.35 + 0.08,
      c: COLORS[Math.floor(Math.random() * COLORS.length)]
    };
  }
  for (let i = 0; i < COUNT; i++) pts.push(mkParticle());

  function frame() {
    ctx.clearRect(0, 0, W, H);
    pts.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) { Object.assign(p, mkParticle()); }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.c},${p.a})`;
      ctx.fill();
    });
    // connections
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < 110) {
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.strokeStyle = `rgba(108,99,255,${0.07*(1-d/110)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(frame);
  }
  frame();
})();

/* ── 5. NAVBAR SCROLL ─────────────────────────────────────── */
(function initNavbar() {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        nav.classList.toggle('scrolled', window.scrollY > 40);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();

/* ── 6. HAMBURGER ─────────────────────────────────────────── */
(function initHamburger() {
  const btn = document.getElementById('hamburger');
  const menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;
  btn.addEventListener('click', () => {
    btn.classList.toggle('open');
    menu.classList.toggle('open');
  });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    btn.classList.remove('open');
    menu.classList.remove('open');
  }));
})();

/* ── 7. SCROLL REVEAL ─────────────────────────────────────── */
(function initReveal() {
  const els = document.querySelectorAll('.reveal, .reveal-right');
  if (!els.length) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  els.forEach(el => io.observe(el));
})();

/* ── 8. INTERACTIVE 3D CARD ───────────────────────────────── */
(function init3DCard() {
  const scene = document.getElementById('scene3d');
  const card = document.getElementById('card3d');
  const shine = document.getElementById('cardShine');
  if (!scene || !card) return;

  const MAX_ROT = 18;
  let animId = null;
  let targetX = 0, targetY = 0, currentX = 0, currentY = 0;
  let isInteracting = false;

  function lerpAngle() {
    currentX += (targetX - currentX) * 0.1;
    currentY += (targetY - currentY) * 0.1;
    card.style.transform = `rotateX(${currentX}deg) rotateY(${currentY}deg)`;
    if (shine) {
      const sx = 50 + targetY * 1.5;
      const sy = 50 - targetX * 1.5;
      shine.style.background = `radial-gradient(circle at ${sx}% ${sy}%, rgba(255,255,255,0.1), transparent 60%)`;
    }
    if (isInteracting || Math.abs(currentX) > 0.05 || Math.abs(currentY) > 0.05) {
      animId = requestAnimationFrame(lerpAngle);
    } else {
      animId = null;
    }
  }

  function startAnim() {
    if (!animId) animId = requestAnimationFrame(lerpAngle);
  }

  // MOUSE
  scene.addEventListener('mousemove', e => {
    const r = scene.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    targetX = -y * MAX_ROT;
    targetY = x * MAX_ROT;
    isInteracting = true;
    startAnim();
  });

  scene.addEventListener('mouseleave', () => {
    targetX = 0; targetY = 0; isInteracting = false;
    startAnim();
  });

  // TOUCH
  scene.addEventListener('touchmove', e => {
    if (e.touches.length !== 1) return;
    const r = scene.getBoundingClientRect();
    const t = e.touches[0];
    const x = (t.clientX - r.left) / r.width - 0.5;
    const y = (t.clientY - r.top) / r.height - 0.5;
    targetX = -y * MAX_ROT;
    targetY = x * MAX_ROT;
    isInteracting = true;
    startAnim();
  }, { passive: true });

  scene.addEventListener('touchend', () => {
    targetX = 0; targetY = 0; isInteracting = false;
    startAnim();
  });

  // Idle float when not interacting
  let idleT = 0;
  function idleFloat() {
    if (!isInteracting) {
      idleT += 0.012;
      targetX = Math.sin(idleT) * 5;
      targetY = Math.cos(idleT * 0.7) * 6;
      startAnim();
    }
    requestAnimationFrame(idleFloat);
  }
  idleFloat();
})();

/* ── 9. GLASS CARD TILT ───────────────────────────────────── */
(function initCardTilt() {
  if (window.matchMedia('(pointer: coarse)').matches) return; // skip touch
  document.querySelectorAll('.glass-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `translateY(-6px) rotateX(${-y*7}deg) rotateY(${x*7}deg)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
})();

/* ── 10. FAQ — FETCH & PARSE README.md ────────────────────── */
(function initFAQ() {
  const tabsEl = document.getElementById('faqTabs');
  const bodyEl = document.getElementById('faqBody');
  if (!tabsEl || !bodyEl) return;

  const RAW_URL = 'https://raw.githubusercontent.com/lausiapempruy/DRI-Store-Web/main/README.md';

  async function load() {
    try {
      const res = await fetch(RAW_URL + '?t=' + Date.now());
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const text = await res.text();
      parse(text);
    } catch(err) {
      bodyEl.innerHTML = `
        <div class="faq-error">
          <strong>⚠️ Gagal memuat FAQ.</strong>
          <span>Pastikan repo <code>lausiapempruy/DRI-Store-Web</code> bersifat Public dan file <code>README.md</code> ada.</span>
          <code style="font-size:12px;color:var(--tx3)">${err.message}</code>
        </div>`;
    }
  }

  function parse(text) {
    // Extract between markers if exist
    const S = '<!-- DRI_STORE_FAQ_START -->';
    const E = '<!-- DRI_STORE_FAQ_END -->';
    let content = text.includes(S)
      ? text.slice(text.indexOf(S) + S.length, text.includes(E) ? text.indexOf(E) : text.length).trim()
      : text;

    // Split by ## sections
    const sections = [];
    const lines = content.split('\n');
    let cur = null;

    lines.forEach(line => {
      const m = line.match(/^## (.+)$/);
      if (m) {
        if (cur) sections.push(cur);
        cur = { title: m[1].trim().replace(/^[^\w\s]+\s*/, ''), lines: [] };
      } else if (cur) {
        cur.lines.push(line);
      }
    });
    if (cur) sections.push(cur);

    if (!sections.length) {
      bodyEl.innerHTML = '<div class="faq-error"><strong>Tidak ada FAQ ditemukan.</strong><span>Gunakan format <code>## Section Title</code> di README.md.</span></div>';
      return;
    }

    // Build tabs
    tabsEl.innerHTML = '';
    sections.forEach((sec, i) => {
      const btn = document.createElement('button');
      btn.className = 'faq-tab' + (i === 0 ? ' active' : '');
      btn.textContent = sec.title;
      btn.onclick = () => switchTab(i);
      tabsEl.appendChild(btn);
    });

    // Build panels
    bodyEl.innerHTML = sections.map((sec, i) =>
      `<div class="faq-panel${i === 0 ? ' active' : ''}" data-p="${i}">${buildQA(sec.lines.join('\n'))}</div>`
    ).join('');
  }

  function buildQA(text) {
    const items = [];
    let q = null, aLines = [];

    text.split('\n').forEach(line => {
      const qm = line.match(/^\*\*Q:\s*(.+?)\*\*\s*$/);
      const am = line.match(/^A:\s*(.+)$/);
      if (qm) {
        if (q) items.push({ q, a: aLines.join(' ').trim() });
        q = qm[1]; aLines = [];
      } else if (am && q) {
        aLines.push(am[1]);
      } else if (q && line.trim() && !line.startsWith('---') && !line.startsWith('#')) {
        aLines.push(line.trim());
      }
    });
    if (q) items.push({ q, a: aLines.join(' ').trim() });

    if (!items.length) return '<p style="color:var(--tx2);font-size:14px;padding:8px 0">Tidak ada pertanyaan di section ini.</p>';

    return items.map(it => `
      <div class="faq-item">
        <div class="faq-q">${esc(it.q)}</div>
        <div class="faq-a">${esc(it.a)}</div>
      </div>`).join('');
  }

  function switchTab(idx) {
    document.querySelectorAll('.faq-tab').forEach((t,i) => t.classList.toggle('active', i === idx));
    document.querySelectorAll('.faq-panel').forEach((p,i) => p.classList.toggle('active', i === idx));
  }

  function esc(s) {
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

  load();
})();

/* ── 11. SMOOTH ANCHOR SCROLL ─────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});
