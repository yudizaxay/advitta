'use strict';
/* Advitta admin panel. Shares one database (db.js) with the phone demo and updates live. */

const SK = 'advitta.admin.session';
const A = { range: 'year', from: '', to: '', f: {}, drawer: null, modal: null, chat: null, rtab: 'members', ctab: 'pages', cpage: 'about', err: '', cur: null, auth: 'login', authEmail: '' };
const AMT = [['', 'Any amount'], ['0-100000', 'Up to ₹1L'], ['100000-250000', '₹1L – ₹2.5L'], ['250000-500000', '₹2.5L – ₹5L']];
const getSess = () => { try { return JSON.parse(localStorage.getItem(SK)); } catch { return null; } };
const me = () => { const s = getSess(); return s && DB.admins.find(a => a.id === s.id && a.active); };
const can = m => { const a = me(); return !!a && (a.role === 'super' || a.modules.includes(m)); };
const staff = () => DB.admins.filter(a => a.active && a.status === 'active').map(a => a.name);
const toast = t => { const e = $('#toast'); e.textContent = t; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('on'), 2200); };
const pl = (t, k = '') => `<span class="pill ${k}">${esc(t)}</span>`;
const verPill = v => ({ verified: pl('Verified', 'ok'), pending: pl('Pending', 'warn'), rejected: pl('Rejected', 'bad'), none: pl('Not submitted') })[v];
const lPill = l => l.status === 'draft' && l.review === 'rejected' ? pl('Rejected', 'bad') : ({ live: pl('Live', 'ok'), submitted: pl('In review', 'warn'), paused: pl('Paused'), closed: pl('Closed'), draft: pl('Draft') })[l.status];
const stagePl = it => it.declined ? pl('Declined', 'bad') : pl(STEP_E[it.stage], it.stage >= 2 && it.stage < 4 ? 'ok' : it.stage === 4 ? '' : 'warn');
const tkPill = s => ({ open: pl('Open', 'warn'), progress: pl('In progress', 'brand'), resolved: pl('Resolved', 'ok') })[s];
const av = n => `<span class="av">${esc(initials(n))}</span>`;
const who = (n, sub) => `<div class="who">${av(n)}<div>${esc(n)}${sub ? `<span class="sub">${esc(sub)}</span>` : ''}</div></div>`;
const options = (arr, v, all) => (all != null ? `<option value="">${all}</option>` : '') + arr.map(o => Array.isArray(o) ? `<option value="${esc(o[0])}" ${o[0] === v ? 'selected' : ''}>${esc(o[1])}</option>` : `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('');
const fsel = (k, arr, all) => `<select class="sl" data-f="${k}">${options(arr, A.f[k] || '', all)}</select>`;
const fsearch = ph => `<input class="in search" data-f="q" placeholder="${ph}" value="${esc(A.f.q || '')}">`;
const logoSvg = s => `<img src="/icon.svg" width="${s}" height="${s}" alt="Advitta">`;
const kv = rows => `<div class="kv">${rows.map(r => `<span>${r[0]}</span><div>${r[1] || '–'}</div>`).join('')}</div>`;
const me2 = () => me()?.name || 'Advitta';

/* ───────── window for dashboard ───────── */
function win() {
  const n = Date.now(); let from, to = n;
  if (A.range === 'day') from = new Date().setHours(0, 0, 0, 0);
  else if (A.range === 'week') from = n - 7 * DAY;
  else if (A.range === 'month') from = n - 30 * DAY;
  else if (A.range === 'year') from = n - 365 * DAY;
  else { from = A.from ? new Date(A.from).getTime() : 0; to = A.to ? new Date(A.to).getTime() + DAY - 1 : n; }
  return [from, to];
}
const memberT = m => m.submitted || m.t;

/* ───────── pages ───────── */
const pages = {};

pages.dashboard = () => {
  const [from, to] = win(), inw = t => t >= from && t <= to;
  const ents = registered('ent').filter(m => inw(m.t)).length, invs = registered('inv').filter(m => inw(m.t)).length;
  const pend = registered().filter(m => m.ver === 'pending' && inw(memberT(m))).length;
  const live = DB.listings.filter(l => l.status === 'live' && inw(l.t)).length;
  const ints = DB.interests.filter(i => inw(i.t)).length, intro = DB.interests.filter(i => i.introT && inw(i.introT)).length;
  const chats = DB.interests.filter(i => i.introT && inw(i.introT) && i.stage >= 2 && i.stage <= 3 && !i.chatOff).length;
  const fees = DB.payments.filter(p => inw(p.t)).reduce((a, p) => a + (p.status === 'paid' ? p.amount : 0), 0);
  const open = DB.tickets.filter(t => t.status !== 'resolved' && inw(t.t)).length;
  const K = [['Entrepreneurs', ents], ['Investors', invs], ['Pending verifications', pend], ['Live listings', live], ['Interests received', ints], ['Introductions made', intro], ['Active chats', chats], ['Fee collections', inr(fees)], ['Open complaints', open]];
  const N = 7, step = (to - from) / N, b = Array.from({ length: N }, (_, i) => ({ a: from + i * step, i: 0, n: 0 }));
  DB.interests.forEach(it => { const k = Math.min(N - 1, Math.floor((it.t - from) / step)); if (it.t >= from && it.t <= to) b[k].i++; if (it.introT && it.introT >= from && it.introT <= to) b[Math.min(N - 1, Math.floor((it.introT - from) / step))].n++; });
  const mx = Math.max(1, ...b.map(x => Math.max(x.i, x.n))), W = 640, H = 180, bw = W / N;
  const lab = t => new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const svg = `<svg viewBox="0 0 ${W} ${H + 24}" width="100%" role="img" aria-label="Interests and introductions over time">${b.map((x, i) => `<rect x="${i * bw + 12}" y="${H - x.i / mx * H}" width="${bw / 2 - 14}" height="${x.i / mx * H}" rx="4" fill="#5B2D8E"/><rect x="${i * bw + bw / 2 - 2}" y="${H - x.n / mx * H}" width="${bw / 2 - 14}" height="${x.n / mx * H}" rx="4" fill="#C9B3E6"/><text x="${i * bw + bw / 2}" y="${H + 18}" font-size="11" text-anchor="middle" fill="#6B6677">${lab(x.a)}</text>`).join('')}<line x1="0" x2="${W}" y1="${H}" y2="${H}" stroke="#EEEBF2"/></svg>`;
  return {
    title: 'Dashboard', actions: '',
    body: `<div class="bar"><div class="seg">${[['day', 'Today'], ['week', '7 days'], ['month', '30 days'], ['year', '12 months'], ['custom', 'Custom']].map(r => `<button data-a="range" data-v="${r[0]}" class="${A.range === r[0] ? 'on' : ''}">${r[1]}</button>`).join('')}</div>
      ${A.range === 'custom' ? `<input type="date" class="in" data-r="from" value="${A.from}"><input type="date" class="in" data-r="to" value="${A.to}">` : ''}</div>
      <div class="kpis">${K.map(k => `<div class="kpi"><small>${k[0]}</small><b>${k[1]}</b></div>`).join('')}</div>
      <div class="card chart"><h3>Interests and introductions</h3><div class="legend"><span><i style="background:#5B2D8E"></i>Interests</span><span><i style="background:#C9B3E6"></i>Introductions</span></div>${svg}</div>`,
  };
};

/* members */
const verified = m => m.ver === 'verified';
function memRows(role) {
  const q = (A.f.q || '').toLowerCase();
  return registered(role).filter(m => (!A.f.ver || m.ver === A.f.ver) && (!A.f.status || (A.f.status === 'active') === (m.active !== false)) && (!q || [m.user.name, m.phone, m.user.city, m.business?.sector, (m.areas || []).join(' ')].join(' ').toLowerCase().includes(q)));
}
function memTable(role) {
  const rows = memRows(role);
  if (!rows.length) return '<div class="em">No members found</div>';
  return `<div class="tw"><table><thead><tr><th>Name</th><th>Mobile</th><th>City</th><th>${role === 'ent' ? 'Sector' : 'Interest areas'}</th><th>Verification</th><th>${role === 'ent' ? 'Listings' : 'Interests'}</th><th>Active</th></tr></thead><tbody>${rows.map(m => `<tr class="c" data-a="open" data-t="mem" data-id="${m.id}"><td>${who(m.user.name, m.user.email)}</td><td>+91 ${esc(m.phone)}</td><td>${esc(m.user.city)}</td><td>${esc(role === 'ent' ? m.business?.sector : (m.areas || []).join(', '))}</td><td>${verPill(m.ver)}</td><td>${role === 'ent' ? DB.listings.filter(l => l.oid === m.id).length : DB.interests.filter(i => i.iid === m.id).length}</td><td><button data-a="toggle-m" data-id="${m.id}" aria-label="Toggle active"><span class="sw ${m.active !== false ? 'on' : ''}"></span></button></td></tr>`).join('')}</tbody></table></div>`;
}
const memPage = role => () => ({ title: role === 'ent' ? 'Entrepreneurs' : 'Investors', actions: '', table: () => memTable(role), body: `<div class="bar">${fsearch(role === 'ent' ? 'Search name, mobile, city, sector' : 'Search name, mobile, city, interest area')}${fsel('ver', [['verified', 'Verified'], ['pending', 'Pending'], ['rejected', 'Rejected']], 'All verification')}${fsel('status', [['active', 'Active'], ['inactive', 'Inactive']], 'All status')}</div><div id="tbl">${memTable(role)}</div>` });
pages.entrepreneurs = memPage('ent');
pages.investors = memPage('inv');

/* verification */
const vQueue = () => registered().filter(m => (A.f.ver || 'pending') === 'all' || m.ver === (A.f.ver || 'pending'));
function vTable() {
  const rows = vQueue().sort((a, b) => memberT(b) - memberT(a));
  if (!rows.length) return '<div class="em">Nothing to review</div>';
  return `<div class="tw"><table><thead><tr><th>Member</th><th>Role</th><th>Mobile</th><th>Documents</th><th>Submitted</th><th>Status</th></tr></thead><tbody>${rows.map(m => `<tr class="c" data-a="open" data-t="mem" data-id="${m.id}"><td>${who(m.user.name, m.user.city)}</td><td>${m.role === 'ent' ? 'Entrepreneur' : 'Investor'}</td><td>+91 ${esc(m.phone)}</td><td>${Object.keys(m.docs || {}).length}</td><td>${dt(memberT(m))}</td><td>${verPill(m.ver)}</td></tr>`).join('')}</tbody></table></div>`;
}
pages.verification = () => ({ title: 'Verification', actions: '', table: vTable, body: `<div class="bar">${fsel('ver', [['pending', 'Pending'], ['verified', 'Verified'], ['rejected', 'Rejected'], ['all', 'All']])}</div><div id="tbl">${vTable()}</div>` });

/* listings */
function lRows() {
  const q = (A.f.q || '').toLowerCase(), [lo, hi] = (A.f.amt || '0-1000000000').split('-').map(Number);
  return DB.listings.filter(l => (!A.f.status || (A.f.status === 'rejected' ? lPill(l).includes('Rejected') : l.status === A.f.status && !lPill(l).includes('Rejected'))) && (!A.f.sector || l.sector === A.f.sector) && (!A.f.city || l.city === A.f.city) && l.amount >= lo && l.amount <= hi && (!q || (l.title + l.business + l.owner).toLowerCase().includes(q))).sort((a, b) => b.t - a.t);
}
function lTable() {
  const rows = lRows(); if (!rows.length) return '<div class="em">No listings found</div>';
  return `<div class="tw"><table><thead><tr><th>Listing</th><th>Sector</th><th>Amount</th><th>City</th><th>Status</th><th>Created</th></tr></thead><tbody>${rows.map(l => `<tr class="c" data-a="open" data-t="lst" data-id="${l.id}"><td>${esc(l.title)}<span class="sub">${esc(l.business)} · ${esc(l.owner)}</span></td><td>${esc(l.sector)}</td><td>${inr(l.amount)}</td><td>${esc(l.city)}</td><td>${lPill(l)}</td><td>${dt(l.t)}</td></tr>`).join('')}</tbody></table></div>`;
}
pages.listings = () => ({ title: 'Listings', actions: '', table: lTable, body: `<div class="bar">${fsearch('Search title or business')}${fsel('status', [['submitted', 'In review'], ['live', 'Live'], ['paused', 'Paused'], ['closed', 'Closed'], ['draft', 'Draft'], ['rejected', 'Rejected']], 'All status')}${fsel('sector', DB.master.sectors, 'All sectors')}${fsel('amt', AMT.slice(1), 'Any amount')}${fsel('city', DB.master.cities, 'All cities')}</div><div id="tbl">${lTable()}</div>` });

/* interests */
function iRows() {
  const q = (A.f.q || '').toLowerCase();
  return DB.interests.filter(i => (A.f.stage === undefined || A.f.stage === '' || (A.f.stage === 'declined' ? i.declined : !i.declined && String(i.stage) === A.f.stage)) && (!A.f.who || (A.f.who === 'none' ? !i.assignee : i.assignee === A.f.who)) && (!q || (listing(i.lid).title + invOf(i).name).toLowerCase().includes(q))).sort((a, b) => lastAct(b) - lastAct(a));
}
function iTable() {
  const rows = iRows(); if (!rows.length) return '<div class="em">No interests found</div>';
  return `<div class="tw"><table><thead><tr><th>Listing</th><th>Investor</th><th>Entrepreneur</th><th>Stage</th><th>Assigned</th><th>Updated</th></tr></thead><tbody>${rows.map(i => { const l = listing(i.lid); return `<tr class="c" data-a="open" data-t="int" data-id="${i.id}"><td>${esc(l.title)}<span class="sub">${inr(l.amount)}</span></td><td>${esc(invOf(i).name)}</td><td>${esc(l.owner)}</td><td>${stagePl(i)}</td><td>${esc(i.assignee) || '<span class="sub">Unassigned</span>'}</td><td>${rel(lastAct(i))}</td></tr>`; }).join('')}</tbody></table></div>`;
}
pages.interests = () => ({ title: 'Introductions', actions: '', table: iTable, body: `<div class="bar">${fsearch('Search listing or investor')}${fsel('stage', STEP_E.slice(0, 4).map((s, i) => [String(i), s]).concat([['4', 'Closed'], ['declined', 'Declined']]), 'All stages')}${fsel('who', staff().map(s => [s, s]).concat([['none', 'Unassigned']]), 'Anyone')}</div><div id="tbl">${iTable()}</div>` });

/* chats */
const chatList = () => DB.interests.filter(i => (DB.chats[i.id] || []).some(m => m.by !== 'sys')).sort((a, b) => ((DB.chats[b.id].at(-1) || {}).t || 0) - ((DB.chats[a.id].at(-1) || {}).t || 0));
pages.chats = () => {
  const list = chatList(), sel = list.find(i => i.id === A.chat) || list[0], ownerName = it => listing(it.lid).owner;
  let view = '<div class="em">No chats yet</div>';
  if (sel) {
    const l = listing(sel.lid), live = sel.stage >= 2 && sel.stage <= 3;
    const nm = id => id === 'sys' ? '' : (member(id)?.user.name || '');
    view = `<header><div><b>${esc(l.title)}</b><span class="sub" style="display:block;color:var(--ink2);font-size:12px">${esc(invOf(sel).name)} and ${esc(ownerName(sel))}</span></div><div class="act" style="margin:0">${sel.chatOff ? pl('Disabled', 'bad') : live ? pl('Active', 'ok') : pl('Closed')}
      ${live ? `<button class="btn s g" data-a="chat-toggle" data-id="${sel.id}">${sel.chatOff ? 'Enable chat' : 'Disable chat'}</button><button class="btn s d" data-a="stage" data-id="${sel.id}" data-n="4">Close chat</button>` : ''}</div></header>
      <div class="msgs">${(DB.chats[sel.id] || []).map(m => m.by === 'sys' ? `<div class="sy">${esc(m.text)}</div>` : `<div class="m ${m.by === ownerId(sel) ? 'r' : ''}"><b>${esc(nm(m.by))}</b><p>${esc(m.text)}</p><small>${hm(m.t)}${m.read ? ' · Read' : ''}</small></div>`).join('')}</div>`;
  }
  return { title: 'Chats', actions: '', body: `<div class="chats"><div class="clist">${list.map(i => { const l = listing(i.lid), last = (DB.chats[i.id] || []).filter(m => m.by !== 'sys').at(-1); return `<button class="ci ${sel && sel.id === i.id ? 'on' : ''}" data-a="chat-sel" data-id="${i.id}"><b>${esc(l.title)}</b><small>${esc(invOf(i).name)} and ${esc(l.owner)}</small><small>${last ? esc(last.text.slice(0, 48)) : ''}</small></button>`; }).join('') || '<div class="em">No chats</div>'}</div><div class="cv">${view}</div></div>` };
};

/* payments */
function payTable() {
  const rows = DB.payments; if (!rows.length) return '<div class="em">No payments yet</div>';
  return `<div class="tw"><table><thead><tr><th>Transaction</th><th>Member</th><th>Type</th><th>Amount</th><th>Date</th><th>Status</th><th>Method</th><th></th></tr></thead><tbody>${rows.map(p => `<tr><td>${p.id}</td><td>${esc(member(p.mid)?.user?.name)}</td><td>${esc(MODELS[p.kind])}<span class="sub">${esc(p.ref)}</span></td><td>${inr(p.amount)}</td><td>${dt(p.t)}</td><td>${p.status === 'paid' ? pl('Paid', 'ok') : pl('Refunded', 'warn')}</td><td>${p.method}</td><td style="white-space:nowrap"><button class="btn s g" data-a="invoice" data-id="${p.id}">Invoice</button> ${p.status === 'paid' ? `<button class="btn s g" data-a="refund" data-id="${p.id}">Refund</button>` : ''}</td></tr>`).join('')}</tbody></table></div>`;
}
pages.payments = () => {
  const paid = DB.payments.filter(p => p.status === 'paid'), ref = DB.payments.filter(p => p.status === 'refunded');
  return {
    title: 'Payments', actions: '', table: payTable,
    body: `<div class="card"><h3>Fee model</h3><div class="seg" style="margin-bottom:16px">${Object.keys(MODELS).map(k => `<button data-a="model" data-v="${k}" class="${DB.fee.model === k ? 'on' : ''}">${MODELS[k]}</button>`).join('')}</div>
      <form data-form="fees" class="bar" style="margin:0">${[['membership', 'Membership / year'], ['listing', 'Per listing'], ['connection', 'Per introduction']].map(f => `<div><label class="lbl">${f[1]}</label><input class="in" name="${f[0]}" inputmode="numeric" value="${DB.fee[f[0]]}" style="width:140px"></div>`).join('')}<div style="align-self:flex-end"><button class="btn g">Save fees</button></div></form></div>
      <div class="kpis"><div class="kpi"><small>Collected</small><b>${inr(paid.reduce((a, p) => a + p.amount, 0))}</b></div><div class="kpi"><small>Transactions</small><b>${DB.payments.length}</b></div><div class="kpi"><small>Refunded</small><b>${inr(ref.reduce((a, p) => a + p.amount, 0))}</b></div></div>
      <div id="tbl">${payTable()}</div>`,
  };
};

/* support */
function tkTable() {
  const rows = DB.tickets.filter(t => !A.f.status || t.status === A.f.status).sort((a, b) => b.t - a.t);
  if (!rows.length) return '<div class="em">No requests</div>';
  return `<div class="tw"><table><thead><tr><th>Member</th><th>Category</th><th>Description</th><th>Status</th><th>Assigned</th><th>Raised</th></tr></thead><tbody>${rows.map(t => { const m = member(t.mid); return `<tr class="c" data-a="open" data-t="tk" data-id="${t.id}"><td>${who(m?.user?.name || 'Member', m?.role === 'ent' ? 'Entrepreneur' : 'Investor')}</td><td>${esc(t.cat)}</td><td style="max-width:280px">${esc(t.text)}</td><td>${tkPill(t.status)}</td><td>${esc(t.assignee) || '<span class="sub">Unassigned</span>'}</td><td>${rel(t.t)}</td></tr>`; }).join('')}</tbody></table></div>`;
}
pages.support = () => ({ title: 'Support', actions: '', table: tkTable, body: `<div class="bar">${fsel('status', [['open', 'Open'], ['progress', 'In progress'], ['resolved', 'Resolved']], 'All status')}</div><div id="tbl">${tkTable()}</div>` });

/* broadcast */
pages.broadcast = () => ({
  title: 'Broadcast', actions: '',
  body: `<div class="card" style="max-width:560px"><h3>New notification</h3><form data-form="broadcast">
    <div class="fld"><label class="lbl">Send to</label><select class="sl" name="aud" data-aud><option value="all">All members</option><option value="ent">Entrepreneurs</option><option value="inv">Investors</option><option value="one">A selected member</option></select></div>
    <div class="fld hide" id="oneBox" style="display:none"><label class="lbl">Member</label><select class="sl" name="mid">${registered().map(m => `<option value="${m.id}">${esc(m.user.name)} (${m.role === 'ent' ? 'Entrepreneur' : 'Investor'})</option>`).join('')}</select></div>
    <div class="fld"><label class="lbl">Title</label><input class="in" name="title"></div>
    <div class="fld"><label class="lbl">Message</label><textarea class="ta" name="text" rows="3"></textarea></div>
    ${A.err ? `<div class="err">${A.err}</div>` : ''}<button class="btn">Send</button></form></div>
    <div class="tw"><table><thead><tr><th>Title</th><th>Audience</th><th>Sent by</th><th>Date</th></tr></thead><tbody>${DB.broadcasts.map(b => `<tr><td>${esc(b.title)}<span class="sub">${esc(b.text)}</span></td><td>${esc(b.aud)}</td><td>${esc(b.by)}</td><td>${dt(b.t)}</td></tr>`).join('')}</tbody></table></div>`,
});

/* reports */
function report(tab) {
  const nm = id => member(id)?.user?.name || '';
  if (tab === 'members') return { head: ['Name', 'Role', 'Mobile', 'Email', 'City', 'Verification', 'Active', 'Joined'], rows: registered().map(m => [m.user.name, m.role === 'ent' ? 'Entrepreneur' : 'Investor', m.phone, m.user.email, m.user.city, m.ver, m.active !== false ? 'Yes' : 'No', dt(m.t)]) };
  if (tab === 'listings') return { head: ['Title', 'Business', 'Sector', 'Stage', 'City', 'Amount', 'Status', 'Created'], rows: DB.listings.map(l => [l.title, l.business, l.sector, l.stage, l.city, l.amount, l.status, dt(l.t)]) };
  if (tab === 'interests') return { head: ['Listing', 'Investor', 'Entrepreneur', 'Stage', 'Assigned', 'Received', 'Introduced'], rows: DB.interests.map(i => [listing(i.lid).title, invOf(i).name, listing(i.lid).owner, i.declined ? 'Declined' : STEP_E[i.stage], i.assignee, dt(i.t), i.introT ? dt(i.introT) : '']) };
  if (tab === 'fees') return { head: ['Transaction', 'Member', 'Type', 'Reference', 'Amount', 'Status', 'Method', 'Date'], rows: DB.payments.map(p => [p.id, nm(p.mid), MODELS[p.kind], p.ref, p.amount, p.status, p.method, dt(p.t)]) };
  const done = DB.tickets.filter(t => t.status === 'resolved').length;
  return { head: ['Metric', 'Value'], rows: [['Entrepreneurs', registered('ent').length], ['Investors', registered('inv').length], ['Verified members', registered().filter(verified).length], ['Live listings', liveListings().length], ['Interests received', DB.interests.length], ['Introductions made', DB.interests.filter(i => i.introT).length], ['Complaints raised', DB.tickets.length], ['Complaints resolved', done], ['Fee collections', inr(DB.payments.filter(p => p.status === 'paid').reduce((a, p) => a + p.amount, 0))]] };
}
pages.reports = () => {
  const R = report(A.rtab), tabs = [['members', 'Members'], ['listings', 'Listings'], ['interests', 'Introductions'], ['fees', 'Fee collections'], ['kpis', 'Complaints and KPIs']];
  return { title: 'Reports', actions: `<button class="btn" data-a="export">Export CSV</button>`, body: `<div class="bar"><div class="seg">${tabs.map(t => `<button data-a="rtab" data-v="${t[0]}" class="${A.rtab === t[0] ? 'on' : ''}">${t[1]}</button>`).join('')}</div></div><div class="tw"><table><thead><tr>${R.head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${R.rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${R.head.length}" class="em">No data</td></tr>`}</tbody></table></div>` };
};

/* sub-admins */
pages.admins = () => ({
  title: 'Sub-admins', actions: `<button class="btn" data-a="admin-new">Add sub-admin</button>`,
  body: `<div class="tw"><table><thead><tr><th>Name</th><th>Email</th><th>Access</th><th>Status</th><th></th></tr></thead><tbody>${DB.admins.map(a => `<tr><td>${who(a.name)}</td><td>${esc(a.email)}</td><td style="max-width:300px">${a.role === 'super' ? 'All modules' : a.modules.map(m => MODULES.find(x => x[0] === m)?.[1]).join(', ')}</td><td>${a.status === 'invited' ? pl('Invited', 'warn') : a.active ? pl('Active', 'ok') : pl('Inactive')}</td><td style="white-space:nowrap">${a.role === 'super' ? '' : `<button class="btn s g" data-a="admin-edit" data-id="${a.id}">Edit</button> <button class="btn s g" data-a="admin-toggle" data-id="${a.id}">${a.active ? 'Deactivate' : 'Activate'}</button>`}</td></tr>`).join('')}</tbody></table></div>`,
});

/* cms */
pages.cms = () => {
  const T = { about: 'About Advitta', terms: 'Terms & Conditions', privacy: 'Privacy Policy', disclaimer: 'Disclaimer' };
  const body = A.ctab === 'pages'
    ? `<div class="card" style="max-width:720px"><div class="seg" style="margin-bottom:16px">${Object.keys(T).map(k => `<button data-a="cpage" data-v="${k}" class="${A.cpage === k ? 'on' : ''}">${T[k]}</button>`).join('')}</div><form data-form="cms"><textarea class="ta" name="body" rows="10">${esc(DB.cms[A.cpage])}</textarea><div class="act"><button class="btn">Save ${T[A.cpage]}</button></div></form></div>`
    : ['sectors', 'cities'].map(k => `<div class="card" style="max-width:720px"><h3>${k === 'sectors' ? 'Sectors and categories' : 'Cities'}</h3><div class="tagl" style="margin-bottom:14px">${DB.master[k].map(v => `<span class="tag">${esc(v)}<button data-a="m-del" data-k="${k}" data-v="${esc(v)}" aria-label="Remove">×</button></span>`).join('')}</div><form data-form="master" data-k="${k}" class="bar" style="margin:0"><input class="in" name="v" placeholder="Add new"><button class="btn g">Add</button></form></div>`).join('');
  return { title: 'CMS', actions: '', body: `<div class="bar"><div class="seg"><button data-a="ctab" data-v="pages" class="${A.ctab === 'pages' ? 'on' : ''}">Pages</button><button data-a="ctab" data-v="master" class="${A.ctab === 'master' ? 'on' : ''}">Master data</button></div></div>${body}` };
};

/* account */
pages.account = () => {
  const a = me();
  return { title: 'My account', actions: `<button class="btn g" data-a="logout">Log out</button>`, body: `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:18px;max-width:760px">
    <form class="card" data-form="profile"><h3>Profile</h3><div class="fld"><label class="lbl">Name</label><input class="in" name="name" value="${esc(a.name)}"></div><div class="fld"><label class="lbl">Email</label><input class="in" name="email" value="${esc(a.email)}"></div><button class="btn">Save changes</button></form>
    <form class="card" data-form="password"><h3>Change password</h3><div class="fld"><label class="lbl">Current password</label><input class="in" type="password" name="cur"></div><div class="fld"><label class="lbl">New password</label><input class="in" type="password" name="nw"></div><div class="fld"><label class="lbl">Confirm new password</label><input class="in" type="password" name="cf"></div>${A.err ? `<div class="err">${A.err}</div>` : ''}<button class="btn">Update password</button></form></div>` };
};

/* ───────── drawer + modal ───────── */
function fileChips(m) {
  const lab = { id: m.idType + ' (identity proof)', proof: 'Business proof', bdoc: 'Supporting document' }, ks = Object.keys(m.docs || {});
  return ks.length ? `<div class="files">${ks.map(k => `<div class="file">${isImg(m.files?.[k]) ? `<img class="th" src="${m.files[k]}" alt="">` : ''}<div class="grow">${esc(m.docs[k])}<small>${lab[k] || 'Document'}</small></div><button class="btn s g" data-a="preview" data-m="${m.id}" data-k="${k}">Preview</button></div>`).join('')}</div>` : '<span class="sub">No documents</span>';
}
const drawers = {
  mem(id) {
    const m = member(id); if (!m) return null; const ent = m.role === 'ent';
    const ls = DB.listings.filter(l => l.oid === id), is = DB.interests.filter(i => ent ? ownerId(i) === id : i.iid === id);
    const decide = m.ver === 'pending' && can('verification') ? `<div class="sec"><h4>Decision</h4><textarea class="ta" id="reason" rows="2" placeholder="Reason or message (required to reject or ask for more)"></textarea><div class="act"><button class="btn" data-a="decide" data-id="${id}" data-v="ok">Approve</button><button class="btn d" data-a="decide" data-id="${id}" data-v="no">Reject</button><button class="btn g" data-a="decide" data-id="${id}" data-v="info">Request more information</button></div>${A.err ? `<div class="err">${A.err}</div>` : ''}</div>` : '';
    return {
      title: m.user.name, html: `<div class="sec">${kv([['Role', ent ? 'Entrepreneur' : 'Investor'], ['Mobile', '+91 ' + esc(m.phone)], ['Email', esc(m.user.email)], ['City', esc(m.user.city)], ['Verification', verPill(m.ver) + (m.ver === 'rejected' ? `<div class="sub" style="color:var(--bad);margin-top:6px">${esc(m.reject)}</div>` : '')], ['Joined', dt(m.t)], ['Account', m.active !== false ? pl('Active', 'ok') : pl('Inactive')]])}</div>
      ${ent ? `<div class="sec"><h4>Business</h4>${kv([['Name', esc(m.business?.name)], ['Sector', esc(m.business?.sector)], ['Stage', esc(m.business?.stage)], ['City', esc(m.business?.city)], ['About', esc(m.business?.desc)], ['Link', esc(m.business?.link)]])}</div>` : `<div class="sec"><h4>Interest</h4>${kv([['Areas', esc((m.areas || []).join(', '))], ['Note', esc(m.declaration)]])}</div>`}
      <div class="sec"><h4>Documents</h4>${fileChips(m)}</div>${decide}
      ${ent ? `<div class="sec"><h4>Listings</h4>${ls.length ? `<div class="tw"><table class="mini"><tbody>${ls.map(l => `<tr class="c" data-a="open" data-t="lst" data-id="${l.id}"><td>${esc(l.title)}</td><td>${inr(l.amount)}</td><td>${lPill(l)}</td></tr>`).join('')}</tbody></table></div>` : '<span class="sub">None</span>'}</div>` : ''}
      <div class="sec"><h4>Interest history</h4>${is.length ? `<div class="tw"><table class="mini"><tbody>${is.map(i => `<tr class="c" data-a="open" data-t="int" data-id="${i.id}"><td>${esc(listing(i.lid).title)}</td><td>${esc(ent ? invOf(i).name : listing(i.lid).owner)}</td><td>${stagePl(i)}</td></tr>`).join('')}</tbody></table></div>` : '<span class="sub">None</span>'}</div>`,
    };
  },
  lst(id) {
    const l = listing(id); if (!l) return null; const ow = member(l.oid), ints = DB.interests.filter(i => i.lid === id);
    const rev = l.status === 'submitted' ? `<div class="sec"><h4>Review</h4><textarea class="ta" id="reason" rows="2" placeholder="Reason (required to reject)"></textarea><div class="act"><button class="btn" data-a="lreview" data-id="${id}" data-v="ok">Approve</button><button class="btn d" data-a="lreview" data-id="${id}" data-v="no">Reject</button></div>${A.err ? `<div class="err">${A.err}</div>` : ''}</div>` : '';
    const acts = [`<button class="btn g" data-a="ledit" data-id="${id}">Edit</button>`];
    if (l.status === 'live') acts.push(`<button class="btn g" data-a="lset" data-id="${id}" data-s="paused">Pause</button>`);
    if (l.status === 'paused') acts.push(`<button class="btn g" data-a="lset" data-id="${id}" data-s="live">Reactivate</button>`);
    if (['live', 'paused', 'submitted'].includes(l.status)) acts.push(`<button class="btn d" data-a="lset" data-id="${id}" data-s="closed">Take down</button>`);
    const inv = registered('inv').filter(verified);
    return {
      title: l.title, html: `<div class="sec">${kv([['Status', lPill(l)], ['Amount', inr(l.amount)], ['Sector', esc(l.sector)], ['Stage', esc(l.stage)], ['City', esc(l.city)], ['Entrepreneur', ow ? `<a href="#" data-a="open" data-t="mem" data-id="${ow.id}">${esc(l.owner)}</a>` : esc(l.owner)], ['Business', esc(l.business)], ['Created', dt(l.t)], ['Fee', l.paid ? pl('Paid', 'ok') : '–']])}${l.remark ? `<div class="sub" style="color:var(--bad);margin-top:8px">${esc(l.remark)}</div>` : ''}</div>
      <div class="sec"><h4>Pitch</h4><p style="line-height:1.55">${esc(l.desc)}</p></div><div class="sec"><h4>Use of funds</h4><p style="line-height:1.55">${esc(l.purpose)}</p></div>
      ${l.deck ? `<div class="sec"><h4>Pitch deck</h4><div class="file">${isImg(l.deckData) ? `<img class="th" src="${l.deckData}" alt="">` : ''}<div class="grow">${esc(l.deck)}</div><button class="btn s g" data-a="preview" data-l="${l.id}">Preview</button></div></div>` : ''}
      ${rev}<div class="sec"><h4>Manage</h4><div class="act" style="margin-top:0">${acts.join('')}</div></div>
      ${l.status === 'live' && inv.length ? `<div class="sec"><h4>Add test interest</h4><form data-form="testint" data-id="${id}" class="bar" style="margin:0"><select class="sl" name="iid">${inv.map(m => `<option value="${m.id}">${esc(m.user.name)}</option>`).join('')}</select><button class="btn g">Add</button></form></div>` : ''}
      <div class="sec"><h4>Interests (${ints.length})</h4>${ints.length ? `<div class="tw"><table class="mini"><tbody>${ints.map(i => `<tr class="c" data-a="open" data-t="int" data-id="${i.id}"><td>${esc(invOf(i).name)}</td><td>${stagePl(i)}</td></tr>`).join('')}</tbody></table></div>` : '<span class="sub">None</span>'}</div>`,
    };
  },
  int(id) {
    const it = interest(id); if (!it) return null; const l = listing(it.lid), iv = member(it.iid), ow = member(l.oid);
    const steps = [[1, 'Contacted'], [2, 'Introduced'], [3, 'In discussion'], [4, 'Closed']];
    return {
      title: l.title, html: `<div class="sec">${kv([['Stage', stagePl(it)], ['Amount', inr(l.amount)], ['Investor', `<a href="#" data-a="open" data-t="mem" data-id="${it.iid}">${esc(invOf(it).name)}</a><span class="sub">+91 ${esc(iv?.phone)} · ${esc(iv?.user?.email)}</span>`], ['Entrepreneur', `<a href="#" data-a="open" data-t="mem" data-id="${l.oid}">${esc(l.owner)}</a><span class="sub">+91 ${esc(ow?.phone)} · ${esc(ow?.user?.email)}</span>`], ['Investor note', esc(it.note)], ['Fee', it.paid ? pl('Paid', 'ok') : '–']])}</div>
      <div class="sec"><h4>Move to</h4><div class="act" style="margin-top:0">${steps.map(s => `<button class="btn s ${!it.declined && it.stage === s[0] ? '' : 'g'}" data-a="stage" data-id="${id}" data-n="${s[0]}">${s[1]}</button>`).join('')}<button class="btn s ${it.declined ? 'd' : 'g'}" data-a="decline" data-id="${id}">Declined</button></div>${it.stage >= 2 && it.stage <= 3 ? '<div class="sub" style="margin-top:8px">Chat is open for this pair.</div>' : ''}</div>
      <div class="sec"><h4>Assigned to</h4><select class="sl" data-assign="${id}">${options(staff(), it.assignee, 'Unassigned')}</select></div>
      <div class="sec"><h4>Internal notes</h4><form data-form="note" data-id="${id}" class="bar" style="margin-bottom:10px"><input class="in" name="text" placeholder="Add a note" style="flex:1"><button class="btn g">Add</button></form>${it.notes.length ? `<ul class="log">${it.notes.map(n => `<li>${esc(n.text)}<small>${esc(n.by)} · ${dt(n.t)} ${hm(n.t)}</small></li>`).join('')}</ul>` : ''}</div>
      <div class="sec"><h4>Activity</h4><ul class="log">${it.log.map(n => `<li>${esc(n.text)}<small>${esc(n.by)} · ${dt(n.t)} ${hm(n.t)}</small></li>`).join('')}</ul></div>`,
    };
  },
  tk(id) {
    const t = DB.tickets.find(x => x.id === id); if (!t) return null; const m = member(t.mid);
    return {
      title: t.cat, html: `<div class="sec">${kv([['Member', `<a href="#" data-a="open" data-t="mem" data-id="${t.mid}">${esc(m?.user?.name)}</a>`], ['Role', m?.role === 'ent' ? 'Entrepreneur' : 'Investor'], ['Raised', dt(t.t)], ['Status', tkPill(t.status)]])}</div>
      <div class="sec"><h4>Description</h4><p style="line-height:1.55">${esc(t.text)}</p></div>
      <div class="sec"><h4>Assigned to</h4><select class="sl" data-tassign="${id}">${options(staff(), t.assignee, 'Unassigned')}</select></div>
      <div class="sec"><h4>Status</h4><div class="act" style="margin-top:0">${[['open', 'Open'], ['progress', 'In progress'], ['resolved', 'Resolved']].map(s => `<button class="btn s ${t.status === s[0] ? '' : 'g'}" data-a="tstatus" data-id="${id}" data-v="${s[0]}">${s[1]}</button>`).join('')}</div></div>`,
    };
  },
};

function modalHtml() {
  const m = A.modal; if (!m) return '';
  const close = '<button type="button" class="btn g" data-a="closeMd">Cancel</button>';
  if (m.t === 'preview') return `<h2>${esc(m.n)}</h2>${docView(m.n, m.src)}<div class="row"><button class="btn g" data-a="closeMd">Close</button></div>`;
  if (m.t === 'refund') return `<h2>Refund ${m.id}</h2><form data-form="refund" data-id="${m.id}"><div class="fld"><label class="lbl">Reason</label><textarea class="ta" name="reason" rows="3"></textarea></div>${A.err ? `<div class="err">${A.err}</div>` : ''}<div class="row">${close}<button class="btn d">Refund</button></div></form>`;
  if (m.t === 'invoice') { const p = DB.payments.find(x => x.id === m.id), mm = member(p.mid); return `<h2>Invoice ${p.id}</h2>${kv([['Billed to', esc(mm?.user?.name)], ['Date', dt(p.t)], ['Item', esc(MODELS[p.kind]) + ' · ' + esc(p.ref)], ['Amount', inr(p.amount)], ['Method', p.method], ['Status', p.status === 'paid' ? 'Paid' : 'Refunded']])}<div class="sec" style="margin-top:18px"><h4>Audit trail</h4><ul class="log">${p.audit.map(a => `<li>${esc(a.text)}<small>${dt(a.t)} ${hm(a.t)}</small></li>`).join('')}</ul></div><div class="row"><button class="btn g" data-a="closeMd">Close</button><button class="btn" data-a="dl-invoice" data-id="${p.id}">Download</button></div>`; }
  if (m.t === 'ledit') { const l = listing(m.id); return `<h2>Edit listing</h2><form data-form="ledit" data-id="${l.id}"><div class="fld"><label class="lbl">Title</label><input class="in" name="title" value="${esc(l.title)}"></div><div class="fld"><label class="lbl">Amount</label><input class="in" name="amount" value="${l.amount}"></div><div class="fld"><label class="lbl">Pitch</label><textarea class="ta" name="desc" rows="4">${esc(l.desc)}</textarea></div><div class="fld"><label class="lbl">Use of funds</label><textarea class="ta" name="purpose" rows="2">${esc(l.purpose)}</textarea></div>${A.err ? `<div class="err">${A.err}</div>` : ''}<div class="row">${close}<button class="btn">Save changes</button></div></form>`; }
  if (m.t === 'admin') {
    const a = m.id ? DB.admins.find(x => x.id === m.id) : { name: '', email: '', modules: [] };
    return `<h2>${m.id ? 'Edit sub-admin' : 'Add sub-admin'}</h2><form data-form="admin" data-id="${m.id || ''}"><div class="fld"><label class="lbl">Name</label><input class="in" name="name" value="${esc(a.name)}"></div><div class="fld"><label class="lbl">Email</label><input class="in" name="email" value="${esc(a.email)}"></div><label class="lbl">Modules</label><div class="mods">${MODULES.filter(x => x[0] !== 'admins').map(x => `<label><input type="checkbox" name="mod" value="${x[0]}" ${a.modules.includes(x[0]) ? 'checked' : ''}>${x[1]}</label>`).join('')}</div>${A.err ? `<div class="err">${A.err}</div>` : ''}<div class="row">${close}<button class="btn">${m.id ? 'Save changes' : 'Send invite'}</button></div></form>`;
  }
  return '';
}

/* ───────── render ───────── */
function label() { $$('table').forEach(t => { const h = $$('th', t).map(x => x.textContent); $$('tbody tr', t).forEach(r => [...r.children].forEach((c, i) => { c.dataset.l = h[i] || ''; })); }); }
function authView() {
  const box = inner => `<div class="auth">${inner}</div>`;
  if (A.auth === 'forgot') return box(`<form data-form="forgot">${logoSvg(44)}<h1>Reset password</h1><p>Enter your registered email and we will send a reset link.</p><input class="in" name="email" type="email" placeholder="Email" autofocus>${A.err ? `<div class="err">${A.err}</div>` : ''}<button class="btn">Send reset link</button><div class="links"><a href="#" data-a="auth" data-v="login">Back to sign in</a></div></form>`);
  if (A.auth === 'sent') return box(`<div class="box">${logoSvg(44)}<h1>Check your email</h1><p>A reset link was sent to ${esc(A.authEmail)}. For this demo, use the link below.</p><button class="btn" data-a="auth" data-v="reset">Open reset link</button></div>`);
  if (A.auth === 'reset') return box(`<form data-form="reset">${logoSvg(44)}<h1>Set a new password</h1><p>Choose a password with at least 6 characters.</p><div class="fld"><input class="in" name="nw" type="password" placeholder="New password"></div><div class="fld"><input class="in" name="cf" type="password" placeholder="Confirm password"></div>${A.err ? `<div class="err">${A.err}</div>` : ''}<button class="btn">Update password</button></form>`);
  return box(`<form data-form="login">${logoSvg(44)}<h1>Admin sign in</h1><p>Use your Advitta email and password.</p><div class="fld"><input class="in" name="email" type="email" placeholder="Email" value="admin@advitta.in"></div><div class="fld"><input class="in" name="pw" type="password" placeholder="Password" value="Admin@123"></div>${A.err ? `<div class="err">${A.err}</div>` : ''}<button class="btn">Sign in</button><div class="links"><a href="#" data-a="auth" data-v="forgot">Forgot password?</a><a href="#" data-a="staff">Use staff account</a></div></form>`);
}
const badge = { verification: () => registered().filter(m => m.ver === 'pending').length, listings: () => DB.listings.filter(l => l.status === 'submitted').length, support: () => DB.tickets.filter(t => t.status === 'open').length };
const routeName = () => (location.hash.replace(/^#\//, '') || '').split('?')[0];

function render() {
  loadDB();
  const a = me(), app = $('#app');
  if (!a) { app.innerHTML = authView(); $('#drawer').innerHTML = $('#modal').innerHTML = ''; return; }
  let r = routeName(); const allowed = MODULES.filter(m => can(m[0])).map(m => m[0]).concat('account');
  if (!allowed.includes(r)) { r = allowed[0]; history.replaceState(null, '', '#/' + r); }
  const keep = [$('.body')?.scrollTop || 0, $('.dr-body')?.scrollTop || 0];
  const pg = pages[r](); A.cur = pg;
  app.innerHTML = `<div class="shell"><aside class="side"><div class="brand">${logoSvg(28)}Advitta</div><nav class="nav">${MODULES.filter(m => can(m[0])).map(m => { const n = badge[m[0]]?.(); return `<a href="#/${m[0]}" class="${r === m[0] ? 'on' : ''}">${m[1]}${n ? `<span class="n">${n}</span>` : ''}</a>`; }).join('')}</nav><div class="grow"></div><a class="me" href="#/account" style="color:inherit">${av(a.name)}<div><b>${esc(a.name)}</b><small>${a.role === 'super' ? 'Super admin' : 'Staff'}</small></div></a></aside><main><header class="top"><h1>${pg.title}</h1><div>${pg.actions || ''}</div></header><section class="body">${pg.body}</section></main></div>`;
  label(); $('.body').scrollTop = keep[0];
  const d = A.drawer && drawers[A.drawer.t]?.(A.drawer.id);
  $('#drawer').innerHTML = d ? `<div class="dr-bd" data-a="closeDr"></div><aside class="dr"><header><h2>${esc(d.title)}</h2><button class="x" data-a="closeDr" aria-label="Close">×</button></header><div class="dr-body">${d.html}</div></aside>` : '';
  if (d) $('.dr-body').scrollTop = keep[1];
  $('#modal').innerHTML = A.modal ? `<div class="md-bd" data-a="closeMd"></div><div class="md">${modalHtml()}</div>` : '';
}
addEventListener('hashchange', () => { A.f = {}; A.drawer = null; A.err = ''; render(); });
const editing = () => /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName);
addEventListener('storage', e => { if (e.key === DBKEY && !editing()) render(); });

/* ───────── actions ───────── */
const flash = (msg, reset = true) => { if (reset) A.err = ''; toast(msg); render(); };
const acts = {
  closeDr: () => { A.drawer = null; A.err = ''; render(); },
  closeMd: () => { A.modal = null; A.err = ''; render(); },
  open: d => { A.drawer = { t: d.t, id: d.id }; A.err = ''; render(); },
  range: d => { A.range = d.v; render(); },
  rtab: d => { A.rtab = d.v; render(); }, ctab: d => { A.ctab = d.v; render(); }, cpage: d => { A.cpage = d.v; render(); },
  auth: d => { A.auth = d.v; A.err = ''; render(); },
  staff: () => { A.auth = 'login'; render(); $('[name=email]').value = 'staff@advitta.in'; $('[name=pw]').value = 'Staff@123'; },
  logout: () => { localStorage.removeItem(SK); A.drawer = A.modal = null; location.hash = ''; render(); },
  'toggle-m': (d, el, e) => { e.stopPropagation(); const m = member(d.id); m.active = m.active === false; saveDB(); toast(m.active ? 'Activated' : 'Deactivated'); render(); },
  decide: d => {
    const m = member(d.id), reason = ($('#reason')?.value || '').trim();
    if (d.v === 'ok') { m.ver = 'verified'; m.reject = ''; notifyMember(m.id, 'Verification approved', 'You are now verified.', { name: 'status', p: {} }); flash('Approved'); return; }
    if (!reason) { A.err = 'Add a reason first'; render(); return; }
    m.ver = 'rejected'; m.reject = d.v === 'info' ? 'More information needed: ' + reason : reason;
    notifyMember(m.id, d.v === 'info' ? 'More information needed' : 'Verification needs changes', m.reject, { name: 'status', p: {} }); saveDB(); flash(d.v === 'info' ? 'Request sent' : 'Rejected');
  },
  lreview: d => {
    const l = listing(d.id), reason = ($('#reason')?.value || '').trim();
    if (d.v === 'ok') { l.status = 'live'; l.review = 'approved'; l.remark = ''; notifyMember(l.oid, 'Listing approved', l.title + ' is live.', { name: 'mylisting', p: { id: l.id } }); saveDB(); flash('Approved'); return; }
    if (!reason) { A.err = 'Add a reason first'; render(); return; }
    l.status = 'draft'; l.review = 'rejected'; l.remark = reason; notifyMember(l.oid, 'Listing needs changes', l.title, { name: 'mylisting', p: { id: l.id } }); saveDB(); flash('Rejected');
  },
  lset: d => { const l = listing(d.id); l.status = d.s; if (d.s === 'closed') l.review = 'approved'; notifyMember(l.oid, { live: 'Listing reactivated', paused: 'Listing paused', closed: 'Listing taken down' }[d.s], l.title, { name: 'mylisting', p: { id: l.id } }); saveDB(); flash('Updated'); },
  ledit: d => { A.modal = { t: 'ledit', id: d.id }; A.err = ''; render(); },
  stage: d => { const it = interest(d.id); setStage(it, +d.n, me2()); flash('Updated'); },
  decline: d => { declineInterest(interest(d.id), me2()); flash('Declined'); },
  'chat-sel': d => { A.chat = d.id; render(); },
  'chat-toggle': d => { const it = interest(d.id); it.chatOff = !it.chatOff; logAct(it, it.chatOff ? 'Chat disabled' : 'Chat enabled', me2()); (DB.chats[it.id] ||= []).push({ by: 'sys', text: it.chatOff ? 'Chat disabled by Advitta' : 'Chat enabled by Advitta', t: Date.now(), read: true }); saveDB(); flash(it.chatOff ? 'Chat disabled' : 'Chat enabled'); },
  tstatus: d => { const t = DB.tickets.find(x => x.id === d.id); t.status = d.v; notifyMember(t.mid, 'Support update', { open: 'Your request is open.', progress: 'Your request is in progress.', resolved: 'Your request is resolved.' }[d.v], { name: 'support', p: {} }); saveDB(); flash('Updated'); },
  model: d => { DB.fee.model = d.v; saveDB(); flash(MODELS[d.v]); },
  refund: d => { A.modal = { t: 'refund', id: d.id }; A.err = ''; render(); },
  invoice: d => { A.modal = { t: 'invoice', id: d.id }; render(); },
  'dl-invoice': d => { const p = DB.payments.find(x => x.id === d.id), m = member(p.mid); download(`invoice-${p.id}.html`, `<!doctype html><meta charset="utf-8"><title>Invoice ${p.id}</title><body style="font-family:system-ui;max-width:520px;margin:40px auto"><h1>Advitta</h1><h2>Invoice ${p.id}</h2><p>Billed to: ${esc(m?.user?.name)}</p><p>Date: ${dt(p.t)}</p><p>${esc(MODELS[p.kind])} · ${esc(p.ref)}</p><h2>${inr(p.amount)}</h2><p>Status: ${p.status}</p><p style="color:#666">Advitta service fee only. Advitta does not handle investor-to-entrepreneur funds.</p></body>`, 'text/html'); },
  preview: d => {
    if (d.l) { const l = listing(d.l); A.modal = { t: 'preview', n: l.deck, src: l.deckData }; }
    else { const m = member(d.m); A.modal = { t: 'preview', n: m.docs[d.k], src: m.files?.[d.k] }; }
    render();
  },
  export: () => { const R = report(A.rtab); download(`advitta-${A.rtab}.csv`, csv([R.head, ...R.rows])); toast('Exported'); },
  'admin-new': () => { A.modal = { t: 'admin' }; A.err = ''; render(); },
  'admin-edit': d => { A.modal = { t: 'admin', id: d.id }; A.err = ''; render(); },
  'admin-toggle': d => { const a = DB.admins.find(x => x.id === d.id); a.active = !a.active; saveDB(); flash(a.active ? 'Activated' : 'Deactivated'); },
  'm-del': d => { DB.master[d.k] = DB.master[d.k].filter(v => v !== d.v); saveDB(); flash('Removed'); },
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el) return;
  if (el.tagName === 'A') e.preventDefault();
  acts[el.dataset.a]?.(el.dataset, el, e);
});

/* filters, assignment, date range */
document.addEventListener('input', e => {
  const t = e.target;
  if (t.matches('[data-f]')) { A.f[t.dataset.f] = t.value; if (A.cur?.table) { $('#tbl').innerHTML = A.cur.table(); label(); } }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.matches('select[data-f]')) { A.f[t.dataset.f] = t.value; if (A.cur?.table) { $('#tbl').innerHTML = A.cur.table(); label(); } }
  if (t.matches('[data-r]')) { A[t.dataset.r] = t.value; render(); }
  if (t.matches('[data-assign]')) { const it = interest(t.dataset.assign); it.assignee = t.value; logAct(it, t.value ? 'Assigned to ' + t.value : 'Unassigned', me2()); saveDB(); toast('Assigned'); render(); }
  if (t.matches('[data-tassign]')) { DB.tickets.find(x => x.id === t.dataset.tassign).assignee = t.value; saveDB(); toast('Assigned'); render(); }
  if (t.matches('[data-aud]')) { const b = $('#oneBox'); b.style.display = t.value === 'one' ? '' : 'none'; }
});

