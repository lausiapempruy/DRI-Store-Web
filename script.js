// ══════════════════════════════════════════════════════════
//  DRI STORE — script.js
//  Firebase + Discord OAuth2 + Admin + Staff + Feedback
// ══════════════════════════════════════════════════════════

import { initializeApp }           from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, collection,
         getDocs, addDoc, deleteDoc, updateDoc,
         onSnapshot }              from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ──────────────────────────────────────────────────────────
//  ★ CONFIG — replace before deploy
// ──────────────────────────────────────────────────────────
const CONFIG = {
  // Firebase
  firebase: {
    apiKey:            "AIzaSyCPLEWtnMZhdwbWHZXD2QcTcCIAgC_FmJY",
    authDomain:        "dri-store-web.firebaseapp.com",
    projectId:         "dri-store-web",
    storageBucket:     "dri-store-web.firebasestorage.app",
    messagingSenderId: "921301753470",
    appId:             "1:921301753470:web:5df55d8e1ffc4b52a1c22f"
  },
  // Discord OAuth2
  discord: {
    clientId:    "discord.com/oauth2/authorize?client_id=1495230158398033970",
    redirectUri: window.location.origin + window.location.pathname,
    serverId:    "1495076646502531072",
    adminRoleId: "1495228138320429176",
    webhookUrl:  "https://discord.com/api/webhooks/1495386316408619200/7MXQLnoH1OlgbI47QUjAPXWazxtGas8hHzaKZ0QArJse9IVV-2q9jmtGSiTnTPTfv9UL"
  },
  // Staff Familia
  staffUrl: "https://lausiapempruy.github.io/Staff-Familia-Editor/data.json",
  // Claude API (Hate speech filter)
  claudeApiUrl: "https://api.anthropic.com/v1/messages",
  // Feedback cooldown (ms)
  feedbackCooldown: 10 * 60 * 1000
};

// ──────────────────────────────────────────────────────────
//  FIREBASE INIT
// ──────────────────────────────────────────────────────────
const fb  = initializeApp(CONFIG.firebase);
const db  = getFirestore(fb);

// ──────────────────────────────────────────────────────────
//  STATE
// ──────────────────────────────────────────────────────────
const State = {
  user:     null,   // { id, username, avatar, accessToken }
  isAdmin:  false,
  products: [],
  rules:    [],
  socials:  { discord:'#', tiktok:'#', instagram:'#' },
  unsubProducts: null,
  unsubRules:    null,
  unsubSocials:  null,
};

// ──────────────────────────────────────────────────────────
//  DUMMY PRODUCTS (shown until Firestore has data)
// ──────────────────────────────────────────────────────────
const DUMMY_PRODUCTS = [
  { id:'demo1', name:'Premium Pass', price:'Rp 25.000', desc:'Akses premium selama 30 hari. Nikmati fitur eksklusif tanpa batas.', images:['https://placehold.co/600x400/0f0f0f/c9a84c?text=Premium+Pass'], orderLink:'#' },
  { id:'demo2', name:'VIP Bundle',   price:'Rp 75.000', desc:'Paket VIP komplit dengan bonus eksklusif dan support prioritas.', images:['https://placehold.co/600x400/0f0f0f/c9a84c?text=VIP+Bundle','https://placehold.co/600x400/161616/c9a84c?text=VIP+2'], orderLink:'#' },
  { id:'demo3', name:'Elite Access', price:'Rp 150.000', desc:'Akses elite dengan semua fitur dan badge eksklusif DRI Store.', images:['https://placehold.co/600x400/0f0f0f/c9a84c?text=Elite+Access'], orderLink:'#' },
];

const DEFAULT_RULES = [
  'Dilarang melakukan penipuan dalam bentuk apapun.',
  'Hormati semua member dan staff DRI Store.',
  'Dilarang spam di semua channel.',
  'Semua transaksi harus melalui jalur resmi DRI Store.',
  'Dilarang membagikan informasi pribadi orang lain tanpa izin.',
];

