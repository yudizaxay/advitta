'use strict';
/* Shared by the mobile demo (app.js) and the admin panel (admin.js).
   One database in localStorage; both tabs stay in sync through the `storage` event. */

/* ───────── helpers ───────── */
const $ = (s, e = document) => e.querySelector(s);
const $$ = (s, e = document) => [...e.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const inr = n => '₹' + Number(n || 0).toLocaleString('en-IN');
const hm = t => new Date(t).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
const dt = t => new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const rel = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'Now' : m < 60 ? m + 'm' : m < 1440 ? Math.round(m / 60) + 'h' : new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); };
const first = n => (n || '').trim().split(' ')[0];
const initials = n => (n || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();

/* ───────── constants ───────── */
const DBKEY = 'advitta.demo.v2', DAY = 864e5;
const STAGES = ['Idea', 'Early revenue', 'Growing'];
const MIN = 50000, MAX = 500000;
const STEP_E = ['Interest received', 'Contacted by Advitta', 'Introduction arranged', 'In discussion', 'Closed'];
const STEP_I = ['Interest sent', 'Advitta contacted', 'Introduction arranged', 'In discussion', 'Closed'];
const MODELS = { none: 'Not selected', membership: 'Membership', listing: 'Listing fee', connection: 'Connection fee' };
const MODULES = [['dashboard', 'Dashboard'], ['verification', 'Verification'], ['listings', 'Listings'], ['interests', 'Introductions'], ['chats', 'Chats'], ['entrepreneurs', 'Entrepreneurs'], ['investors', 'Investors'], ['payments', 'Payments'], ['support', 'Support'], ['broadcast', 'Broadcast'], ['reports', 'Reports'], ['admins', 'Sub-admins'], ['cms', 'CMS']];

/* ───────── documents ───────── */
const sampleDoc = (title, sub) => 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260"><rect width="400" height="260" rx="18" fill="#F6F4F9"/><rect x="24" y="24" width="352" height="212" rx="12" fill="#fff" stroke="#E4DFEC"/><rect x="44" y="46" width="44" height="44" rx="12" fill="#5B2D8E"/><path d="M54 80V66a12 12 0 0 1 24 0v14M54 73h24" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/><text x="104" y="66" font-family="Arial" font-size="20" font-weight="700" fill="#1B1726">${title}</text><text x="104" y="86" font-family="Arial" font-size="13" fill="#6B6677">${sub}</text><rect x="44" y="120" width="250" height="10" rx="5" fill="#EEEBF2"/><rect x="44" y="144" width="310" height="10" rx="5" fill="#EEEBF2"/><rect x="44" y="168" width="200" height="10" rx="5" fill="#EEEBF2"/><rect x="44" y="196" width="90" height="18" rx="9" fill="#E6F5EE"/><text x="58" y="209" font-family="Arial" font-size="10" font-weight="700" fill="#1E8E5A">SAMPLE</text></svg>`);
/* Turns an uploaded file into a small data URL so it can be previewed in both apps. */
function fileData(f) {
  return new Promise(res => {
    if (f.type === 'application/pdf') { if (f.size > 400000) return res(null); const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => res(null); r.readAsDataURL(f); return; }
    if (!f.type.startsWith('image/')) return res(null);
    const url = URL.createObjectURL(f), img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || 900, h = img.naturalHeight || 600, k = Math.min(1, 900 / Math.max(w, h)), c = document.createElement('canvas');
      c.width = Math.round(w * k); c.height = Math.round(h * k);
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', .72));
    };
    img.onerror = () => { URL.revokeObjectURL(url); res(null); };
    img.src = url;
  });
}
const isImg = d => typeof d === 'string' && d.startsWith('data:image');
const docView = (name, data) => isImg(data) ? `<div class="dview"><img src="${data}" alt="${esc(name)}"></div>`
  : (typeof data === 'string' && data.startsWith('data:application/pdf')) ? `<div class="dview"><embed src="${data}" type="application/pdf"></div>`
  : `<div class="dview"><div class="ph"><b>${esc(name)}</b>Preview not available for this file</div></div>`;