/* ───────── forms ───────── */
const fail = m => { A.err = m; render(); };
const forms = {
  login(d) {
    const a = DB.admins.find(x => x.email.toLowerCase() === d.email.trim().toLowerCase());
    if (!a || !a.active) return fail('No active account with this email');
    if (a.status === 'invited') { if (d.pw.length < 6) return fail('Choose a password with at least 6 characters'); a.pw = d.pw; a.status = 'active'; saveDB(); }
    else if (a.pw !== d.pw) return fail('Incorrect password');
    A.err = ''; localStorage.setItem(SK, JSON.stringify({ id: a.id })); location.hash = '#/' + (a.role === 'super' ? 'dashboard' : a.modules[0]); render();
  },
  forgot(d) { const a = DB.admins.find(x => x.email.toLowerCase() === d.email.trim().toLowerCase()); if (!a) return fail('No account with this email'); A.authEmail = a.email; A.err = ''; A.auth = 'sent'; render(); },
  reset(d) {
    if (d.nw.length < 6) return fail('Use at least 6 characters'); if (d.nw !== d.cf) return fail('Passwords do not match');
    const a = DB.admins.find(x => x.email === A.authEmail); a.pw = d.nw; saveDB(); A.auth = 'login'; A.err = ''; render(); toast('Password updated. Sign in.');
  },
  fees(d) { ['membership', 'listing', 'connection'].forEach(k => { const v = Number(String(d[k]).replace(/\D/g, '')); if (v > 0) DB.fee[k] = v; }); saveDB(); flash('Fees saved'); },
  refund(d, f) {
    if (d.reason.trim().length < 3) return fail('Add a reason');
    const p = DB.payments.find(x => x.id === f.dataset.id); p.status = 'refunded'; p.audit.push({ t: Date.now(), text: `Refunded by ${me2()}: ${d.reason.trim()}` });
    notifyMember(p.mid, 'Refund processed', `${inr(p.amount)} refunded.`, null); A.modal = null; saveDB(); flash('Refunded');
  },
  ledit(d, f) {
    const amt = Number(String(d.amount).replace(/\D/g, '')); if (!amt || amt < MIN || amt > MAX) return fail('Amount must be between ₹50,000 and ₹5,00,000'); if (d.title.trim().length < 3) return fail('Enter a title');
    const l = listing(f.dataset.id); Object.assign(l, { title: d.title.trim(), amount: amt, desc: d.desc.trim(), purpose: d.purpose.trim() }); A.modal = null; saveDB(); flash('Saved');
  },
  testint(d, f) {
    const l = listing(f.dataset.id), it = { id: uid('n'), lid: l.id, iid: d.iid, note: 'Interested in knowing more about your plans.', stage: 0, t: Date.now(), introT: 0, assignee: '', notes: [], log: [{ by: 'System', text: 'Interest received', t: Date.now() }], declined: false, chatOff: false };
    DB.interests.unshift(it); DB.chats[it.id] = []; notifyMember(l.oid, 'New interest', `A verified investor is interested in ${l.title}.`, { name: 'conn', p: { id: it.id } }); notifyMember(d.iid, 'Interest sent', l.title, { name: 'conn', p: { id: it.id } }); saveDB(); flash('Interest added');
  },
  note(d, f) { if (!d.text.trim()) return; const it = interest(f.dataset.id); it.notes.unshift({ by: me2(), text: d.text.trim(), t: Date.now() }); logAct(it, 'Note added', me2()); saveDB(); flash('Note added'); },
  broadcast(d) {
    if (d.title.trim().length < 2 || d.text.trim().length < 2) return fail('Add a title and message');
    const to = registered().filter(m => d.aud === 'all' || m.role === d.aud || (d.aud === 'one' && m.id === d.mid));
    to.forEach(m => notifyMember(m.id, d.title.trim(), d.text.trim(), null));
    DB.broadcasts.unshift({ id: uid('b'), t: Date.now(), aud: { all: 'All members', ent: 'Entrepreneurs', inv: 'Investors', one: member(d.mid)?.user?.name }[d.aud], title: d.title.trim(), text: d.text.trim(), by: me2() }); saveDB(); flash(`Sent to ${to.length} member${to.length === 1 ? '' : 's'}`);
  },
  admin(d, f) {
    const mods = [...f.querySelectorAll('[name=mod]:checked')].map(x => x.value), id = f.dataset.id;
    if (d.name.trim().length < 2) return fail('Enter a name'); if (!/^\S+@\S+\.\S+$/.test(d.email)) return fail('Enter a valid email'); if (!mods.length) return fail('Choose at least one module');
    if (DB.admins.some(a => a.email.toLowerCase() === d.email.trim().toLowerCase() && a.id !== id)) return fail('Email already in use');
    if (id) Object.assign(DB.admins.find(a => a.id === id), { name: d.name.trim(), email: d.email.trim(), modules: mods });
    else DB.admins.push({ id: uid('a'), name: d.name.trim(), email: d.email.trim(), pw: '', role: 'sub', modules: mods, active: true, status: 'invited' });
    A.modal = null; saveDB(); flash(id ? 'Saved' : 'Invite sent. They set a password at first sign in.');
  },
  cms(d) { DB.cms[A.cpage] = d.body.trim(); saveDB(); flash('Saved'); },
  master(d, f) { const k = f.dataset.k, v = d.v.trim(); if (!v) return; if (!DB.master[k].includes(v)) DB.master[k].push(v); DB.master[k].sort(); saveDB(); flash('Added'); },
  profile(d) { const a = me(); if (d.name.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(d.email)) return toast('Check name and email'); a.name = d.name.trim(); a.email = d.email.trim(); saveDB(); flash('Saved'); },
  password(d) { const a = me(); if (a.pw !== d.cur) return fail('Current password is incorrect'); if (d.nw.length < 6) return fail('Use at least 6 characters'); if (d.nw !== d.cf) return fail('Passwords do not match'); a.pw = d.nw; saveDB(); flash('Password updated'); },
};
document.addEventListener('submit', e => {
  const f = e.target.closest('form[data-form]'); if (!f) return; e.preventDefault();
  forms[f.dataset.form]?.(Object.fromEntries(new FormData(f)), f);
});

render();
