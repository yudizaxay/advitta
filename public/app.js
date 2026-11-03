'use strict';
/* ───────── icons ───────── */
const ICONS = {
  home: '<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>',
  link: '<circle cx="9" cy="12" r="5"/><circle cx="15" cy="12" r="5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 20c1-4 4-6 8-6s7 2 8 6"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/>',
  filter: '<path d="M4 7h16M7 12h10M10 17h4"/>',
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 21h4"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  chev: '<path d="M9 5l7 7-7 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  up: '<path d="M12 19V5M5 12l7-7 7 7"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>',
  file: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>',
  out: '<path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9"/>',
  biz: '<path d="M5 21V4h9v17M14 9h5v12M8 8h3M8 12h3M8 16h3"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  cam: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
  doc: '<path d="M7 3h10v18H7z"/><path d="M10 8h4M10 12h4M10 16h2"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M9 9h5a2 2 0 0 1 0 4H9M9 13h4"/>',
};
const I = (n, s = 22) => `<svg class="i" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;
const logo = (s = 48, anim = false) => `<svg class="logo${anim ? ' draw' : ''}" width="${s}" height="${s}" viewBox="0 0 48 48" role="img" aria-label="Advitta"><rect width="48" height="48" rx="13" fill="#5B2D8E"/><path pathLength="1" d="M14 35V23a10 10 0 0 1 20 0v12" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/><path pathLength="1" d="M14 28h20" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/></svg>`;

/* ───────── data ───────── */
let SECTORS, CITIES;
const applyMaster = () => { SECTORS = DB.master.sectors; CITIES = DB.master.cities; };
applyMaster();
const AMOUNTS = [{ l: 'Any', min: 0, max: 1e9 }, { l: 'Up to ₹1L', min: 0, max: 100000 }, { l: '₹1L – ₹2.5L', min: 100000, max: 250000 }, { l: '₹2.5L – ₹5L', min: 250000, max: 500000 }];
const NEXT_REPLIES = ['Thanks for connecting. Happy to learn more about the plan.', 'That makes sense. Could you share how you would use the first month of funds?', 'Great. I am free this week for a call.', 'Understood. Let me review and get back to you tomorrow.'];
const PAGE_TITLES = { about: 'About Advitta', terms: 'Terms & Conditions', privacy: 'Privacy Policy', disclaimer: 'Disclaimer' };
const CATS = ['Verification', 'Listing', 'Introduction', 'Account', 'Other'];

/* ───────── state ───────── */
const AS = new URLSearchParams(location.search).get('as'); /* demo hub: fixed role, own session */
const GK = 'advitta.session' + (AS ? '.' + AS : '');
let G = (() => { try { return JSON.parse(localStorage.getItem(GK)); } catch { return null; } })() || { role: null, in: false, mid: null };
const saveG = () => { try { localStorage.setItem(GK, JSON.stringify(G)); } catch { /* ignore */ } };
const save = () => { saveDB(); saveG(); };
let M = null, S = null, seen = new Set();
const blank = role => ({ id: uid('m'), role, phone: '', user: null, ver: 'none', reject: '', docs: {}, idType: 'PAN', business: {}, areas: [], declaration: '', settings: { push: true, chat: true }, notes: [], active: true, seed: false, t: Date.now(), mem: 0 });
const wrap = m => new Proxy(m, {
  get(t, k) {
    if (k === 'listings') return DB.listings.filter(l => l.oid === t.id);
    if (k === 'interests') return DB.interests.filter(i => t.role === 'ent' ? ownerId(i) === t.id : i.iid === t.id);
    if (k === 'tickets') return DB.tickets.filter(x => x.mid === t.id);
    return t[k];
  },
  set(t, k, v) { t[k] = v; return true; },
});
function useMember(m) { M = m; S = wrap(m); seen = new Set(m.notes.map(n => n.id)); }
if (AS) G.role = AS;
const loggedOutScreen = () => (AS ? 'login' : 'role');
if (G.mid && member(G.mid)) useMember(member(G.mid)); else if (G.role) useMember(blank(G.role)); else G.in = false;
const isEnt = () => S && S.role === 'ent';
const chatOpen = it => it.stage >= 2 && it.stage <= 3 && !it.chatOff;

/* ───────── navigation ───────── */
let stack = [{ name: 'splash', p: {} }], tab = 'home', timer = null;
const ui = { f: { q: '', sector: [], stage: [], city: '', amt: 0 }, otpPhone: '' };
const cur = () => stack[stack.length - 1];
const push = (name, p = {}) => { stack.push({ name, p }); render('r'); };
const pop = () => { if (stack.length > 1) { stack.pop(); render('l'); } };
const reset = (name, p = {}) => { stack = [{ name, p }]; render('f'); };
const home = () => { tab = 'home'; reset('tabs'); };

function render(anim) {
  clearInterval(timer);
  const v = $('#view'), old = $('.scroll', v), keep = !anim && old ? old.scrollTop : 0;
  let { name, p } = cur();
  if (G.in && M && M.active === false && !['splash', 'role'].includes(name)) { name = 'blocked'; p = {}; }
  v.innerHTML = `<div class="page ${anim ? 'a-' + anim : ''} ${name === 'splash' ? 'splash' : ''}">${screens[name](p)}</div>`;
  const sc = $('.scroll', v); if (sc && keep) sc.scrollTop = keep;
  mounts[name]?.(p);
}

/* ───────── component bits ───────── */
const nav = (title, right = '', sub = '') => `<header class="nav"><button class="ib" data-act="back" aria-label="Back">${I('back')}</button><h2>${title}${sub ? `<span class="sub">${sub}</span>` : ''}</h2><div class="nr">${right}</div></header>`;
const large = (t, right = '') => `<header class="large"><h1>${t}</h1><div>${right}</div></header>`;
const unread = () => S.notes.filter(n => !n.read).length;
const bell = () => `<button class="ib" data-act="go" data-n="notes" aria-label="Notifications">${I('bell')}${unread() ? '<i class="badge"></i>' : ''}</button>`;
const field = (name, label, inner) => `<div class="field" data-f="${name}"><label>${label}</label>${inner}</div>`;
const input = (name, v = '', o = {}) => `<input name="${name}" value="${esc(v)}" ${o.type ? `type="${o.type}"` : ''} ${o.ph ? `placeholder="${o.ph}"` : ''} ${o.ro ? 'readonly' : ''} ${o.attrs || ''} autocomplete="off">`;
const select = (name, opts, v = '', ph = 'Select') => `<select name="${name}"><option value="">${ph}</option>${opts.map(o => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
const chips = (g, opts, on = [], single = false) => `<div class="chips" data-g="${g}" ${single ? 'data-single' : ''}>${opts.map(o => `<button type="button" class="chip ${on.includes(o) ? 'on' : ''}" data-act="chip" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>`;
const av = (n, s = 44, img) => `<span class="av" style="width:${s}px;height:${s}px;font-size:${Math.round(s * .38)}px">${img ? `<img src="${img}" alt="">` : esc(initials(n))}</span>`;
const empty = (ic, t, p, btn = '') => `<div class="empty-s"><div class="big">${I(ic, 28)}</div><b>${t}</b>${p ? `<p>${p}</p>` : ''}${btn}</div>`;
const up = (key, label) => `<label class="up ${S.docs[key] ? 'done' : ''}"><input type="file" accept="image/*,.pdf" data-up="${key}" hidden><span class="ui">${isImg(M.files?.[key]) ? `<img src="${M.files[key]}" alt="">` : I(S.docs[key] ? 'check' : 'upload')}</span><span class="ut"><b>${label}</b><small>${esc(S.docs[key] || 'Upload')}</small></span></label>`;

const PILL = { pending: ['Pending', 'warn'], verified: ['Verified', 'ok'], rejected: ['Rejected', 'bad'], draft: ['Draft', ''], submitted: ['In review', 'warn'], live: ['Live', 'ok'], paused: ['Paused', ''], closed: ['Closed', ''], none: ['Not verified', ''] };
const pill = k => { const [t, c] = PILL[k] || [k, '']; return `<span class="pill ${c}">${t}</span>`; };
const lstat = l => (l.status === 'draft' && l.review === 'rejected') ? 'rejected' : l.status;
const stepsOf = () => isEnt() ? STEP_E : STEP_I;
const stagePill = i => `<span class="pill ${i >= 2 && i < 4 ? 'ok' : i === 4 ? '' : 'warn'}">${stepsOf()[i]}</span>`;
const findL = listing, findI = interest;
const counter = it => member(isEnt() ? it.iid : listing(it.lid).oid);
const verCard = () => {
  if (S.ver === 'verified') return '';
  const m = { none: ['Verify your account', 'Add your documents', 'shield'], pending: ['Verification in review', 'Usually within a day', 'clock'], rejected: ['Verification needs changes', 'See what to fix', 'info'] }[S.ver];
  return `<button class="vcard ${S.ver}" data-act="ver"><span class="lead">${I(m[2])}</span><span><b>${m[0]}</b><small>${m[1]}</small></span>${I('chev', 18).replace('class="i"', 'class="i ic"')}</button>`;
};
const row = (o) => `<button class="row-i ${o.cls || ''}" ${o.act ? `data-act="${o.act}"` : ''} ${Object.entries(o.d || {}).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ')}>${o.lead ? `<span class="lead">${I(o.lead)}</span>` : ''}<span class="main"><b>${o.t}</b>${o.s ? `<small>${o.s}</small>` : ''}</span>${o.end ? `<span class="end">${o.end}</span>` : ''}${o.chev === false ? '' : I('chev', 18).replace('class="i"', 'class="i ic"')}</button>`;

/* ───────── screens ───────── */
const screens = {
  splash: () => `${logo(84, true)}<h1>Advitta</h1>`,

  role: () => `<div class="scroll" style="padding-top:34px">${logo(44)}<h1 class="t" style="margin-top:32px">I am an…</h1><div class="role">
    <button data-act="role" data-r="ent"><span class="lead">${I('biz', 26)}</span><b>Entrepreneur</b>${I('chev', 18).replace('class="i"', 'class="i ic"')}</button>
    <button data-act="role" data-r="inv"><span class="lead">${I('coin', 26)}</span><b>Investor</b>${I('chev', 18).replace('class="i"', 'class="i ic"')}</button></div></div>`,

  login: () => `${nav('')}<form class="scroll" data-form="login"><h1 class="t">Your mobile number</h1><div style="height:22px"></div>
    <div class="field" data-f="phone"><div class="phone-in"><span class="cc">+91</span>${input('phone', S.phone, { type: 'tel', attrs: 'inputmode="numeric" maxlength="10" data-digits autofocus' })}</div></div>
    <button class="btn" ${S.phone.length === 10 ? '' : 'disabled'} id="go">Continue</button></form>`,

  otp: () => `${nav('')}<div class="scroll"><h1 class="t">Enter the code</h1><p class="muted">Sent to +91 ${esc(ui.otpPhone)}</p><div style="height:22px"></div>
    <div class="field" data-f="otp"><input class="otp" data-otp inputmode="numeric" maxlength="4" autocomplete="one-time-code" placeholder="••••" autofocus></div>
    <button class="link" id="resend" disabled style="color:var(--ink2)"></button></div>`,

  register: () => `${nav('')}<form class="scroll" data-form="register"><h1 class="t">Your details</h1><div style="height:18px"></div>
    <label class="avpick"><input type="file" accept="image/*" data-avatar hidden>${av(S.user?.name || '', 92, S.user?.img)}<span class="cam">${I('cam', 16)}</span></label>
    ${field('name', 'Full name', input('name', S.user?.name))}
    ${field('email', 'Email', input('email', S.user?.email, { type: 'email' }))}
    ${field('phone', 'Mobile', input('phone', '+91 ' + S.phone, { ro: 1 }))}
    ${field('city', 'City', select('city', CITIES, S.user?.city))}
    <button class="btn" style="margin-top:8px">Continue</button></form>`,

  docs: () => `${nav('Verification')}<form class="scroll" data-form="docs">${isEnt() ? `
    <div class="sec" style="margin-top:6px">Identity proof</div>${chips('idType', ['PAN', 'Aadhaar', 'Govt ID'], [S.idType], true)}<div style="height:12px"></div>${up('id', 'Upload ID')}
    <div class="sec">Business</div>
    ${field('bname', 'Business name', input('bname', S.business.name))}
    ${field('sector', 'Category', select('sector', SECTORS, S.business.sector))}
    ${field('stage', 'Stage', select('stage', STAGES, S.business.stage))}
    ${field('desc', 'About the business', `<textarea name="desc">${esc(S.business.desc || '')}</textarea>`)}
    <div class="sec" style="margin-top:4px">Business proof</div>${up('proof', 'Udyam, GST or registration')}
    ` : `
    <div class="sec" style="margin-top:6px">Identity proof</div>${chips('idType', ['PAN', 'Aadhaar', 'Govt ID'], [S.idType], true)}<div style="height:12px"></div>${up('id', 'Upload ID')}
    <div class="sec">Areas of interest</div>${chips('areas', SECTORS, S.areas)}<div class="field" data-f="areas"></div>
    ${field('decl', 'Short note about your interest', `<textarea name="decl">${esc(S.declaration || '')}</textarea>`)}`}
    <button class="btn" style="margin-top:10px">Submit for review</button></form>`,

  status: () => {
    const m = {
      none: ['warn', 'shield', 'Not verified', ''], pending: ['', 'clock', 'In review', ''],
      verified: ['ok', 'shield', 'You are verified', ''], rejected: ['bad', 'info', 'Needs changes', S.reject],
    }[S.ver];
    const cls = { warn: '', '': '', ok: 'ok', bad: 'bad' }[m[0]];
    return `${nav('Verification')}<div class="center"><div class="stat-ic ${cls}">${I(m[1], 38)}</div><h1>${m[2]}</h1>
      ${S.ver === 'rejected' ? `<div class="remark">${esc(S.reject)}</div>` : ''}</div>
      <div class="foot">${S.ver === 'rejected' || S.ver === 'none' ? `<button class="btn" data-act="go" data-n="docs">${S.ver === 'none' ? 'Add documents' : 'Update and resubmit'}</button>` : `<button class="btn ghost" data-act="home">Go to home</button>`}</div>`;
  },

  tabs: () => {
    const tabs = isEnt() ? [['home', 'Home', 'home'], ['listings', 'Listings', 'list'], ['interests', 'Interests', 'link'], ['me', 'Profile', 'user']]
      : [['home', 'Home', 'home'], ['browse', 'Browse', 'search'], ['interests', 'Interests', 'link'], ['me', 'Profile', 'user']];
    if (!tabs.some(t => t[0] === tab)) tab = 'home';
    return `${tabContent[tab]()}<nav class="tabbar">${tabs.map(t => `<button class="tab ${t[0] === tab ? 'on' : ''}" data-act="tab" data-t="${t[0]}">${I(t[2])}${t[1]}</button>`).join('')}</nav>`;
  },

  notes: () => `${nav('Notifications')}<div class="scroll">${S.notes.length ? `<div class="rows">${S.notes.map(n => row({ t: esc(n.title), s: esc(n.text), end: `<small>${rel(n.t)}</small>`, chev: false, cls: n.read ? '' : 'dot', act: 'note', d: { id: n.id } })).join('')}</div>` : empty('bell', 'No notifications', '')}</div>`,

  listing: ({ id }) => {
    const l = findL(id), it = S.interests.find(i => i.lid === id);
    return `${nav('')}<div class="scroll"><h1 class="t" style="font-size:26px">${esc(l.title)}</h1><div class="hero-amt">${inr(l.amount)}</div>
      <div class="chips"><span class="pill brand">${esc(l.sector)}</span><span class="pill">${esc(l.stage)}</span><span class="pill">${esc(l.city)}</span></div>
      <div class="biz">${I('shield', 24)}<div><b>${esc(l.business)}</b><small>Verified business · ${esc(l.owner)}</small></div></div>
      <div class="kv"><span>About</span><p>${esc(l.desc)}</p></div>
      <div class="kv"><span>Use of funds</span><p>${esc(l.purpose)}</p></div>
      ${l.deck ? `<div class="kv"><span>Pitch deck</span><button class="up done" style="margin:0;width:100%" data-act="viewdoc" data-id="${id}"><span class="ui">${isImg(l.deckData) ? `<img src="${l.deckData}" alt="">` : I('file')}</span><span class="ut"><b>${esc(l.deck)}</b></span></button></div>` : ''}</div>
      <div class="foot">${it ? `<button class="btn ghost" data-act="go" data-n="conn" data-id="${it.id}">${esc(STEP_I[it.stage])}</button>` : `<button class="btn" data-act="interest" data-id="${id}">Express interest</button>`}</div>`;
  },

  mylisting: ({ id }) => {
    const l = findL(id), st = lstat(l), n = S.interests.filter(i => i.lid === id).length;
    const b = [];
    if (l.status === 'draft') { b.push(`<button class="btn" data-act="submit-l" data-id="${id}">${l.review === 'rejected' ? 'Resubmit for review' : 'Submit for review'}</button>`, `<button class="btn ghost" data-act="go" data-n="lform" data-id="${id}">Edit</button>`); }
    if (l.status === 'live') b.push(`<button class="btn ghost" data-act="lset" data-id="${id}" data-s="paused">Pause</button>`);
    if (l.status === 'paused') b.push(`<button class="btn" data-act="lset" data-id="${id}" data-s="live">Resume</button>`);
    if (l.status === 'live' || l.status === 'paused') b.push(`<button class="btn ghost danger" data-act="confirm" data-id="${id}">Close listing</button>`);
    return `${nav('Listing')}<div class="scroll"><h1 class="t" style="font-size:26px">${esc(l.title)}</h1><div class="hero-amt">${inr(l.amount)}</div>
      <div class="chips">${pill(st)}<span class="pill brand">${esc(l.sector)}</span><span class="pill">${esc(l.stage)}</span>${n ? `<span class="pill ok">${n} interest${n > 1 ? 's' : ''}</span>` : ''}</div>
      ${st === 'rejected' ? `<div class="remark">${esc(l.remark)}</div>` : ''}
      <div style="height:14px"></div><div class="kv"><span>Pitch</span><p>${esc(l.desc)}</p></div><div class="kv"><span>Use of funds</span><p>${esc(l.purpose)}</p></div>
      ${l.deck ? `<div class="kv"><span>Pitch deck</span><button class="up done" style="margin:0;width:100%" data-act="viewdoc" data-id="${id}"><span class="ui">${isImg(l.deckData) ? `<img src="${l.deckData}" alt="">` : I('file')}</span><span class="ut"><b>${esc(l.deck)}</b></span></button></div>` : ''}</div>
      ${b.length ? `<div class="foot">${b.join('')}</div>` : ''}`;
  },

  lform: ({ id }) => {
    const l = id ? findL(id) : {};
    return `${nav(id ? 'Edit listing' : 'New listing')}<form class="scroll" data-form="lform" data-id="${id || ''}" style="padding-top:6px">
      ${field('title', 'Title', input('title', l.title))}
      ${field('amount', 'Amount', `<div class="amt"><span>₹</span>${input('amount', l.amount ? Number(l.amount).toLocaleString('en-IN') : '', { attrs: 'inputmode="numeric" data-money' })}</div>`)}
      ${field('sector', 'Category', select('sector', SECTORS, l.sector || S.business.sector))}
      ${field('stage', 'Stage', select('stage', STAGES, l.stage || S.business.stage))}
      ${field('purpose', 'Use of funds', `<textarea name="purpose" style="height:84px">${esc(l.purpose || '')}</textarea>`)}
      ${field('desc', 'Pitch', `<textarea name="desc">${esc(l.desc || '')}</textarea>`)}
      ${up('deck', 'Pitch deck (optional)')}
      <button class="btn" name="mode" value="submit" style="margin-top:8px">Submit for review</button>
      <button class="btn ghost" name="mode" value="draft">Save draft</button></form>`;
  },

  conn: ({ id }) => {
    const it = findI(id), l = findL(it.lid), steps = stepsOf(), open = chatOpen(it);
    const iv = invOf(it), who = isEnt() ? (it.stage >= 2 ? { n: iv.name, s: `Investor · ${iv.city}` } : { n: 'Verified investor', s: iv.city })
      : (it.stage >= 2 ? { n: l.owner, s: `${l.business} · ${l.city}` } : { n: l.business, s: `Details shared after introduction` });
    return `${nav('')}<div class="scroll"><h1 class="t" style="font-size:24px">${esc(l.title)}</h1><div style="height:14px"></div>
      <div class="party">${av(who.n, 46)}<div><b>${esc(who.n)}</b><small>${esc(who.s)}</small></div></div>
      ${it.note ? `<div class="kv" style="border-top:0;padding-top:0"><span>Note</span><p>${esc(it.note)}</p></div>` : ''}
      <ul class="tl">${steps.map((s, i) => `<li class="${i < it.stage ? 'done' : i === it.stage ? 'done now' : ''}"><i>${i <= it.stage ? I('check') : ''}</i>${s}</li>`).join('')}</ul></div>
      <div class="foot"><button class="btn" ${open ? '' : 'disabled'} data-act="go" data-n="chat" data-id="${id}">${open ? '' : I('lock', 18)}Message</button></div>`;
  },

  chat: ({ id }) => {
    const it = findI(id), open = chatOpen(it);
    const name = counter(it)?.user?.name || 'Member';
    return `${nav(esc(name), '', 'Monitored by Advitta')}<div class="msgs" id="msgs">${msgsHtml(it)}</div>
      ${open ? `<form class="composer" data-form="chat" data-id="${id}"><input name="text" placeholder="Message" autocomplete="off"><button class="send" aria-label="Send">${I('up')}</button></form>` : `<div class="foot" style="text-align:center;color:var(--ink2);font-size:14px">${I('lock', 18)}</div>`}`;
  },

  support: () => `${nav('Support', `<button class="ib" data-act="newticket" aria-label="New request">${I('plus')}</button>`)}<div class="scroll">${S.tickets.length ? `<div class="rows">${S.tickets.map(t => row({ t: esc(t.cat), s: esc(t.text), end: `<span class="pill ${{ open: 'warn', progress: 'brand', resolved: 'ok' }[t.status]}">${{ open: 'Open', progress: 'In progress', resolved: 'Resolved' }[t.status]}</span>`, chev: false })).join('')}</div>` : empty('help', 'No requests', '', `<button class="btn" data-act="newticket">New request</button>`)}</div>`,

  settings: () => `${nav('Settings')}<div class="scroll"><div class="rows" style="margin-top:6px">
    <div class="row-i"><span class="main"><b>Push notifications</b></span><button class="sw ${S.settings.push ? 'on' : ''}" data-act="sw" data-k="push" aria-label="Push notifications"></button></div>
    <div class="row-i"><span class="main"><b>New messages</b></span><button class="sw ${S.settings.chat ? 'on' : ''}" data-act="sw" data-k="chat" aria-label="New messages"></button></div></div></div>`,

  editprofile: () => `${nav('Edit profile')}<form class="scroll" data-form="profile" style="padding-top:6px">
    <label class="avpick"><input type="file" accept="image/*" data-avatar hidden>${av(S.user.name, 92, S.user.img)}<span class="cam">${I('cam', 16)}</span></label>
    ${field('name', 'Full name', input('name', S.user.name))}${field('email', 'Email', input('email', S.user.email, { type: 'email' }))}
    ${field('city', 'City', select('city', CITIES, S.user.city))}
    ${isEnt() ? '' : `<div class="lbl">Areas of interest</div>${chips('areas', SECTORS, S.areas)}<div style="height:18px"></div>`}
    <button class="btn">Save changes</button></form>`,

  business: () => `${nav('Business profile')}<form class="scroll" data-form="business" style="padding-top:6px">
    ${field('name', 'Business name', input('name', S.business.name))}${field('sector', 'Category', select('sector', SECTORS, S.business.sector))}
    ${field('stage', 'Stage', select('stage', STAGES, S.business.stage))}${field('city', 'City', select('city', CITIES, S.business.city || S.user.city))}
    ${field('desc', 'About', `<textarea name="desc">${esc(S.business.desc || '')}</textarea>`)}
    ${field('link', 'Website or social link', input('link', S.business.link, { type: 'url' }))}${up('bdoc', 'Supporting document')}
    <button class="btn">Save changes</button></form>`,

  page: ({ k }) => `${nav(PAGE_TITLES[k])}<div class="scroll"><p style="font-size:16px;line-height:1.65;padding-top:8px">${esc(DB.cms[k])}</p></div>`,
  blocked: () => `<div class="center"><div class="stat-ic bad">${I('lock', 38)}</div><h1>Account deactivated</h1><p class="muted">Contact Advitta support.</p></div><div class="foot"><button class="btn ghost" data-act="logout">Log out</button></div>`,
};

const tabContent = {
  home() {
    const n = S.notes.find(x => !x.read);
    const banner = n ? `<button class="banner" data-act="note" data-id="${n.id}"><i class="dotb"></i><span><b>${esc(n.title)}</b><small>${esc(n.text)}</small></span></button>` : '';
    const head = `<header class="large"><h1>Hi, ${esc(first(S.user.name))}</h1>${bell()}</header>`;
    if (isEnt()) {
      const live = S.listings.filter(l => l.status === 'live').length;
      return `${head}<div class="scroll">${verCard()}${banner}<div class="stats"><div class="stat"><b>${live}</b><small>Live listings</small></div><div class="stat"><b>${S.interests.length}</b><small>Interests</small></div></div>
        <div class="acts"><button class="act brand" data-act="newl"><span class="lead">${I('plus')}</span><b>Create listing</b></button><button class="act" data-act="tab" data-t="interests"><span class="lead">${I('link')}</span><b>View interests</b></button></div>
        ${S.listings.length ? `<div class="sec">Your listings</div><div class="rows">${S.listings.slice(0, 3).map(l => row({ t: esc(l.title), s: inr(l.amount), end: pill(lstat(l)), chev: false, act: 'go', d: { n: 'mylisting', id: l.id } })).join('')}</div>` : ''}</div>`;
    }
    const live = liveListings(), rec = live.filter(l => S.areas.includes(l.sector)).concat(live).filter((l, i, a) => a.indexOf(l) === i).slice(0, 3);
    return `${head}<div class="scroll">${verCard()}${banner}<button class="act brand" style="width:100%;min-height:96px;flex-direction:row;align-items:center" data-act="tab" data-t="browse"><b style="font-size:18px">Browse listings</b><span class="lead">${I('search')}</span></button>
      <div class="sec">New for you</div><div class="rows">${rec.map(listRow).join('')}</div>
      ${S.interests.length ? `<div class="sec">Your interests</div><div class="rows">${S.interests.slice(0, 3).map(intRow).join('')}</div>` : ''}</div>`;
  },
  listings() {
    return `${large('Listings', `<button class="ib" data-act="newl" aria-label="New listing">${I('plus')}</button>`)}<div class="scroll">${S.listings.length ? `<div class="rows">${S.listings.map(l => row({ t: esc(l.title), s: `${inr(l.amount)} · ${esc(l.stage)}`, end: pill(lstat(l)), chev: false, act: 'go', d: { n: 'mylisting', id: l.id } })).join('')}</div>` : empty('list', 'No listings yet', '', `<button class="btn" data-act="newl">Create listing</button>`)}</div>`;
  },
  browse() {
    const f = ui.f, n = f.sector.length + f.stage.length + (f.city ? 1 : 0) + (f.amt ? 1 : 0);
    if (S.ver !== 'verified') return `${large('Browse')}<div class="scroll">${empty('lock', 'Verification required', 'Browse listings once you are verified.', `<button class="btn" data-act="ver">View status</button>`)}</div>`;
    return `${large('Browse')}<div class="scroll"><div class="sbar"><label>${I('search', 20)}<input data-q placeholder="Search" value="${esc(f.q)}"></label><button class="fb ${n ? 'on' : ''}" data-act="filters" aria-label="Filters">${I('filter', 20)}</button></div><div class="rows" id="res">${resultsHtml()}</div></div>`;
  },
  interests() {
    return `${large('Interests')}<div class="scroll">${S.interests.length ? `<div class="rows">${S.interests.map(intRow).join('')}</div>` : empty('link', 'No interests yet', isEnt() ? '' : 'Express interest from a listing.', isEnt() ? '' : `<button class="btn" data-act="tab" data-t="browse">Browse listings</button>`)}</div>`;
  },
  me() {
    const u = S.user, r = (t, ic, a, d) => row({ t, lead: ic, act: a, d });
    return `${large('Profile')}<div class="scroll"><div class="party" style="margin-top:0">${av(u.name, 56, u.img)}<div><b>${esc(u.name)}</b><small>+91 ${esc(S.phone)} · ${esc(u.city)}</small></div></div>
      <div class="rows">${r('Edit profile', 'user', 'go', { n: 'editprofile' })}${isEnt() ? r('Business profile', 'biz', 'go', { n: 'business' }) : ''}${r('Verification', 'shield', 'ver', {})}${r('Settings', 'bell', 'go', { n: 'settings' })}${r('Support', 'help', 'go', { n: 'support' })}${innerWidth <= 760 ? r('Admin panel', 'shield', 'admin-link', {}) : ''}</div>
      <div class="sec">Legal</div><div class="rows">${Object.keys(PAGE_TITLES).map(k => row({ t: PAGE_TITLES[k], act: 'go', d: { n: 'page', k } })).join('')}</div>
      <div style="height:18px"></div><button class="btn ghost danger" data-act="logout">${I('out', 20)}Log out</button></div>`;
  },
};

const listRow = l => row({ t: esc(l.title), s: `${esc(l.sector)} · ${esc(l.city)}`, end: `<b>${inr(l.amount)}</b><small>${esc(l.stage)}</small>`, chev: false, act: 'go', d: { n: 'listing', id: l.id } });
const intRow = it => { const l = findL(it.lid); return row({ t: esc(l.title), s: isEnt() ? (it.stage >= 2 ? esc(invOf(it).name) : 'Verified investor · ' + esc(invOf(it).city)) : esc(l.business), end: stagePill(it.stage), chev: false, act: 'go', d: { n: 'conn', id: it.id } }); };
function resultsHtml() {
  const f = ui.f, q = f.q.toLowerCase(), a = AMOUNTS[f.amt];
  const r = liveListings().filter(l => (!q || (l.title + l.sector + l.city + l.business + l.desc).toLowerCase().includes(q)) && (!f.sector.length || f.sector.includes(l.sector)) && (!f.stage.length || f.stage.includes(l.stage)) && (!f.city || f.city === l.city) && l.amount > a.min - (a.min ? 0 : 1) && l.amount <= a.max);
  return r.length ? r.map(listRow).join('') : empty('search', 'No matches', '');
}
function msgsHtml(it) {
  return (DB.chats[it.id] || []).map(x => x.by === 'sys' ? `<div class="sys">${esc(x.text)}</div>` : `<div class="b ${x.by === M.id ? 'me' : 'them'}"><p>${esc(x.text)}</p><span>${hm(x.t)}${x.by === M.id && x.read ? ' · Read' : ''}</span></div>`).join('');
}
function markRead(id) { let ch = false; (DB.chats[id] || []).forEach(x => { if (x.by !== M.id && x.by !== 'sys' && !x.read) { x.read = true; ch = true; } }); if (ch) saveDB(); }
const drawMsgs = (id, typing) => { const m = $('#msgs'); if (!m || cur().name !== 'chat' || cur().p.id !== id) return; markRead(id); m.innerHTML = msgsHtml(findI(id)) + (typing ? '<div class="typing"><i></i><i></i><i></i></div>' : ''); m.scrollTop = m.scrollHeight; };

/* ───────── mounts ───────── */
const mounts = {
  splash() { setTimeout(() => { if (cur().name !== 'splash') return; (G.in && S && S.user?.name) ? (S.ver === 'none' ? (tab = 'home', stack = [{ name: 'tabs', p: {} }], push('docs')) : home()) : reset(loggedOutScreen()); }, 2200); },
  otp() {
    let s = 30; const b = $('#resend');
    const tick = () => { if (s > 0) { b.disabled = true; b.style.color = 'var(--ink2)'; b.textContent = `Resend in 0:${String(s).padStart(2, '0')}`; s--; } else { b.disabled = false; b.style.color = ''; b.textContent = 'Resend code'; clearInterval(timer); } };
    tick(); timer = setInterval(tick, 1000); b.onclick = () => { s = 30; tick(); timer = setInterval(tick, 1000); toast('Code sent'); };
    setTimeout(() => $('[data-otp]')?.focus(), 350);
  },
  login() { setTimeout(() => $('[name=phone]')?.focus(), 350); },
  chat({ id }) { markRead(id); const m = $('#msgs'); m.innerHTML = msgsHtml(findI(id)); m.scrollTop = m.scrollHeight; },
};

/* ───────── ui helpers ───────── */
let tt;
function toast(t) { const e = $('#toast'); e.textContent = t; e.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => e.classList.remove('on'), 1900); }
function sheet(html) { const s = $('#sheet'); s.innerHTML = `<div class="bd" data-act="shut"></div><div class="sh"><div class="grab"></div>${html}</div>`; requestAnimationFrame(() => s.classList.add('open')); }
function shut() { const s = $('#sheet'); s.classList.remove('open'); setTimeout(() => { if (!s.classList.contains('open')) s.innerHTML = ''; }, 300); }
let pt;
function banner(n) {
  const p = $('#push'); p.innerHTML = `<button data-act="note" data-id="${n.id}"><span class="lead" style="flex:none">${logo(36)}</span><span><b>${esc(n.title)}</b><small>${esc(n.text)}</small></span></button>`;
  p.classList.add('on'); clearTimeout(pt); pt = setTimeout(() => p.classList.remove('on'), 3600);
}
function notify(title, text, go) {
  notifyMember(M.id, title, text, go); const n = M.notes[0]; seen.add(n.id);
  if (S.settings.push && G.in) banner(n);
}
function err(form, name, msg) { const f = $(`[data-f="${name}"]`, form); if (!f) return; f.classList.add('bad'); $('.msg', f)?.remove(); f.insertAdjacentHTML('beforeend', `<em class="msg">${msg}</em>`); }
function clearErr(form) { $$('.field.bad', form).forEach(f => f.classList.remove('bad')); $$('.msg', form).forEach(m => m.remove()); }
const chipVals = (form, g) => $$(`[data-g="${g}"] .chip.on`, form).map(c => c.dataset.v);
const refresh = () => { save(); render(); };
let payInfo = null;
function pay(kind, ref, amount, cb) {
  payInfo = { kind, ref, amount, cb };
  sheet(`<h3>Pay ${inr(amount)}</h3><p class="muted" style="margin:-8px 0 20px">${esc(kind === 'membership' ? 'Membership · 1 year' : ref)}</p><button class="btn" data-act="pay">Pay ${inr(amount)}</button><button class="btn ghost" data-act="shut">Not now</button>`);
}
function gate(kind, ref, cb, already) {
  const model = feeModel();
  if (model === 'membership' && (M.mem || 0) < Date.now()) return pay('membership', 'Membership', DB.fee.membership, cb);
  if (model === kind && kind !== 'membership' && !already) return pay(kind, ref, DB.fee[kind], cb);
  cb();
}
function ensureVerified() { if (S.ver !== 'verified') { toast('Verification pending'); push('status'); return false; } return true; }

/* ───────── actions ───────── */
const acts = {
  back: () => pop(),
  shut: () => shut(),
  home: () => home(),
  tab: d => { tab = d.t; if (cur().name !== 'tabs') { stack = [{ name: 'tabs', p: {} }]; } render(); },
  go: d => push(d.n, { id: d.id, k: d.k }),
  ver: () => push(S.ver === 'none' ? 'docs' : 'status'),
  role: d => { G.role = d.r; useMember(blank(d.r)); saveG(); push('login'); },
  chip: (d, el) => { const g = el.parentElement; if (g.hasAttribute('data-single')) $$('.chip', g).forEach(c => c.classList.remove('on')); el.classList.toggle('on', g.hasAttribute('data-single') ? true : !el.classList.contains('on')); },
  logout: () => { G.in = false; G.mid = null; if (AS) useMember(blank(AS)); saveG(); stack = [{ name: loggedOutScreen(), p: {} }]; tab = 'home'; render('f'); },
  sw: (d, el) => { S.settings[d.k] = !S.settings[d.k]; el.classList.toggle('on'); save(); },
  note: d => { const n = S.notes.find(x => x.id === d.id); if (!n) return; n.read = true; save(); $('#push').classList.remove('on'); if (n.go) { if (cur().name === 'tabs' || cur().name === 'notes') { push(n.go.name, n.go.p); } else { push(n.go.name, n.go.p); } } else render(); },
  newl: () => { if (ensureVerified()) gate('open', '', () => push('lform', {})); },
  'submit-l': d => { const l = findL(d.id); gate('listing', l.title, () => { l.status = 'submitted'; l.review = 'pending'; if (feeModel() === 'listing') l.paid = true; save(); toast('Submitted for review'); render(); }, l.paid); },
  pay: () => { const f = payInfo; addPayment(M.id, f.kind, f.amount, f.ref); if (f.kind === 'membership') M.mem = Date.now() + 365 * DAY; save(); shut(); toast('Payment received'); f.cb(); },
  lset: d => { findL(d.id).status = d.s; save(); toast(d.s === 'live' ? 'Resumed' : 'Paused'); render(); },
  confirm: d => sheet(`<h3>Close this listing?</h3><button class="btn danger" style="background:var(--badbg);color:var(--bad)" data-act="lclose" data-id="${d.id}">Close listing</button><button class="btn ghost" data-act="shut">Cancel</button>`),
  lclose: d => { findL(d.id).status = 'closed'; save(); shut(); toast('Closed'); render(); },
  interest: d => { if (!ensureVerified()) return; gate('open', '', () => sheet(`<h3>Express interest</h3><form data-form="interest" data-id="${d.id}"><div class="field"><label>Add a note (optional)</label><textarea name="note" style="height:96px"></textarea></div><button class="btn">Send interest</button></form>`)); },
  filters: () => { const f = ui.f; sheet(`<h3>Filters</h3><div class="lbl">Category</div>${chips('sector', SECTORS, f.sector)}<div class="lbl" style="margin-top:18px">Stage</div>${chips('stage', STAGES, f.stage)}<div class="lbl" style="margin-top:18px">Amount</div>${chips('amt', AMOUNTS.map(a => a.l), [AMOUNTS[f.amt].l], true)}<div class="field" style="margin-top:18px"><label>City</label>${select('city', CITIES, f.city, 'Any city')}</div><button class="btn" data-act="apply">Show results</button><button class="btn ghost" data-act="clearf">Clear</button>`); },
  apply: () => { const s = $('#sheet'); ui.f.sector = chipVals(s, 'sector'); ui.f.stage = chipVals(s, 'stage'); ui.f.amt = Math.max(0, AMOUNTS.findIndex(a => a.l === chipVals(s, 'amt')[0])); ui.f.city = $('[name=city]', s).value; shut(); render(); },
  clearf: () => { Object.assign(ui.f, { sector: [], stage: [], city: '', amt: 0 }); shut(); render(); },
  newticket: () => sheet(`<h3>New request</h3><form data-form="ticket">${field('cat', 'Category', select('cat', CATS, '', 'Choose'))}${field('text', 'Description', '<textarea name="text"></textarea>')}<button class="btn">Send request</button></form>`),
  'admin-link': () => window.open('/admin', '_blank'),
  viewdoc: d => { const l = findL(d.id); sheet(`<h3>${esc(l.deck)}</h3>${docView(l.deck, l.deckData)}<button class="btn ghost" data-act="shut">Close</button>`); },
  'a-reset': () => { resetDB(); location.reload(); },
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  if (el.tagName === 'LABEL') return;
  acts[el.dataset.act]?.(el.dataset, el, e);
});
$('#edge').addEventListener('click', () => $('#admin').classList.toggle('open'));
document.addEventListener('click', e => { if ($('#admin').classList.contains('open') && !e.target.closest('#admin,#edge')) $('#admin').classList.remove('open'); });

/* ───────── inputs ───────── */
document.addEventListener('input', e => {
  const t = e.target, form = t.closest('form'); if (form) { const f = t.closest('.field'); if (f?.classList.contains('bad')) { f.classList.remove('bad'); $('.msg', f)?.remove(); } }
  if (t.matches('[data-digits]')) { t.value = t.value.replace(/\D/g, '').slice(0, 10); S.phone = t.value; $('#go').disabled = t.value.length !== 10; }
  if (t.matches('[data-money]')) { const d = t.value.replace(/\D/g, '').slice(0, 7); t.value = d ? Number(d).toLocaleString('en-IN') : ''; }
  if (t.matches('[data-q]')) { ui.f.q = t.value; $('#res').innerHTML = resultsHtml(); }
  if (t.matches('[data-otp]')) { t.value = t.value.replace(/\D/g, '').slice(0, 4); if (t.value.length === 4) { t.blur(); setTimeout(otpDone, 250); } }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.matches('[data-up]')) {
    const f = t.files[0]; if (!f) return; const k = t.dataset.up, l = t.closest('.up');
    S.docs[k] = f.name; l.classList.add('done'); $('small', l).textContent = f.name; $('.ui', l).innerHTML = I('check');
    fileData(f).then(d => { M.files = M.files || {}; if (d) { M.files[k] = d; if (isImg(d)) $('.ui', l).innerHTML = `<img src="${d}" alt="">`; } else delete M.files[k]; save(); });
  }
  if (t.matches('[data-avatar]')) { const f = t.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); c.width = c.height = 160; const x = c.getContext('2d'), m = Math.min(img.width, img.height); x.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, 160, 160); S.user = S.user || {}; S.user.img = c.toDataURL('image/jpeg', .8); $('.avpick .av').innerHTML = `<img src="${S.user.img}" alt="">`; save(); }; img.src = r.result; }; r.readAsDataURL(f); }
});
function otpDone() {
  const ex = DB.members.find(m => m.role === G.role && m.phone === S.phone);
  if (ex) useMember(ex); else { DB.members.push(M); }
  G.in = true; G.mid = M.id; save();
  if (S.user?.name) { S.ver === 'none' ? (stack = [{ name: 'tabs', p: {} }], push('docs')) : home(); } else push('register');
}

