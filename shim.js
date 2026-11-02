/* shim.js – rulează aplicația în afara Claude (GitHub Pages + Supabase + cheie API Anthropic).
   În Claude (window.claude există) nu face nimic. */
(function () {
  if (window.claude && window.claude.use) return;
  // Doar pe GitHub Pages, pe calculator (file://) sau pe un domeniu propriu declarat în config.js; în Claude nu face nimic.
  const h = location.hostname;
  const standalone = location.protocol === 'file:' || /github\.io$|^localhost$|^127\.0\.0\.1$/.test(h) || (window.MB_CONFIG && window.MB_CONFIG.host === h);
  if (!standalone) return;
  const LS = 'mb-cfg';
  const cfgGet = () => { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; } };
  const cfgSet = c => { try { localStorage.setItem(LS, JSON.stringify(c)); } catch (e) {} };
  const base = window.MB_CONFIG || {};
  let cfg = { ...base, ...cfgGet() };
  const TABLE = 'memorii_docs';

  /* ---------- ecran de configurare ---------- */
  function rnd(n) { const a = new Uint8Array(n); crypto.getRandomValues(a); return [...a].map(x => 'abcdefghjkmnpqrstuvwxyz23456789'[x % 31]).join(''); }
  function setupScreen(force) {
    return new Promise(resolve => {
      if (!force && cfg.url && cfg.key && cfg.ws) return resolve();
      const d = document.createElement('div');
      d.className = 'mb-setup';
      d.innerHTML = `
<style>.mb-setup{position:fixed;inset:0;z-index:9999;background:rgba(15,18,24,.55);display:flex;align-items:center;justify-content:center;padding:16px;font:14px/1.5 "IBM Plex Sans",Arial,sans-serif}
.mb-setup form{background:#fff;color:#1d2026;border-radius:8px;max-width:560px;width:100%;padding:22px;display:flex;flex-direction:column;gap:10px;max-height:92vh;overflow:auto}
.mb-setup h2{margin:0;font:600 22px/1.2 "Archivo Narrow",Arial,sans-serif}.mb-setup label{font-size:12px;color:#5d6470;display:flex;flex-direction:column;gap:3px}
.mb-setup input{padding:8px;border:1px solid #d8dce3;border-radius:6px;font:inherit}.mb-setup .row{display:flex;gap:8px;flex-wrap:wrap}
.mb-setup button{padding:9px 14px;border-radius:6px;border:1px solid #2c5ba9;background:#2c5ba9;color:#fff;font:inherit;cursor:pointer}.mb-setup button.g{background:#fff;color:#2c5ba9}
.mb-setup p{margin:0;font-size:13px;color:#5d6470}.mb-setup .err{color:#d9402a}</style>
<form>
<h2>Memorii Brisk – configurare</h2>
<p>Se face o singură dată pe fiecare calculator. Datele se salvează în baza Supabase a echipei; codul echipei îl trimiți colegilor.</p>
<label>URL Supabase<input name="url" placeholder="https://xxxx.supabase.co" value="${cfg.url || ''}" ${base.url ? 'readonly' : ''}></label>
<label>Cheia publică (anon) Supabase<input name="key" value="${cfg.key || ''}" ${base.key ? 'readonly' : ''}></label>
<label>Codul echipei<input name="ws" value="${cfg.ws || ''}" placeholder="primești codul de la un coleg"></label>
<div class="row"><button type="button" class="g" data-new>Creez o echipă nouă (cod nou)</button></div>
<label>Cheia API Anthropic (pentru citirea documentelor și a planșelor; opțional)<input name="ai" type="password" value="${cfg.ai || ''}" placeholder="sk-ant-..."></label>
<label>Model Claude<input name="model" value="${cfg.model || 'claude-sonnet-5-5'}"></label>
<p>Cheia API rămâne doar pe acest calculator (în browser). Fără ea, aplicația merge, dar fără „Completează cu Claude” și fără citirea planșelor.</p>
<p class="err" hidden></p>
<div class="row"><button type="submit">Salvez și pornesc</button>${force ? '<button type="button" class="g" data-cancel>Renunț</button>' : ''}</div>
</form>`;
      document.body.append(d);
      const f = d.querySelector('form');
      d.querySelector('[data-new]').onclick = () => { f.ws.value = 'mb-' + rnd(22); };
      const c = d.querySelector('[data-cancel]'); if (c) c.onclick = () => { d.remove(); resolve(false); };
      f.onsubmit = async e => {
        e.preventDefault();
        const n = { url: f.url.value.trim().replace(/\/$/, ''), key: f.key.value.trim(), ws: f.ws.value.trim(), ai: f.ai.value.trim(), model: f.model.value.trim() || 'claude-sonnet-5-5' };
        const er = d.querySelector('.err');
        if (!n.url || !n.key || n.ws.length < 20) { er.hidden = false; er.textContent = 'Completează URL-ul, cheia și un cod de echipă de minimum 20 de caractere.'; return; }
        cfg = { ...base, ...n };
        try { await rest('GET', `?select=id&limit=1`); } catch (x) { er.hidden = false; er.textContent = 'Nu mă pot conecta la Supabase: ' + x.message; return; }
        cfgSet(n); d.remove(); resolve(true);
      };
    });
  }
  window.MB_SETTINGS = async () => { const ok = await setupScreen(true); if (ok) location.reload(); };

  /* ---------- Supabase REST ---------- */
  async function rest(method, query, body) {
    const r = await fetch(`${cfg.url}/rest/v1/${TABLE}${query || ''}`, {
      method,
      headers: { apikey: cfg.key, Authorization: 'Bearer ' + cfg.key, 'x-ws': cfg.ws, 'Content-Type': 'application/json', Prefer: method === 'POST' ? 'resolution=merge-duplicates,return=minimal' : 'return=minimal' },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!r.ok) throw new Error(r.status + ' ' + (await r.text()).slice(0, 200));
    return method === 'GET' ? r.json() : null;
  }
  const enc = encodeURIComponent;
  const split = p => { const s = p.split('/'); return { col: s.slice(0, -1).join('/'), id: s[s.length - 1] }; };
  const snapDoc = (id, data) => ({ id, exists: data != null, data: () => data == null ? undefined : JSON.parse(JSON.stringify(data)), metadata: { fromCache: false, hasPendingWrites: false } });

  const listeners = {}; // col -> [cb]
  async function pull(col) {
    const rows = await rest('GET', `?select=id,data&ws=eq.${enc(cfg.ws)}&col=eq.${enc(col)}&limit=5000`);
    const docs = rows.map(r => snapDoc(r.id, r.data));
    (listeners[col] || []).forEach(cb => { try { cb({ docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: {} }); } catch (e) { console.error(e); } });
  }
  setInterval(() => Object.keys(listeners).forEach(c => pull(c).catch(() => {})), 15000);

  function docRef(path) {
    const { col, id } = split(path);
    return {
      id, path,
      async get() { const r = await rest('GET', `?select=data&ws=eq.${enc(cfg.ws)}&col=eq.${enc(col)}&id=eq.${enc(id)}`); return snapDoc(id, r[0] ? r[0].data : null); },
      async set(data) { await rest('POST', '?on_conflict=ws,col,id', [{ ws: cfg.ws, col, id, data, updated_at: new Date().toISOString() }]); pull(col).catch(() => {}); },
      async update(data) { const s = await this.get(); if (!s.exists) throw { code: 'invalid_argument', message: 'documentul nu există' }; await this.set({ ...s.data(), ...data }); },
      async delete() { await rest('DELETE', `?ws=eq.${enc(cfg.ws)}&col=eq.${enc(col)}&id=eq.${enc(id)}`); pull(col).catch(() => {}); },
      onSnapshot(next) { const t = setInterval(async () => next(await this.get()), 15000); this.get().then(next); return () => clearInterval(t); }
    };
  }
  function query(col, filters) {
    const q = () => filters.map(([f, op, v]) => `&data->>${enc(f)}=eq.${enc(v)}`).join('');
    return {
      where(f, op, v) { return query(col, [...filters, [f, op, v]]); },
      orderBy() { return this; }, limit() { return this; },
      async get() { const rows = await rest('GET', `?select=id,data&ws=eq.${enc(cfg.ws)}&col=eq.${enc(col)}${q()}&limit=5000`); const docs = rows.map(r => snapDoc(r.id, r.data)); return { docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: {} }; },
      onSnapshot(next, err) { (listeners[col] = listeners[col] || []).push(next); pull(col).catch(e => err && err({ code: 'unavailable', message: e.message })); return () => { listeners[col] = listeners[col].filter(x => x !== next); }; },
      doc: id => docRef(col + '/' + (id || ('d' + Date.now().toString(36) + rnd(4)))),
      async add(data) { const r = docRef(col + '/d' + Date.now().toString(36) + rnd(4)); await r.set(data); return r; }
    };
  }
  const db = { doc: docRef, collection: c => query(c, []) };

  /* ---------- descărcări ---------- */
  const downloads = {
    async save({ filename, data }) {
      const blob = data instanceof Blob ? data : new Blob([data]);
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; document.body.append(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
      return { status: 'saved' };
    }
  };

  /* ---------- Claude prin API Anthropic ---------- */
  const b64 = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(blob); });
  async function ask(input, opts = {}) {
    if (!cfg.ai) throw { code: 'not_granted', message: 'Lipsește cheia API Anthropic (Setări).' };
    const content = [];
    for (const im of (opts.images || [])) content.push({ type: 'image', source: { type: 'base64', media_type: im.type || 'image/jpeg', data: await b64(im) } });
    content.push({ type: 'text', text: typeof input === 'string' ? input : input.map(m => m.content).join('\n\n') });
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': cfg.ai, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true', 'content-type': 'application/json' },
      body: JSON.stringify({ model: cfg.model || 'claude-sonnet-5-5', max_tokens: 16000, messages: [{ role: 'user', content }] })
    });
    if (r.status === 429) throw { code: 'rate_limited', message: 'prea multe cereri' };
    if (!r.ok) throw { code: 'unavailable', message: r.status + ' ' + (await r.text()).slice(0, 200) };
    const j = await r.json();
    return { text: (j.content || []).filter(c => c.type === 'text').map(c => c.text).join(''), truncated: j.stop_reason === 'max_tokens' };
  }
  const sample = async (input, opts) => ask(input, opts);
  sample.json = async (input, opts) => {
    const { text } = await ask((typeof input === 'string' ? input : '') + '\n\nRăspunsul tău va fi citit automat: scrie doar JSON valid.', opts);
    const tryP = s => { try { return JSON.parse(s); } catch (e) { return undefined; } };
    let v = tryP(text.trim());
    if (v === undefined) { const m = text.match(/```(?:json)?\s*([\s\S]*?)```/); if (m) v = tryP(m[1]); }
    if (v === undefined) { const a = Math.min(...['{', '['].map(c => text.indexOf(c)).filter(i => i >= 0)); const b = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']')); if (a >= 0 && b > a) v = tryP(text.slice(a, b + 1)); }
    if (v === undefined) throw { code: 'invalid_json', message: 'răspuns fără JSON', text };
    return v;
  };
  sample.limits = async () => ({ maxPromptBytes: 900000, images: { maxCount: 20, maxInputBytes: 5 * 1024 * 1024, mediaTypes: ['image/jpeg', 'image/png'] } });

  const user = { can: async () => true, isOwner: () => true, canEdit: () => true, id: async () => 'local', me: async () => ({ id: 'local', name: '' }) };

  let ready = null;
  window.claude = {
    use: async name => {
      ready = ready || setupScreen(false);
      await ready;
      if (name === 'db') return db;
      if (name === 'downloads') return downloads;
      if (name === 'user') return user;
      if (name === 'sample') return cfg.ai ? sample : null;
      return null;
    }
  };
  window.MB_STANDALONE = true;
})();
