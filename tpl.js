/* Șabloane de documente. Fiecare întoarce {body, footer, title, filename}. */
window.TPL = (function () {
  const { B } = DOCX;
  const L = LIB;
  const v = (x, label) => (x == null || String(x).trim() === '') ? '⟦' + label + '⟧' : String(x).trim();
  const has = x => x != null && String(x).trim() !== '';
  const lines = x => String(x || '').split('\n').map(s => s.trim()).filter(Boolean);
  const cells = (x, n) => lines(x).map(l => { const c = l.split('|').map(s => s.trim()); while (c.length < n) c.push(''); return c.slice(0, n); });
  const num = x => { const n = parseFloat(String(x || '').replace(/\./g, '').replace(',', '.')); return isNaN(n) ? null : n; };
  const fmt = (n, d = 2) => n == null ? '' : n.toLocaleString('ro-RO', { maximumFractionDigits: d });
  const upQ = s => '„' + s + '”';
  const mp = x => has(x) ? x + (/m[p²2]/.test(x) ? '' : ' mp') : null;

  function ctx(P) {
    const g = P.gen || {}, a = P.amp || {}, c = P.c || {}, si = P.si || {};
    const F = L.fn(c.functiune) || null;
    const amplasament = [a.judet && ('Jud. ' + a.judet), a.uat && ('UAT ' + a.uat), a.localitate && ('Loc. ' + a.localitate), a.adresa, a.nrCad && ('nr. cad. ' + a.nrCad), a.cf && ('CF nr. ' + a.cf)].filter(Boolean).join(', ');
    const nsi = si.nsi || '';
    const lung = F && F.lung && nsi ? F.lung[nsi.replace('(+)', '')] : null;
    return { g, a, c, si, F, amplasament, nsi, lung, niv: P.niv || [], rooms: P.rooms || [], pc: P.pc || {}, opis: P.opis || {} };
  }

  function legiList(docType, X, extra = []) {
    const ids = [...L.COMUNE[docType], ...(X.F ? X.F.legi : []), ...extra];
    if (X.a.monument && /da|lmi|protejat/i.test(X.a.monument)) ids.push('L422');
    const seen = new Set(); const out = [];
    ids.forEach(id => { if (!seen.has(id) && L.LEGI[id]) { seen.add(id); out.push(L.LEGI[id]); } });
    return out;
  }

  function cover(X, l1, l2, l3) {
    let x = B.spacer() + B.title(l1, 48) + (l2 ? B.title(l2, 40) : '') + (l3 ? B.sub(l3, 28, 240) : B.spacer());
    x += B.center(upQ(v(X.g.denumire, 'denumirea obiectivului')));
    x += B.kv('Amplasament', v(X.amplasament, 'amplasament'));
    x += B.kv('Beneficiar', v(X.g.beneficiar, 'beneficiar'));
    x += B.kv('Proiectant general', v(X.g.proiectant, 'proiectant general'));
    if (has(X.g.codBenef)) x += B.kv('Cod proiect beneficiar', X.g.codBenef);
    x += B.kv('Cod proiect', v(X.g.cod, 'cod proiect'));
    x += B.kv('Data', v(X.g.data, 'data'));
    return x;
  }

  function semnatura(X) {
    return B.spacer() + B.sign(`**DATA:** ${v(X.g.data, 'data')}`, `${v(X.g.proiectant, 'proiectant')}\n\nÎNTOCMIT,\n\n${v(X.g.intocmit || X.g.sefProiect, 'întocmit')}`);
  }

  function identificare(X) {
    return B.h2('Denumirea obiectivului de investiții') + B.p(upQ(v(X.g.denumire, 'denumire'))) +
      B.h2('Amplasamentul obiectivului și adresa') + B.p(v(X.amplasament, 'amplasament')) +
      B.h2('Date de identificare') + B.bullets([
        ' beneficiarul lucrărilor: ' + v(X.g.beneficiar, 'beneficiar') + (has(X.g.benefAdresa) ? ', ' + X.g.benefAdresa : ''),
        ' proiectant general: ' + v(X.g.proiectant, 'proiectant') + (has(X.g.proiectantAdresa) ? ', ' + X.g.proiectantAdresa : ''),
        has(X.g.sefProiect) ? ' șef de proiect: ' + X.g.sefProiect : null,
        has(X.g.proprietar) ? ' proprietar teren (conform extras CF): ' + X.g.proprietar : null
      ]);
  }

  function vecinatati(X) {
    const a = X.a;
    const r = [['nord', a.vecN], ['sud', a.vecS], ['est', a.vecE], ['vest', a.vecV]].filter(x => has(x[1])).map(x => x[0] + ': ' + x[1] + ';');
    return r.length ? B.bullets(r) : B.p('⟦vecinătăți (N/S/E/V)⟧');
  }

  function indicatoriTable(X) {
    const a = X.a, c = X.c;
    return B.table(['Indicator', 'Propus', 'Maxim admis'], [
      ['Suprafață teren', v(mp(a.sTeren), 'S teren'), '–'],
      ['Suprafață construită la sol', v(mp(c.sc), 'Sc'), '–'],
      ['Suprafață construită desfășurată', v(mp(c.sd), 'Sd'), '–'],
      ['P.O.T.', v(c.potProp, 'POT propus'), v(a.potMax, 'POT max')],
      ['C.U.T.', v(c.cutProp, 'CUT propus'), v(a.cutMax, 'CUT max')],
      ['Regim de înălțime', v(c.regim, 'regim de înălțime'), v(a.regimMaxAdm, 'regim max')],
      ['Înălțime maximă', v(c.hMax, 'H max'), v(a.hMaxAdm, 'H max admis')],
      ['Spații verzi', v(c.spVerziProp, 'spații verzi'), v(a.spVerziMin, 'spații verzi min')]
    ], [3600, 3000, 3000]);
  }

  // text despre încadrarea la foc, specific funcțiunii
  function incadrareSI(X, detaliat) {
    const F = X.F, si = X.si;
    const out = [];
    out.push(B.p(`Construcția are destinația ${v(F && F.label.toLowerCase(), 'destinație')}${X.c.functiuniSec ? ', cu funcțiuni secundare: ' + X.c.functiuniSec : ''}. Încadrarea din punct de vedere al securității la incendiu se face conform P 118/1-2025, ${F ? 'capitolul ' + (F.sec.length > 2 ? F.sec + ' „' + F.secTitlu + '”' : F.secTitlu) : '⟦capitol P118⟧'}, coroborat cu performanțele comune din capitolul 2.`));
    out.push(B.bullets([
      `nivelul de stabilitate la incendiu: **${v(si.nsi, 'nivel stabilitate')}**, stabilit conform art. 2.1.3.2 și Tabelul ${F && F.t2 === 'Tabelul 3' ? '3' : '2'} din P 118/1-2025;`,
      `riscul de incendiu: **${v(si.risc, 'risc incendiu')}**, determinat conform art. 2.1.2.1 – 2.1.2.3 (densitatea sarcinii termice; risc mic pentru q ≤ 420 MJ/m², conform art. 2.1.2.2);`,
      `tipul clădirii: ${v(si.tipCladire, 'tip clădire')};`,
      has(si.compartimente) ? `compartimente de incendiu: ${cells(si.compartimente, 5).map(r => r[0]).join('; ')};` : 'compartimente de incendiu: ⟦compartimente⟧;',
      `clasa de consecințe: ${v(si.cc && L.CC_TXT[si.cc] || si.cc, 'clasa de consecințe')} (art. 370 și anexa nr. 6 din Legea nr. 169/2026);`,
      `clasa de importanță și de expunere la cutremur: ${v(si.clasaImp, 'clasa de importanță')} (P 100-1/2013).`
    ]));
    if (F && F.nota) out.push(B.note(F.nota));
    if (F && F.sali) out.push(B.note(F.sali));
    if (detaliat) {
      if (X.lung) out.push(B.p(`Lungimile maxime ale căilor de evacuare, pentru nivelul ${si.nsi} de stabilitate la incendiu, sunt conform ${F.tLung} din P 118/1-2025: **${X.lung[0]} m** în două direcții diferite și **${X.lung[1]} m** într-o singură direcție (coridor înfundat).`));
      else if (F && F.tLung) out.push(B.p(`Lungimile maxime ale căilor de evacuare se stabilesc conform ${F.tLung} din P 118/1-2025${has(si.lungimiProp) ? ': ' + si.lungimiProp : ' ⟦lungimi de evacuare⟧'}.`));
      if (F && F.uf) out.push(B.p(`Numărul normat de utilizatori pe unitatea de trecere (flux) de evacuare este Uf = ${F.uf} (P 118/1-2025, ${F.ufRef}); lățimea liberă normată este de 80 cm pentru un flux și 1,10 m pentru două fluxuri (art. 2.5.11.1).`));
      if (F && F.acces) out.push(B.p(`Accesul și intervenția autospecialelor de stingere se asigură ${F.acces.txt} (art. ${F.acces.art} din P 118/1-2025)${has(si.accesInterventie) ? '. ' + si.accesInterventie : '.'}`));
      if (F && F.tScari) out.push(B.p(`Comportarea la foc a pereților, ușilor și planșeelor caselor de scări închise respectă ${F.tScari}, iar a celor care separă căile de evacuare orizontale (coridoare și holuri) respectă ${F.tCoridoare} din P 118/1-2025.`));
    }
    return out.join('');
  }

  function cerinteFundamentale(X, detaliat) {
    const F = X.F, c = X.c, si = X.si;
    let x = B.p('Prezenta documentație răspunde cerințelor fundamentale aplicabile, care trebuie realizate și menținute pe întreaga durată de existență a construcției:');
    x += B.h3('A. Rezistență mecanică și stabilitate');
    x += B.p(`Soluția structurală (${v(c.structura, 'sistem structural')}) este dezvoltată în proiectul de rezistență, conform P 100-1/2013 și CR 0-2012. Clasa de importanță și de expunere la cutremur: ${v(si.clasaImp, 'clasa de importanță')}.`);
    x += B.h3('B. Securitate la incendiu');
    x += incadrareSI(X, detaliat);
    x += B.p(`Măsurile de securitate la incendiu sunt detaliate în Scenariul de securitate la incendiu ${X.g.faza === 'PTE' ? '' : 'preliminar '}elaborat conform Ordinului M.A.I. nr. 180/2022${si.supusAviz === 'nu' ? '' : '; construcția se încadrează în categoriile care se supun avizării privind securitatea la incendiu, conform H.G. nr. 571/2016'}.`);
    x += B.h3('C. Igienă, sănătate și mediu');
    x += B.p((F && F.igiena) || 'Se asigură iluminatul natural și artificial, ventilarea, alimentarea cu apă potabilă, evacuarea apelor uzate și a deșeurilor conform Ordinului M.S. nr. 119/2014.');
    x += B.h3('D. Siguranță și accesibilitate în exploatare');
    x += B.p('Proiectul respectă NP 068-2002 (siguranța circulației pietonale, a accesului, a deplasării pe scări și rampe, protecția la schimbări de nivel) și NP 051-2012 privind accesibilitatea pentru persoanele cu dizabilități.' + (has(c.accesibilizare) ? ' ' + c.accesibilizare : ''));
    x += B.h3('E. Protecție împotriva zgomotului');
    x += B.p('Elementele de separare și finisajele asigură indicii de izolare la zgomot aerian și de impact prevăzuți de C 125-2013, în funcție de destinația încăperilor.');
    x += B.h3('F. Economie de energie și izolare termică');
    x += B.p(`Anvelopa se dimensionează conform C 107-2005 și Mc 001-2022; clădirea respectă cerințele nZEB din Legea nr. 372/2005, republicată.${has(c.termo) ? ' ' + c.termo : ''}${has(c.energie) ? ' ' + c.energie : ''}`);
    x += B.h3('G. Utilizarea sustenabilă a resurselor naturale');
    x += B.p('Se utilizează materiale durabile, reciclabile și compatibile cu mediul, cu declarații de performanță conform Regulamentului (UE) nr. 305/2011.');
    return x;
  }

  /* ---------------- MEMORIU CU ---------------- */
  function CU(P) {
    const X = ctx(P), a = X.a, c = X.c, g = X.g, si = X.si;
    let x = cover(X, 'MEMORIU DE PREZENTARE', 'CERTIFICAT DE URBANISM', 'pentru ' + (a.cuScop || 'construire'));
    x += B.h1('1 DATE GENERALE') + identificare(X);
    x += B.h2('Obiectul documentației');
    x += B.p(`Prezenta documentație a fost întocmită la solicitarea beneficiarului, în vederea obținerii Certificatului de Urbanism pentru ${a.cuScop || 'construire'}, în conformitate cu prevederile art. 257 din Legea nr. 169/2026 privind Codul amenajării teritoriului, urbanismului și construcțiilor (CATUC).`);
    x += B.p(`Memoriul constituie descrierea succintă a investiției propuse, prevăzută la art. 257 alin. (8) lit. b) din Legea nr. 169/2026, în vederea identificării modului în care aceasta se încadrează în documentațiile de urbanism aprobate și a avizelor și acordurilor necesare construirii.`);
    x += B.h1('2 DATE DE IDENTIFICARE A AMPLASAMENTULUI');
    x += B.h2('2.1 Regimul juridic') + B.p(v(a.regimJuridic, 'regim juridic (CF)'));
    x += B.h2('2.2 Regimul economic') + B.bullets(['folosința actuală: ' + v(a.folosinta, 'folosință actuală') + ';', 'destinația stabilită prin documentația de urbanism în vigoare: ' + v(a.destinatiePUG, 'destinație PUG/PUZ') + '.']);
    x += B.h2('2.3 Încadrarea în documentațiile de urbanism aprobate') + B.p(v(a.docUrb, 'documentații de urbanism (PUG/PUZ, HCL)'));
    if (has(a.rlu)) x += B.p('**Prevederi ale regulamentului local de urbanism aplicabile:**') + B.table(['Reglementare', 'Valoare stabilită'], cells(a.rlu, 2), [3600, 6000]);
    x += B.h2('2.4 Descrierea situației existente');
    x += B.h3('Caracteristici ale terenului') + B.p(v(a.teren, 'descriere teren'));
    x += B.h3('Vecinătăți') + vecinatati(X);
    x += B.h3('Circulația autovehiculelor și a pietonilor') + B.p(v(a.circulatii, 'circulații'));
    x += B.h3('Accesurile la teren') + B.p(v(a.accesuri, 'accesuri'));
    x += B.h3('Echiparea edilitară') + B.p(v(a.utilitati, 'utilități existente'));
    x += B.h3('Condiții geotehnice și de risc natural') + B.p(v(a.geotehnic, 'geotehnică / seismicitate'));
    x += B.h3('Bilanț teritorial existent') + B.table(['Indicator', 'Valoare'], [['Suprafață teren (conform CF)', v(mp(a.sTeren), 'S teren')], ['Construcții existente', v(a.constrExist, 'construcții existente')]], [4800, 4800]);
    x += B.h1('3 DESCRIEREA SITUAȚIEI PROPUSE');
    x += B.h2('3.1 Cerințe specifice de temă') + B.p(v(c.tema, 'temă de proiectare'));
    x += B.h2('3.2 Lucrări propuse') + (lines(c.lucrari).length ? B.bullets(lines(c.lucrari).map(s => s.replace(/;?$/, ';'))) : B.p('⟦lucrări propuse⟧'));
    x += B.h2('3.3 Indicatori estimați ai investiției');
    x += B.p('Valorile de mai jos sunt orientative și demonstrează încadrarea investiției în reglementările urbanistice aprobate. Ele se definitivează în proiectul pentru autorizarea executării lucrărilor de construire, cu respectarea indicatorilor maximi aprobați.');
    x += indicatoriTable(X);
    x += B.h2('3.4 Asigurarea utilităților') + B.p(v(c.utilitatiProp || a.utilitati, 'utilități propuse'));
    x += B.h2('3.5 Clasa de consecințe și încadrări');
    x += B.bullets([
      `${v(si.cc && L.CC_TXT[si.cc] || si.cc, 'clasa de consecințe')}, conform art. 370 și anexei nr. 6 din Legea nr. 169/2026;`,
      `clasa de importanță ${v(si.clasaImp, 'clasa de importanță')}, conform Codului de proiectare seismică P 100-1/2013;`,
      `securitate la incendiu: nivelul de stabilitate la incendiu și riscul de incendiu se stabilesc la faza DTAC, prin scenariul de securitate la incendiu, conform P 118/1-2025${X.F ? ', capitolul ' + X.F.sec + ' (' + X.F.secTitlu.toLowerCase() + ')' : ''}.` + (si.supusAviz === 'nu' ? '' : ' Construcția se încadrează în categoriile care se supun avizării și autorizării privind securitatea la incendiu, conform H.G. nr. 571/2016.')
    ]);
    x += B.h1('4 LEGISLAȚIE APLICABILĂ') + B.p('Prezenta documentație s-a întocmit în conformitate cu, dar fără a se limita la:') + B.bullets(legiList('CU', X).map(s => s + ';'));
    x += B.h1('5 CONCLUZII');
    x += B.p(`Prezenta documentație a fost întocmită în vederea obținerii Certificatului de Urbanism pentru obiectivul ${upQ(v(g.denumire, 'denumire'))}, amplasat ${v(X.amplasament, 'amplasament')}.`);
    x += B.p('Investiția propusă se încadrează în funcțiunile admise și în indicatorii urbanistici maximi aprobați. Soluția tehnică definitivă, indicatorii finali și modul de racordare la utilități se stabilesc în proiectul pentru autorizarea executării lucrărilor de construire, cu respectarea condițiilor din Certificatul de Urbanism și din avizele și acordurile solicitate prin acesta.');
    x += semnatura(X);
    return { body: x, title: 'Memoriu CU', footer: `${v(g.cod, 'cod')} | Memoriu de prezentare CU` };
  }

  /* ---------------- MEMORIU ARHITECTURĂ DTAC (CATUC anexa 2 pct. 1.4.2) ---------------- */
  function nivTable(X) {
    if (!X.niv.length) return B.p('⟦funcțiuni pe niveluri⟧');
    return B.table(['Nivel', 'Funcțiuni', 'Sc (mp)', 'Su (mp)', 'H nivel (m)'], X.niv.map(n => [n.nume, n.functiuni, n.sc, n.su, n.h]), [1400, 4600, 1200, 1200, 1200]);
  }
  function DTAC_ARH(P) {
    const X = ctx(P), a = X.a, c = X.c, g = X.g, si = X.si;
    let x = cover(X, 'MEMORIU TEHNIC', 'ARHITECTURĂ', 'Proiect pentru autorizarea executării lucrărilor de construire (DTAC)');
    x += B.h1('1 DATE GENERALE', { page: true }) + identificare(X);
    x += B.h2('Faza de proiectare și baza legală');
    x += B.p(`Proiectul pentru autorizarea executării lucrărilor de construire este elaborat conform art. 264 alin. (3) și conținutului-cadru din anexa nr. 2 la Legea nr. 169/2026, pe baza Certificatului de Urbanism nr. ${v(a.cuNr, 'nr. CU')} din ${v(a.cuData, 'data CU')}${has(a.cuEmitent) ? ', emis de ' + a.cuEmitent : ''}. Memoriul tehnic de arhitectură are structura prevăzută la pct. 1.4.2 din anexa nr. 2.`);
    x += B.h1('2 DESCRIEREA STĂRII INIȚIALE A TERENULUI');
    x += B.p(`Terenul, în suprafață de ${v(mp(a.sTeren), 'S teren')}, este situat în ${v(a.intravilan, 'intravilan/extravilan')}. ${v(a.regimJuridic, 'regim juridic')}`);
    x += B.p(v(a.teren, 'descriere teren'));
    x += B.h3('Vecinătăți') + vecinatati(X);
    x += B.h3('Construcții existente') + B.p(v(a.constrExist, 'construcții existente'));
    x += B.h3('Echipare edilitară existentă') + B.p(v(a.utilitati, 'utilități existente'));
    x += B.h3('Condiții geotehnice') + B.p(v(a.geotehnic, 'geotehnică'));
    x += B.h1('3 DESCRIEREA LUCRĂRILOR PROPUSE');
    x += B.p(v(c.tema, 'temă / descrierea investiției'));
    if (lines(c.lucrari).length) x += B.bullets(lines(c.lucrari).map(s => s.replace(/;?$/, ';')));
    x += B.h3('Compoziție și organizare funcțională');
    x += B.p(`Construcția are regimul de înălțime ${v(c.regim, 'regim de înălțime')} și destinația ${v(X.F && X.F.label.toLowerCase(), 'destinație')}. Repartizarea funcțiunilor pe niveluri:`);
    x += nivTable(X);
    x += B.table(['Caracteristică', 'Valoare'], [
      ['Suprafață construită (Sc)', v(mp(c.sc), 'Sc')], ['Suprafață desfășurată (Sd)', v(mp(c.sd), 'Sd')], ['Suprafață utilă (Su)', v(mp(c.su), 'Su')],
      ['Înălțime maximă', v(c.hMax, 'H max')], ['Înălțime la cornișă / atic', v(c.hCornisa, 'H cornișă')], ['Volum construit', v(c.volum, 'volum')]
    ], [4800, 4800]);
    if (c.existenta === 'da') x += B.h3('Elemente care se păstrează') + B.p(v(c.elementePastrate, 'elemente păstrate'));
    x += B.h1('4 SOLUȚII TEHNICE ȘI RESPECTAREA REGLEMENTĂRILOR URBANISTICE');
    x += B.h2('4.1 Încadrarea în reglementările urbanistice');
    x += B.p(`Documentații de urbanism aplicabile: ${v(a.docUrb, 'PUG/PUZ')}. Indicatorii propuși se încadrează în valorile maxime admise:`);
    x += indicatoriTable(X);
    if (has(a.retrageri)) x += B.p('Retrageri față de limitele parcelei: ' + a.retrageri);
    x += B.h2('4.2 Soluții constructive');
    x += B.bullets([
      'sistem structural: ' + v(c.structura, 'structură') + ';', 'fundații: ' + v(c.fundatii, 'fundații') + ';',
      'închideri exterioare: ' + v(c.inchideri, 'închideri') + ';', 'compartimentări interioare: ' + v(c.compartimentari, 'compartimentări') + ';',
      'acoperiș / învelitoare: ' + v(c.acoperis, 'acoperiș') + ';', 'tâmplărie exterioară: ' + v(c.tamplarieExt, 'tâmplărie exterioară') + '.'
    ]);
    x += B.h2('4.3 Materiale și finisaje');
    x += B.bullets(['finisaje exterioare: ' + v(c.finisajeExt, 'finisaje exterioare') + ';', 'finisaje interioare: ' + v(c.finisajeInt, 'finisaje interioare') + '.']);
    x += B.h2('4.4 Elemente de peisaj, vegetație, mobilier urban, împrejmuiri');
    x += B.p(v(c.peisaj, 'amenajări exterioare și spații verzi'));
    x += B.h1('5 PROTEJAREA ELEMENTELOR SEMNIFICATIVE DIN PUNCT DE VEDERE CULTURAL');
    x += B.p(has(a.monument) && /da|lmi|protejat/i.test(a.monument) ? a.monument + ' Intervenția respectă prevederile Legii nr. 422/2001 și avizul Ministerului Culturii.' : 'Nu este cazul. Imobilul nu este înscris în Lista monumentelor istorice și nu se află în zonă de protecție a acestora.');
    x += B.h1('6 EXIGENȚE DE CALITATE');
    x += B.p('Exigențele de calitate se detaliază în proiectul tehnic de execuție.');
    x += cerinteFundamentale(X, true);
    x += B.h1('7 ACCESUL DIN DRUMUL PUBLIC') + B.p(v(a.accesuri, 'accesuri din drum public'));
    x += B.h1('8 LOCURI DE PARCARE') + B.p(v(c.parcaje, 'parcaje') + (has(a.parcajeNorm) ? ' Necesar normat: ' + a.parcajeNorm + '.' : ''));
    x += B.h1('9 ECHIPAREA CU UTILITĂȚI ȘI ILUMINAT') + B.p(v(c.utilitatiProp || a.utilitati, 'utilități propuse'));
    x += B.h1('10 COLECTAREA SELECTIVĂ A DEȘEURILOR') + B.p(v(c.deseuri, 'colectarea deșeurilor') + ' Gestionarea deșeurilor respectă O.U.G. nr. 92/2021.');
    x += B.h1('11 RELAȚIILE CU VECINĂTĂȚILE ȘI ÎMPREJMUIRI') + B.p(v(c.imprejmuire, 'împrejmuiri / relații cu vecinătățile'));
    if (has(si.distante)) x += B.table(['Direcție', 'Distanță', 'Vecinătate'], cells(si.distante, 3), [2000, 1800, 5800]);
    x += B.h1('12 PROTECȚIA MEDIULUI') + B.p(v(c.mediu, 'protecția mediului') + ' Se respectă O.U.G. nr. 195/2005 și Legea nr. 292/2018.');
    if (X.pc.areAdapost === 'da') x += B.h1('13 PROTECȚIE CIVILĂ') + B.p(`Se prevede adăpost de protecție civilă ${X.pc.tip || ''} cu capacitatea de ${v(X.pc.capacitate, 'capacitate')} persoane, conform Legii nr. 481/2004 și normelor tehnice privind adăposturile de protecție civilă; soluția este detaliată în documentația pentru avizul de protecție civilă.`);
    x += B.h1('LEGISLAȚIE APLICABILĂ') + B.bullets(legiList('DTAC', X).map(s => s + ';'));
    x += semnatura(X);
    return { body: x, title: 'Memoriu arhitectură DTAC', footer: `${v(g.cod, 'cod')} | Memoriu tehnic arhitectură | Faza DTAC` };
  }

  /* ---------------- MEMORIU ARHITECTURĂ PT (art. 508 CATUC) ---------------- */
  function PTE_ARH(P) {
    const X = ctx(P), a = X.a, c = X.c, g = X.g, si = X.si;
    let x = cover(X, 'MEMORIU TEHNIC', 'ARHITECTURĂ', 'Proiect tehnic de execuție (PT)');
    x += B.h1('1 DATE GENERALE', { page: true }) + identificare(X);
    x += B.p(`Proiectul tehnic de execuție este elaborat conform art. 507–508 din Legea nr. 169/2026, cu respectarea autorizației de construire${has(P.amp && P.amp.acNr) ? ' nr. ' + P.amp.acNr : ''} și a reglementărilor urbanistice aplicabile.`);
    x += B.h1('2 INSERȚIA PE AMPLASAMENT ȘI RELAȚIA CU VECINĂTĂȚILE');
    x += B.p(`Terenul are suprafața de ${v(mp(a.sTeren), 'S teren')}. ${v(a.teren, 'descriere teren')}`) + B.h3('Vecinătăți') + vecinatati(X);
    if (has(si.distante)) x += B.table(['Direcție', 'Distanță', 'Vecinătate'], cells(si.distante, 3), [2000, 1800, 5800]);
    x += B.h3('Accesuri') + B.p(v(a.accesuri, 'accesuri'));
    x += B.h1('3 PREZENTAREA DESCRIPTIVĂ A PROPUNERII – FUNCȚIUNI, CIRCULAȚII, ACCESURI, FLUXURI');
    x += B.p(v(c.tema, 'descrierea propunerii'));
    x += nivTable(X);
    x += B.h3('Circulații verticale și orizontale') + B.p(v(si.scari, 'scări / circulații verticale') + (has(si.cai) ? ' ' + si.cai : ''));
    x += B.h3('Accesibilitate') + B.p(v(c.accesibilizare, 'măsuri de accesibilizare (NP 051-2012)'));
    x += B.h1('4 RAPORTUL SUPRAFEȚELOR PE ÎNCĂPERI ȘI FUNCȚIUNI');
    x += B.table(['Caracteristică', 'Valoare'], [['Suprafață construită (Sc)', v(mp(c.sc), 'Sc')], ['Suprafață desfășurată (Sd)', v(mp(c.sd), 'Sd')], ['Suprafață utilă (Su)', v(mp(c.su), 'Su')], ['P.O.T. / C.U.T.', v(c.potProp, 'POT') + ' / ' + v(c.cutProp, 'CUT')]], [4800, 4800]);
    if (X.rooms.length) {
      const byLvl = {};
      X.rooms.forEach(r => { (byLvl[r.nivel || '–'] = byLvl[r.nivel || '–'] || []).push(r); });
      Object.keys(byLvl).forEach(k => {
        const rs = byLvl[k];
        const tot = rs.reduce((s, r) => s + (num(r.su) || 0), 0);
        x += B.h3('Tabel încăperi – ' + k);
        x += B.table(['Cod', 'Denumire', 'Su (mp)', 'Pardoseală', 'Pereți', 'Tavan', 'H liber'], [...rs.map(r => [r.cod, r.nume, r.su, r.pard, r.pereti, r.tavan, r.h]), ['TOTAL', '', fmt(tot), '', '', '', '']], [800, 2600, 900, 1400, 1400, 1700, 800]);
      });
    } else x += B.p('⟦tabel încăperi (se importă din Revit/Excel în tab-ul Încăperi)⟧');
    x += B.h1('5 SOLUȚII CONSTRUCTIVE ȘI FINISAJE');
    x += B.bullets([
      'sistem structural: ' + v(c.structura, 'structură') + ';', 'fundații: ' + v(c.fundatii, 'fundații') + ';',
      'închideri exterioare: ' + v(c.inchideri, 'închideri') + ';', 'compartimentări: ' + v(c.compartimentari, 'compartimentări') + ';',
      'acoperiș: ' + v(c.acoperis, 'acoperiș') + ';', 'termosistem: ' + v(c.termo, 'termoizolații') + ';'
    ]);
    x += B.h3('Pardoseli') + B.p(v(c.pardoseli, 'pardoseli'));
    x += B.h3('Finisaje interioare') + B.p(v(c.finisajeInt, 'finisaje interioare'));
    x += B.h3('Finisaje exterioare') + B.p(v(c.finisajeExt, 'finisaje exterioare'));
    x += B.h3('Tâmplărie exterioară') + B.p(v(c.tamplarieExt, 'tâmplărie exterioară'));
    x += B.h3('Tâmplărie interioară') + B.p(v(c.tamplarieInt, 'tâmplărie interioară') + ' Ușile de pe căile de evacuare nu au praguri mai mari de 2,5 cm și se deschid în sensul evacuării, conform P 118/1-2025 (secțiunea 2.5.5).');
    x += B.h3('Balustrade') + B.p(v(c.balustrade, 'balustrade'));
    x += B.h1('6 ÎNDEPLINIREA CERINȚELOR FUNDAMENTALE');
    x += cerinteFundamentale(X, true);
    if (has(si.separari)) x += B.h3('Elemente de separare rezistente la foc') + B.table(['Spațiu', 'Pereți', 'Planșeu', 'Uși', 'Temei'], cells(si.separari, 5), [2400, 1700, 1500, 1700, 2300]);
    x += B.h1('7 URMĂRIREA COMPORTĂRII ÎN TIMP') + B.p('Urmărirea comportării în timp se face conform programului de urmărire în timp și monitorizare (art. 508 alin. (2) lit. i) din Legea nr. 169/2026) și P 130-1999, de regulă prin urmărire curentă.');
    x += B.h1('8 EGALITATEA DE ȘANSE ȘI DE TRATAMENT') + B.p('Spațiile sunt accesibile tuturor utilizatorilor, fără discriminare, conform NP 051-2012; grupurile sanitare se prevăd separat pe sexe și pentru persoane cu dizabilități, după caz.');
    x += B.h1('9 REFACEREA AMPLASAMENTULUI') + B.p('După terminarea lucrărilor se desființează organizarea de șantier, se evacuează deșeurile prin operatori autorizați și se amenajează spațiile verzi conform planului de situație.');
    x += B.h1('10 LEGISLAȚIE APLICABILĂ') + B.bullets(legiList('PTE', X).map(s => s + ';'));
    x += B.h1('11 PREVEDERI FINALE') + B.p('Orice modificare a soluțiilor din prezentul proiect se face numai cu acordul scris al proiectantului. Executantul are obligația să semnaleze în scris orice neconcordanță între piesele proiectului înainte de executarea lucrării respective.');
    x += semnatura(X);
    return { body: x, title: 'Memoriu arhitectură PT', footer: `${v(g.cod, 'cod')} | Memoriu tehnic arhitectură | Faza PT` };
  }

  /* ---------------- SSI – helpers ---------------- */
  function utilizatori(X) {
    const F = X.F;
    if (!X.niv.length) return { txt: '⟦număr utilizatori pe niveluri⟧', total: null };
    let tot = 0; const out = [];
    X.niv.forEach(n => {
      const u = (num(n.angajati) || 0) + (num(n.vizitatori) || 0); tot += u;
      const fl = F && F.uf && u ? Math.max(1, Math.ceil(u / F.uf)) : null;
      out.push(`${n.nume}: angajați ${n.angajati || 0}, vizitatori ${n.vizitatori || 0} – total ${u} persoane${fl ? ' → ' + fl + (fl > 1 ? ' fluxuri' : ' flux') : ''}`);
    });
    return { txt: out.join('\n'), total: tot, list: out };
  }
  function elementeSI(X) {
    const col = L.t2col(X.si.nsi, num(X.si.hUlt));
    if (col == null) return [['⟦nivel de stabilitate la incendiu⟧', '']];
    return L.T2.map(r => [r.l + ' (' + r.ind + ')', r.v[col] === '-' ? 'fără performanță normată' : `minimum ${r.ind.split(' ')[0]} ${r.v[col]}, clasa de reacție la foc ${col <= 5 ? r.cls : 'conform Tabelul 2'}`]);
  }
  function stingatoare(X) {
    const sd = num(X.c.sd); const n = X.niv.length || 1;
    if (!sd) return '⟦Sd pentru calculul stingătoarelor⟧';
    const k = Math.max(Math.ceil(sd / 250), 2 * n);
    return `minimum ${k} stingătoare portative cu performanța minimă 21A și 113B (un stingător la cel mult 250 m² arie desfășurată, minimum două pe fiecare nivel – art. 3.1.7.1 din P 118/1-2025)`;
  }

  /* ---------------- SSI PRELIMINAR – Anexa 5 OMAI 180/2022 ---------------- */
  function SSI_PRE(P) {
    const X = ctx(P), a = X.a, c = X.c, g = X.g, si = X.si, F = X.F;
    const U = utilizatori(X);
    const T = (rows) => B.table(null, rows, [3000, 6600]);
    let x = B.p('ANEXA nr. 5 la normele metodologice', { jc: 'right', r: { sz: 18 } });
    x += B.title('SCENARIU DE SECURITATE LA INCENDIU PRELIMINAR', 32) + B.sub('(conform Ordinului M.A.I. nr. 180/2022)', 22, 240);
    x += T([
      ['1. Caracteristicile construcției sau amenajării'],
      ['1.1. Datele de identificare', `Denumire conform C.U. nr. ${v(a.cuNr, 'nr. CU')} din ${v(a.cuData, 'data CU')}: ${upQ(v(g.denumire, 'denumire'))}\n\nProprietar/beneficiar: ${v(g.beneficiar, 'beneficiar')}\n\nAdresă investiție: ${v(X.amplasament, 'amplasament')}`],
      ['1.2. Destinația', `funcțiuni principale: ${v(F && F.label, 'destinație')}\n\nfuncțiuni secundare: ${v(c.functiuniSec, 'funcțiuni secundare')}\n\nfuncțiuni conexe: ${v(c.functiuniConexe, 'funcțiuni conexe')}`],
      ['1.3. Categoria de importanță', `${v(si.cc && L.CC_TXT[si.cc] || si.cc, 'clasa de consecințe')} (art. 370 alin. (5) din Legea nr. 169/2026)`],
      ['1.4. Particularități specifice construcției/amenajării', v(c.tema, 'descriere investiție')],
      ['a) tipul clădirii', v(si.tipCladire, 'tip clădire')],
      ['b) tipul parcajului', v(c.parcaje, 'parcaj')],
      ['c) regimul de înălțime și volumul construcției', `Regim de înălțime: ${v(c.regim, 'regim')}\n\nVolum: ${v(c.volum, 'volum')}`],
      ['d) aria construită și desfășurată', `Sc = ${v(mp(c.sc), 'Sc')}; Sd = ${v(mp(c.sd), 'Sd')}` + (X.niv.length ? '\n\n' + X.niv.map(n => `${n.nume}: Sc ${n.sc || '–'} mp, h nivel ${n.h || '–'} m`).join('\n\n') : '')],
      ['e) principalele destinații ale încăperilor', X.niv.length ? X.niv.map(n => n.nume + ': ' + (n.functiuni || '–')).join('\n\n') : '⟦funcțiuni pe niveluri⟧'],
      ['f) compartimente de incendiu', has(si.compartimente) ? cells(si.compartimente, 5).map(r => `${r[0]}: Ac ${r[1]} mp, Ad ${r[2]} mp, V ${r[3]} mc, ${r[4]}`).join('\n\n') : '⟦compartimente⟧'],
      ['g) număr maxim de utilizatori', U.txt.replace(/\n/g, '\n\n') + (U.total ? `\n\nTOTAL: ${U.total} persoane` : '') + (F && F.uf ? `\n\nUf = ${F.uf} (P 118/1-2025, ${F.ufRef})` : '') + `\n\nCapacitate de autoevacuare: ${v(si.autoevacuare, 'capacitate de autoevacuare')}`],
      ['h) capacități de depozitare', v(si.depozitare, 'capacități de depozitare')],
      ['2. Nivelurile riscului de incendiu estimat'],
      ['Risc de incendiu', `Densitatea sarcinii termice s-a determinat conform art. 2.1.2.1 – 2.1.2.3 din P 118/1-2025 (puteri calorifice conform Anexei 9). Rezultă: **${v(si.risc, 'risc de incendiu')}**.` + riscRooms(X)],
      ['3. Nivelurile criteriilor de performanță privind securitatea la incendiu'],
      ['3.1. Rezistența și clasa de reacție la foc a elementelor de construcție', elementeSI(X).map(r => r[0] + ': ' + r[1]).join('\n\n') + '\n\n(valori minime conform Tabelului 2 din P 118/1-2025; se verifică notele tabelului)'],
      ['3.2. Nivelul de stabilitate la incendiu', `Nivel ${v(si.nsi, 'nivel stabilitate')} de stabilitate la incendiu (art. 2.1.3.2 și art. 2.1.3.3 din P 118/1-2025)`],
      ['3.3. Limitarea propagării incendiilor la vecinătăți', (has(si.distante) ? cells(si.distante, 3).map(r => `${r[0]}: ${r[1]} – ${r[2]}`).join('\n\n') : '⟦distanțe față de vecinătăți⟧') + '\n\nDistanțele minime de siguranță: art. 2.2.1.2 și Tabelul 4 din P 118/1-2025.' + (has(si.separari) ? '\n\nLa interior: ' + cells(si.separari, 5).map(r => `${r[0]} – pereți ${r[1]}, planșeu ${r[2]}, uși ${r[3]}${r[4] ? ' (' + r[4] + ')' : ''}`).join('; ') : '')],
      ['3.4. Evacuarea utilizatorilor'],
      ['a) măsuri pentru controlul fumului', v(si.controlFum, 'control fum')],
      ['b) tipul scărilor', v(si.scari, 'scări')],
      ['c) geometria căilor de evacuare', v(si.cai, 'geometria căilor de evacuare') + (X.lung ? `\n\nLungimi maxime de evacuare (${F.tLung} din P 118/1-2025, nivel ${si.nsi}): ${X.lung[0]} m în două direcții; ${X.lung[1]} m într-o direcție.` : (F && F.tLung ? `\n\nLungimi de evacuare conform ${F.tLung} din P 118/1-2025.` : ''))],
      ['d) numărul fluxurilor de evacuare', (F && F.uf ? `Uf = ${F.uf} utilizatori/flux (${F.ufRef}).\n\n` : '') + U.txt.replace(/\n/g, '\n\n')],
      ['3.5. Măsuri pentru persoanele care nu se pot evacua singure', v(si.persDizabilitati, 'măsuri evacuare persoane cu dizabilități')],
      ['3.6. Securitatea forțelor de intervenție'],
      ['a) accesul forțelor de intervenție', v(si.accesInterventie, 'acces forțe de intervenție')],
      ['b) accesuri carosabile și căi de intervenție', (F && F.acces ? `Se asigură ${F.acces.txt} (art. ${F.acces.art} din P 118/1-2025).\n\n` : '') + v(a.accesuri, 'accesuri carosabile')],
      ['c) ascensoare de pompieri', v(si.ascensorPompieri, 'ascensor de pompieri') ],
      ['4. Instalații cu rol în asigurarea cerinței fundamentale „securitate la incendiu”'],
      ['4.1. Hidranți de incendiu interiori', v(si.hidrInt, 'hidranți interiori (P 118/2-2013)')],
      ['4.2. Hidranți de incendiu exteriori', v(si.hidrExt, 'hidranți exteriori (P 118/2-2013)')],
      ['4.3. Instalații automate de stingere cu sprinklere', v(si.sprinkler, 'sprinklere')],
      ['4.4. – 4.7. Alte instalații de stingere', v(si.alteStingere, 'alte instalații de stingere')],
      ['4.8. Instalații de detectare, semnalizare și alarmare (IDSAI)', v(si.detectie, 'detecție (P 118/3-2015)')],
      ['4.9. Instalații de desfumare / control al fumului', v(si.desfumare, 'desfumare (P 118/1-2025 cap. 8)')],
      ['4.10. Instalație electrică', v(si.alimRezerva, 'alimentare receptoare de securitate') + '\n\n' + v(si.ilumSig, 'iluminat de siguranță (I 7-2011)')],
      ['4.11. Instalație de protecție împotriva trăsnetului', v(si.paratrasnet, 'IPT (I 7-2011)')],
      ['5. Măsuri compensatorii'],
      ['Prevederi care nu pot fi respectate / măsuri compensatorii', v(si.compensatorii, 'măsuri compensatorii') ]
    ]);
    x += proiectanti(X);
    return { body: x, title: 'Scenariu SI preliminar', footer: `${v(g.cod, 'cod')} | Scenariu de securitate la incendiu preliminar` };
  }
  function riscRooms(X) {
    const rs = X.rooms.filter(r => has(r.q));
    if (!rs.length) return '';
    return '\n\n' + rs.map(r => `${r.cod} ${r.nume}: q = ${r.q} MJ/m² → risc ${num(r.q) <= 420 ? 'mic' : num(r.q) <= 840 ? 'mijlociu' : 'mare'}`).join('\n\n');
  }
  function proiectanti(X) {
    const g = X.g;
    return B.p('Proiectanți', { jc: 'center', before: 240, r: { b: true } }) + B.table(null, [
      ['Arhitectură', v(g.sefProiect, 'arhitect')],
      ['Instalații sanitare și de stingere a incendiilor', v(g.specSan, 'proiectant instalații sanitare')],
      ['Instalații electrice (curenți tari)', v(g.specEl, 'proiectant instalații electrice')],
      ['Instalații de curenți slabi', v(g.specCs || g.specEl, 'proiectant curenți slabi')],
      ['Instalații de desfumare / ventilare', v(g.specDesf || g.specTerm, 'proiectant desfumare')]
    ], [4800, 4800]);
  }

  /* ---------------- SSI – Anexa 4 OMAI 180/2022 ---------------- */
  function SSI_AUT(P) {
    const X = ctx(P), a = X.a, c = X.c, g = X.g, si = X.si, F = X.F;
    const U = utilizatori(X);
    let x = B.spacer() + B.title('SCENARIU DE SECURITATE LA INCENDIU', 40) + B.sub('întocmit conform structurii-cadru din anexa nr. 4 la Normele metodologice aprobate prin Ordinul M.A.I. nr. 180/2022', 22, 240);
    x += B.center(upQ(v(g.denumire, 'denumire')));
    x += B.kv('Amplasament', v(X.amplasament, 'amplasament')) + B.kv('Beneficiar', v(g.beneficiar, 'beneficiar')) + B.kv('Proiectant general', v(g.proiectant, 'proiectant')) + B.kv('Data', v(g.data, 'data'));
    x += B.h1('1. CARACTERISTICILE CONSTRUCȚIEI SAU AMENAJĂRII', { page: true });
    x += B.h2('1.1. Datele de identificare');
    x += B.p('**A. Date necesare identificării construcției:** ' + upQ(v(g.denumire, 'denumire')) + ', proprietar/beneficiar ' + v(g.beneficiar, 'beneficiar') + ', adresa ' + v(X.amplasament, 'amplasament') + '.');
    x += B.p('**B. Date de contact ale beneficiarului:** ' + v(g.benefContact, 'telefon / e-mail beneficiar') + '.');
    x += B.p('**C. Profilul de activitate și programul de lucru:** ' + v(g.programLucru, 'profil de activitate și program de lucru') + '.');
    x += B.h2('1.2. Destinația') + B.bullets(['funcțiuni principale: ' + v(F && F.label, 'destinație') + ';', 'funcțiuni secundare: ' + v(c.functiuniSec, 'funcțiuni secundare') + ';', 'funcțiuni conexe: ' + v(c.functiuniConexe, 'funcțiuni conexe') + '.']);
    x += B.h2('1.3. Categoria de importanță') + B.p(`${v(si.cc && L.CC_TXT[si.cc] || si.cc, 'clasa de consecințe')}, conform art. 370 din Legea nr. 169/2026.`);
    x += B.h2('1.4. Particularități specifice construcției');
    x += B.p('**a) tipul clădirii:** ' + v(si.tipCladire, 'tip clădire'));
    x += B.p('**b) tipul parcajului:** ' + v(c.parcaje, 'parcaj'));
    x += B.p('**c) caracteristici dimensionale (pe compartimente de incendiu):**');
    x += has(si.compartimente) ? B.table(['Compartiment', 'Aria construită (mp)', 'Aria desfășurată (mp)', 'Volum (mc)', 'Regim de înălțime'], cells(si.compartimente, 5), [2400, 1800, 1800, 1600, 2000]) : B.p('⟦compartimente: nume | Ac | Ad | volum | regim⟧');
    x += B.p(`Înălțimea maximă dintre carosabilul adiacent accesibil autospecialelor și pardoseala ultimului nivel folosibil: ${v(si.hUlt, 'h ultimul nivel folosibil')} m.`);
    x += B.p('**d) numărul maxim de utilizatori, pe niveluri și total:**') + (U.list ? B.bullets(U.list) : B.p(U.txt)) + (U.total ? B.p(`Total: **${U.total} persoane**.`) : '');
    x += B.p('**e) prezența permanentă a persoanelor și capacitatea de autoevacuare:** ' + v(si.autoevacuare, 'autoevacuare'));
    x += B.p('**f) capacități de depozitare:** ' + v(si.depozitare, 'depozitare'));
    x += B.p('**g) numărul căilor de evacuare și al refugiilor:** ' + v(si.nrCaiEvac, 'număr căi de evacuare'));
    x += B.h1('2. IDENTIFICAREA ȘI STABILIREA NIVELURILOR DE RISC DE INCENDIU');
    x += B.p(`A. Riscul de incendiu s-a stabilit pentru fiecare încăpere/grup de încăperi similare și compartiment, conform art. 2.1.2.1 – 2.1.2.3 din P 118/1-2025, pe baza densității sarcinii termice (puteri calorifice conform Anexei 9). Rezultă risc de incendiu **${v(si.risc, 'risc')}**.` + riscRooms(X).replace(/\n\n/g, ' '));
    if (X.rooms.some(r => has(r.q))) x += B.table(['Cod', 'Încăpere', 'Su (mp)', 'q (MJ/m²)', 'Risc'], X.rooms.filter(r => has(r.q)).map(r => [r.cod, r.nume, r.su, r.q, num(r.q) <= 420 ? 'mic' : num(r.q) <= 840 ? 'mijlociu' : 'mare']), [1000, 4000, 1400, 1600, 1600]);
    x += B.p('B. Procese tehnologice și substanțe periculoase (Legea nr. 59/2016): ' + (F && F.id === 'productie' ? v(si.depozitare, 'substanțe periculoase') : 'nu este cazul.'));
    x += B.h1('3. NIVELURILE CRITERIILOR DE PERFORMANȚĂ PRIVIND SECURITATEA LA INCENDIU');
    x += B.h2('3.1. Stabilitatea la foc și limitarea propagării în interior');
    x += B.p(`a) Construcția se încadrează în nivelul **${v(si.nsi, 'nivel')}** de stabilitate la incendiu. Elementele de construcție îndeplinesc condițiile minime din Tabelul 2 al P 118/1-2025:`);
    x += B.table(['Element de construcție', 'Performanță minimă'], elementeSI(X), [4800, 4800]);
    x += B.p('b) Elemente de separare a compartimentelor și protecția golurilor:');
    x += has(si.separari) ? B.table(['Spațiu', 'Pereți', 'Planșeu', 'Uși', 'Temei'], cells(si.separari, 5), [2400, 1700, 1500, 1700, 2300]) : B.p('⟦separări: spațiu | pereți | planșeu | uși | temei⟧');
    if (F && F.tScari) x += B.p(`Casele de scări închise și căile de evacuare orizontale respectă ${F.tScari}, respectiv ${F.tCoridoare} din P 118/1-2025.`);
    x += B.p('c) Măsuri pentru instalațiile electrice, de gaze, ventilare și termice: încăperile tehnice se separă conform secțiunii 2.4.14 din P 118/1-2025; trecerile prin elementele rezistente la foc se etanșează cu sisteme certificate, cu cel puțin aceeași rezistență la foc ca elementul traversat; ghenele respectă secțiunea 2.4.11.');
    x += B.h2('3.2. Limitarea propagării incendiilor la vecinătăți');
    x += B.p('a) Distanțe de siguranță (art. 2.2.1.2 și Tabelul 4 din P 118/1-2025):') + (has(si.distante) ? B.table(['Direcție', 'Distanță', 'Vecinătate'], cells(si.distante, 3), [2000, 1800, 5800]) : B.p('⟦distanțe față de vecinătăți⟧'));
    x += B.p('b) Limitarea propagării pe fațadă și acoperiș (secțiunea 2.3.6 din P 118/1-2025): ' + v(si.fatada, 'măsuri fațadă / acoperiș'));
    x += B.h2('3.3. Evacuarea utilizatorilor');
    x += B.p('**A. a) alcătuirea căilor de evacuare:** ' + v(si.cai, 'alcătuire căi de evacuare'));
    x += B.p('**b) tipul scărilor:** ' + v(si.scari, 'scări'));
    x += B.p('**c) geometria căilor de evacuare:** lățimi conform art. 2.5.11.1 (80 cm / 1 flux, 1,10 m / 2 fluxuri, 1,60 m / 3 fluxuri); înălțimi libere conform secțiunii 2.5.15.');
    x += B.p('**d) lungimile de evacuare:** ' + (X.lung ? `${X.lung[0]} m în două direcții și ${X.lung[1]} m într-o direcție (${F.tLung} din P 118/1-2025, nivel ${si.nsi}). ` : (F && F.tLung ? `conform ${F.tLung} din P 118/1-2025. ` : '')) + (has(si.lungimiProp) ? 'Lungimi realizate: ' + si.lungimiProp : ''));
    x += B.p('**e) numărul fluxurilor de evacuare:** ' + (F && F.uf ? `Uf = ${F.uf} (${F.ufRef}); ` : '') + (U.list ? U.list.join('; ') : U.txt));
    x += B.p('**f) dispozitive de siguranță la uși:** ' + v(si.dispozitiveUsi, 'autoînchidere, bare antipanică (P 118/1-2025, 2.5.5 și Tabelul 128)'));
    x += B.p('**g) marcarea căilor de evacuare:** ' + v(si.marcare, 'marcare (secțiunea 2.5.16)'));
    x += B.p('**B. Persoane care nu se pot evacua singure:** ' + v(si.persDizabilitati, 'măsuri (Anexa 5.5 P 118/1-2025)'));
    x += B.h2('3.4. Securitatea forțelor de intervenție');
    x += B.p('**A.** ' + v(si.accesInterventie, 'acces în clădire'));
    x += B.p('**B.** ' + (F && F.acces ? `Accesul și intervenția autospecialelor se asigură ${F.acces.txt} (art. ${F.acces.art} din P 118/1-2025); căile de circulație carosabile au gabaritul conform art. 2.6.2. ` : '') + v(a.accesuri, 'accesuri carosabile'));
    x += B.p('**C. Ascensoare de pompieri:** ' + v(si.ascensorPompieri, 'ascensor de pompieri'));
    x += B.h1('4. ECHIPAREA ȘI DOTAREA CU INSTALAȚII CU ROL ÎN SECURITATEA LA INCENDIU');
    x += B.p('**A. Instalații de stingere:**') + B.bullets(['hidranți interiori: ' + v(si.hidrInt, 'hidranți interiori') + ';', 'hidranți exteriori: ' + v(si.hidrExt, 'hidranți exteriori') + ';', 'sprinklere: ' + v(si.sprinkler, 'sprinklere') + ';', 'alte instalații: ' + v(si.alteStingere, 'alte instalații') + '.']);
    x += B.p('**B. Detectare, semnalizare și alarmare (e.c.s.):** ' + v(si.detectie, 'detecție'));
    x += B.p('**C. Desfumare / evacuarea fumului și gazelor fierbinți:** ' + v(si.desfumare, 'desfumare'));
    x += B.p('**D. Alimentarea receptoarelor cu rol de securitate la incendiu:** ' + v(si.alimRezerva, 'alimentare de rezervă'));
    x += B.p('**E. Iluminat de siguranță:** ' + v(si.ilumSig, 'iluminat de siguranță'));
    x += B.p('**F. Protecție împotriva trăsnetului:** ' + v(si.paratrasnet, 'IPT'));
    x += B.h1('5. MĂSURI TEHNICO-ORGANIZATORICE PRIVIND EXPLOATAREA CONSTRUCȚIEI');
    x += B.p('**A.** Instrucțiunile de funcționare a instalațiilor cu rol de securitate la incendiu se elaborează de proiectanții și furnizorii instalațiilor și se păstrează în cartea tehnică a construcției.');
    x += B.p('**B.** Verificarea și întreținerea instalațiilor se fac periodic, de personal sau firme atestate, conform reglementărilor specifice (P 118/2-2013, P 118/3-2015, I 7-2011) și instrucțiunilor producătorilor.');
    x += B.p('**C.** Documentele de organizare a apărării împotriva incendiilor se întocmesc conform Ordinului M.A.I. nr. 163/2007' + (F && F.legi.includes('O118_2010') ? ' și Ordinului nr. 118/2010' : '') + (F && F.legi.includes('O179_2023') ? ' și Ordinului nr. 179/2023' : '') + '. ' + (has(si.exploatare) ? si.exploatare : ''));
    x += B.p('**D. Stingătoare:** ' + v(si.stingatoare, stingatoare(X)) + '.');
    x += B.h1('6. MĂSURI COMPENSATORII') + B.p(v(si.compensatorii, 'măsuri compensatorii'));
    x += proiectanti(X);
    return { body: x, title: 'Scenariu de securitate la incendiu', footer: `${v(g.cod, 'cod')} | Scenariu de securitate la incendiu` };
  }

  /* ---------------- OPIS ISU / PC ---------------- */
  function opis(X, kind) {
    const o = X.opis, a = X.a;
    let rows = [['PIESE SCRISE'], ['', 'Cerere-tip', '', '1', 'A4'], ['', 'Certificatul de urbanism', `nr. ${v(a.cuNr, 'nr CU')} din ${v(a.cuData, 'data CU')}`, v(o.cuPagini, 'file'), 'A4'], ['', 'Extras de carte funciară pentru informare', v(a.cf, 'CF'), v(o.cfPagini, 'file'), 'A4']];
    if (kind === 'ISU') rows.push(['', 'Scenariul de securitate la incendiu preliminar', '', v(o.ssiPagini, 'file'), 'A4']);
    else rows.push(['', 'Memoriu tehnic arhitectură', '', v(o.pcPagini, 'file'), 'A4']);
    cells(o.piesePlus, 3).forEach(r => rows.push(['', r[0], r[1], r[2], 'A4']));
    cells(o.verificatori, 4).forEach(r => { rows.push(['', 'Referatul verificatorului ' + r[0], r[3], '1', 'A4']); rows.push(['', `Certificat de atestare verificator ${r[0]} – ${r[1]}`, r[2], '1', 'A4']); });
    rows.push(['PIESE DESENATE']);
    const pl = kind === 'ISU' ? o.planse : (o.planseePC || o.planse);
    if (has(pl)) cells(pl, 3).forEach(r => rows.push(['', r[0], r[1], '1', r[2]])); else rows.push(['', '⟦planșe: titlu | cod | format⟧', '', '', '']);
    let i = 0; rows = rows.map(r => r.length === 1 ? r : [String(++i), ...r.slice(1)]);
    let x = B.title('OPIS', 36) + B.sub('cu documentele depuse pentru eliberarea ' + (kind === 'ISU' ? 'avizului/autorizației de securitate la incendiu' : 'avizului de protecție civilă'), 24, 240);
    x += B.center(upQ(v(X.g.denumire, 'denumire')), { sz: 20 });
    x += B.table(['Nr. crt.', 'Denumirea documentului', 'Seria, codul, nr. de înregistrare', 'Nr. file', 'Format'], rows, [800, 4600, 2400, 900, 900]);
    x += B.p('Data ...............                                   Semnătura ................', { before: 240 });
    return x;
  }
  function OPIS_ISU(P) { const X = ctx(P); return { body: opis(X, 'ISU'), title: 'Opis ISU', footer: `${v(X.g.cod, 'cod')} | Opis aviz ISU` }; }
  function OPIS_PC(P) { const X = ctx(P); return { body: opis(X, 'PC'), title: 'Opis protecție civilă', footer: `${v(X.g.cod, 'cod')} | Opis aviz protecție civilă` }; }

  /* ---------------- MEMORIU PROTECȚIE CIVILĂ ---------------- */
  function PC_MEM(P) {
    const X = ctx(P), a = X.a, c = X.c, g = X.g, si = X.si, pc = X.pc;
    const U = utilizatori(X);
    let x = cover(X, 'DOCUMENTAȚIE TEHNICĂ', 'PENTRU OBȚINEREA AVIZULUI DE PROTECȚIE CIVILĂ', null);
    x += B.h1('1 DATE GENERALE', { page: true }) + identificare(X);
    x += B.h1('2 DATE DE IDENTIFICARE A OBIECTIVULUI');
    x += B.h2('Regimul juridic') + B.p(v(a.regimJuridic, 'regim juridic'));
    x += B.h2('Regimul economic') + B.p(`Folosința actuală: ${v(a.folosinta, 'folosință')}. Destinația stabilită prin documentația de urbanism: ${v(a.destinatiePUG, 'destinație PUG/PUZ')}.`);
    x += B.h2('Regimul tehnic') + B.p(v(a.docUrb, 'reglementări urbanistice'));
    x += B.h2('Particularități ale amplasamentului') + B.p(v(a.teren, 'teren')) + vecinatati(X);
    x += B.h1('3 DESCRIEREA GENERALĂ A LUCRĂRILOR');
    x += B.p('Prezentul memoriu tehnic a fost întocmit în vederea obținerii avizului de protecție civilă, conform Ordinului M.A.I. nr. 180/2022.');
    x += B.p(v(c.tema, 'descrierea investiției'));
    x += B.table(['Caracteristică', 'Valoare'], [['Regim de înălțime', v(c.regim, 'regim')], ['Suprafață construită', v(mp(c.sc), 'Sc')], ['Suprafață desfășurată', v(mp(c.sd), 'Sd')], ['Clasa de consecințe', v(si.cc, 'CC')], ['Clasa de importanță (P 100-1/2013)', v(si.clasaImp, 'clasa de importanță')], ['Nivel de stabilitate la incendiu (P 118/1-2025)', v(si.nsi, 'NSI')], ['P.O.T. / C.U.T. propus', v(c.potProp, 'POT') + ' / ' + v(c.cutProp, 'CUT')], ['Sistem constructiv', v(c.structura, 'structură')]], [4800, 4800]);
    x += B.h3('Structura funcțională') + nivTable(X);
    x += B.h1('4 MĂSURI SPECIALE PENTRU PROTECȚIA CIVILĂ');
    if (pc.areAdapost !== 'da') x += B.p(v(pc.calcul, 'justificare: nu se prevede adăpost / scutire'));
    else {
      x += B.p(`Se prevede adăpost de protecție civilă ${v(pc.tip, 'tip adăpost')}, cu suprafața utilă de ${v(pc.suprafata, 'suprafață')} mp și volumul de ${v(pc.volum, 'volum')} mc, alcătuit din ${v(pc.nrIncaperi, 'nr. încăperi')} încăperi.`);
      x += B.p(`Capacitatea de adăpostire: ${v(pc.capacitate, 'capacitate')} persoane. ${v(pc.calcul, 'calculul capacității (ex.: 2/3 din personal, 1 mp/persoană)')}` + (U.total ? ` Numărul total de utilizatori estimați ai construcției este de ${U.total} persoane.` : ''));
      x += B.bullets([
        'accesul în adăpost: ' + v(pc.usa, 'acces / ușă etanșă') + ';',
        'ieșirea de salvare: ' + v(pc.iesire, 'ieșire de salvare') + ';',
        'pereți și planșeu: ' + v(pc.pereti, 'pereți') + '; ' + v(pc.planseu, 'planșeu') + ';',
        'grup sanitar / cabine: ' + v(pc.cabine, 'cabine WC') + '.'
      ]);
      x += B.p('La execuție se respectă Normele tehnice privind proiectarea și executarea adăposturilor de protecție civilă în subsolul construcțiilor noi, Legea nr. 481/2004 și normele generale de securitate a muncii și de apărare împotriva incendiilor.');
    }
    x += B.h1('LEGISLAȚIE APLICABILĂ') + B.bullets(legiList('PC', X).map(s => s + ';'));
    x += semnatura(X);
    return { body: x, title: 'Memoriu protecție civilă', footer: `${v(g.cod, 'cod')} | Memoriu tehnic – aviz protecție civilă` };
  }

  /* ---------------- tokeni pentru documentele din model ---------------- */
  function tokens(P) {
    const X = ctx(P), g = X.g, si = X.si, c = X.c;
    const fazaTxt = { CU: 'C.U.', DTAC: 'D.T.A.C.', PTE: 'P.T.E.', PT: 'P.T.' }[g.faza] || g.faza;
    const extra = X.F ? X.F.legi.map(id => L.LEGI[id]).filter(Boolean).join('; ') : '';
    return {
      FAZA: fazaTxt, DENUMIRE: g.denumire, BENEFICIAR: g.beneficiar, BENEFICIAR2: g.beneficiar2 || '', ADRESA: X.amplasament,
      ELABORATOR: [g.proiectant, g.proiectantAdresa].filter(Boolean).join(', '), ELABORATOR_SCURT: g.proiectant,
      PROIECTANT_ARH: g.proiectant, PROIECTANT_STR: g.specRez, PROIECTANT_INST: [g.specSan, g.specEl].filter(Boolean).join(', '),
      COD: g.cod, DATA: g.data, SEF_PROIECT: g.sefProiect, INTOCMIT: g.intocmit || g.sefProiect,
      CC: si.cc, CLASA_IMP: si.clasaImp, NSI: si.nsi, RISC: si.risc, REGIM: c.regim,
      LEGI_FUNCTIUNE: extra || 'Reglementările specifice funcțiunii, conform memoriului tehnic.',
      SCOP: c.tema
    };
  }

  // verificare completitudine
  function lipsuri(id, P) {
    const gens = { CU, DTAC_ARH, PTE_ARH, SSI_PRE, SSI_AUT, OPIS_ISU, OPIS_PC, PC_MEM };
    if (gens[id]) {
      const r = gens[id](P);
      const m = [...r.body.matchAll(/\[de completat: ([^\]]+)\]/g)].map(x => x[1]);
      return [...new Set(m)];
    }
    const t = tokens(P);
    const need = { FAZE: ['FAZA', 'DENUMIRE', 'BENEFICIAR', 'ADRESA', 'ELABORATOR'], URM: ['FAZA', 'DENUMIRE', 'BENEFICIAR', 'ADRESA', 'ELABORATOR', 'SCOP'], CS_ARH: ['FAZA', 'DENUMIRE', 'BENEFICIAR', 'ADRESA', 'COD', 'DATA', 'SEF_PROIECT', 'CC', 'CLASA_IMP', 'NSI', 'RISC', 'REGIM'] }[id] || [];
    return need.filter(k => !has(t[k]));
  }

  return { CU, DTAC_ARH, PTE_ARH, SSI_PRE, SSI_AUT, OPIS_ISU, OPIS_PC, PC_MEM, tokens, lipsuri, utilizatori: P => utilizatori(ctx(P)), elementeSI: P => elementeSI(ctx(P)), ctx };
})();