/* ───────── forms ───────── */
const forms = {
  login(d, form) {
    if (S.phone.length !== 10) return err(form, 'phone', 'Enter a 10-digit number');
    ui.otpPhone = S.phone; save(); push('otp');
  },
  register(d, form) {
    let ok = true;
    if (d.name.trim().length < 2) { err(form, 'name', 'Enter your full name'); ok = false; }
    if (!/^\S+@\S+\.\S+$/.test(d.email)) { err(form, 'email', 'Enter a valid email'); ok = false; }
    if (!d.city) { err(form, 'city', 'Select your city'); ok = false; }
    if (!ok) return;
    S.user = { ...(S.user || {}), name: d.name.trim(), email: d.email.trim(), city: d.city }; save(); push('docs');
  },
  docs(d, form) {
    let ok = true;
    if (!S.docs.id) { toast('Upload your ID'); ok = false; }
    if (isEnt()) {
      if (!d.bname.trim()) { err(form, 'bname', 'Enter your business name'); ok = false; }
      if (!d.sector) { err(form, 'sector', 'Select a category'); ok = false; }
      if (!d.stage) { err(form, 'stage', 'Select a stage'); ok = false; }
      if (d.desc.trim().length < 10) { err(form, 'desc', 'Add a short description'); ok = false; }
    } else {
      const a = chipVals(form, 'areas'); if (!a.length) { err(form, 'areas', 'Choose at least one area'); ok = false; }
      if (d.decl.trim().length < 10) { err(form, 'decl', 'Add a short note'); ok = false; }
    }
    if (!ok) return;
    S.idType = chipVals(form, 'idType')[0] || 'PAN';
    if (isEnt()) S.business = { ...S.business, name: d.bname.trim(), sector: d.sector, stage: d.stage, desc: d.desc.trim(), city: S.business.city || S.user.city };
    else { S.areas = chipVals(form, 'areas'); S.declaration = d.decl.trim(); }
    S.ver = 'pending'; M.submitted = Date.now(); save(); tab = 'home'; stack = [{ name: 'tabs', p: {} }]; push('status');
  },
  lform(d, form, e) {
    const amt = Number(d.amount.replace(/\D/g, '')), mode = e.submitter?.value || 'draft'; let ok = true;
    if (d.title.trim().length < 3) { err(form, 'title', 'Enter a title'); ok = false; }
    if (!amt || amt < MIN || amt > MAX) { err(form, 'amount', 'Enter between ₹50,000 and ₹5,00,000'); ok = false; }
    if (!d.sector) { err(form, 'sector', 'Select a category'); ok = false; }
    if (!d.stage) { err(form, 'stage', 'Select a stage'); ok = false; }
    if (d.purpose.trim().length < 5) { err(form, 'purpose', 'Describe how you will use the funds'); ok = false; }
    if (d.desc.trim().length < 10) { err(form, 'desc', 'Add a short pitch'); ok = false; }
    if (!ok) return;
    const id = form.dataset.id;
    const run = paid => {
      const l = id ? findL(id) : { id: uid('L'), oid: M.id, status: 'draft', review: null, remark: '', t: Date.now(), paid: false, owner: S.user.name, business: S.business.name || S.user.name, city: S.business.city || S.user.city };
      Object.assign(l, { title: d.title.trim(), amount: amt, sector: d.sector, stage: d.stage, purpose: d.purpose.trim(), desc: d.desc.trim(), deck: S.docs.deck || l.deck || null, deckData: S.docs.deck ? (M.files?.deck || null) : (l.deckData || null) });
      if (M.files) delete M.files.deck;
      if (mode === 'submit') { l.status = 'submitted'; l.review = 'pending'; l.remark = ''; if (paid) l.paid = true; }
      if (!id) DB.listings.unshift(l); delete S.docs.deck; save();
      stack.pop(); if (id) stack.pop(); stack.push({ name: 'mylisting', p: { id: l.id } }); render('l'); toast(mode === 'submit' ? 'Submitted for review' : 'Draft saved');
    };
    if (mode === 'submit') gate('listing', d.title.trim(), () => run(feeModel() === 'listing'), id && findL(id).paid); else run(false);
  },
  interest(d, form) {
    const l = findL(form.dataset.id), paid = feeModel() === 'connection';
    gate('connection', l.title, () => {
      const it = { id: uid('n'), lid: l.id, iid: M.id, note: d.note.trim(), stage: 0, t: Date.now(), introT: 0, assignee: '', notes: [], log: [{ by: 'System', text: 'Interest received', t: Date.now() }], declined: false, chatOff: false, paid };
      DB.interests.unshift(it); DB.chats[it.id] = [];
      notifyMember(l.oid, 'New interest', `A verified investor is interested in ${l.title}.`, { name: 'conn', p: { id: it.id } });
      save(); shut(); notify('Interest sent', `${l.title}. Advitta will be in touch.`, { name: 'conn', p: { id: it.id } }); toast('Interest sent'); render();
    });
  },
  chat(d, form) {
    const text = d.text.trim(); if (!text) return; const id = form.dataset.id, it = findI(id); if (!chatOpen(it)) return;
    (DB.chats[id] ||= []).push({ by: M.id, text, t: Date.now(), read: false }); form.reset(); saveDB(); drawMsgs(id);
    $('[name=text]', form)?.focus();
    const cp = counter(it); if (!cp) return;
    if (cp.seed) {
      setTimeout(() => { DB.chats[id].forEach(m => { if (m.by === M.id) m.read = true; }); saveDB(); drawMsgs(id, true); }, 700);
      setTimeout(() => {
        const reply = NEXT_REPLIES[DB.chats[id].length % NEXT_REPLIES.length];
        DB.chats[id].push({ by: cp.id, text: reply, t: Date.now(), read: false }); saveDB();
        if (cur().name === 'chat' && cur().p.id === id) drawMsgs(id); else if (S.settings.chat) notify('New message', `${cp.user.name}: ${reply.slice(0, 40)}…`, { name: 'chat', p: { id } });
      }, 2000);
    } else if (cp.settings.chat) notifyMember(cp.id, 'New message', `${S.user.name}: ${text.slice(0, 60)}`, { name: 'chat', p: { id } });
  },
  ticket(d, form) {
    let ok = true;
    if (!d.cat) { err(form, 'cat', 'Choose a category'); ok = false; }
    if (d.text.trim().length < 5) { err(form, 'text', 'Describe the issue'); ok = false; }
    if (!ok) return;
    DB.tickets.unshift({ id: uid('t'), mid: M.id, cat: d.cat, text: d.text.trim(), status: 'open', t: Date.now(), assignee: '' }); save(); shut(); toast('Request sent'); render();
  },
  profile(d, form) {
    let ok = true;
    if (d.name.trim().length < 2) { err(form, 'name', 'Enter your full name'); ok = false; }
    if (!/^\S+@\S+\.\S+$/.test(d.email)) { err(form, 'email', 'Enter a valid email'); ok = false; }
    if (!d.city) { err(form, 'city', 'Select your city'); ok = false; }
    if (!ok) return;
    Object.assign(S.user, { name: d.name.trim(), email: d.email.trim(), city: d.city }); if (!isEnt()) S.areas = chipVals(form, 'areas'); save(); pop(); toast('Saved');
  },
  business(d, form) {
    if (!d.name.trim()) return err(form, 'name', 'Enter your business name');
    S.business = { ...S.business, name: d.name.trim(), sector: d.sector, stage: d.stage, city: d.city, desc: d.desc.trim(), link: d.link.trim() }; S.listings.forEach(l => { l.business = d.name.trim(); }); save(); pop(); toast('Saved');
  },
};
document.addEventListener('submit', e => {
  const form = e.target.closest('form[data-form]'); if (!form) return; e.preventDefault();
  clearErr(form); forms[form.dataset.form]?.(Object.fromEntries(new FormData(form)), form, e);
});

