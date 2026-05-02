/* ============================================================
   DRI Store — app.js
   Production JS: Security + FAQ Parser + Animations + Cursor
   ============================================================ */

'use strict';

/* ── SECURITY LAYER ────────────────────────────────────────── */
(function() {
  // 1. Disable right-click
  document.addEventListener('contextmenu', e => e.preventDefault());

  // 2. Disable common devtools shortcuts
  document.addEventListener('keydown', e => {
    const blocked = (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && ['I','J','C','U','K'].includes(e.key.toUpperCase())) ||
      (e.ctrlKey && e.key.toUpperCase() === 'U') ||
      (e.ctrlKey && e.key.toUpperCase() === 'S') ||
      (e.ctrlKey && e.key.toUpperCase() === 'A') ||
      (e.ctrlKey && e.key.toUpperCase() === 'P')
    );
    if (blocked) e.preventDefault();
  });

  // 3. Detect devtools open (size heuristic)
  let devtoolsOpen = false;
  const threshold = 160;
  function detectDevtools() {
    const widthDiff = window.outerWidth - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;
    if (widthDiff > threshold || heightDiff > threshold) {
    } else {
      devtoolsOpen = false;
    }
  }
  setInterval(detectDevtools, 1000);

  // 4. Disable text selection on sensitive areas
  document.addEventListener('selectstart', e => {
    if (!e.target.matches('input,textarea,[contenteditable]')) {
      e.preventDefault();
    }
  });

  // 5. Disable drag
  document.addEventListener('dragstart', e => e.preventDefault());

  // 6. Protect Discord link — encode so it's not plain text in DOM
  // Links are set dynamically by JS below
  const DISCORD_ENCODED = atob('aHR0cHM6Ly9kaXNjb3JkLmdnL1VzN01IYjhWUUU=');
  const discordBtns = document.querySelectorAll(
    '#discordNavBtn,#discordMobileBtn,#heroDiscordBtn,#ctaDiscordBtn,#footerDiscordBtn'
  );
  discordBtns.forEach(btn => {
    if (btn) btn.setAttribute('href', DISCORD_ENCODED);
  });

  // 7. Warn on copy attempt
  document.addEventListener('copy', e => {
    e.clipboardData.setData('text/plain', '© DRI Store — Konten ini dilindungi.');
    e.preventDefault();
  });

  // 8. Console warning
  const style = 'color:#f87171;font-size:14px;font-weight:bold';
  console.log('%c⛔ STOP!', style);
  console.log('%cJangan lanjutkan jika kamu tidak tahu apa yang kamu lakukan. Website ini milik DRI Store.', 'color:#8888aa;font-size:12px');
})();

/* ── CURSOR ────────────────────────────────────────────────── */
(function() {
  const cursor = document.getElementById('cursor');
  const dot = document.getElementById('cursorDot');
  if (!cursor || !dot) return;

  let mx = 0, my = 0, cx = 0, cy = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top = my + 'px';
  });

  function animateCursor() {
    cx += (mx - cx) * 0.12;
    cy += (my - cy) * 0.12;
    cursor.style.left = cx + 'px';
    cursor.style.top = cy + 'px';
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  // Scale on hover interactable elements
  document.querySelectorAll('a,button,.faq-tab,.glass-card-feat').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.style.transform = 'translate(-50%,-50%) scale(1.8)');
    el.addEventListener('mouseleave', () => cursor.style.transform = 'translate(-50%,-50%) scale(1)');
  });
})();

/* ── PARTICLE CANVAS ───────────────────────────────────────── */
(function() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.r = Math.random() * 1.5 + 0.3;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = (Math.random() - 0.5) * 0.3;
      this.alpha = Math.random() * 0.4 + 0.1;
      const colors = ['108,99,255','167,139,250','56,189,248'];
      this.color = colors[Math.floor(Math.random() * colors.length)];
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color},${this.alpha})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < 80; i++) particles.push(new Particle());

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(108,99,255,${0.08 * (1 - dist/120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    drawConnections();
    requestAnimationFrame(loop);
  }
  loop();
})();

/* ── NAVBAR SCROLL ─────────────────────────────────────────── */
(function() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  });
})();

/* ── HAMBURGER ─────────────────────────────────────────────── */
(function() {
  const btn = document.getElementById('hamburger');
  const menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;
  btn.addEventListener('click', () => {
    btn.classList.toggle('open');
    menu.classList.toggle('open');
  });
  // Close on link click
  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      btn.classList.remove('open');
      menu.classList.remove('open');
    });
  });
})();