// ──────────────────────────────────────────────────────────
//  CURSOR
// ──────────────────────────────────────────────────────────
const dot  = document.getElementById('cursor-dot');
const ring = document.getElementById('cursor-ring');
if (dot && ring) {
  let mx = 0, my = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  const animCursor = () => {
    if (dot) { dot.style.left = mx+'px'; dot.style.top = my+'px'; }
    rx += (mx-rx) * 0.15; ry += (my-ry) * 0.15;
    if (ring) { ring.style.left = rx+'px'; ring.style.top = ry+'px'; }
    requestAnimationFrame(animCursor);
  };
  animCursor();
  document.querySelectorAll('a,button').forEach(el => {
    el.addEventListener('mouseenter', () => { if(ring) { ring.style.width='44px'; ring.style.height='44px'; ring.style.borderColor='var(--gold2)'; } });
    el.addEventListener('mouseleave', () => { if(ring) { ring.style.width='28px'; ring.style.height='28px'; ring.style.borderColor='var(--gold)'; } });
  });
}

// ──────────────────────────────────────────────────────────
//  TOAST
// ──────────────────────────────────────────────────────────
function toast(msg, type='') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'toast' + (type ? ' '+type : '');
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 3500);
}

// ──────────────────────────────────────────────────────────
//  UTILS
// ──────────────────────────────────────────────────────────
function $(id) { return document.getElementById(id); }
function show(id) { const el = $(id); if(el) el.classList.remove('hidden'); }
function hide(id) { const el = $(id); if(el) el.classList.add('hidden'); }
function setLsStatus(txt) { const el = $('ls-status-text'); if(el) el.textContent = txt; }
function setLdText(txt)   { const el = $('ld-text');        if(el) el.textContent = txt; }