/* ───────── live sync with the admin panel ───────── */
let pending = false;
const typing = () => /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) && $('#screen').contains(document.activeElement);
addEventListener('storage', e => {
  if (e.key !== DBKEY || !e.newValue) return;
  try { DB = JSON.parse(e.newValue); } catch { return; }
  applyMaster();
  if (G.mid) { const m = member(G.mid); if (m) { M = m; S = wrap(m); } else { G.in = false; G.mid = null; if (AS) useMember(blank(AS)); saveG(); stack = [{ name: loggedOutScreen(), p: {} }]; render('f'); return; } }
  if (M && G.in) {
    const fresh = M.notes.filter(n => !seen.has(n.id)); fresh.forEach(n => seen.add(n.id));
    if (fresh.length && S.settings.push) banner(fresh[0]);
  }
  if (cur().name === 'splash') return;
  if (typing()) pending = true; else render();
});
document.addEventListener('focusout', () => { if (pending) setTimeout(() => { if (!typing()) { pending = false; render(); } }, 50); });

/* ───────── fit phone to window ───────── */
function fit() { const w = innerWidth <= 760 ? 1 : Math.max(.3, Math.min(1, (innerHeight - 48) / 844)); document.documentElement.style.setProperty('--s', w); }
addEventListener('resize', fit); fit();

render();
