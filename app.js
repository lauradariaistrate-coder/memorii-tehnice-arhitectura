/* UI: proiecte, tab-uri, salvare în db, import cu Claude, generare documente. */
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const h = (tag, attrs = {}, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (k === 'html') e.innerHTML = v; else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
    }
    kids.flat().forEach(c => c != null && e.append(c.nodeType ? c : document.createTextNode(c)));
    return e;
  };
  const L = LIB;
  const BRISK = {};
  const LUNI = ['IANUARIE', 'FEBRUARIE', 'MARTIE', 'APRILIE', 'MAI', 'IUNIE', 'IULIE', 'AUGUST', 'SEPTEMBRIE', 'OCTOMBRIE', 'NOIEMBRIE', 'DECEMBRIE'];

  /* ---------- schema câmpurilor ---------- */
  const opt = arr => arr.map(x => Array.isArray(x) ? x : [x, x]);
  const FN_OPTS = [['', '— alege destinația —'], ...L.F.map(f => [f.id, f.grup + ' · ' + f.label])];
  const TABS = [
    { id: 'gen', t: 'Date generale', groups: [
      { t: 'Identificare', f: [
        ['gen.cod', 'Cod proiect', 'text', 'ex. DEM9076'], ['gen.codBenef', 'Cod proiect beneficiar', 'text'],
        ['gen.denumire', 'Denumirea obiectivului (ca în CU)', 'area'], ['gen.faza', 'Faza curentă', 'select', opt([['CU', 'CU'], ['DTAC', 'DTAC'], ['PTE', 'PT / PTE']])],
        ['gen.data', 'Data documentelor', 'text', 'ex. OCTOMBRIE 2026']] },
      { t: 'Beneficiar', f: [
        ['gen.beneficiar', 'Beneficiar', 'text'], ['gen.beneficiar2', 'Beneficiar (rând 2, opțional)', 'text'], ['gen.benefAdresa', 'Adresa beneficiarului', 'text'],
        ['gen.benefContact', 'Contact beneficiar (tel., e-mail)', 'text'], ['gen.programLucru', 'Profil de activitate și program de lucru', 'text'], ['gen.proprietar', 'Proprietar teren (din CF)', 'text']] },
      { t: 'Proiectanți', f: [
        ['gen.proiectant', 'Proiectant general', 'text'], ['gen.proiectantAdresa', 'Adresa proiectantului', 'text'],
        ['gen.sefProiect', 'Șef proiect / arhitect', 'text', 'ex. arh. Laura Istrate'], ['gen.intocmit', 'Întocmit', 'text'],
        ['gen.specRez', 'Rezistență', 'text'], ['gen.specSan', 'Instalații sanitare / stingere', 'text'], ['gen.specTerm', 'Instalații termice / ventilare', 'text'],
        ['gen.specEl', 'Instalații electrice', 'text'], ['gen.specCs', 'Curenți slabi', 'text'], ['gen.specDesf', 'Desfumare', 'text']] }
    ] },
    { id: 'amp', t: 'Amplasament & urbanism', groups: [
      { t: 'Amplasament', f: [
        ['amp.judet', 'Județ', 'text'], ['amp.uat', 'UAT', 'text'], ['amp.localitate', 'Localitate', 'text'], ['amp.adresa', 'Adresă / parcelă', 'text'],
        ['amp.nrCad', 'Nr. cadastral', 'text'], ['amp.cf', 'Nr. carte funciară', 'text'], ['amp.sTeren', 'Suprafață teren (mp)', 'text'],
        ['amp.intravilan', 'Situare', 'select', opt(['', 'intravilan', 'extravilan'])], ['amp.monument', 'Monument / zonă protejată', 'text', 'nu / da – detalii'],
        ['amp.regimJuridic', 'Regim juridic (CF: proprietar, sarcini, servituți)', 'area'], ['amp.folosinta', 'Folosința actuală', 'text'], ['amp.destinatiePUG', 'Destinația prin PUG/PUZ', 'text']] },
      { t: 'Certificat de urbanism și reglementări', f: [
        ['amp.cuNr', 'CU nr.', 'text'], ['amp.cuData', 'CU din data', 'text'], ['amp.cuEmitent', 'Emis de', 'text'], ['amp.cuScop', 'Scopul CU', 'text', 'construire'],
        ['amp.acNr', 'Autorizație de construire nr. (faza PT)', 'text'],
        ['amp.docUrb', 'Documentații de urbanism (PUG/PUZ, HCL, UTR)', 'area'], ['amp.potMax', 'POT maxim', 'text'], ['amp.cutMax', 'CUT maxim', 'text'],
        ['amp.regimMaxAdm', 'Regim maxim de înălțime', 'text'], ['amp.hMaxAdm', 'H maxim admis', 'text'], ['amp.spVerziMin', 'Spații verzi minime', 'text'],
        ['amp.parcajeNorm', 'Necesar normat de parcaje', 'text'], ['amp.retrageri', 'Retrageri impuse', 'area'],
        ['amp.rlu', 'Tabel RLU (un rând: reglementare | valoare)', 'area']] },
      { t: 'Situația existentă', f: [
        ['amp.teren', 'Descrierea terenului', 'area'], ['amp.vecN', 'Vecin nord', 'text'], ['amp.vecS', 'Vecin sud', 'text'], ['amp.vecE', 'Vecin est', 'text'], ['amp.vecV', 'Vecin vest', 'text'],
        ['amp.circulatii', 'Circulații auto și pietonale', 'area'], ['amp.accesuri', 'Accesuri la teren / din drum public', 'area'], ['amp.utilitati', 'Echipare edilitară existentă', 'area'],
        ['amp.geotehnic', 'Geotehnică și seismicitate', 'area'], ['amp.constrExist', 'Construcții existente', 'text', 'teren liber de construcții'],
        ['amp.scExist', 'Sc existentă (mp)', 'text'], ['amp.sdExist', 'Sd existentă (mp)', 'text'], ['amp.potExist', 'POT existent', 'text'], ['amp.cutExist', 'CUT existent', 'text'], ['amp.regimExist', 'Regim de înălțime existent', 'text']] }
    ] },
    { id: 'c', t: 'Construcție', groups: [
      { t: 'Descriere', f: [
        ['c.functiuniSec', 'Funcțiuni secundare', 'text'], ['c.functiuniConexe', 'Funcțiuni conexe', 'text'],
        ['c.tema', 'Tema / descrierea investiției', 'area'], ['c.lucrari', 'Lucrări propuse (câte una pe rând)', 'area'],
        ['c.existenta', 'Intervenție la construcție existentă', 'select', opt(['', 'nu', 'da'])], ['c.elementePastrate', 'Elemente care se păstrează', 'area']] },
      { t: 'Indicatori', f: [
        ['c.regim', 'Regim de înălțime', 'text', 'ex. S+P+2E'], ['c.hMax', 'H maxim', 'text'], ['c.hCornisa', 'H cornișă / atic', 'text'],
        ['c.sc', 'Sc (mp)', 'text'], ['c.sd', 'Sd (mp)', 'text'], ['c.su', 'Su (mp)', 'text'], ['c.volum', 'Volum (mc)', 'text'],
        ['c.potProp', 'POT propus', 'text'], ['c.cutProp', 'CUT propus', 'text'], ['c.spVerziProp', 'Spații verzi propuse', 'text'], ['c.parcaje', 'Parcaje propuse', 'area']] },
      { t: 'Soluții constructive', f: [
        ['c.structura', 'Sistem structural', 'text'], ['c.fundatii', 'Fundații', 'text'], ['c.inchideri', 'Închideri exterioare', 'area'], ['c.compartimentari', 'Compartimentări', 'area'],
        ['c.acoperis', 'Acoperiș / învelitoare', 'area'], ['c.termo', 'Termoizolații', 'area'], ['c.tamplarieExt', 'Tâmplărie exterioară', 'area'], ['c.tamplarieInt', 'Tâmplărie interioară', 'area'],
        ['c.pardoseli', 'Pardoseli', 'area'], ['c.finisajeInt', 'Finisaje interioare', 'area'], ['c.finisajeExt', 'Finisaje exterioare', 'area'], ['c.balustrade', 'Balustrade', 'area']] },
      { t: 'Exterior, utilități, mediu', f: [
        ['c.peisaj', 'Amenajări exterioare, vegetație, mobilier urban', 'area'], ['c.imprejmuire', 'Împrejmuiri, relații cu vecinătățile', 'area'],
        ['c.utilitatiProp', 'Utilități propuse', 'area'], ['c.deseuri', 'Colectarea deșeurilor', 'area'], ['c.mediu', 'Protecția mediului', 'area'],
        ['c.accesibilizare', 'Accesibilizare (NP 051)', 'area'], ['c.energie', 'Performanță energetică / nZEB', 'area']] }
    ] },
    { id: 'si', t: 'Securitate la incendiu', groups: [
      { t: 'Încadrări', f: [
        ['si.cc', 'Clasa de consecințe (CATUC art. 370)', 'select', opt(['', 'CC1', 'CC2', 'CC3', 'CC4'])], ['si.clasaImp', 'Clasa de importanță (P 100-1)', 'select', opt(['', 'I', 'II', 'III', 'IV'])],
        ['si.nsi', 'Nivel de stabilitate la incendiu', 'select', opt(['', 'I', 'II', 'II(+)', 'III', 'III(+)', 'IV', 'V'])], ['si.hUlt', 'h – cota ultimului nivel folosibil (m)', 'text'],
        ['si.risc', 'Risc de incendiu', 'select', opt(['', 'mic', 'mijlociu', 'mare', 'foarte mare'])], ['si.tipCladire', 'Tipul clădirii', 'text', 'civilă obișnuită, fără săli aglomerate'],
        ['si.supusAviz', 'Se supune avizării ISU (HG 571/2016)', 'select', opt(['', 'da', 'nu'])],
        ['si.compartimente', 'Compartimente (nume | Ac | Ad | volum | regim)', 'area'], ['si.autoevacuare', 'Capacitate de autoevacuare', 'area'], ['si.depozitare', 'Capacități de depozitare', 'area']] },
      { t: 'Propagare și separări', f: [
        ['si.distante', 'Distanțe la vecinătăți (direcție | distanță | descriere)', 'area'], ['si.separari', 'Separări (spațiu | pereți | planșeu | uși | temei)', 'area'],
        ['si.fatada', 'Măsuri fațadă / acoperiș', 'area']] },
      { t: 'Evacuare și intervenție', f: [
        ['si.scari', 'Scări', 'area'], ['si.cai', 'Alcătuirea și geometria căilor de evacuare', 'area'], ['si.nrCaiEvac', 'Număr căi de evacuare / refugii', 'text'],
        ['si.lungimiProp', 'Lungimi de evacuare realizate', 'text'], ['si.dispozitiveUsi', 'Dispozitive la uși', 'area'], ['si.marcare', 'Marcarea căilor de evacuare', 'area'],
        ['si.controlFum', 'Control al fumului (evacuare)', 'area'], ['si.persDizabilitati', 'Persoane care nu se pot evacua singure', 'area'],
        ['si.accesInterventie', 'Acces forțe de intervenție', 'area'], ['si.ascensorPompieri', 'Ascensor de pompieri', 'text', 'Nu este cazul']] },
      { t: 'Instalații', f: [
        ['si.hidrInt', 'Hidranți interiori', 'area'], ['si.hidrExt', 'Hidranți exteriori', 'area'], ['si.sprinkler', 'Sprinklere', 'area'], ['si.alteStingere', 'Alte instalații de stingere', 'area'],
        ['si.detectie', 'Detectare, semnalizare, alarmare', 'area'], ['si.desfumare', 'Desfumare', 'area'], ['si.alimRezerva', 'Alimentare receptoare de securitate', 'area'],
        ['si.ilumSig', 'Iluminat de siguranță', 'area'], ['si.paratrasnet', 'Protecție împotriva trăsnetului', 'area'], ['si.stingatoare', 'Stingătoare (gol = calcul automat)', 'text'],
        ['si.exploatare', 'Măsuri de exploatare', 'area'], ['si.compensatorii', 'Măsuri compensatorii', 'area', 'Nu este cazul']] }
    ] },
    { id: 'pc', t: 'Protecție civilă & opis', groups: [
      { t: 'Adăpost de protecție civilă', f: [
        ['pc.areAdapost', 'Se prevede adăpost', 'select', opt(['', 'da', 'nu'])], ['pc.tip', 'Tip adăpost', 'text'], ['pc.suprafata', 'Suprafață utilă (mp)', 'text'], ['pc.volum', 'Volum (mc)', 'text'],
        ['pc.nrIncaperi', 'Nr. încăperi', 'text'], ['pc.capacitate', 'Capacitate (persoane)', 'text'], ['pc.calcul', 'Calculul capacității / justificare', 'area'],
        ['pc.usa', 'Acces / ușă etanșă', 'area'], ['pc.iesire', 'Ieșire de salvare', 'area'], ['pc.pereti', 'Pereți', 'text'], ['pc.planseu', 'Planșeu', 'text'], ['pc.cabine', 'Cabine WC', 'text']] },
      { t: 'Opis', f: [
        ['opis.cuPagini', 'CU – nr. file', 'text'], ['opis.cfPagini', 'Extras CF – nr. file', 'text'], ['opis.ssiPagini', 'SSI preliminar – nr. file', 'text'], ['opis.pcPagini', 'Memoriu PC – nr. file', 'text'],
        ['opis.piesePlus', 'Alte piese scrise (denumire | nr. | file)', 'area'], ['opis.verificatori', 'Verificatori (specialitate | nume | certificat | referat)', 'area'],
        ['opis.planse', 'Planșe ISU (titlu | cod | format)', 'area'], ['opis.planseePC', 'Planșe PC (titlu | cod | format)', 'area']] }
    ] }
  ];
  const NAV = [
    { id: 'imp', t: '1 · Piese scrise și centralizator' },
    { id: 'pd', t: '2 · Piese desenate' },
    { id: 'lipsa', t: '3 · Date lipsă' },
    { id: 'doc', t: '4 · Documente' },
    { id: 'leg', t: 'Legislație' },
    { id: 'dec', t: 'Decizii' }
  ];
  const FIELD = {};
  TABS.forEach(t => (t.groups || []).forEach(g => (g.f || []).forEach(f => { FIELD[f[0]] = { label: f[1], type: f[2], tab: t.id }; })));

  /* ---------- stare ---------- */
  let db = null, user = null, downloads = null, sample = null, canWrite = true;
  let projects = [];
  let cur = null; let curTab = 'imp';
  let saveTimer = null, saving = false, pendingSave = false;
  const local = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };

  const get = (o, path) => path.split('.').reduce((a, k) => a == null ? a : a[k], o);
  const set = (o, path, val) => { const ks = path.split('.'); let x = o; ks.slice(0, -1).forEach(k => { x[k] = x[k] || {}; x = x[k]; }); x[ks[ks.length - 1]] = val; };
  const has = x => x != null && String(x).trim() !== '';

  function blankProject() {
    const d = new Date();
    return { gen: { ...BRISK, faza: 'DTAC', data: LUNI[d.getMonth()] + ' ' + d.getFullYear() }, amp: { cuScop: 'construire' }, c: {}, si: { ascensorPompieri: 'Nu este cazul', compensatorii: 'Nu este cazul – construcție nouă.' }, niv: [], rooms: [], pc: {}, opis: {}, decizii: [], createdAt: Date.now() };
  }

  /* ---------- persistență ---------- */
  let lastStatus = ['Salvat', 'ok'];
  function status(t, cls) { lastStatus = [t, cls]; const s = $('#saveState'); if (s) { s.textContent = t; s.className = 'save ' + (cls || ''); } }
  function queueSave() {
    if (!cur) return;
    cur.updatedAt = Date.now();
    status('Modificări nesalvate…', 'pending');
    clearTimeout(saveTimer); saveTimer = setTimeout(doSave, 700);
    renderSidebar();
  }
  async function doSave() {
    saveTimer = null;
    if (!cur) return;
    if (!db) { status('Salvare indisponibilă în această vizualizare', 'err'); return; }
    if (saving) { pendingSave = true; return; }
    saving = true;
    const data = JSON.parse(JSON.stringify(cur)); delete data.id;
    try { await db.doc('projects/' + cur.id).set(data); status('Salvat', 'ok'); }
    catch (e) {
      if (e && e.code === 'invalid_argument') { canWrite = false; status('Doar citire – nu ai drept de modificare', 'err'); }
      else status('Eroare la salvare: ' + (e.message || e.code), 'err');
    }
    saving = false;
    if (pendingSave) { pendingSave = false; doSave(); }
  }

  /* ---------- sidebar ---------- */
  function renderSidebar() {
    const list = $('#projList'); list.innerHTML = '';
    const q = ($('#projSearch').value || '').toLowerCase();
    const items = projects.map(p => (cur && p.id === cur.id) ? cur : p)
      .filter(p => !q || JSON.stringify([p.gen && p.gen.cod, p.gen && p.gen.denumire, p.gen && p.gen.beneficiar]).toLowerCase().includes(q))
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    if (!items.length) list.append(h('p', { class: 'empty-side' }, db ? 'Niciun proiect încă. Creează primul proiect cu butonul de mai sus.' : 'Se încarcă proiectele…'));
    items.forEach(p => {
      const F = L.fn(p.c && p.c.functiune);
      const st = p.c && p.c.functiuneStatus === 'decisa' ? 'ok' : (F ? 'prop' : 'none');
      list.append(h('button', { class: 'proj' + (cur && cur.id === p.id ? ' on' : ''), onclick: () => openProject(p.id) },
        h('span', { class: 'proj-top' }, h('span', { class: 'code' }, (p.gen && p.gen.cod) || 'fără cod'), h('span', { class: 'chip' }, (p.gen && p.gen.faza) || '–')),
        h('span', { class: 'proj-name' }, (p.gen && p.gen.denumire) || 'Proiect nou, fără denumire'),
        h('span', { class: 'proj-fn' }, h('i', { class: 'dot ' + st }), F ? F.label : 'destinație nestabilită')));
    });
  }

  async function newProject() {
    if (!db) { toast('Baza de date nu este disponibilă în această vizualizare.'); return; }
    const id = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    cur = { id, ...blankProject(), updatedAt: Date.now() };
    projects.push(cur); curTab = 'imp';
    renderAll(); doSave();
  }
  function openProject(id) {
    const p = projects.find(x => x.id === id); if (!p) return;
    cur = JSON.parse(JSON.stringify(p)); cur.id = id;
    ['gen', 'amp', 'c', 'si', 'pc', 'opis'].forEach(k => cur[k] = cur[k] || {}); cur.niv = cur.niv || []; cur.rooms = cur.rooms || []; cur.decizii = cur.decizii || [];
    local.set('lastProject', id);
    cur.auto = cur.auto || {};
    if (sourcesFor !== id) { sourcesFor = null; importDocs = []; }
    renderAll();
  }

  /* ---------- main ---------- */
  function renderAll() { renderSidebar(); renderMain(); }
  function renderMain() {
    const m = $('#main'); m.innerHTML = '';
    if (!cur) {
      m.append(h('div', { class: 'welcome' },
        h('h2', {}, 'Memorii și scenarii de securitate la incendiu'),
        h('p', {}, 'Fiecare proiect are o fișă cu datele lui. Din fișă se generează memoriile (CU, DTAC, PT), scenariile de securitate la incendiu (preliminar și pentru autorizare), documentația de protecție civilă și programele de execuție'),
        h('ol', {}, h('li', {}, 'Încarci documentele proiectului (CU, extras CF, scenariu, expertiză, memorii). Claude face centralizatorul datelor: urbanism, bilanț, construcție, securitate la incendiu.'), h('li', {}, 'În „Date lipsă” completezi doar ce cer memoriile și nu s-a găsit în documente.'), h('li', {}, 'Descarci memoriile .docx din „Documente”.')),
        h('button', { class: 'btn primary', onclick: newProject }, 'Proiect nou')));
      return;
    }
    const F = L.fn(cur.c.functiune);
    m.append(h('header', { class: 'phead' },
      h('div', { class: 'ph-l' },
        h('div', { class: 'ph-code' }, h('span', { class: 'code big' }, cur.gen.cod || 'fără cod'), h('span', { class: 'chip' }, cur.gen.faza || '–'),
          h('span', { class: 'chip fn ' + (cur.c.functiuneStatus === 'decisa' ? 'ok' : 'warn') }, F ? (cur.c.functiuneStatus === 'decisa' ? 'Destinație decisă: ' : 'Destinație propusă: ') + F.label : 'Destinație nestabilită')),
        h('h1', { title: cur.gen.denumire || '' }, cur.gen.denumire || 'Proiect nou')),
      h('div', { class: 'ph-r' }, h('span', { id: 'saveState', class: 'save ' + lastStatus[1] }, lastStatus[0]))));
    const tabs = h('nav', { class: 'tabs', role: 'tablist' });
    if (!NAV.find(n => n.id === curTab)) curTab = 'imp';
    const nMiss = missingAll().items.length;
    NAV.forEach(t => {
      tabs.append(h('button', { role: 'tab', class: 'tab' + (t.id === curTab ? ' on' : ''), 'aria-selected': t.id === curTab ? 'true' : 'false', onclick: () => { curTab = t.id; local.set('tab', t.id); renderMain(); } },
        t.t, t.id === 'lipsa' ? h('span', { class: 'pct' + (nMiss ? ' warnb' : ' full') }, String(nMiss)) : null));
    });
    m.append(tabs);
    const body = h('section', { class: 'tabbody' });
    m.append(body);
    CUSTOM[curTab](body);
    loadSources();
  }
  function tabFill(t) {
    if (!t.groups) return null;
    const fs = t.groups.flatMap(g => g.f || []); if (!fs.length) return null;
    return Math.round(100 * fs.filter(f => has(get(cur, f[0]))).length / fs.length);
  }
  function group(g) {
    const box = h('fieldset', { class: 'grp' }, h('legend', {}, g.t));
    const grid = h('div', { class: 'grid' });
    g.f.forEach(f => grid.append(field(f)));
    box.append(grid); return box;
  }
  function field([path, label, type, extra]) {
    const id = 'f_' + path.replace(/\./g, '_');
    const val = get(cur, path) ?? '';
    let input;
    const onch = e => { set(cur, path, e.target.value); queueSave(); e.target.closest('.fld').classList.toggle('filled', has(e.target.value)); };
    if (type === 'select') {
      input = h('select', { id, onchange: onch }, ...extra.map(([v, t]) => h('option', { value: v, selected: v === val }, t)));
    } else if (type === 'area') {
      input = h('textarea', { id, rows: 3, placeholder: extra || '', oninput: onch }); input.value = val;
      input.addEventListener('input', () => autosize(input)); setTimeout(() => autosize(input));
    } else { input = h('input', { id, type: 'text', placeholder: extra || '', oninput: onch }); input.value = val; }
    if (!canWrite) input.disabled = true;
    const auto = cur.auto && cur.auto[path];
    if (auto) input.addEventListener('input', () => { delete cur.auto[path]; }, { once: true });
    return h('div', { class: 'fld ' + (type === 'area' ? 'wide ' : '') + (has(val) ? 'filled' : '') }, h('label', { for: id }, label, auto ? h('span', { class: 'auto', title: 'Completat de Claude din: ' + auto }, 'C') : null), input);
  }
  function autosize(t) { t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight + 2, 420) + 'px'; }

  /* ---------- tab-uri speciale ---------- */
  const CUSTOM = {
    destinatie(wrap) {
      const box = h('fieldset', { class: 'grp dest' }, h('legend', {}, 'Destinația clădirii'));
      const F = L.fn(cur.c.functiune);
      const sel = h('select', { id: 'f_c_functiune', onchange: e => { cur.c.functiune = e.target.value; cur.c.functiuneStatus = e.target.value ? 'propusa' : ''; queueSave(); renderMain(); } },
        ...FN_OPTS.map(([v, t]) => h('option', { value: v, selected: v === (cur.c.functiune || '') }, t)));
      const decided = cur.c.functiuneStatus === 'decisa';
      box.append(h('div', { class: 'dest-row' },
        h('div', { class: 'fld' }, h('label', { for: 'f_c_functiune' }, 'Destinația principală'), sel),
        h('div', { class: 'dest-state' },
          decided ? h('span', { class: 'chip fn ok' }, 'Decisă' + (cur.c.functiuneData ? ' la ' + cur.c.functiuneData : ''))
            : (F ? h('button', { class: 'btn primary', onclick: approveFn }, 'Aprob destinația') : h('span', { class: 'muted' }, 'Alege destinația sau cere o propunere în „Import cu Claude”.')),
          decided ? h('button', { class: 'btn ghost', onclick: () => { cur.c.functiuneStatus = 'propusa'; queueSave(); renderMain(); } }, 'Redeschide') : null)));
      if (cur.c.functiuneMotiv) box.append(h('p', { class: 'motiv' }, h('b', {}, 'Motivare: '), cur.c.functiuneMotiv));
      if (F) box.append(fnCard(F));
      wrap.append(box); return wrap;
    },
    niveluri(body) {
      const box = h('fieldset', { class: 'grp' }, h('legend', {}, 'Niveluri (utilizatori și fluxuri de evacuare)'));
      const cols = [['nume', 'Nivel'], ['functiuni', 'Funcțiuni'], ['sc', 'Sc (mp)'], ['su', 'Su (mp)'], ['h', 'H nivel (m)'], ['angajati', 'Angajați'], ['vizitatori', 'Vizitatori']];
      box.append(editTable(cur.niv, cols, () => ({ nume: '' })));
      const U = TPL.utilizatori(cur);
      if (U.total) box.append(h('p', { class: 'calc' }, 'Total utilizatori: ', h('b', {}, String(U.total)), (L.fn(cur.c.functiune) || {}).uf ? ` · Uf = ${L.fn(cur.c.functiune).uf}` : ''));
      body.append(box);
      const rb = h('fieldset', { class: 'grp' }, h('legend', {}, 'Încăperi'));
      rb.append(h('p', { class: 'muted' }, 'Lipește rânduri din Excel sau din tabelul de încăperi Revit, în ordinea coloanelor: cod, denumire, nivel, Su, pardoseală, pereți, tavan, înălțime liberă, q (MJ/m², opțional).'));
      const ta = h('textarea', { id: 'pasteRooms', rows: 4, placeholder: 'S01\tGARAJ\tSUBSOL\t161\tșapă elicopterizată\tvopsea lavabilă\t–\t3,15' });
      rb.append(ta, h('div', { class: 'row' },
        h('button', { class: 'btn', onclick: () => { const add = parseRooms(ta.value); cur.rooms.push(...add); ta.value = ''; queueSave(); renderMain(); toast(add.length + ' încăperi adăugate'); } }, 'Adaugă încăperile lipite'),
        h('button', { class: 'btn ghost', onclick: () => { if (rb.dataset.confirm === '1') { cur.rooms = []; queueSave(); renderMain(); } else { rb.dataset.confirm = '1'; toast('Apasă din nou pentru a goli lista de încăperi'); } } }, 'Golește lista')));
      rb.append(editTable(cur.rooms, [['cod', 'Cod'], ['nume', 'Denumire'], ['nivel', 'Nivel'], ['su', 'Su'], ['pard', 'Pardoseală'], ['pereti', 'Pereți'], ['tavan', 'Tavan'], ['h', 'H'], ['q', 'q MJ/m²']], () => ({})));
      body.append(rb);
    },
    imp(body) { renderImport(body); centralizator(body); },
    lipsa: renderLipsa,
    pd: renderDrawings,
    doc: renderDocs,
    leg: renderLeg,
    dec(body) {
      const box = h('fieldset', { class: 'grp' }, h('legend', {}, 'Decizii luate în proiect'));
      const ta = h('textarea', { id: 'newDec', rows: 2, placeholder: 'ex. Securitatea la incendiu se justifică pe P118/1-2025; scările nu continuă la subsol.' });
      box.append(ta, h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: () => { if (!ta.value.trim()) return; cur.decizii.unshift({ data: new Date().toLocaleDateString('ro-RO'), text: ta.value.trim() }); queueSave(); renderMain(); } }, 'Adaugă decizia')));
      const ul = h('ul', { class: 'dec' });
      (cur.decizii || []).forEach((d, i) => ul.append(h('li', {}, h('time', {}, d.data), h('span', {}, d.text), h('button', { class: 'x', 'aria-label': 'Șterge decizia', onclick: () => { cur.decizii.splice(i, 1); queueSave(); renderMain(); } }, '×'))));
      if (!cur.decizii.length) ul.append(h('li', { class: 'muted' }, 'Nicio decizie notată încă.'));
      box.append(ul); body.append(box);
    }
  };

  function approveFn() {
    cur.c.functiuneStatus = 'decisa'; cur.c.functiuneData = new Date().toLocaleDateString('ro-RO');
    const F = L.fn(cur.c.functiune);
    cur.decizii.unshift({ data: cur.c.functiuneData, text: 'Destinația aprobată: ' + F.label + ' (P 118/1-2025, ' + (F.sec.length > 2 ? 'cap. ' + F.sec : F.secTitlu) + ').' });
    queueSave(); renderMain(); toast('Destinația este decisă');
  }

  function fnCard(F) {
    const nsi = (cur.si.nsi || '').replace('(+)', '');
    const rows = [
      ['P 118/1-2025', (F.sec.length > 2 ? 'Secțiunea ' + F.sec + ' – ' : '') + F.secTitlu],
      F.tUtil && ['Număr de utilizatori', F.tUtil], F.uf && ['Uf (utilizatori/flux)', F.uf + ' – ' + F.ufRef],
      F.tLung && ['Lungimi de evacuare', F.tLung + (F.lung && nsi && F.lung[nsi] ? ` → nivel ${cur.si.nsi}: ${F.lung[nsi][0]} m / ${F.lung[nsi][1]} m` : '')],
      F.tScari && ['Case de scări / coridoare', F.tScari + ' / ' + F.tCoridoare],
      F.acces && ['Acces autospeciale', 'art. ' + F.acces.art + ' – ' + F.acces.txt],
      F.legi.length && ['Acte specifice', F.legi.map(id => L.LEGI[id].split(' – ')[0].split(' pentru ')[0].split(' privind ')[0]).join('; ')],
      F.nota && ['Atenție', F.nota]
    ].filter(Boolean);
    return h('dl', { class: 'fncard' }, ...rows.flatMap(([k, v]) => [h('dt', {}, k), h('dd', {}, String(v))]));
  }

  function editTable(arr, cols, mk) {
    const wrap = h('div', { class: 'tblwrap' });
    const t = h('table', { class: 'edit' });
    t.append(h('thead', {}, h('tr', {}, ...cols.map(c => h('th', {}, c[1])), h('th', {}, ''))));
    const tb = h('tbody');
    arr.forEach((row, i) => tb.append(h('tr', {}, ...cols.map(([k]) => {
      const inp = h('input', { type: 'text', 'aria-label': k, value: row[k] || '', oninput: e => { row[k] = e.target.value; queueSave(); } });
      return h('td', {}, inp);
    }), h('td', {}, h('button', { class: 'x', 'aria-label': 'Șterge rândul', onclick: () => { arr.splice(i, 1); queueSave(); renderMain(); } }, '×')))));
    t.append(tb); wrap.append(t);
    wrap.append(h('button', { class: 'btn ghost sm', onclick: () => { arr.push(mk()); queueSave(); renderMain(); } }, '+ Rând'));
    return wrap;
  }
  function parseRooms(txt) {
    return txt.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
      const c = l.split(/\t|;|\|/).map(s => s.trim());
      return { cod: c[0], nume: c[1], nivel: c[2], su: (c[3] || '').replace(/\s*m²|\s*mp/, ''), pard: c[4], pereti: c[5], tavan: c[6], h: c[7], q: c[8] };
    });
  }

  /* ---------- Centralizator ---------- */
  function cell(path, ph) {
    const v = get(cur, path) ?? '';
    const t = h('textarea', { class: 'cellin', rows: 1, 'aria-label': (FIELD[path] || {}).label || path, placeholder: ph || '—', oninput: e => { set(cur, path, e.target.value); if (cur.auto) delete cur.auto[path]; queueSave(); autosize(e.target); } });
    t.value = v; if (!canWrite) t.disabled = true; setTimeout(() => autosize(t));
    return t;
  }
  function srcBadge(path) {
    const a = cur.auto && cur.auto[path];
    return a ? h('span', { class: 'auto', title: 'Din: ' + a }, 'C') : null;
  }
  function selCell(path) {
    const f = TABS.flatMap(t => t.groups || []).flatMap(g => g.f || []).find(x => x[0] === path);
    const val = get(cur, path) ?? '';
    const sel = h('select', { class: 'cellin', 'aria-label': f[1], onchange: e => { set(cur, path, e.target.value); if (cur.auto) delete cur.auto[path]; queueSave(); } }, ...f[3].map(([v, t]) => h('option', { value: v, selected: v === val }, t || '—')));
    if (!canWrite) sel.disabled = true;
    return sel;
  }
  function centralizator(body) {
    const wrap = h('div', { class: 'central' });
    wrap.append(h('h2', { class: 'sech' }, 'Centralizatorul datelor proiectului'));
    if (!Object.keys(cur.auto || {}).length && !importDocs.length) wrap.append(h('p', { class: 'muted' }, 'După import, aici apar datele găsite în documente. Le poți corecta direct în tabel; „C” arată că valoarea vine din documente.'));
    CUSTOM.destinatie(wrap);
    // bilanț
    const B = [
      ['Suprafață teren (mp)', 'amp.sTeren', 'amp.sTeren', null],
      ['Suprafață construită Sc (mp)', 'amp.scExist', 'c.sc', null],
      ['Suprafață desfășurată Sd (mp)', 'amp.sdExist', 'c.sd', null],
      ['P.O.T.', 'amp.potExist', 'c.potProp', 'amp.potMax'],
      ['C.U.T.', 'amp.cutExist', 'c.cutProp', 'amp.cutMax'],
      ['Regim de înălțime', 'amp.regimExist', 'c.regim', 'amp.regimMaxAdm'],
      ['Înălțime maximă', null, 'c.hMax', 'amp.hMaxAdm'],
      ['Spații verzi', null, 'c.spVerziProp', 'amp.spVerziMin']
    ];
    const tb = h('tbody');
    B.forEach(([l, e, p, m]) => tb.append(h('tr', {}, h('th', { scope: 'row' }, l),
      ...[e, p, m].map(k => h('td', {}, k ? h('div', { class: 'cellw' }, cell(k), srcBadge(k)) : h('span', { class: 'muted' }, '–'))))));
    wrap.append(h('section', { class: 'sheet' }, h('h3', {}, 'Bilanț teritorial'),
      h('div', { class: 'tblwrap' }, h('table', { class: 'bilant' }, h('thead', {}, h('tr', {}, h('th', {}, ''), h('th', {}, 'Existent'), h('th', {}, 'Propus'), h('th', {}, 'Maxim admis'))), tb))));
    const inBilant = new Set(B.flatMap(r => r.slice(1)).filter(Boolean));
    // secțiuni
    TABS.forEach(t => t.groups.forEach(g => {
      const rows = (g.f || []).filter(f => !inBilant.has(f[0]));
      if (!rows.length) return;
      const full = rows.filter(f => has(get(cur, f[0]))), empty = rows.filter(f => !has(get(cur, f[0])));
      const sec = h('section', { class: 'sheet' }, h('h3', {}, t.t + ' · ' + g.t, h('span', { class: 'cnt' }, full.length + ' / ' + rows.length)));
      const dl = h('div', { class: 'rows' });
      const row = f => h('div', { class: 'r' }, h('div', { class: 'k' }, f[1], srcBadge(f[0])), h('div', { class: 'v' }, f[2] === 'select' ? selCell(f[0]) : cell(f[0], f[3] && typeof f[3] === 'string' ? f[3] : '')));
      full.forEach(f => dl.append(row(f)));
      sec.append(dl);
      if (empty.length) {
        const d = h('details', { class: 'emptyrows' }, h('summary', {}, empty.length + ' câmpuri goale'));
        const dl2 = h('div', { class: 'rows' }); empty.forEach(f => dl2.append(row(f))); d.append(dl2); sec.append(d);
      }
      wrap.append(sec);
    }));
    // niveluri
    const nv = h('section', { class: 'sheet' }, h('h3', {}, 'Niveluri și utilizatori'));
    nv.append(editTable(cur.niv, [['nume', 'Nivel'], ['functiuni', 'Funcțiuni'], ['sc', 'Sc (mp)'], ['su', 'Su (mp)'], ['h', 'H nivel (m)'], ['angajati', 'Angajați'], ['vizitatori', 'Vizitatori']], () => ({ nume: '' })));
    const U = TPL.utilizatori(cur);
    if (U.total) nv.append(h('p', { class: 'calc' }, 'Total utilizatori: ', h('b', {}, String(U.total)), (L.fn(cur.c.functiune) || {}).uf ? ` · Uf = ${L.fn(cur.c.functiune).uf}` : ''));
    wrap.append(nv);
    const rb = h('details', { class: 'sheet' }, h('summary', {}, h('h3', { style: 'display:inline' }, 'Încăperi (' + cur.rooms.length + ')')));
    rb.append(h('p', { class: 'muted' }, 'Lipește rânduri din Excel sau Revit: cod, denumire, nivel, Su, pardoseală, pereți, tavan, înălțime liberă, q (MJ/m², opțional).'));
    const ta = h('textarea', { id: 'pasteRooms', rows: 3 });
    rb.append(ta, h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => { const add = parseRooms(ta.value); cur.rooms.push(...add); ta.value = ''; queueSave(); renderMain(); toast(add.length + ' încăperi adăugate'); } }, 'Adaugă încăperile lipite')));
    rb.append(editTable(cur.rooms, [['cod', 'Cod'], ['nume', 'Denumire'], ['nivel', 'Nivel'], ['su', 'Su'], ['pard', 'Pardoseală'], ['pereti', 'Pereți'], ['tavan', 'Tavan'], ['h', 'H'], ['q', 'q MJ/m²']], () => ({})));
    wrap.append(rb);
    body.append(wrap);
  }

  /* ---------- Date lipsă ---------- */
  const SENT = /§([a-z]+\.[A-Za-z0-9]+)§/g;
  const TPL_NEED = { FAZE: ['FAZA', 'DENUMIRE', 'BENEFICIAR', 'ADRESA', 'ELABORATOR'], URM: ['FAZA', 'DENUMIRE', 'BENEFICIAR', 'ADRESA', 'ELABORATOR', 'SCOP'], CS_ARH: ['FAZA', 'DENUMIRE', 'BENEFICIAR', 'ADRESA', 'COD', 'DATA', 'SEF_PROIECT', 'CC', 'CLASA_IMP', 'NSI', 'RISC', 'REGIM'] };
  function missingFor(docId, probe) {
    const out = new Set(); let txt = '';
    try {
      if (TPL[docId]) txt = TPL[docId](probe).body;
      else { const t = TPL.tokens(probe); txt = (TPL_NEED[docId] || []).map(k => t[k] || '').join(' '); }
    } catch (e) { return out; }
    let m; SENT.lastIndex = 0;
    while ((m = SENT.exec(txt))) if (FIELD[m[1]]) out.add(m[1]);
    return out;
  }
  function selectedDocs() {
    if (!cur.docsSel || !cur.docsSel.length) return L.DOCS.filter(d => d.faza === (cur.gen.faza || 'DTAC')).map(d => d.id);
    return cur.docsSel;
  }
  function missingAll() {
    if (!cur) return { items: [] };
    const probe = JSON.parse(JSON.stringify(cur));
    Object.keys(FIELD).forEach(k => { if (!has(get(probe, k))) set(probe, k, '§' + k + '§'); });
    const map = {};
    selectedDocs().forEach(id => missingFor(id, probe).forEach(k => { (map[k] = map[k] || []).push(id); }));
    const items = Object.keys(map).map(k => ({ k, docs: map[k] }));
    const extra = [];
    if (!cur.c.functiune || cur.c.functiuneStatus !== 'decisa') extra.push('destinatie');
    if (!cur.niv.length && selectedDocs().some(id => /SSI|PC_MEM/.test(id))) extra.push('niveluri');
    return { items, extra };
  }
  function renderLipsa(body) {
    const box = h('div', { class: 'central' });
    box.append(h('h2', { class: 'sech' }, 'Date lipsă pentru memorii'));
    // selecția documentelor
    const sel = new Set(selectedDocs());
    const chips = h('div', { class: 'docchips' }, h('span', { class: 'muted' }, 'Pentru documentele:'));
    L.DOCS.forEach(d => chips.append(h('label', { class: 'dchip' + (sel.has(d.id) ? ' on' : '') }, h('input', { type: 'checkbox', checked: sel.has(d.id), onchange: e => { const s2 = new Set(selectedDocs()); e.target.checked ? s2.add(d.id) : s2.delete(d.id); cur.docsSel = [...s2]; queueSave(); renderMain(); } }), shortDoc(d))));
    box.append(chips);
    const M = missingAll();
    if (M.extra.includes('destinatie')) box.append(h('div', { class: 'banner warn' }, 'Destinația clădirii nu este decisă. ', h('button', { class: 'btn sm', onclick: () => { curTab = 'imp'; renderMain(); } }, 'Stabilește destinația')));
    if (M.extra.includes('niveluri')) box.append(h('div', { class: 'banner warn' }, 'Lipsesc nivelurile cu numărul de utilizatori (necesare pentru fluxurile de evacuare din SSI). ', h('button', { class: 'btn sm', onclick: () => { curTab = 'imp'; renderMain(); setTimeout(() => { const t = $('.sheet .edit'); t && t.scrollIntoView({ block: 'center' }); }, 50); } }, 'Completează nivelurile')));
    if (!M.items.length) { box.append(h('p', { class: 'okmsg' }, 'Nu lipsește nimic pentru documentele selectate.')); body.append(box); return; }
    box.append(h('p', { class: 'muted' }, M.items.length + ' date de completat. Ce scrii aici se salvează direct în centralizator. Dacă un câmp rămâne gol, apare în memoriu marcat cu galben.'));
    TABS.forEach(t => t.groups.forEach(g => {
      const rows = (g.f || []).filter(f => M.items.find(i => i.k === f[0]));
      if (!rows.length) return;
      const sec = h('section', { class: 'sheet' }, h('h3', {}, t.t + ' · ' + g.t, h('span', { class: 'cnt' }, String(rows.length))));
      const dl = h('div', { class: 'rows' });
      rows.forEach(f => {
        const it = M.items.find(i => i.k === f[0]);
        dl.append(h('div', { class: 'r' }, h('div', { class: 'k' }, f[1], h('span', { class: 'needs' }, it.docs.map(id => shortDoc(L.DOCS.find(d => d.id === id))).join(' · '))),
          h('div', { class: 'v' }, f[2] === 'select' ? selCell(f[0]) : cell(f[0], typeof f[3] === 'string' ? f[3] : 'de completat'))));
      });
      sec.append(dl); box.append(sec);
    }));
    body.append(box);
  }
  function shortDoc(d) {
    return { CU: 'Memoriu CU', DTAC_ARH: 'Memoriu DTAC', SSI_PRE: 'SSI preliminar', OPIS_ISU: 'Opis ISU', PC_MEM: 'Memoriu PC', OPIS_PC: 'Opis PC', PTE_ARH: 'Memoriu PT', SSI_AUT: 'SSI autorizare', FAZE: 'Faze determinante', URM: 'Urmărire în timp', CS_ARH: 'Caiet de sarcini' }[d.id] || d.titlu;
  }

  /* ---------- Documente ---------- */
  function renderDocs(body) {
    const F = L.fn(cur.c.functiune);
    if (!F || cur.c.functiuneStatus !== 'decisa') body.append(h('div', { class: 'banner warn' }, F ? 'Destinația este doar propusă. Documentele se pot genera, dar aprobă destinația în tab-ul „Construcție” înainte de predare.' : 'Alege și aprobă destinația clădirii în tab-ul „Construcție”: de ea depind articolele din P 118/1-2025 și legislația citată.'));
    if (!downloads) body.append(h('div', { class: 'banner' }, 'Descărcarea fișierelor nu este disponibilă în această vizualizare. Deschide pagina în claude.ai.'));
    body.append(h('p', { class: 'muted' }, 'Câmpurile necompletate apar în document marcate cu galben, ca „[de completat: …]”. Le poți completa aici și regenera, sau direct în Word.'));
    const groups = {};
    L.DOCS.forEach(d => (groups[d.grup] = groups[d.grup] || []).push(d));
    Object.entries(groups).forEach(([g, ds]) => {
      const sec = h('div', { class: 'docgrp' }, h('h3', {}, g));
      const grid = h('div', { class: 'docs' });
      ds.forEach(d => {
        let miss = [];
        try { miss = TPL.lipsuri(d.id, cur); } catch (e) { miss = ['eroare: ' + e.message]; }
        const card = h('article', { class: 'doc' + (d.faza === cur.gen.faza ? ' cur' : '') },
          h('div', { class: 'doc-top' }, h('span', { class: 'chip' }, d.faza), h('span', { class: 'miss ' + (miss.length ? 'warn' : 'ok') }, miss.length ? miss.length + ' câmpuri lipsă' : 'complet')),
          h('h4', {}, d.titlu),
          miss.length ? h('details', {}, h('summary', {}, 'Ce lipsește'), h('p', { class: 'misslist' }, miss.join(' · '))) : null,
          h('button', { class: 'btn primary', disabled: !downloads, onclick: e => gen(d, e.target) }, 'Descarcă .docx'));
        grid.append(card);
      });
      sec.append(grid); body.append(sec);
    });
  }
  async function gen(d, btn) {
    const old = btn.textContent; btn.disabled = true; btn.textContent = 'Se generează…';
    try {
      let blob, fname;
      const base = [cur.gen.cod || 'PROIECT', d.id].join('_');
      if (d.kind === 'gen') {
        const r = TPL[d.id](cur);
        blob = await DOCX.build(r.body, r.footer.replace(/⟦[^⟧]*⟧/g, '…'), r.title + ' – ' + (cur.gen.denumire || ''), cur.gen.proiectant || '');
      } else {
        const t = TPL.tokens(cur);
        blob = await DOCX.fromTemplate(d.file, t, `${cur.gen.cod || ''} | ${d.titlu}`, cur.gen.proiectant || '');
      }
      fname = base.replace(/[^\w.-]+/g, '_') + '.docx';
      await downloads.save({ filename: fname, data: blob });
      toast('Salvat: ' + fname);
    } catch (e) {
      if (e && e.code === 'declined') toast('Descărcare anulată');
      else if (e && e.code === 'rate_limited') toast('Există deja o descărcare în așteptare');
      else toast('Nu am putut genera documentul: ' + (e.message || e.code));
    }
    btn.disabled = false; btn.textContent = old;
  }

  /* ---------- Legislație ---------- */
  let P118 = null;
  async function renderLeg(body) {
    const F = L.fn(cur.c.functiune);
    const box = h('fieldset', { class: 'grp' }, h('legend', {}, 'Legislație citată'));
    const ids = [...new Set([...L.COMUNE.DTAC, ...(F ? F.legi : [])])];
    box.append(h('ul', { class: 'legi' }, ...ids.map(id => h('li', { class: F && F.legi.includes(id) ? 'spec' : '' }, L.LEGI[id]))));
    box.append(h('p', { class: 'muted' }, F ? 'Rândurile evidențiate sunt specifice destinației „' + F.label + '”.' : 'Alege destinația ca să vezi actele specifice.'));
    body.append(box);
    const ab = h('fieldset', { class: 'grp' }, h('legend', {}, 'Articole P 118/1-2025'));
    const q = h('input', { type: 'search', id: 'artSearch', placeholder: 'Caută în articole (ex. lungimi de evacuare, 2.5.14, open space)' });
    const res = h('div', { class: 'arts' }, h('p', { class: 'muted' }, 'Se încarcă indexul articolelor…'));
    ab.append(q, res); body.append(ab);
    try { if (!P118) P118 = await (await fetch('files/p118.json')).json(); } catch (e) { res.innerHTML = ''; res.append(h('p', {}, 'Indexul nu s-a putut încărca.')); return; }
    const show = () => {
      const s = q.value.trim().toLowerCase();
      let list;
      if (s) list = P118.filter(a => a.a.startsWith(s) || a.t.toLowerCase().includes(s)).slice(0, 60);
      else list = F ? P118.filter(a => a.a === F.sec || a.a.startsWith(F.sec + '.') || (F.acces && a.a === F.acces.art)) : P118.slice(0, 20);
      res.innerHTML = '';
      if (!list.length) res.append(h('p', { class: 'muted' }, 'Niciun articol găsit.'));
      list.forEach(a => res.append(h('div', { class: 'art' }, h('span', { class: 'artn' }, 'Art. ' + a.a), h('p', {}, a.t + (a.t.length >= 600 ? ' …' : '')))));
    };
    q.addEventListener('input', show); show();
  }

  /* ---------- Import cu Claude ---------- */
  // Textele documentelor se păstrează în db (colecția sources), ca să poată fi refolosite la orice tab.
  let importDocs = [];          // documentele proiectului curent: {id, name, text, err}
  let sourcesFor = null;        // id-ul proiectului pentru care sunt încărcate
  let busyTabs = new Set();
  let lastReport = null;
  const MAXTXT = 100000;

  async function loadSources() {
    if (!cur || sourcesFor === cur.id || !db) return;
    sourcesFor = cur.id; importDocs = [];
    try {
      const snap = await db.collection('sources').where('pid', '==', cur.id).get();
      importDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {}
    if (curTab === 'imp' || curTab === 'pd') renderMain();
  }
  async function saveSource(d) {
    if (!db || !cur) return;
    d.id = d.id || (cur.id + '__' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5));
    try { await db.doc('sources/' + d.id).set({ pid: cur.id, name: d.name, kind: d.kind || 'scris', meta: d.meta || null, text: d.text.slice(0, MAXTXT), at: Date.now() }); }
    catch (e) { d.err = 'nu s-a putut salva: ' + (e.code || e.message); }
  }

  async function removeSource(d) {
    const i = importDocs.indexOf(d); if (i >= 0) importDocs.splice(i, 1);
    if (d.id && db) { try { await db.doc('sources/' + d.id).delete(); } catch (e) {} }
    renderMain();
  }

  /* ---------- Piese desenate ---------- */
  let drawQueue = [];   // {name, status}
  let drawBusy = false;
  function renderDrawings(body) {
    loadSources();
    const box = h('fieldset', { class: 'grp' }, h('legend', {}, 'Piese desenate'));
    box.append(h('p', { class: 'muted' }, 'Încarcă planșele (PDF exportat din Revit/AutoCAD sau imagini PNG/JPG): planuri, secțiuni, fațade, plan de situație. Claude „privește” fiecare pagină și extrage cartușul (titlu, cod, scară, format), suprafețele, încăperile, cotele, distanțele la limite și vecinătăți, scările și accesurile. Rezultatul se păstrează la proiect și se folosește la completarea centralizatorului și a memoriilor.'));
    const inp = h('input', { type: 'file', id: 'pdFiles', multiple: true, accept: '.pdf,.png,.jpg,.jpeg' });
    const drop = h('label', { class: 'drop', for: 'pdFiles' }, h('b', {}, 'Alege planșe'), ' sau trage-le aici', inp);
    drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('over'));
    drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('over'); addDrawings(e.dataTransfer.files); });
    inp.addEventListener('change', () => addDrawings(inp.files));
    box.append(drop);
    if (!sample) box.append(h('div', { class: 'banner warn' }, 'Claude nu este disponibil în această vizualizare; planșele nu pot fi citite.'));
    if (drawQueue.length) box.append(h('ul', { class: 'files' }, ...drawQueue.map(q => h('li', {}, h('span', {}, q.name), h('span', { class: 'muted' }, q.status)))));
    body.append(box);
    const pl = importDocs.filter(d => d.kind === 'plansa');
    const sec = h('section', { class: 'sheet' }, h('h3', {}, 'Planșe citite', h('span', { class: 'cnt' }, String(pl.length))));
    if (!pl.length) sec.append(h('p', { class: 'muted' }, 'Nicio planșă încă.'));
    else {
      const tb = h('tbody');
      pl.forEach(d => { const m = d.meta || {}; tb.append(h('tr', {}, h('td', {}, m.cod || '–'), h('td', {}, m.titlu || d.name), h('td', {}, m.scara || '–'), h('td', {}, m.format || '–'),
        h('td', {}, h('details', {}, h('summary', {}, 'date extrase'), h('pre', { class: 'extr' }, d.text))), h('td', {}, h('button', { class: 'x', 'aria-label': 'Elimină planșa', onclick: () => removeSource(d) }, '×')))); });
      sec.append(h('div', { class: 'tblwrap' }, h('table', { class: 'prop' }, h('thead', {}, h('tr', {}, h('th', {}, 'Cod'), h('th', {}, 'Titlu'), h('th', {}, 'Scară'), h('th', {}, 'Format'), h('th', {}, 'Conținut'), h('th', {}, ''))), tb)));
      sec.append(h('div', { class: 'row' },
        h('button', { class: 'btn primary', disabled: !sample || busyTabs.size > 0, onclick: () => fillWithClaude(null) }, busyTabs.size ? 'Claude completează…' : 'Completează centralizatorul cu Claude'),
        h('button', { class: 'btn', onclick: planseToOpis }, 'Pune planșele în opis')));
    }
    body.append(sec);
  }
  function planseToOpis() {
    const pl = importDocs.filter(d => d.kind === 'plansa' && d.meta);
    const lines = pl.map(d => [d.meta.titlu || d.name, d.meta.cod || '', d.meta.format || ''].join(' | '));
    cur.opis.planse = lines.join('\n'); queueSave(); toast(lines.length + ' planșe trecute în opis (ISU)'); renderMain();
  }
  async function pageImages(f) {
    const ext = f.name.split('.').pop().toLowerCase();
    if (ext !== 'pdf') return [{ label: f.name, blob: f, text: '' }];
    await loadPdfJs();
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await f.arrayBuffer()) }).promise;
    const out = [];
    for (let i = 1; i <= Math.min(pdf.numPages, 30); i++) {
      const pg = await pdf.getPage(i);
      const v1 = pg.getViewport({ scale: 1 });
      const scale = Math.min(4, 2200 / Math.max(v1.width, v1.height));
      const vp = pg.getViewport({ scale });
      const cv = document.createElement('canvas'); cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
      const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
      await pg.render({ canvasContext: ctx, viewport: vp }).promise;
      const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.85));
      let text = '';
      try { const tc = await pg.getTextContent(); text = tc.items.map(it => it.str + (it.hasEOL ? '\n' : ' ')).join('').slice(0, 15000); } catch (e) {}
      out.push({ label: f.name + (pdf.numPages > 1 ? ' – pag. ' + i : ''), blob, text });
    }
    return out;
  }
  async function addDrawings(files) {
    if (!sample) return;
    let lim = null; try { lim = await sample.limits(); } catch (e) {}
    if (!lim || !lim.images) { toast('Citirea imaginilor nu este disponibilă în această vizualizare.'); return; }
    const pages = [];
    for (const f of files) {
      const q = { name: f.name, status: 'se pregătesc paginile…' }; drawQueue.push(q); renderMain();
      try { const ps = await pageImages(f); ps.forEach(p => pages.push({ ...p, q })); q.status = ps.length + ' pagini de citit'; }
      catch (e) { q.status = 'nu am putut deschide: ' + e.message; }
      renderMain();
    }
    for (const p of pages) {
      p.q.status = 'Claude citește ' + p.label + '…'; renderMain();
      try {
        if (p.blob.size > lim.images.maxInputBytes) throw new Error('imagine prea mare');
        const r = await sample.json(drawPrompt(p), { images: [p.blob], modelTier: 'complex' });
        const d = { name: p.label, kind: 'plansa', meta: r.plansa || {}, text: drawText(p.label, r) };
        importDocs.push(d); await saveSource(d);
        if (Array.isArray(r.incaperi) && r.incaperi.length) {
          const have = new Set(cur.rooms.map(x => (x.cod || '') + '|' + (x.nume || '')));
          r.incaperi.forEach(i => { const key = (i.cod || '') + '|' + (i.nume || ''); if (!have.has(key) && (i.cod || i.nume)) { cur.rooms.push({ cod: i.cod || '', nume: i.nume || '', nivel: i.nivel || (r.plansa && r.plansa.nivel) || '', su: i.su || '' }); have.add(key); } });
          queueSave();
        }
        p.q.status = 'citită: ' + ((r.plansa && r.plansa.titlu) || p.label);
      } catch (e) { p.q.status = 'eroare la ' + p.label + ': ' + (e.code === 'not_granted' ? 'accesul la Claude nu a fost permis' : e.code === 'rate_limited' ? 'prea multe cereri, reîncearcă peste un minut' : (e.code || e.message)); }
      renderMain();
    }
    drawQueue = drawQueue.filter(q => /^eroare|nu am putut/.test(q.status));
    toast('Planșele au fost citite'); renderMain();
  }
  function drawPrompt(p) {
    return `Ești arhitect și citești o planșă dintr-un proiect de arhitectură din România (imaginea atașată${p.text ? ', plus textul extras din PDF mai jos' : ''}).\n\nExtrage DOAR ce se vede pe planșă, fără să inventezi:\n- cartușul: titlul planșei, codul/numărul, scara, formatul (A0–A4), faza, data, proiectantul;\n- tipul planșei (plan de situație, plan nivel, secțiune, fațadă, detaliu etc.) și nivelul;\n- suprafețe (teren, construită, desfășurată, utilă, pe nivel), bilanț teritorial, POT/CUT, spații verzi, parcaje (număr locuri);\n- încăperi: cod, denumire, suprafață utilă, finisaje dacă apar;\n- cote: ±0,00, înălțimi de nivel, înălțime maximă/cornișă/atic, regim de înălțime;\n- distanțe față de limitele de proprietate și față de clădirile vecine (cu direcția), accesuri auto/pietonale, străzi;\n- scări (număr, tip, lățimi), uși pe căile de evacuare, marcaje de securitate la incendiu (pereți rezistenți la foc, clase EI, compartimente), lifturi;\n- materiale/finisaje de fațadă dacă e fațadă.\n\nRăspunde DOAR cu JSON:\n{"plansa": {"titlu": "", "cod": "", "scara": "", "format": "", "tip": "", "nivel": ""}, "date": {"<denumire>": "<valoare>"}, "incaperi": [{"cod": "", "nume": "", "su": "", "nivel": ""}], "observatii": ""}${p.text ? '\n\nTEXT DIN PDF:\n' + p.text : ''}`;
  }
  function drawText(label, r) {
    const pl = r.plansa || {};
    let t = `PLANȘĂ: ${pl.titlu || label}${pl.cod ? ' (' + pl.cod + ')' : ''}${pl.scara ? ', scara ' + pl.scara : ''}${pl.format ? ', format ' + pl.format : ''}${pl.tip ? ', tip ' + pl.tip : ''}${pl.nivel ? ', nivel ' + pl.nivel : ''}\n`;
    Object.entries(r.date || {}).forEach(([k, v]) => { t += `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}\n`; });
    if (Array.isArray(r.incaperi) && r.incaperi.length) t += 'ÎNCĂPERI:\n' + r.incaperi.map(i => [i.cod, i.nume, i.su ? i.su + ' mp' : '', i.nivel].filter(Boolean).join(' | ')).join('\n') + '\n';
    if (r.observatii) t += 'Observații: ' + r.observatii + '\n';
    return t;
  }

  function renderImport(body) {
    loadSources();
    const box = h('fieldset', { class: 'grp' }, h('legend', {}, 'Documentele proiectului'));
    box.append(h('p', { class: 'muted' }, 'Adaugă CU-ul, extrasul CF, scenariul de securitate la incendiu, expertiza, avize, memorii existente (PDF, DOCX, TXT). Textul se păstrează la proiect. Claude citește documentele și completează centralizatorul de mai jos; dacă o valoare din documente diferă de cea existentă, îți apare pentru decizie.'));
    const inp = h('input', { type: 'file', id: 'impFiles', multiple: true, accept: '.pdf,.docx,.txt,.md' });
    const drop = h('label', { class: 'drop', for: 'impFiles' }, h('b', {}, 'Alege fișiere'), ' sau trage-le aici', inp);
    drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('over'));
    drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('over'); addFiles(e.dataTransfer.files); });
    inp.addEventListener('change', () => addFiles(inp.files));
    const list = h('ul', { class: 'files' });
    const scrise = importDocs.filter(d => d.kind !== 'plansa');
    if (!scrise.length) list.append(h('li', { class: 'muted' }, 'Niciun document scris salvat încă pentru acest proiect.'));
    scrise.forEach(d => list.append(h('li', {}, h('span', {}, d.name), h('span', { class: 'muted' }, d.err || (d.text ? d.text.length.toLocaleString('ro-RO') + ' caractere' : 'se citește…')),
      h('button', { class: 'x', 'aria-label': 'Elimină documentul', onclick: () => removeSource(d) }, '×'))));
    const np = importDocs.filter(d => d.kind === 'plansa').length;
    if (np) list.append(h('li', { class: 'muted' }, `+ ${np} planșe citite în „Piese desenate”; intră și ele în completare.`));
    const paste = h('textarea', { id: 'impPaste', rows: 3, placeholder: 'Sau lipește aici text și apasă „Adaugă textul”' });
    box.append(drop, list, paste, h('div', { class: 'row' }, h('button', { class: 'btn ghost', onclick: async () => { if (!paste.value.trim()) return; const d = { name: 'Text lipit ' + new Date().toLocaleString('ro-RO'), text: paste.value.trim() }; importDocs.push(d); await saveSource(d); paste.value = ''; renderMain(); } }, 'Adaugă textul')));
    const goBtn = h('button', { class: 'btn primary', disabled: !sample || !importDocs.some(d => d.text) || busyTabs.size > 0, onclick: () => fillWithClaude(null) }, busyTabs.size ? 'Claude citește documentele…' : 'Completează centralizatorul cu Claude');
    box.append(h('div', { class: 'row' }, goBtn, sample ? null : h('span', { class: 'muted' }, 'Claude nu este disponibil în această vizualizare.')));
    body.append(box);
    const out = h('div', { id: 'impOut' }); body.append(out);
    if (lastReport && lastReport.pid === cur.id) showReport(out, lastReport);
    if ((cur.pending || []).length) showPending(out);
  }
  async function addFiles(files) {
    for (const f of files) {
      const d = { name: f.name, text: '' }; importDocs.push(d); renderMain();
      try { d.text = await extractText(f); await saveSource(d); } catch (e) { d.err = 'nu am putut citi: ' + e.message; }
      renderMain();
    }
  }
  async function extractText(f) {
    const ext = f.name.split('.').pop().toLowerCase();
    if (ext === 'txt' || ext === 'md') return await f.text();
    if (ext === 'docx') {
      const z = await JSZip.loadAsync(await f.arrayBuffer());
      const x = await z.file('word/document.xml').async('string');
      return x.replace(/<\/w:p>/g, '\n').replace(/<\/w:tc>/g, ' | ').replace(/<w:tab\/>/g, '\t').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\n{3,}/g, '\n\n');
    }
    if (ext === 'pdf') {
      await loadPdfJs();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await f.arrayBuffer()) }).promise;
      let out = '';
      for (let i = 1; i <= Math.min(pdf.numPages, 60); i++) {
        const pg = await pdf.getPage(i); const tc = await pg.getTextContent();
        out += tc.items.map(it => it.str + (it.hasEOL ? '\n' : ' ')).join('') + '\n';
      }
      if (out.replace(/\s/g, '').length < 50) throw new Error('PDF scanat, fără text (necesită OCR)');
      return out;
    }
    throw new Error('format neacceptat');
  }
  function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('nu s-a încărcat ' + src)); document.head.append(s); }); }
  async function loadPdfJs() {
    if (window.pdfjsLib) return;
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js');
  }

  // aplatizează {"gen":{"cod":..}} sau {"gen.cod":..}
  function flatten(o, pre = '', out = {}) {
    Object.entries(o || {}).forEach(([k, v]) => {
      const key = pre ? pre + '.' + k : k;
      if (v && typeof v === 'object' && !Array.isArray(v) && !FIELD[key]) flatten(v, key, out); else out[key] = v;
    });
    return out;
  }
  const HINTS = {
    gen: 'Din CU, contracte, cartușe, memorii: cod proiect, denumirea obiectivului exact ca în CU, beneficiar și adresa lui, proprietar din CF, proiectanți de specialitate.',
    amp: 'Din CU și extrasul CF: amplasament, nr. cadastral, CF, suprafață teren, regim juridic/economic/tehnic, PUG/PUZ, POT/CUT, regim maxim, retrageri, vecinătăți, utilități, geotehnică. Pentru „Tabel RLU” folosește rânduri „reglementare | valoare”.',
    c: 'Din memorii, scenariu, expertiză: funcțiuni secundare/conexe, tema, lucrările propuse (câte una pe rând), regim de înălțime, Sc, Sd, Su, volum, H, POT/CUT propus, structură, fundații, închideri, compartimentări, acoperiș, tâmplării, finisaje, parcaje, utilități, accesibilizare. Dacă e o construcție existentă, completează c.existenta = da și elementele păstrate.',
    si: 'Mai ales din scenariul de securitate la incendiu și avizul ISU: clasa de consecințe (CC1–CC4; categoria C = CC2, B = CC3, D = CC1), clasa de importanță, nivelul de stabilitate la incendiu (dacă documentul folosește „grad de rezistență la foc” conform P118/99, transpune: gradul I → I, II → II, III → III, IV → IV, V → V și menționează în observații), riscul de incendiu, tipul clădirii, compartimente („nume | Ac | Ad | volum | regim”, câte unul pe rând), distanțe la vecinătăți („direcție | distanță | descriere”), separări („spațiu | pereți | planșeu | uși | temei”), scări, căi de evacuare, control fum, intervenție, toate instalațiile (hidranți, sprinklere, detecție, desfumare, iluminat de siguranță, paratrăsnet), stingătoare, măsuri compensatorii.',
    pc: 'Din documentația de protecție civilă și opisuri: adăpost (da/nu, tip, suprafață, volum, capacitate, calcul), uși etanșe, ieșire de salvare; pentru opis: nr. file, verificatori („specialitate | nume | certificat | referat”), planșe („titlu | cod | format”).'
  };
  function tabKeys(tabId) {
    const t = TABS.find(x => x.id === tabId);
    return (t.groups || []).flatMap(g => g.f || []).map(f => f[0]);
  }

  async function askTab(tabId, src) {
    const keys = tabKeys(tabId);
    const list = keys.map(k => `${k}: ${FIELD[k].label}${FIELD[k].type === 'select' ? ' (una dintre: ' + (TABS.flatMap(t => t.groups || []).flatMap(g => g.f || []).find(f => f[0] === k)[3] || []).map(o => o[0]).filter(Boolean).join(', ') + ')' : ''}`).join('\n');
    const extra = tabId === 'si' ? '\n\nDacă documentele dau utilizatori pe niveluri, adaugă și "niveluri": [{"nume":"Parter","functiuni":"...","sc":"...","su":"...","h":"...","angajati":"...","vizitatori":"..."}].' : tabId === 'c' ? '\n\nPropune și destinația principală: "destinatie": {"id": "<unul dintre: ' + L.F.map(f => f.id).join(', ') + '>", "motiv": "o frază"}.' : '';
    const prompt = `Ești arhitect într-un birou din România și completezi fișa unui proiect (memorii tehnice și scenarii de securitate la incendiu; cadru legal: Legea nr. 169/2026 – CATUC, P 118/1-2025, OMAI 180/2022).\n\nCompletează CÂT MAI MULTE câmpuri din lista de mai jos pe baza documentelor sursă. Preia valorile care apar explicit și pe cele care rezultă direct din documente (ex. din scenariul de securitate la incendiu: riscul, nivelul de stabilitate, compartimentele, instalațiile). Nu inventa date care nu au sprijin în documente; lasă câmpul afară. Scrie în română cu diacritice, în stilul unui memoriu tehnic; pentru câmpurile descriptive scrie fraze complete, preluând detaliile din documente. Folosește pluralul „accesuri”.\n\nIndicații: ${HINTS[tabId]}\n\nCâmpuri (cheie: descriere):\n${list}${extra}\n\nRăspunde DOAR cu JSON:\n{"campuri": {"<cheie>": "<valoare>"}, "surse": {"<cheie>": "documentul / pagina"}, "observatii": ["neconcordanțe sau lucruri de verificat"]}\n\nDOCUMENTE SURSĂ:\n${src}`;
    return await sample.json(prompt, { modelTier: 'complex' });
  }

  const norm = x => String(x || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '');
  // Pentru fiecare diferență, Claude propune varianta cea mai cuprinzătoare (unește cele două valori).
  async function mergeConflicts(list) {
    const out = [];
    for (let i = 0; i < list.length; i += 20) {
      const chunk = list.slice(i, i + 20);
      const items = chunk.map((c, j) => ({ id: j, camp: FIELD[c.k].label, existenta: c.now, din_documente: c.v }));
      const prompt = `Ești arhitect și unifici datele fișei unui proiect (memorii tehnice, scenarii de securitate la incendiu, România). Pentru fiecare câmp ai valoarea existentă și valoarea găsită acum în documente. Propune VARIANTA CEA MAI CUPRINZĂTOARE: păstrează toate informațiile corecte din ambele, elimină repetițiile, scrie în română cu diacritice, în stilul unui memoriu tehnic (folosește „accesuri”). Dacă cele două valori se contrazic (alte cifre, alt nivel, alt număr), alege varianta din documente și explică diferența în „nota”.\n\nRăspunde DOAR cu JSON: [{"id": 0, "propunere": "...", "nota": "ce s-a unit / ce diferă (scurt)", "contradictie": true|false}]\n\n${JSON.stringify(items)}`;
      try {
        const r = await sample.json(prompt, { modelTier: 'complex' });
        (Array.isArray(r) ? r : []).forEach(x => { const c = chunk[x.id]; if (c && has(x.propunere)) { c.prop = String(x.propunere); c.nota = x.nota || ''; c.contra = !!x.contradictie; } });
      } catch (e) {}
      chunk.forEach(c => { if (!c.prop) { c.prop = c.v; c.nota = 'varianta din documente'; } out.push(c); });
    }
    return out;
  }

  async function fillWithClaude(onlyTab) {
    if (!sample) { toast('Claude nu este disponibil în această vizualizare.'); return; }
    await loadSources();
    const texts = importDocs.filter(d => d.text).map(d => `=== ${d.kind === 'plansa' ? 'PIESĂ DESENATĂ' : 'DOCUMENT'}: ${d.name} ===\n${d.text}`);
    if (!texts.length) { toast('Adaugă întâi documentele proiectului în „Import cu Claude”.'); curTab = 'imp'; renderMain(); return; }
    let src = texts.join('\n\n'); if (src.length > 110000) src = src.slice(0, 110000);
    const tabs = onlyTab ? [onlyTab] : ['gen', 'amp', 'c', 'si', 'pc'];
    const pid = cur.id;
    tabs.forEach(t => busyTabs.add(t)); renderMain();
    const report = { pid, filled: [], conflicts: [], obs: [], errors: [], dest: null };
    const queue = [...tabs];
    const worker = async () => { while (queue.length) { const t = queue.shift(); await one(t); } };
    const one = async t => {
      try {
        const r = await askTab(t, src);
        if (!cur || cur.id !== pid) return;
        const vals = flatten(r && r.campuri ? r.campuri : r);
        const surse = (r && r.surse) || {};
        cur.auto = cur.auto || {};
        Object.entries(vals).forEach(([k, v]) => {
          if (!FIELD[k] || !has(v) || typeof v === 'object') return;
          v = String(v).trim();
          const now = get(cur, k);
          if (!has(now)) { set(cur, k, v); cur.auto[k] = surse[k] || 'documentele proiectului'; report.filled.push(k); }
          else if (norm(now) !== norm(v)) report.conflicts.push({ k, v, now: String(now), sursa: surse[k] || '' });
        });
        if (r && Array.isArray(r.niveluri) && r.niveluri.length && !cur.niv.length) { cur.niv = r.niveluri.map(n => ({ nume: n.nume || '', functiuni: n.functiuni || '', sc: n.sc || '', su: n.su || '', h: n.h || '', angajati: n.angajati || '', vizitatori: n.vizitatori || '' })); report.filled.push('niveluri'); }
        if (r && r.destinatie && L.fn(r.destinatie.id)) {
          report.dest = r.destinatie;
          if (!cur.c.functiune) { cur.c.functiune = r.destinatie.id; cur.c.functiuneStatus = 'propusa'; cur.c.functiuneMotiv = r.destinatie.motiv || ''; }
        }
        (r && r.observatii || []).forEach(o => report.obs.push(o));
      } catch (e) { report.errors.push(TABS.find(x => x.id === t).t + ': ' + (e.code === 'not_granted' ? 'accesul la Claude nu a fost permis' : e.code === 'rate_limited' ? 'prea multe cereri, reîncearcă peste un minut' : (e.code || e.message))); }
      busyTabs.delete(t);
      queueSave(); renderMain();
    };
    await Promise.all([worker(), worker()]);
    if (report.conflicts.length && cur && cur.id === pid) {
      toast('Claude unifică ' + report.conflicts.length + ' valori diferite…');
      const merged = await mergeConflicts(report.conflicts);
      const old = (cur.pending || []).filter(p => !merged.find(m => m.k === p.k));
      cur.pending = [...old, ...merged]; queueSave();
    }
    lastReport = report;
    toast(report.filled.length + ' câmpuri completate' + (report.conflicts.length ? ', ' + report.conflicts.length + ' diferențe de decis' : ''));
    if (!onlyTab || report.conflicts.length) { curTab = 'imp'; }
    renderMain();
  }

  function showReport(out, r) {
    const box = h('fieldset', { class: 'grp' }, h('legend', {}, 'Rezultatul completării'));
    box.append(h('p', {}, h('b', {}, r.filled.length + ' câmpuri completate automat'), r.filled.length ? ' – sunt marcate cu „C” în tab-uri; le poți corecta oricând.' : '.'));
    if (r.dest && L.fn(r.dest.id)) box.append(h('div', { class: 'propdest' }, h('div', {}, h('span', { class: 'muted' }, 'Destinație propusă'), h('strong', {}, L.fn(r.dest.id).label), h('p', {}, r.dest.motiv || '')),
      cur.c.functiuneStatus === 'decisa' ? h('span', { class: 'chip fn ok' }, 'Destinația este deja decisă') : h('button', { class: 'btn primary', onclick: () => { cur.c.functiune = r.dest.id; cur.c.functiuneMotiv = r.dest.motiv || ''; approveFn(); } }, 'Aprob destinația')));
    if (r.obs.length) box.append(h('div', { class: 'banner' }, h('b', {}, 'De verificat: '), r.obs.join(' · ')));
    if (r.errors.length) box.append(h('div', { class: 'banner warn' }, 'Nu s-au putut completa: ' + r.errors.join('; ')));
    out.append(box);
  }

  function showPending(out) {
    const P = cur.pending;
    const box = h('fieldset', { class: 'grp' }, h('legend', {}, 'Variante propuse pentru date diferite (' + P.length + ')'));
    box.append(h('p', { class: 'muted' }, 'Pentru câmpurile care aveau deja o valoare, Claude a unit informația existentă cu cea din documente într-o singură variantă, cea mai cuprinzătoare. Bifezi = ești de acord și varianta intră în centralizator. Poți corecta textul propus înainte să bifezi. Rândurile marcate „diferă” au cifre sau date care se contrazic.'));
    const tb = h('tbody');
    P.forEach((c, i) => {
      const ta = h('textarea', { class: 'cellin propin', rows: 2, 'aria-label': 'Varianta propusă pentru ' + FIELD[c.k].label, oninput: e => { c.prop = e.target.value; autosize(e.target); } }); ta.value = c.prop || c.v; setTimeout(() => autosize(ta));
      tb.append(h('tr', { class: c.contra ? 'contra' : '' },
        h('td', {}, h('input', { type: 'checkbox', class: 'pendchk', 'data-i': i, 'aria-label': 'De acord: ' + FIELD[c.k].label })),
        h('td', {}, h('b', {}, FIELD[c.k].label), c.contra ? h('span', { class: 'tag' }, 'diferă') : null, c.nota ? h('small', {}, c.nota) : null,
          h('details', { class: 'was' }, h('summary', {}, 'vezi valorile inițiale'), h('p', {}, h('i', {}, 'Era: '), c.now), h('p', {}, h('i', {}, 'În documente: '), c.v))),
        h('td', {}, ta)));
    });
    const tbl = h('table', { class: 'prop pend' }, h('thead', {}, h('tr', {}, h('th', {}, h('input', { type: 'checkbox', 'aria-label': 'Bifează tot', onchange: e => $$('.pendchk', tbl).forEach(ch => ch.checked = e.target.checked) })), h('th', {}, 'Câmp'), h('th', {}, 'Varianta propusă'))), tb);
    box.append(h('div', { class: 'tblwrap' }, tbl));
    box.append(h('div', { class: 'row' },
      h('button', { class: 'btn primary', onclick: () => {
        const ok = new Set($$('.pendchk', tbl).filter(ch => ch.checked).map(ch => +ch.dataset.i));
        P.forEach((c, i) => { if (ok.has(i)) { set(cur, c.k, c.prop || c.v); cur.auto = cur.auto || {}; cur.auto[c.k] = 'unificat de Claude: ' + (c.sursa || 'documente'); } });
        cur.pending = P.filter((c, i) => !ok.has(i)); queueSave(); toast(ok.size + ' variante acceptate'); renderMain();
      } }, 'Aplică variantele bifate'),
      h('button', { class: 'btn ghost', onclick: () => {
        const ok = new Set($$('.pendchk', tbl).filter(ch => ch.checked).map(ch => +ch.dataset.i));
        if (!ok.size) { toast('Bifează rândurile pe care vrei să le renunți'); return; }
        cur.pending = P.filter((c, i) => !ok.has(i)); queueSave(); toast(ok.size + ' propuneri respinse; rămâne valoarea existentă'); renderMain();
      } }, 'Respinge bifatele (păstrez ce era)')));
    out.append(box);
  }

  /* ---------- toast ---------- */
  let tt;
  function toast(t) { const el = $('#toast'); el.textContent = t; el.hidden = false; clearTimeout(tt); tt = setTimeout(() => el.hidden = true, 3200); }

  /* ---------- pornire ---------- */
  curTab = local.get('tab', 'imp');
  $('#newBtn').addEventListener('click', newProject);
  $('#projSearch').addEventListener('input', renderSidebar);
  renderAll();
  (async () => {
    const C = window.claude;
    if (!C || !C.use) { renderSidebar(); return; }
    [db, user, downloads, sample] = await Promise.all(['db', 'user', 'downloads', 'sample'].map(n => C.use(n).catch(() => null)));
    if (user && user.can) { try { const w = await user.can('data.write'); if (w === false) canWrite = false; } catch (e) {} }
    if (!db) { $('#projList').innerHTML = ''; $('#projList').append(h('p', { class: 'empty-side' }, 'Proiectele se păstrează doar când pagina este deschisă în claude.ai, cu cont.')); renderMain(); return; }
    let first = true;
    db.collection('projects').onSnapshot(snap => {
      projects = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (first) { first = false; const last = local.get('lastProject', null); if (!cur && last && projects.find(p => p.id === last)) { openProject(last); return; } }
      if (cur && !saving && !saveTimer) {
        const fresh = projects.find(p => p.id === cur.id);
        if (fresh && (fresh.updatedAt || 0) > (cur.updatedAt || 0) && document.activeElement && !document.activeElement.closest('.tabbody')) { openProject(cur.id); return; }
      }
      renderSidebar();
      if (!cur) renderMain();
    }, err => { status('Sincronizarea s-a oprit: ' + err.code, 'err'); });
    renderMain();
  })();
})();