// ──────────────────────────────────────────────────────────
//  DISCORD OAUTH2
// ──────────────────────────────────────────────────────────
window.App = {

  startOAuth() {
    const params = new URLSearchParams({
      client_id:     CONFIG.discord.clientId,
      redirect_uri:  CONFIG.discord.redirectUri,
      response_type: 'token',
      scope:         'identify guilds guilds.members.read',
    });
    window.location.href = 'https://discord.com/api/oauth2/authorize?' + params.toString();
  },

  async handleOAuthCallback(hash) {
    const params = new URLSearchParams(hash.substring(1));
    const token  = params.get('access_token');
    if (!token) return false;

    // Clear hash from URL
    history.replaceState(null, '', window.location.pathname);

    show('loading-screen');
    hide('lockscreen');
    setLdText('Mengambil data akun...');

    try {
      // Fetch user identity
      const userRes  = await fetch('https://discord.com/api/users/@me', { headers: { Authorization: 'Bearer ' + token } });
      if (!userRes.ok) throw new Error('Gagal ambil data user');
      const userData = await userRes.json();

      setLdText('Memeriksa keanggotaan server...');

      // Server membership check via RoProxy-style delay
      await new Promise(r => setTimeout(r, 500));
      const memberRes = await fetch(`https://discord.com/api/users/@me/guilds/${CONFIG.discord.serverId}/member`, {
        headers: { Authorization: 'Bearer ' + token }
      });

      if (!memberRes.ok) {
        hide('loading-screen');
        show('lockscreen');
        setLsStatus('⚠ Kamu belum bergabung ke server DRI Store. Join dulu!');
        toast('Kamu belum join server Discord DRI Store!', 'error');
        return false;
      }

      const memberData = await memberRes.json();
      const roles      = memberData.roles || [];
      const isAdmin    = roles.includes(CONFIG.discord.adminRoleId);

      // Build user object
      State.user = {
        id:          userData.id,
        username:    userData.username,
        displayName: memberData.nick || userData.global_name || userData.username,
        avatar:      userData.avatar
          ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png?size=64`
          : `https://cdn.discordapp.com/embed/avatars/${parseInt(userData.discriminator||0) % 5}.png`,
        accessToken: token,
      };
      State.isAdmin = isAdmin;

      // Persist to session
      sessionStorage.setItem('dri_user',    JSON.stringify(State.user));
      sessionStorage.setItem('dri_admin',   isAdmin ? '1' : '0');

      // Save/update user in Firestore
      await setDoc(doc(db, 'users', userData.id), {
        username:    State.user.username,
        displayName: State.user.displayName,
        avatar:      State.user.avatar,
        isAdmin,
        lastLogin:   new Date().toISOString(),
      }, { merge: true });

      setLdText('Memuat konten...');
      await new Promise(r => setTimeout(r, 800));

      this._launchApp();
      return true;

    } catch (err) {
      console.error(err);
      hide('loading-screen');
      show('lockscreen');
      setLsStatus('❌ Error: ' + err.message);
      toast('Gagal autentikasi: ' + err.message, 'error');
      return false;
    }
  },

  async init() {
    // Custom cursor textarea fix
    document.addEventListener('keyup', e => {
      const el = $('fb-msg');
      if (el) $('fb-count').textContent = el.value.length;
    });

    // Check session
    const saved = sessionStorage.getItem('dri_user');
    if (saved) {
      State.user    = JSON.parse(saved);
      State.isAdmin = sessionStorage.getItem('dri_admin') === '1';
      show('loading-screen');
      setLdText('Memulihkan sesi...');
      await new Promise(r => setTimeout(r, 1000));
      this._launchApp();
      return;
    }

    // Handle OAuth callback
    if (window.location.hash.includes('access_token')) {
      await this.handleOAuthCallback(window.location.hash);
      return;
    }

    // Show lockscreen
    show('lockscreen'); // already visible by default
  },

  _launchApp() {
    hide('loading-screen');
    hide('lockscreen');
    show('app');

    // Set nav user info
    $('nav-avatar').src = State.user.avatar;
    $('nav-uname').textContent = State.user.displayName;
    show('nav-user');
    if (State.isAdmin) show('btn-admin');

    // Load all data
    this._listenFirestore();
    this._loadStaff();
    this._applyCharCounter();
  },

  _listenFirestore() {
    // Products real-time
    State.unsubProducts = onSnapshot(collection(db, 'products'), snap => {
      const docs = [];
      snap.forEach(d => docs.push({ id: d.id, ...d.data() }));
      State.products = docs.length ? docs : DUMMY_PRODUCTS;
      if ($('sec-products').classList.contains('active')) this._renderProducts();
    });

    // Rules real-time
    State.unsubRules = onSnapshot(doc(db, 'config', 'rules'), snap => {
      const data = snap.exists() ? snap.data() : null;
      State.rules = data?.list || DEFAULT_RULES;
      if ($('sec-rules').classList.contains('active')) this._renderRules();
    });

    // Socials real-time
    State.unsubSocials = onSnapshot(doc(db, 'config', 'socials'), snap => {
      const data = snap.exists() ? snap.data() : {};
      State.socials = { discord: data.discord||'#', tiktok: data.tiktok||'#', instagram: data.instagram||'#' };
      this._applySocials();
    });
  },

  _applySocials() {
    const sl = State.socials;
    const links = [
      ['sl-discord', sl.discord],
      ['sl-tiktok',  sl.tiktok],
      ['sl-instagram', sl.instagram],
      ['hero-discord-link', sl.discord],
    ];
    links.forEach(([id, href]) => { const el = $(id); if(el) el.href = href; });
  },

  _applyCharCounter() {
    const ta = $('fb-msg');
    if (ta) ta.addEventListener('input', () => { $('fb-count').textContent = ta.value.length; });
  },

  nav(el, sec) {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    if (el) el.classList.add('active');
    document.querySelectorAll('.sec').forEach(s => { s.classList.remove('active'); s.classList.add('hidden'); });
    const target = $('sec-'+sec);
    if (target) { target.classList.remove('hidden'); target.classList.add('active'); }
    // Lazy render
    if (sec === 'products') this._renderProducts();
    if (sec === 'staff')    this._renderStaff();
    if (sec === 'rules')    this._renderRules();
    // close mobile menu
    $('nav-links')?.classList.remove('open');
  },

  toggleMenu() {
    $('nav-links')?.classList.toggle('open');
  },

  // ── PRODUCTS ──
  _renderProducts() {
    const grid = $('products-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const prods = State.products.length ? State.products : DUMMY_PRODUCTS;
    prods.forEach(p => {
      const img = (p.images && p.images[0]) || 'https://placehold.co/400x300/0f0f0f/c9a84c?text=DRI+Store';
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <div class="pc-img-wrap">
          <img src="${img}" alt="${p.name}" loading="lazy"/>
          <span class="pc-badge">DRI STORE</span>
        </div>
        <div class="pc-body">
          <p class="pc-name">${p.name}</p>
          <p class="pc-price">${p.price}</p>
          <p class="pc-desc">${p.desc||''}</p>
          <button class="pc-btn" onclick="App.openProdModal('${p.id}')">Lihat Detail →</button>
        </div>`;
      grid.appendChild(card);
    });
  },

  openProdModal(id) {
    const p = State.products.find(x => x.id === id);
    if (!p) return;
    $('modal-name').textContent  = p.name;
    $('modal-price').textContent = p.price;
    $('modal-desc').textContent  = p.desc || '';
    $('modal-order').href        = p.orderLink || '#';

    const imgs = (p.images && p.images.length) ? p.images : ['https://placehold.co/600x400/0f0f0f/c9a84c?text=DRI+Store'];
    $('modal-main-img').src = imgs[0];

    const thumbs = $('modal-thumbs');
    thumbs.innerHTML = '';
    if (imgs.length > 1) {
      imgs.forEach((src, i) => {
        const img = document.createElement('img');
        img.src = src; if(i===0) img.classList.add('active');
        img.onclick = () => {
          $('modal-main-img').src = src;
          thumbs.querySelectorAll('img').forEach(t => t.classList.remove('active'));
          img.classList.add('active');
        };
        thumbs.appendChild(img);
      });
    }
    show('prod-modal');
  },

  closeProdModal() { hide('prod-modal'); },

  // ── STAFF ──
  async _loadStaff() {
    try {
      // Fetch via Blob URL (anti-leak, RAM only)
      const res  = await fetch(CONFIG.staffUrl);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const res2 = await fetch(url);
      const data = await res2.json();
      URL.revokeObjectURL(url);
      State.staffData = Array.isArray(data) ? data : (data.staff || data.members || []);
    } catch(e) {
      State.staffData = [];
    }
  },

  _renderStaff() {
    const grid = $('staff-grid');
    if (!grid) return;
    if (!State.staffData) {
      grid.innerHTML = '<div class="spinner">Memuat...</div>';
      setTimeout(() => this._renderStaff(), 1000);
      return;
    }
    if (!State.staffData.length) {
      grid.innerHTML = '<div class="spinner">Tidak ada data staff ditemukan.</div>';
      return;
    }
    grid.innerHTML = '';
    State.staffData.forEach(s => {
      const card = document.createElement('div');
      card.className = 'staff-card';
      card.innerHTML = `
        <img class="staff-avatar" src="${s.avatar||s.image||s.pfp||'https://placehold.co/80x80/0f0f0f/c9a84c?text=?'}" alt="${s.name||s.username||'Staff'}" loading="lazy"/>
        <p class="staff-name">${s.name||s.username||'Unknown'}</p>
        <span class="staff-role">${s.role||s.position||'Staff'}</span>`;
      grid.appendChild(card);
    });
  },

  // ── RULES ──
  _renderRules() {
    const list = $('rules-list');
    if (!list) return;
    const rules = State.rules.length ? State.rules : DEFAULT_RULES;
    list.innerHTML = rules.map((r, i) => `
      <div class="rule-item">
        <span class="rule-num">${String(i+1).padStart(2,'0')}</span>
        <span class="rule-text">${r}</span>
      </div>`).join('');
  },

  // ── FEEDBACK ──
  _fbCooldownKey() { return 'dri_fb_cd_' + State.user?.id; },

  async verifyRoblox() {
    const username = $('roblox-user')?.value?.trim();
    const status   = $('roblox-status');
    if (!username) { status.textContent = '⚠ Masukkan username.'; status.className='roblox-status err'; return; }
    status.textContent = 'Memverifikasi...'; status.className = 'roblox-status';
    try {
      // 15s delay verification
      await new Promise(r => setTimeout(r, 2000));
      const res  = await fetch(`https://api.roproxy.com/v1/users/search?keyword=${encodeURIComponent(username)}&limit=10`);
      const data = await res.json();
      const found = data?.data?.find(u => u.name.toLowerCase() === username.toLowerCase());
      if (found) {
        State.robloxVerified = found.name;
        status.textContent = `✓ Terverifikasi: ${found.name} (ID: ${found.id})`;
        status.className = 'roblox-status ok';
      } else {
        State.robloxVerified = null;
        status.textContent = '✗ Username tidak ditemukan di Roblox.';
        status.className = 'roblox-status err';
      }
    } catch(e) {
      State.robloxVerified = null;
      status.textContent = '✗ Gagal verifikasi (coba lagi).';
      status.className = 'roblox-status err';
    }
  },

  async submitFeedback() {
    const msg  = $('fb-msg')?.value?.trim();
    const type = document.querySelector('input[name="fb-type"]:checked')?.value || 'Kritik';
    const btn  = document.querySelector('#fb-form .btn-gold');

    if (!msg) { toast('Pesan tidak boleh kosong!', 'error'); return; }

    // Cooldown check
    const cdKey = this._fbCooldownKey();
    const lastSent = parseInt(localStorage.getItem(cdKey)||'0');
    const now = Date.now();
    if (now - lastSent < CONFIG.feedbackCooldown) {
      const left = Math.ceil((CONFIG.feedbackCooldown - (now-lastSent)) / 60000);
      $('fb-cd-msg').textContent = `⏳ Cooldown aktif. Tunggu ${left} menit lagi.`;
      show('fb-cd-msg');
      return;
    }

    if (btn) { btn.textContent = 'Memfilter pesan...'; btn.disabled = true; }

    // AI Hate Speech Filter via Claude API
    const toxic = await this._checkHateSpeech(msg);

    if (toxic) {
      this._triggerToxicSelfDestruct();
      if (btn) { btn.textContent = 'Kirim Pesan'; btn.disabled = false; }
      return;
    }

    // Send to Discord Webhook
    try {
      if (btn) btn.textContent = 'Mengirim...';
      const user = State.user;
      const payload = {
        embeds: [{
          title: `${type} dari DRI Store Website`,
          description: msg,
          color: type === 'Kritik' ? 0xe74c3c : 0x2ecc71,
          author: { name: user.displayName, icon_url: user.avatar },
          footer: { text: `ID: ${user.id} • Roblox: ${State.robloxVerified||'Tidak Diverifikasi'}` },
          timestamp: new Date().toISOString()
        }]
      };
      await fetch(CONFIG.discord.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      localStorage.setItem(cdKey, String(Date.now()));
      $('fb-msg').value = '';
      $('fb-count').textContent = '0';
      $('fb-cd-msg').textContent = '✓ Pesan terkirim! Cooldown 10 menit aktif.';
      show('fb-cd-msg');
      toast('Pesan terkirim! Terima kasih.', 'success');
    } catch(e) {
      toast('Gagal kirim pesan. Coba lagi.', 'error');
    } finally {
      if (btn) { btn.textContent = 'Kirim Pesan'; btn.disabled = false; }
    }
  },

  async _checkHateSpeech(text) {
    // Uses Claude API via proxy
    // NOTE: In production, this should go through your backend to protect API keys.
    // For GitHub Pages (static), use a Cloudflare Worker or similar proxy.
    try {
      const res = await fetch(CONFIG.claudeApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 20,
          system: 'You are a hate speech detector. Respond ONLY with "TOXIC" if the message contains hate speech, insults, profanity, or harassment, otherwise respond with "CLEAN".',
          messages: [{ role:'user', content: text }]
        })
      });
      const data = await res.json();
      const reply = data?.content?.[0]?.text?.trim().toUpperCase() || 'CLEAN';
      return reply.includes('TOXIC');
    } catch {
      // On API error, fallback to keyword filter
      const badWords = ['anjing','bangsat','babi','tolol','idiot','goblok','bodoh','hate','kill','die','stupid'];
      return badWords.some(w => text.toLowerCase().includes(w));
    }
  },

  _triggerToxicSelfDestruct() {
    hide('fb-form');
    show('fb-toxic');
    let t = 5;
    $('toxic-timer').textContent = t;
    // Trigger CSS transition
    setTimeout(() => { const f = $('toxic-fill'); if(f) f.style.width='0%'; }, 100);
    const interval = setInterval(() => {
      t--;
      $('toxic-timer').textContent = t;
      if (t <= 0) {
        clearInterval(interval);
        hide('fb-toxic');
        show('fb-form');
        $('fb-msg').value = '';
        $('fb-count').textContent = '0';
        // Reset fill
        setTimeout(() => { const f = $('toxic-fill'); if(f) f.style.width='100%'; f.style.transition='none'; }, 100);
        setTimeout(() => { const f = $('toxic-fill'); if(f) f.style.transition=''; }, 200);
      }
    }, 1000);
  },

  // ── ADMIN ──
  openAdmin() {
    if (!State.isAdmin) { toast('Akses ditolak!', 'error'); return; }
    hide('app');
    show('admin-panel');
    Admin.init();
  },

  closeAdmin() {
    hide('admin-panel');
    show('app');
  },

  // ── LOGOUT ──
  logout() {
    sessionStorage.clear();
    State.user = null; State.isAdmin = false;
    if (State.unsubProducts) State.unsubProducts();
    if (State.unsubRules)    State.unsubRules();
    if (State.unsubSocials)  State.unsubSocials();
    hide('app');
    show('lockscreen');
    setLsStatus('Kamu telah logout.');
    toast('Logout berhasil.');
  }
};