/* ───────── seed ───────── */
function seedDB() {
  const now = Date.now(), at = d => now - d * DAY;
  const L = [
    ['Handloom saree studio', 'Meera Joshi', 'Meera Looms', 'Fashion & textiles', 'Growing', 'Jaipur', 250000, 'Four new looms and a season of raw silk stock.', 'We weave and sell handloom sarees to boutiques across Rajasthan. Orders now exceed what our two looms can make. More looms let us hire six more weavers from our village.', 'Meera-Looms-deck.pdf'],
    ['Cloud kitchen for home-style tiffins', 'Sunita Rao', 'Ghar Ka Dabba', 'Food & beverage', 'Early revenue', 'Pune', 150000, 'Commercial cooking equipment and a delivery scooter.', 'A home kitchen serving 60 office workers a day with weekly menus. We need a proper setup to reach 200 tiffins and meet licensing norms.', null],
    ['Organic millet snacks', 'Lakshmi Nair', 'Millet Mylk', 'Food & beverage', 'Early revenue', 'Kochi', 300000, 'Packaging machine and first bulk millet purchase.', 'Ready-to-eat millet snacks sold at farmers markets and two stores. Hand packing limits us to 400 packs a week.', 'Millet-Mylk.pdf'],
    ['Neighbourhood beauty studio', 'Farah Khan', 'Glow by Farah', 'Beauty & wellness', 'Early revenue', 'Lucknow', 120000, 'Salon chairs, sterilisation kit and a rented shopfront deposit.', 'Eight years as a home-visit beautician with 300 repeat clients. Moving into a small studio lets me train and employ two apprentices.', null],
    ['Block-print home décor', 'Anjali Shah', 'Chhapa', 'Handicrafts', 'Growing', 'Ahmedabad', 400000, 'Printing tables, natural dyes and an online store build.', 'Block-printed cushions and throws made by a cooperative of 12 artisans. Sales are strong at exhibitions; we want steady online orders.', 'Chhapa-lookbook.pdf'],
    ['Dairy and ghee from desi cows', 'Kavita Patel', 'Gau Dhan Dairy', 'Agri & dairy', 'Early revenue', 'Indore', 350000, 'Six cows, a chilling unit and glass bottle packaging.', 'Direct-to-home milk and ghee for 90 families. A chilling unit and more cows lets us serve 300 homes.', null],
    ['After-school coding for girls', 'Divya Menon', 'Code Didi', 'Education', 'Idea', 'Bengaluru', 80000, 'Twelve laptops and a pilot course for two schools.', 'Weekend coding clubs for girls in grades 6 to 9. Two schools have agreed to host us once we have the devices.', null],
    ['Bookkeeping for small shops', 'Rekha Iyer', 'Khata Simple', 'Tech & services', 'Early revenue', 'Hyderabad', 200000, 'Mobile app development and field sales for 3 months.', 'A Telugu-first bookkeeping service for kirana stores with 45 paying shops. An app would replace the paper ledger I deliver today.', 'Khata-Simple.pdf'],
    ['Upcycled fabric bags', 'Pooja Verma', 'Phir Se', 'Fashion & textiles', 'Idea', 'Delhi', 60000, 'Industrial sewing machine and sample production.', 'Bags made from textile mill offcuts. Prototypes sold out at two pop-ups; I need a machine to take bulk orders.', null],
    ['Women-run general store', 'Savita Deshmukh', 'Saaz Mart', 'Retail', 'Growing', 'Mumbai', 450000, 'Second outlet fit-out and opening stock.', 'Our first store breaks even in month five and employs four women. The second outlet is in a larger housing society nearby.', null],
  ];
  const mk = (id, role, name, city, phone, extra = {}) => {
    const m = { id, role, phone, user: { name, email: name.toLowerCase().replace(/[^a-z]+/g, '.') + '@mail.com', city }, ver: 'verified', reject: '', docs: {}, files: {}, idType: 'PAN', business: {}, areas: [], declaration: '', settings: { push: true, chat: true }, notes: [], active: true, seed: true, t: at(60 + Math.random() * 300 | 0), mem: 0, ...extra };
    const lab = { id: [m.idType + ' card', name], proof: ['Business proof', m.business?.name || name], bdoc: ['Supporting document', m.business?.name || name] };
    Object.keys(m.docs).forEach(k => { if (lab[k]) m.files[k] = sampleDoc(...lab[k]); });
    return m;
  };
  const members = [], listings = [];
  L.forEach((l, i) => {
    members.push(mk('e' + (i + 1), 'ent', l[1], l[5], '98' + String(20000000 + i * 1371733).slice(0, 8), { business: { name: l[2], sector: l[3], stage: l[4], city: l[5], desc: l[8] }, docs: { id: 'pan-card.pdf', proof: 'udyam-certificate.pdf' } }));
    listings.push({ id: 's' + (i + 1), oid: 'e' + (i + 1), title: l[0], owner: l[1], business: l[2], sector: l[3], stage: l[4], city: l[5], amount: l[6], purpose: l[7], desc: l[8], deck: l[9], deckData: l[9] ? sampleDoc('Pitch deck', l[2]) : null, status: 'live', review: 'approved', remark: '', t: at(40 + i * 9), paid: false });
  });
  const pend = [['e11', 'Nisha Gupta', 'Surat', 'Nisha Pickles', 'Food & beverage', 'Idea', 3], ['e12', 'Tara Bose', 'Kolkata', 'Tara Terracotta', 'Handicrafts', 'Early revenue', 1]];
  pend.forEach(p => members.push(mk(p[0], 'ent', p[1], p[2], '9' + (700000000 + members.length * 3211117), { ver: 'pending', business: { name: p[3], sector: p[4], stage: p[5], city: p[2], desc: 'Small family business making and selling local products.' }, docs: { id: 'aadhaar.pdf', proof: 'gst-certificate.pdf' }, t: at(p[6]) })));
  members.push(mk('e13', 'ent', 'Isha Malhotra', 'Chandigarh', '9988123456', { ver: 'rejected', reject: 'The ID photo is unclear. Upload a clear copy and resubmit.', business: { name: 'Isha Knits', sector: 'Fashion & textiles', stage: 'Idea', city: 'Chandigarh', desc: 'Hand-knit winter wear.' }, docs: { id: 'id-blurry.jpg' }, t: at(12) }));
  const INV = [['i1', 'Rohan Mehta', 'Mumbai', ['Food & beverage', 'Retail']], ['i2', 'Aditi Sharma', 'Delhi', ['Fashion & textiles', 'Handicrafts']], ['i3', 'Vikram Rao', 'Bengaluru', ['Education', 'Tech & services']], ['i4', 'Neha Kulkarni', 'Pune', ['Agri & dairy', 'Beauty & wellness']], ['i5', 'Arjun Nair', 'Kochi', ['Food & beverage']]];
  INV.forEach((v, i) => members.push(mk(v[0], 'inv', v[1], v[2], '97' + String(10000000 + i * 2917331).slice(0, 8), { areas: v[3], declaration: 'I want to back first-time women founders with small cheques.', docs: { id: 'pan-card.pdf' }, t: at(30 + i * 40) })));
  members.push(mk('i6', 'inv', 'Karan Bhatia', 'Gurugram', '9811122233', { ver: 'pending', areas: ['Retail', 'Education'], declaration: 'Angel investor interested in retail and education ventures.', docs: { id: 'aadhaar.pdf' }, t: at(2) }));
  listings.push(
    { id: 's11', oid: 'e2', title: 'Cold-pressed oils', owner: 'Sunita Rao', business: 'Ghar Ka Dabba', sector: 'Food & beverage', stage: 'Early revenue', city: 'Pune', amount: 180000, purpose: 'Oil press and bottling line.', desc: 'Wood-pressed groundnut and sesame oil sold to neighbours and two organic stores.', deck: null, status: 'submitted', review: 'pending', remark: '', t: at(1), paid: false },
    { id: 's12', oid: 'e6', title: 'Paneer and curd unit', owner: 'Kavita Patel', business: 'Gau Dhan Dairy', sector: 'Agri & dairy', stage: 'Growing', city: 'Indore', amount: 220000, purpose: 'Small processing unit and cold storage.', desc: 'Value addition from our own milk to serve cafés and hostels.', deck: null, status: 'submitted', review: 'pending', remark: '', t: at(3), paid: false },
    { id: 's13', oid: 'e5', title: 'Dye studio expansion', owner: 'Anjali Shah', business: 'Chhapa', sector: 'Handicrafts', stage: 'Growing', city: 'Ahmedabad', amount: 150000, purpose: 'Natural dye vats and drying space.', desc: 'Dedicated dye studio for our block-print cooperative.', deck: null, status: 'paused', review: 'approved', remark: '', t: at(55), paid: false },
    { id: 's14', oid: 'e3', title: 'Millet cafe pilot', owner: 'Lakshmi Nair', business: 'Millet Mylk', sector: 'Food & beverage', stage: 'Idea', city: 'Kochi', amount: 90000, purpose: 'Counter and kitchen set-up.', desc: 'A tiny millet café near a college.', deck: null, status: 'closed', review: 'approved', remark: '', t: at(120), paid: false });
  const ints = [['n1', 's1', 'i2', 3, 'Strong demand. Would like to understand the weaver economics.', 20], ['n2', 's3', 'i1', 2, 'Interested in the packaging plan.', 14], ['n3', 's5', 'i2', 1, 'Love the product. Can we talk about online plans?', 6], ['n4', 's2', 'i4', 0, 'Could you share unit economics per tiffin?', 1], ['n5', 's8', 'i3', 4, 'Looks promising.', 70], ['n6', 's6', 'i4', 0, 'Interested in the dairy chain.', 2], ['n7', 's10', 'i1', 0, 'Happy to back a second outlet.', 0.3]];
  const interests = ints.map(x => ({ id: x[0], lid: x[1], iid: x[2], note: x[4], stage: x[3], t: at(x[5]), introT: x[3] >= 2 ? at(x[5] - 2) : 0, assignee: x[3] > 0 ? 'Vikas Nair' : '', notes: x[3] > 0 ? [{ by: 'Vikas Nair', text: 'Spoke to the investor. Keen to proceed.', t: at(x[5] - 1) }] : [], log: [{ by: 'System', text: 'Interest received', t: at(x[5]) }].concat(x[3] > 0 ? [{ by: 'Vikas Nair', text: STEP_E[x[3]], t: at(x[5] - 1) }] : []), declined: false, chatOff: false }));
  const chats = {
    n1: [['sys', 'Introduction arranged by Advitta', 19], ['e1', 'Hello Aditi, thanks for your interest in Meera Looms.', 19], ['i2', 'Hi Meera. Could you share how many weavers you have today?', 18.5], ['e1', 'Two weavers now, six after the new looms.', 18]],
    n2: [['sys', 'Introduction arranged by Advitta', 13], ['i1', 'Hello Lakshmi, happy to connect via Advitta.', 12.9]],
    n5: [['sys', 'Introduction arranged by Advitta', 68], ['i3', 'Hi Rekha, I liked the idea.', 67], ['e8', 'Thank you. Happy to walk you through the numbers.', 66.8], ['sys', 'Closed', 40]],
  };
  const C = {}; Object.keys(chats).forEach(k => C[k] = chats[k].map(m => ({ by: m[0], text: m[1], t: at(m[2]), read: true })));
  const tickets = [
    { id: 't1', mid: 'e1', cat: 'Listing', text: 'How do I add more photos to my listing?', status: 'progress', t: at(3), assignee: 'Vikas Nair' },
    { id: 't2', mid: 'i2', cat: 'Introduction', text: 'Can the introduction call be rescheduled?', status: 'open', t: at(1), assignee: '' },
    { id: 't3', mid: 'e5', cat: 'Account', text: 'I need to change my registered city.', status: 'resolved', t: at(25), assignee: 'Vikas Nair' },
  ];
  return {
    v: 3, seq: 100, members, listings, interests, chats: C, tickets, payments: [], broadcasts: [
      { id: 'b1', t: at(9), aud: 'All members', title: 'Welcome to Advitta', text: 'Thanks for joining. Complete your verification to get started.', by: 'Anita Rao' }],
    fee: { model: 'none', membership: 499, listing: 299, connection: 199 },
    cms: {
      about: 'Advitta helps women-led businesses and investors find each other. Every member is verified by our team. When an investor shows interest, an Advitta team member personally makes the introduction.',
      terms: 'By using Advitta you agree to provide accurate information and to keep conversations respectful. Advitta may remove listings or members that break these terms. Final terms are provided by Advitta.',
      privacy: 'We collect the details you provide to verify you and make introductions. Your contact details are shared with another member only after Advitta arranges an introduction. We never sell your data.',
      disclaimer: 'Advitta only facilitates introductions. It does not hold, pool or transfer any money and does not offer investment advice. All discussions, due diligence, agreements and payments happen directly between the entrepreneur and the investor, outside the platform.',
    },
    master: { sectors: ['Food & beverage', 'Fashion & textiles', 'Handicrafts', 'Beauty & wellness', 'Agri & dairy', 'Education', 'Tech & services', 'Retail'], cities: ['Ahmedabad', 'Bengaluru', 'Delhi', 'Hyderabad', 'Indore', 'Jaipur', 'Kochi', 'Lucknow', 'Mumbai', 'Pune'] },
    admins: [
      { id: 'a1', name: 'Anita Rao', email: 'admin@advitta.in', pw: 'Admin@123', role: 'super', modules: MODULES.map(m => m[0]), active: true, status: 'active' },
      { id: 'a2', name: 'Vikas Nair', email: 'staff@advitta.in', pw: 'Staff@123', role: 'sub', modules: ['verification', 'listings', 'interests', 'chats', 'support'], active: true, status: 'active' },
    ],
  };
}