/* ── SCROLL REVEAL ─────────────────────────────────────────── */
(function() {
  const els = document.querySelectorAll('.reveal,.reveal-right');
  if (!els.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(el => obs.observe(el));
})();

/* ── FAQ — FETCH & PARSE README.md ─────────────────────────── */
(function() {
  const README_URL = 'https://raw.githubusercontent.com/lausiapempruy/DRI-Store-Web/main/README.md';
  const tabsEl = document.getElementById('faqTabs');
  const bodyEl = document.getElementById('faqBody');
  if (!tabsEl || !bodyEl) return;

  async function loadFAQ() {
    try {
      const res = await fetch(README_URL + '?nocache=' + Date.now());
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const text = await res.text();
      parseFAQ(text);
    } catch (err) {
      bodyEl.innerHTML = `
        <div class="faq-error">
          <strong>⚠️ Gagal memuat FAQ.</strong>
          <span>Pastikan file README.md ada di repo <code>lausiapempruy/DRI-Store-Web</code> dan repo bersifat public.</span>
          <code>${err.message}</code>
        </div>`;
    }
  }

  function parseFAQ(text) {
    // Extract between markers if present
    const startMarker = '<!-- DRI_STORE_FAQ_START -->';
    const endMarker = '<!-- DRI_STORE_FAQ_END -->';
    let content = text;
    if (text.includes(startMarker)) {
      const s = text.indexOf(startMarker) + startMarker.length;
      const e = text.includes(endMarker) ? text.indexOf(endMarker) : text.length;
      content = text.slice(s, e).trim();
    }

    // Split into sections by ## headings
    const sectionRegex = /^## (.+)$/gm;
    const sections = [];
    let match;
    const indices = [];

    while ((match = sectionRegex.exec(content)) !== null) {
      indices.push({ title: match[1].trim(), index: match.index, end: 0 });
    }

    indices.forEach((sec, i) => {
      sec.end = i + 1 < indices.length ? indices[i + 1].index : content.length;
      const raw = content.slice(sec.index, sec.end).replace(/^## .+\n/, '').trim();
      sections.push({ title: sec.title, raw });
    });

    if (!sections.length) {
      bodyEl.innerHTML = '<div class="faq-error"><strong>Tidak ada FAQ ditemukan di README.md.</strong><span>Pastikan format menggunakan <code>## Section Title</code>.</span></div>';
      return;
    }

    // Build tabs
    tabsEl.innerHTML = '';
    sections.forEach((sec, i) => {
      const btn = document.createElement('button');
      btn.className = 'faq-tab' + (i === 0 ? ' active' : '');
      btn.textContent = sec.title;
      btn.dataset.index = i;
      btn.addEventListener('click', () => switchTab(i));
      tabsEl.appendChild(btn);
    });

    // Build panels
    bodyEl.innerHTML = sections.map((sec, i) => `
      <div class="faq-panel${i === 0 ? ' active' : ''}" data-panel="${i}">
        ${parseQA(sec.raw)}
      </div>
    `).join('');
  }

  function parseQA(text) {
    // Parse **Q: ...** / A: ... pattern
    const lines = text.split('\n');
    const items = [];
    let currentQ = null;
    let currentA = [];

    lines.forEach(line => {
      const qMatch = line.match(/^\*\*Q:\s*(.+?)\*\*$/);
      const aMatch = line.match(/^A:\s*(.+)$/);

      if (qMatch) {
        if (currentQ) {
          items.push({ q: currentQ, a: currentA.join('\n').trim() });
        }
        currentQ = qMatch[1];
        currentA = [];
      } else if (aMatch && currentQ) {
        currentA.push(aMatch[1]);
      } else if (line.trim() && currentQ && !line.startsWith('---') && !line.startsWith('#')) {
        currentA.push(line.trim());
      }
    });

    if (currentQ) items.push({ q: currentQ, a: currentA.join('\n').trim() });

    if (!items.length) {
      return '<p style="color:var(--text2);font-size:14px">Tidak ada pertanyaan di section ini.</p>';
    }

    return items.map(item => `
      <div class="faq-item">
        <div class="faq-q">${escHtml(item.q)}</div>
        <div class="faq-a">${escHtml(item.a)}</div>
      </div>
    `).join('');
  }

  function switchTab(idx) {
    document.querySelectorAll('.faq-tab').forEach((t, i) => {
      t.classList.toggle('active', i === idx);
    });
    document.querySelectorAll('.faq-panel').forEach((p, i) => {
      p.classList.toggle('active', i === idx);
    });
  }

  function escHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  loadFAQ();
})();

/* ── CARD 3D TILT ───────────────────────────────────────────── */
(function() {
  document.querySelectorAll('.glass-card-feat,.team-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `translateY(-6px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();

/* ── SMOOTH ANCHOR SCROLL ──────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