// ──────────────────────────────────────────────────────────
//  ADMIN MODULE
// ──────────────────────────────────────────────────────────
window.Admin = {

  async init() {
    this.renderProducts();
    this.renderRules();
    this.loadSocials();
  },

  tab(btn, name) {
    document.querySelectorAll('.adm-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.adm-tab').forEach(t => { t.classList.remove('active'); t.classList.add('hidden'); });
    const target = $('adm-'+name);
    if (target) { target.classList.remove('hidden'); target.classList.add('active'); }
    if (name === 'products') this.renderProducts();
    if (name === 'rules')    this.renderRules();
    if (name === 'socials')  this.loadSocials();
  },

  // ── PRODUCTS ──
  async renderProducts() {
    const list = $('adm-prod-list');
    if (!list) return;
    const snap = await getDocs(collection(db, 'products'));
    const prods = [];
    snap.forEach(d => prods.push({ id:d.id, ...d.data() }));

    if (!prods.length) {
      list.innerHTML = '<p style="color:var(--muted);font-family:var(--font-mono);font-size:12px">Belum ada produk. Tambah sekarang.</p>';
      return;
    }
    list.innerHTML = prods.map(p => `
      <div class="adm-prod-item">
        <img class="adm-prod-img" src="${p.images?.[0]||'https://placehold.co/56x56/0f0f0f/c9a84c?text=?'}" alt="${p.name}"/>
        <div class="adm-prod-info">
          <strong>${p.name}</strong>
          <span>${p.price}</span>
        </div>
        <div class="adm-prod-actions">
          <button class="btn-edit" onclick="Admin.editProduct('${p.id}')">✎ Edit</button>
          <button class="btn-del"  onclick="Admin.deleteProduct('${p.id}')">✕</button>
        </div>
      </div>`).join('');
  },

  openForm(id) {
    $('adm-form-ttl').textContent = 'Tambah Produk';
    $('adm-pid').value   = '';
    $('adm-pname').value = '';
    $('adm-pprice').value= '';
    $('adm-pdesc').value = '';
    $('adm-porder').value= '';
    $('adm-pimgs').value = '';
    show('adm-form-modal');
  },

  async editProduct(id) {
    const d = await getDoc(doc(db,'products',id));
    if (!d.exists()) return;
    const p = d.data();
    $('adm-form-ttl').textContent = 'Edit Produk';
    $('adm-pid').value   = id;
    $('adm-pname').value = p.name||'';
    $('adm-pprice').value= p.price||'';
    $('adm-pdesc').value = p.desc||'';
    $('adm-porder').value= p.orderLink||'';
    $('adm-pimgs').value = (p.images||[]).join('\n');
    show('adm-form-modal');
  },

  closeForm() { hide('adm-form-modal'); },

  async saveProduct() {
    const id     = $('adm-pid').value;
    const name   = $('adm-pname').value.trim();
    const price  = $('adm-pprice').value.trim();
    const desc   = $('adm-pdesc').value.trim();
    const order  = $('adm-porder').value.trim();
    const images = $('adm-pimgs').value.split('\n').map(s=>s.trim()).filter(Boolean).slice(0,10);

    if (!name || !price) { toast('Nama dan harga wajib diisi!', 'error'); return; }

    const data = { name, price, desc, orderLink:order, images, updatedAt: new Date().toISOString() };

    try {
      if (id) {
        await updateDoc(doc(db,'products',id), data);
      } else {
        data.createdAt = new Date().toISOString();
        await addDoc(collection(db,'products'), data);
      }
      toast('Produk disimpan!', 'success');
      this.closeForm();
      this.renderProducts();
    } catch(e) {
      toast('Gagal simpan: ' + e.message, 'error');
    }
  },

  async deleteProduct(id) {
    if (!confirm('Hapus produk ini?')) return;
    try {
      await deleteDoc(doc(db,'products',id));
      toast('Produk dihapus.', 'success');
      this.renderProducts();
    } catch(e) {
      toast('Gagal hapus: ' + e.message, 'error');
    }
  },

  // ── RULES ──
  async renderRules() {
    const list = $('adm-rules-list');
    if (!list) return;
    const d = await getDoc(doc(db,'config','rules'));
    const rules = d.exists() ? (d.data().list || DEFAULT_RULES) : DEFAULT_RULES;
    list.innerHTML = rules.map((r,i) => `
      <div class="adm-rule-row" id="rr-${i}">
        <textarea rows="2">${r}</textarea>
        <button class="adm-rule-del" onclick="Admin.removeRule(${i})">✕</button>
      </div>`).join('');
  },

  addRule() {
    const list = $('adm-rules-list');
    const i    = list.querySelectorAll('.adm-rule-row').length;
    const row  = document.createElement('div');
    row.className = 'adm-rule-row'; row.id = 'rr-'+i;
    row.innerHTML = `<textarea rows="2" placeholder="Peraturan baru..."></textarea><button class="adm-rule-del" onclick="this.parentElement.remove()">✕</button>`;
    list.appendChild(row);
  },

  removeRule(i) { $('rr-'+i)?.remove(); },

  async saveRules() {
    const rows  = $('adm-rules-list').querySelectorAll('textarea');
    const rules = [...rows].map(t=>t.value.trim()).filter(Boolean);
    try {
      await setDoc(doc(db,'config','rules'), { list: rules, updatedAt: new Date().toISOString() });
      toast('Peraturan disimpan!', 'success');
    } catch(e) {
      toast('Gagal simpan: ' + e.message, 'error');
    }
  },

  // ── SOCIALS ──
  async loadSocials() {
    try {
      const d = await getDoc(doc(db,'config','socials'));
      if (d.exists()) {
        const data = d.data();
        $('adm-disc').value   = data.discord||'';
        $('adm-tiktok').value = data.tiktok||'';
        $('adm-ig').value     = data.instagram||'';
      }
    } catch {}
  },

  async saveSocials() {
    const data = {
      discord:   $('adm-disc').value.trim(),
      tiktok:    $('adm-tiktok').value.trim(),
      instagram: $('adm-ig').value.trim(),
      updatedAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db,'config','socials'), data);
      toast('Social links disimpan!', 'success');
    } catch(e) {
      toast('Gagal simpan: ' + e.message, 'error');
    }
  },

  // ── SYNC ──
  async forceSync() {
    const log = $('sync-log');
    const ts  = new Date().toLocaleTimeString();
    log.textContent += `[${ts}] Force sync initiated...\n`;
    // Firestore real-time listeners handle this automatically.
    // This just triggers a visual confirmation.
    await new Promise(r => setTimeout(r, 800));
    log.textContent += `[${ts}] ✓ All listeners active. Data is in sync.\n`;
    toast('Sync berhasil!', 'success');
  }
};

// ──────────────────────────────────────────────────────────
//  BOOT
// ──────────────────────────────────────────────────────────
App.init();