/* ───────── store ───────── */
let DB = null;
function loadDB() {
  try { DB = JSON.parse(localStorage.getItem(DBKEY)); } catch { DB = null; }
  if (!DB || DB.v !== 3) { DB = seedDB(); saveDB(); }
  return DB;
}
function saveDB() { try { localStorage.setItem(DBKEY, JSON.stringify(DB)); } catch { /* storage unavailable */ } }
function resetDB() { try { Object.keys(localStorage).filter(k => k.startsWith('advitta.')).forEach(k => localStorage.removeItem(k)); } catch { /* ignore */ } }
const uid = p => p + (DB.seq++) + Math.random().toString(36).slice(2, 6); /* random tail: tabs and iframes each count seq on their own copy */
loadDB();

/* ───────── queries ───────── */
const member = id => DB.members.find(m => m.id === id);
const listing = id => DB.listings.find(l => l.id === id);
const interest = id => DB.interests.find(i => i.id === id);
const registered = role => DB.members.filter(m => m.user?.name && (!role || m.role === role));
const liveListings = () => DB.listings.filter(l => l.status === 'live');
const invOf = it => member(it.iid)?.user || { name: 'Investor', city: '' };
const ownerId = it => listing(it.lid)?.oid;
const lastAct = it => (it.log[0] || { t: it.t }).t;
const feeModel = () => DB.fee.model;

/* ───────── actions shared by app + admin ───────── */
function notifyMember(mid, title, text, go) {
  const m = member(mid); if (!m) return;
  m.notes.unshift({ id: uid('n'), t: Date.now(), title, text, read: false, go }); saveDB();
}
function logAct(it, text, by = 'Advitta') { it.log.unshift({ by, text, t: Date.now() }); }
function setStage(it, n, by = 'Advitta') {
  it.stage = n; it.declined = false; if (n >= 2 && !it.introT) it.introT = Date.now();
  logAct(it, STEP_E[n], by);
  const l = listing(it.lid), ch = (DB.chats[it.id] ||= []);
  if (n === 2) {
    ch.push({ by: 'sys', text: 'Introduction arranged by Advitta', t: Date.now(), read: true });
    const sd = [member(it.iid), member(l.oid)].find(m => m?.seed);
    if (sd) ch.push({ by: sd.id, text: 'Hello, thanks to Advitta for the introduction. Looking forward to talking.', t: Date.now() + 1, read: false });
  }
  if (n === 4) ch.push({ by: 'sys', text: 'Closed', t: Date.now(), read: true });
  const title = n === 2 ? 'Introduction arranged' : STEP_E[n];
  notifyMember(l.oid, title, l.title, { name: 'conn', p: { id: it.id } });
  notifyMember(it.iid, title, l.title, { name: 'conn', p: { id: it.id } });
  saveDB();
}
function declineInterest(it, by = 'Advitta') {
  it.stage = 4; it.declined = true; logAct(it, 'Declined', by);
  (DB.chats[it.id] ||= []).push({ by: 'sys', text: 'Closed', t: Date.now(), read: true });
  const l = listing(it.lid);
  notifyMember(it.iid, 'Interest closed', l.title, { name: 'conn', p: { id: it.id } });
  notifyMember(l.oid, 'Interest closed', l.title, { name: 'conn', p: { id: it.id } });
  saveDB();
}
function addPayment(mid, kind, amount, ref) {
  const p = { id: 'TXN' + (100000 + DB.seq++ * 7919 % 900000), mid, kind, ref, amount, t: Date.now(), status: 'paid', method: 'UPI', audit: [{ t: Date.now(), text: 'Payment received' }] };
  DB.payments.unshift(p); saveDB(); return p;
}
function csv(rows) { return rows.map(r => r.map(c => '"' + String(c ?? '').replace(/"/g, '""') + '"').join(',')).join('\n'); }
function download(name, text, type = 'text/csv') { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
