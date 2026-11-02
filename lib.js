/* Biblioteca de date: legislație, profiluri de funcțiune, valori P118/1-2025.
   Sursă: P118/1-2025 (Ordinul MDLPA nr. 267/2025), Legea nr. 169/2026 (CATUC), OMAI nr. 180/2022. */
window.LIB = (function () {
  const LEGI = {
    L169: 'Legea nr. 169/2026 privind Codul amenajării teritoriului, urbanismului și construcțiilor (CATUC)',
    L10: 'Legea nr. 10/1995 privind calitatea în construcții, republicată – dispozițiile rămase în vigoare',
    HG766: 'H.G. nr. 766/1997 pentru aprobarea unor regulamente privind calitatea în construcții',
    HG343: 'H.G. nr. 343/2017 pentru aprobarea Regulamentului de recepție a construcțiilor',
    HG525: 'H.G. nr. 525/1996 pentru aprobarea Regulamentului general de urbanism, republicată – în măsura în care nu contravine Legii nr. 169/2026',
    L307: 'Legea nr. 307/2006 privind apărarea împotriva incendiilor, republicată',
    HG571: 'H.G. nr. 571/2016 pentru aprobarea categoriilor de construcții și amenajări care se supun avizării și/sau autorizării privind securitatea la incendiu',
    OMAI180: 'Ordinul M.A.I. nr. 180/2022 pentru aprobarea Normelor metodologice privind avizarea și autorizarea de securitate la incendiu și protecție civilă',
    OMAI163: 'Ordinul M.A.I. nr. 163/2007 pentru aprobarea Normelor generale de apărare împotriva incendiilor',
    P118_1: 'P 118/1-2025 – Normativ privind securitatea la incendiu a construcțiilor (aprobat prin Ordinul MDLPA nr. 267/2025)',
    P118_2: 'P 118/2-2013 – Normativ privind securitatea la incendiu a construcțiilor, Partea a II-a – Instalații de stingere, cu modificările aduse prin Ordinul nr. 6026/2018',
    P118_3: 'P 118/3-2015 – Normativ privind securitatea la incendiu a construcțiilor, Partea a III-a – Instalații de detectare, semnalizare și avertizare incendiu, cu modificările aduse prin Ordinul nr. 6025/2018',
    C300: 'C 300-1994 – Normativ de prevenire și stingere a incendiilor pe durata executării lucrărilor de construcții și instalații aferente acestora',
    I7: 'I 7-2011 – Normativ pentru proiectarea, execuția și exploatarea instalațiilor electrice aferente clădirilor',
    NP051: 'NP 051-2012 – Normativ privind adaptarea clădirilor civile și spațiului urban la nevoile individuale ale persoanelor cu handicap',
    NP068: 'NP 068-2002 – Normativ privind proiectarea clădirilor civile din punct de vedere al cerinței de siguranță în exploatare',
    NP063: 'NP 063-2002 – Normativ privind criteriile de performanță specifice rampelor și scărilor pentru circulația pietonală în construcții',
    C107: 'C 107-2005 – Normativ privind calculul termotehnic al elementelor de construcție ale clădirilor',
    MC001: 'Mc 001-2022 – Metodologie de calcul al performanței energetice a clădirilor',
    L372: 'Legea nr. 372/2005 privind performanța energetică a clădirilor, republicată',
    C125: 'C 125-2013 – Normativ privind proiectarea și executarea măsurilor de izolare fonică și a tratamentelor acustice în clădiri',
    P100: 'P 100-1/2013 – Cod de proiectare seismică. Partea I – Prevederi de proiectare pentru clădiri',
    CR0: 'CR 0-2012 – Cod de proiectare. Bazele proiectării construcțiilor',
    P130: 'P 130-1999 – Normativ privind urmărirea comportării în timp a construcțiilor',
    L319: 'Legea nr. 319/2006 a securității și sănătății în muncă',
    HG1091: 'H.G. nr. 1091/2006 privind cerințele minime de securitate și sănătate pentru locul de muncă',
    HG300: 'H.G. nr. 300/2006 privind cerințele minime de securitate și sănătate pentru șantierele temporare sau mobile',
    OUG195: 'O.U.G. nr. 195/2005 privind protecția mediului, cu modificările și completările ulterioare',
    L292: 'Legea nr. 292/2018 privind evaluarea impactului anumitor proiecte publice și private asupra mediului',
    OUG92: 'O.U.G. nr. 92/2021 privind regimul deșeurilor',
    OMS119: 'Ordinul Ministerului Sănătății nr. 119/2014 pentru aprobarea Normelor de igienă și sănătate publică privind mediul de viață al populației',
    L481: 'Legea nr. 481/2004 privind protecția civilă, republicată',
    OG43: 'O.G. nr. 43/2000 privind protecția patrimoniului arheologic, republicată',
    L422: 'Legea nr. 422/2001 privind protejarea monumentelor istorice, republicată',
    P132: 'P 132-1993 – Normativ pentru proiectarea parcajelor de autoturisme în localități urbane',
    NP127: 'NP 127-2009 – Normativ de securitate la incendiu a parcajelor subterane pentru autoturisme – în măsura în care nu contravine P 118/1-2025',
    L59: 'Legea nr. 59/2016 privind controlul asupra pericolelor de accident major în care sunt implicate substanțe periculoase',
    L114: 'Legea nr. 114/1996 a locuinței, republicată',
    NP057: 'NP 057-2002 – Normativ privind proiectarea clădirilor de locuințe',
    OMS914: 'Ordinul Ministerului Sănătății nr. 914/2006 pentru aprobarea normelor privind condițiile pe care trebuie să le îndeplinească un spital în vederea obținerii autorizației sanitare de funcționare',
    NP015: 'NP 015-1997 – Normativ privind proiectarea și verificarea construcțiilor spitalicești și a instalațiilor aferente acestora',
    NP021: 'NP 021-2022 – Normativ privind proiectarea, executarea și exploatarea construcțiilor ce conțin spații pentru furnizarea asistenței medicale ambulatorii',
    OMS1456: 'Ordinul Ministerului Sănătății nr. 1456/2020 pentru aprobarea Normelor de igienă din unitățile pentru ocrotirea, educarea, instruirea, odihna și recreerea copiilor și tinerilor',
    OANT65: 'Ordinul președintelui Autorității Naționale pentru Turism nr. 65/2013 pentru aprobarea Normelor metodologice privind eliberarea certificatelor de clasificare a structurilor de primire turistice',
    O118_2010: 'Ordinul nr. 118/2010 pentru aprobarea Dispozițiilor generale de apărare împotriva incendiilor la structuri de primire turistice, unități de alimentație publică și unități de comerț',
    O179_2023: 'Ordinul nr. 179/2023 privind dispozițiile generale de apărare împotriva incendiilor la spații și clădiri în care se organizează și funcționează servicii sociale',
    ANSVSA111: 'Ordinul A.N.S.V.S.A. nr. 111/2008 privind aprobarea Normei sanitare veterinare și pentru siguranța alimentelor privind procedura de înregistrare sanitară veterinară și pentru siguranța alimentelor a activităților de producție, procesare, depozitare, transport și/sau comercializare a produselor de origine animală',
    R305: 'Regulamentul (UE) nr. 305/2011 privind produsele pentru construcții și H.G. nr. 668/2017 privind stabilirea condițiilor pentru comercializarea produselor pentru construcții',
    PCNORME: 'Normele tehnice privind proiectarea și executarea adăposturilor de protecție civilă în subsolul construcțiilor noi'
  };

  // Acte comune, pe tipuri de document
  const COMUNE = {
    CU: ['L169', 'L10', 'HG525', 'OUG195', 'L292', 'L307', 'HG571', 'P118_1', 'P100', 'NP051', 'OG43', 'OMS119'],
    DTAC: ['L169', 'L10', 'HG766', 'HG525', 'L307', 'HG571', 'OMAI180', 'P118_1', 'P118_2', 'P118_3', 'I7', 'P100', 'CR0', 'NP068', 'NP063', 'NP051', 'C107', 'MC001', 'L372', 'C125', 'OMS119', 'OUG195', 'OUG92', 'L319', 'HG300', 'C300'],
    PTE: ['L169', 'L10', 'HG766', 'HG343', 'L307', 'HG571', 'OMAI180', 'OMAI163', 'P118_1', 'P118_2', 'P118_3', 'C300', 'I7', 'P100', 'CR0', 'NP068', 'NP063', 'NP051', 'C107', 'MC001', 'L372', 'C125', 'P130', 'OMS119', 'OUG195', 'OUG92', 'L319', 'HG1091', 'HG300', 'R305'],
    SSI: ['L307', 'HG571', 'OMAI180', 'OMAI163', 'P118_1', 'P118_2', 'P118_3', 'I7', 'C300'],
    PC: ['L481', 'OMAI180', 'PCNORME', 'L307', 'P118_1']
  };

  /* Tabelul 2 P118/1-2025 – condiții minime (minute) pe niveluri de stabilitate la incendiu.
     Coloane: I(h≥125), I(75≤h<125), I(45<h<75), I(28<h≤45), I(h≤28), II, II(+), III, III(+), IV, V */
  const T2_COLS = ['I_125', 'I_75', 'I_45', 'I_28', 'I', 'II', 'IIp', 'III', 'IIIp', 'IV', 'V'];
  const T2 = [
    { k: 'stalpi', l: 'Stâlpi', ind: 'R', v: [240, 180, 180, 120, 120, 120, 90, 60, 45, 30, '-'], cls: 'A1' },
    { k: 'grinzi', l: 'Grinzi', ind: 'R', v: [180, 120, 120, 90, 90, 90, 90, 60, 45, 30, '-'], cls: 'A1' },
    { k: 'plansee', l: 'Planșee, inclusiv planșee-terasă care constituie căi de evacuare sau preiau încărcări suplimentare', ind: 'REI', v: [120, 120, 120, 90, 90, 90, 90, 60, 45, 30, '-'], cls: 'A1' },
    { k: 'terasa', l: 'Planșee-terasă care nu constituie căi de evacuare și preiau încărcări numai din zăpadă', ind: 'RE', v: [120, 90, 90, 60, 60, 60, 45, 45, 30, 15, '-'], cls: 'A1' },
    { k: 'portanti', l: 'Pereți portanți (structurali) cu rol de limitare a propagării focului', ind: 'REI', v: [240, 180, 180, 120, 120, 120, 90, 60, 45, 30, '-'], cls: 'A1' },
    { k: 'sectorizare', l: 'Pereți de sectorizare cu rol de limitare a propagării focului în interiorul compartimentului de incendiu', ind: 'REI/EI', v: [180, 180, 120, 120, 120, 90, 90, 60, 45, 30, '-'], cls: 'A1 sau A2-s1,d0' },
    { k: 'despartitori', l: 'Pereți neportanți despărțitori interiori cu rol de limitare a propagării focului', ind: 'EI', v: [90, 60, 60, 60, 60, 45, 45, 30, 15, 15, '-'], cls: 'A1 sau A2-s1,d0' },
    { k: 'exteriori', l: 'Pereți exteriori neportanți (exceptând tâmplăria, pereții cortină, fațadele ventilate și duble)', ind: 'E (o-i)', v: [60, 45, 30, 30, 15, 15, 15, 15, 15, '-', '-'], cls: 'A1 sau A2-s1,d0' },
    { k: 'sarpanta', l: 'Șarpante ale acoperișurilor, acoperișuri autoportante', ind: 'R', v: [120, 90, 90, 60, 60, 60, 45, 45, 30, 15, '-'], cls: 'A1' }
  ];
  function t2col(nsi, h) {
    if (nsi === 'I') { h = +h || 0; return h >= 125 ? 0 : h >= 75 ? 1 : h > 45 ? 2 : h > 28 ? 3 : 4; }
    const m = { 'II': 5, 'II(+)': 6, 'III': 7, 'III(+)': 8, 'IV': 9, 'V': 10 };
    return m[nsi];
  }

  /* Profiluri de funcțiune: capitolul P118/1-2025, tabele și articole specifice, acte specifice. */
  const F = [
    {
      id: 'locuinta_unifamiliala', label: 'Locuință unifamilială', grup: 'Locuire',
      sec: '3.2.1', secTitlu: 'Clădiri de locuit supraterane',
      tUtil: 'Tabelul 23', uf: 80, ufRef: 'Tabelul 51, nr. crt. 3',
      tScari: 'Tabelul 54', tCoridoare: 'Tabelul 55', tLung: 'Tabelul 56',
      lung: { I: [50, 25], II: [50, 25], III: [25, 12], IV: [25, 12], V: [12, 8] },
      acces: { art: '3.2.1.13', txt: 'cel puțin pe o latură și, totodată, cel puțin pe 15% din perimetrul pereților exteriori (h ≤ 8 m), respectiv pe 25% din perimetru (h > 8 m)' },
      avizISU: 'de regulă nu se supune avizării ISU (se verifică încadrarea conform H.G. nr. 571/2016)',
      legi: ['L114', 'NP057'], cc: 'CC1 / CC2',
      igiena: 'Încăperile de locuit vor avea iluminat și ventilare naturală directă, conform Legii nr. 114/1996 (anexa nr. 1) și Ordinului M.S. nr. 119/2014.'
    },
    {
      id: 'locuinte_colective', label: 'Locuințe colective', grup: 'Locuire',
      sec: '3.2.1', secTitlu: 'Clădiri de locuit supraterane',
      tUtil: 'Tabelul 23', uf: 80, ufRef: 'Tabelul 51, nr. crt. 3',
      tScari: 'Tabelul 54', tCoridoare: 'Tabelul 55', tLung: 'Tabelul 56',
      lung: { I: [50, 25], II: [50, 25], III: [25, 12], IV: [25, 12], V: [12, 8] },
      acces: { art: '3.2.1.13', txt: 'cel puțin pe o latură și, totodată, cel puțin pe 25% din perimetrul pereților exteriori (h > 8 m)' },
      legi: ['L114', 'NP057'], cc: 'CC2',
      igiena: 'Apartamentele vor respecta exigențele minimale din anexa nr. 1 la Legea nr. 114/1996 și normele de igienă aprobate prin Ordinul M.S. nr. 119/2014 (însorire, iluminat natural, ventilare).'
    },
    {
      id: 'administrativ', label: 'Clădire administrativă / birouri', grup: 'Civil',
      sec: '3.2.2', secTitlu: 'Clădiri administrative supraterane',
      tUtil: 'Tabelul 24', uf: 70, ufRef: 'Tabelul 51, nr. crt. 2',
      tScari: 'Tabelul 57 (art. 3.2.2.6)', tCoridoare: 'Tabelul 58 (art. 3.2.2.7)', tLung: 'Tabelul 60',
      lung: { I: [45, 23], II: [45, 23], III: [30, 16], IV: [16, 10], V: [10, 6] },
      acces: { art: '3.2.2.10', txt: 'cel puțin pe o latură și, totodată, cel puțin pe 25% din perimetrul pereților exteriori' },
      arts: ['3.2.2.1', '3.2.2.2', '3.2.2.4', '3.2.2.5'],
      legi: ['HG1091'], cc: 'CC2',
      igiena: 'Spațiile de lucru vor asigura iluminat natural și artificial, ventilare și microclimat conform H.G. nr. 1091/2006 și Ordinului M.S. nr. 119/2014.'
    },
    {
      id: 'comert', label: 'Comerț (magazine, centre comerciale)', grup: 'Civil',
      sec: '3.2.3', secTitlu: 'Clădiri pentru comerț supraterane',
      tUtil: 'Tabelele 25–26', uf: 70, ufRef: 'Tabelul 51, nr. crt. 2',
      tScari: 'Tabelul 61', tCoridoare: 'Tabelele 62–63', tLung: 'Tabelul 64',
      lung: { I: [42, 21], II: [42, 21], III: [21, 15], IV: [15, 10], V: [10, 6] },
      acces: { art: '3.2.3.20', txt: 'cel puțin integral pe două laturi alăturate și, totodată, cel puțin pe 50% din perimetrul pereților exteriori' },
      arts: ['3.2.3.1', '3.2.3.2'],
      sali: 'Spațiile comerciale care se încadrează în categoria sălilor aglomerate respectă și prevederile cap. 4.3 din P 118/1-2025 (art. 3.2.3.2 alin. (2)).',
      legi: ['HG1091', 'ANSVSA111', 'O118_2010'], cc: 'CC2',
      igiena: 'Spațiile de vânzare și anexele (depozitare, recepție marfă, grup social) respectă normele de igienă din Ordinul M.S. nr. 119/2014 și, pentru produse alimentare, normele sanitar-veterinare aplicabile.'
    },
    {
      id: 'alimentatie', label: 'Alimentație publică (restaurant, bar)', grup: 'Civil',
      sec: '3.2.3', secTitlu: 'Clădiri pentru comerț supraterane (alimentație publică)',
      tUtil: 'Tabelul 27', uf: 70, ufRef: 'Tabelul 51, nr. crt. 2',
      tScari: 'Tabelul 61', tCoridoare: 'Tabelele 62–63', tLung: 'Tabelul 64',
      lung: { I: [42, 21], II: [42, 21], III: [21, 15], IV: [15, 10], V: [10, 6] },
      acces: { art: '3.2.3.20', txt: 'cel puțin integral pe două laturi alăturate și, totodată, cel puțin pe 50% din perimetrul pereților exteriori' },
      sali: 'Sălile de consumație cu capacitate care le încadrează în categoria sălilor aglomerate respectă și cap. 4.3 din P 118/1-2025.',
      legi: ['HG1091', 'ANSVSA111', 'O118_2010'], cc: 'CC2',
      igiena: 'Fluxurile tehnologice (materie primă – preparare – servire – deșeuri) se separă conform normelor sanitare și sanitar-veterinare aplicabile.'
    },
    {
      id: 'sanatate', label: 'Sănătate (spital, policlinică, clinică)', grup: 'Civil',
      sec: '3.2.4', secTitlu: 'Clădiri pentru sănătate supraterane',
      tUtil: 'Tabelul 29', uf: 50, ufRef: 'Tabelul 51, nr. crt. 1 (persoane care nu se pot evacua singure)',
      tScari: 'Tabelul 65', tCoridoare: 'Tabelul 66', tLung: 'Tabelul 67 (transport cu targa) / Tabelul 68',
      lung: { I: [38, 18], II: [38, 18], III: [18, 12], IV: [12, 8], V: [8, 6] },
      acces: { art: '3.2.4.11', txt: 'cel puțin integral pe două laturi alăturate și, totodată, cel puțin pe 50% din perimetrul pereților exteriori' },
      arts: ['3.2.4.1'], nsiMin: 'II',
      nota: 'Clădirile pentru sănătate destinate persoanelor care nu se pot evacua singure trebuie să îndeplinească criteriile de încadrare în nivelul I sau II de stabilitate la incendiu (art. 3.2.4.1 alin. (3)).',
      legi: ['OMS914', 'NP015', 'NP021', 'HG1091'], cc: 'CC3',
      igiena: 'Circuitele funcționale (pacienți, personal, materiale curate/murdare, deșeuri medicale) se separă conform normelor Ministerului Sănătății.'
    },
    {
      id: 'social', label: 'Servicii sociale (cămine bătrâni, centre rezidențiale)', grup: 'Civil',
      sec: '3.2.4', secTitlu: 'Clădiri pentru sănătate supraterane (cămine de bătrâni și persoane cu dizabilități)',
      tUtil: 'Tabelul 29', uf: 50, ufRef: 'Tabelul 51, nr. crt. 1',
      tScari: 'Tabelul 65', tCoridoare: 'Tabelul 66', tLung: 'Tabelul 67 / Tabelul 68',
      lung: { I: [38, 18], II: [38, 18], III: [18, 12], IV: [12, 8], V: [8, 6] },
      acces: { art: '3.2.4.11', txt: 'cel puțin integral pe două laturi alăturate și, totodată, cel puțin pe 50% din perimetrul pereților exteriori' },
      nsiMin: 'II', nota: 'Pentru persoanele care nu se pot evacua singure se aplică art. 3.2.4.1 alin. (3) (nivel I sau II de stabilitate la incendiu).',
      legi: ['O179_2023', 'HG1091'], cc: 'CC3',
      igiena: 'Spațiile de cazare, de servire a mesei și grupurile sanitare respectă normele de igienă aplicabile serviciilor sociale și Ordinul M.S. nr. 119/2014.'
    },
    {
      id: 'cultura', label: 'Cultură (teatru, muzeu, bibliotecă, sală conferințe)', grup: 'Civil',
      sec: '3.2.5', secTitlu: 'Clădiri pentru cultură supraterane',
      tUtil: 'Tabelul 30', uf: 70, ufRef: 'Tabelul 51, nr. crt. 2',
      tScari: 'Tabelul 69', tCoridoare: 'Tabelul 70', tLung: 'Tabelul 72',
      lung: { I: [40, 20], II: [40, 20], III: [30, 16], IV: [15, 10], V: [10, 6] },
      acces: { art: '3.2.5.9', txt: 'cel puțin pe o latură și, totodată, cel puțin pe 25% din perimetrul pereților exteriori' },
      sali: 'Sălile care se încadrează în categoria sălilor aglomerate respectă cap. 4.3 din P 118/1-2025.',
      legi: ['HG1091'], cc: 'CC2 / CC3'
    },
    {
      id: 'invatamant', label: 'Învățământ (grădiniță, școală, universitate)', grup: 'Civil',
      sec: '3.2.6', secTitlu: 'Clădiri pentru învățământ supraterane',
      tUtil: 'Tabelul 31', uf: 70, ufRef: 'Tabelul 51, nr. crt. 2',
      tScari: 'Tabelele 73–74', tCoridoare: 'Tabelele 75–76', tLung: 'Tabelul 77',
      lung: null,
      acces: { art: '3.2.6.12', txt: 'cel puțin pe o latură și pe 25% din perimetrul pereților exteriori (capacitate < 200 utilizatori), respectiv pe două laturi (capacitate ≥ 200 utilizatori)' },
      legi: ['OMS1456'], cc: 'CC3',
      igiena: 'Sălile de grupă/clasă, grupurile sanitare și spațiile anexe respectă Normele de igienă aprobate prin Ordinul M.S. nr. 1456/2020.'
    },
    {
      id: 'turism', label: 'Turism (hotel, pensiune)', grup: 'Civil',
      sec: '3.2.7', secTitlu: 'Clădiri pentru turism supraterane',
      tUtil: 'Tabelul 32', uf: 80, ufRef: 'Tabelul 51, nr. crt. 3',
      tScari: 'Tabelul 78', tCoridoare: 'Tabelul 79', tLung: 'Tabelul 80',
      lung: { I: [40, 20], II: [40, 20], III: [30, 16], IV: [15, 10], V: [10, 6] },
      acces: { art: '3.2.7.8', txt: 'cel puțin integral pe două laturi alăturate și pe 50% din perimetru (peste 50 de locuri de cazare), respectiv pe o latură și 25% din perimetru (sub 50 de locuri)' },
      arts: ['3.2.7.6', '3.2.7.7'],
      legi: ['OANT65', 'O118_2010', 'HG1091'], cc: 'CC2'
    },
    {
      id: 'cult', label: 'Lăcaș de cult', grup: 'Civil',
      sec: '3.2.8', secTitlu: 'Clădiri de cult supraterane',
      tUtil: 'Tabelul 33', uf: 70, ufRef: 'Tabelul 51, nr. crt. 2', tLung: 'Tabelul 81', lung: null,
      acces: { art: '3.2.8.8', txt: 'cel puțin pe o latură și, totodată, cel puțin pe 25% din perimetrul pereților exteriori' },
      legi: [], cc: 'CC2'
    },
    {
      id: 'sport', label: 'Sport (sală de sport, bazin)', grup: 'Civil',
      sec: '3.2.9', secTitlu: 'Clădiri de sport supraterane',
      tUtil: 'Tabelul 34', uf: 70, ufRef: 'Tabelul 51, nr. crt. 2',
      tScari: 'Tabelul 82', tCoridoare: 'Tabelul 83', tLung: 'Tabelul 84',
      lung: { I: [100, 50], II: [100, 50], III: [75, 30], IV: [50, 25], V: [25, 15] },
      acces: { art: '3.2.9.7', txt: 'cel puțin integral pe două laturi alăturate și, totodată, cel puțin pe 50% din perimetrul pereților exteriori' },
      sali: 'Sălile de sport încadrate în categoria sălilor aglomerate respectă cap. 4.3 din P 118/1-2025.',
      legi: ['HG1091'], cc: 'CC2 / CC3'
    },
    {
      id: 'parcaj', label: 'Parcaj autoturisme', grup: 'Civil',
      sec: '3.2.11', secTitlu: 'Parcaje pentru autoturisme',
      tUtil: 'Tabelul 36', uf: 70, ufRef: 'Tabelul 51, nr. crt. 2', tLung: 'Tabelul 88',
      lung: { I: [40, 25], II: [40, 25], III: [30, 20], IV: [16, 12], V: [16, 12] },
      arts: ['3.2.11.1'],
      legi: ['P132', 'NP127'], cc: 'CC2'
    },
    {
      id: 'productie', label: 'Producție și/sau depozitare', grup: 'Producție',
      sec: '6', secTitlu: 'Construcții de producție și/sau depozitare (cap. 6)',
      tUtil: 'Tabelul 39', uf: null, ufRef: 'Tabelul 115', tLung: 'Tabelul 116', lung: null,
      acces: { art: '6.2.1.9', txt: 'cel puțin pe o latură, astfel încât să se asigure accesul și intervenția autospecialelor pe cel puțin 25% din perimetrul pereților exteriori (construcții de tip obișnuit)' },
      arts: ['6.1.1.1'], t2: 'Tabelul 3',
      legi: ['L59', 'HG1091'], cc: 'CC2',
      igiena: 'Fluxul tehnologic, spațiile sociale și vestiarele respectă H.G. nr. 1091/2006 și normele de igienă aplicabile.'
    },
    {
      id: 'sali_aglomerate', label: 'Clădire cu săli aglomerate', grup: 'Special',
      sec: '4.3', secTitlu: 'Clădiri civile cu săli aglomerate',
      tUtil: 'Tabelul 98 (categorii)', uf: null, ufRef: 'Tabelul 109', tLung: 'Tabelul 110', lung: null,
      acces: { art: '4.3.6.1', txt: 'cel puțin pe două laturi, astfel încât să se asigure accesul și intervenția autospecialelor pe cel puțin 50% din perimetrul pereților exteriori' },
      arts: ['4.3.1.1'], legi: ['HG1091'], cc: 'CC3'
    },
    {
      id: 'inalta', label: 'Clădire civilă înaltă', grup: 'Special',
      sec: '4.1', secTitlu: 'Clădiri civile supraterane înalte',
      tScari: 'Tabelul 91', tCoridoare: 'Tabelul 92', tLung: 'Tabelul 93', lung: null,
      legi: ['HG1091'], cc: 'CC3'
    },
    {
      id: 'mixt', label: 'Funcțiuni mixte', grup: 'Special',
      sec: '7', secTitlu: 'Construcții cu funcțiuni mixte (cap. 7)',
      arts: ['7.1.1'], lung: null,
      nota: 'Funcțiunea distinctă care depășește 50% din aria desfășurată totală determină încadrarea; funcțiunile se separă conform cap. 7 din P 118/1-2025 (art. 7.1.1).',
      legi: ['HG1091'], cc: 'CC2'
    }
  ];

  const CC_TXT = {
    CC1: 'clasa de consecințe CC1 (importanță redusă), echivalentă categoriei de importanță D',
    CC2: 'clasa de consecințe CC2 (importanță normală), echivalentă categoriei de importanță C',
    CC3: 'clasa de consecințe CC3 (importanță deosebită), echivalentă categoriei de importanță B',
    CC4: 'clasa de consecințe CC4 (importanță excepțională), echivalentă categoriei de importanță A'
  };

  const DOCS = [
    { id: 'CU', titlu: 'Memoriu de prezentare – Certificat de urbanism', faza: 'CU', kind: 'gen', grup: 'Urbanism' },
    { id: 'DTAC_ARH', titlu: 'Memoriu tehnic arhitectură – DTAC', faza: 'DTAC', kind: 'gen', grup: 'Autorizare' },
    { id: 'SSI_PRE', titlu: 'Scenariu de securitate la incendiu preliminar (Anexa 5 OMAI 180/2022)', faza: 'DTAC', kind: 'gen', grup: 'Securitate la incendiu' },
    { id: 'OPIS_ISU', titlu: 'Opis aviz/autorizație ISU', faza: 'DTAC', kind: 'gen', grup: 'Securitate la incendiu' },
    { id: 'PC_MEM', titlu: 'Memoriu tehnic – aviz protecție civilă', faza: 'DTAC', kind: 'gen', grup: 'Protecție civilă' },
    { id: 'OPIS_PC', titlu: 'Opis aviz protecție civilă', faza: 'DTAC', kind: 'gen', grup: 'Protecție civilă' },
    { id: 'PTE_ARH', titlu: 'Memoriu tehnic arhitectură – PT', faza: 'PTE', kind: 'gen', grup: 'Execuție' },
    { id: 'SSI_AUT', titlu: 'Scenariu de securitate la incendiu (Anexa 4 OMAI 180/2022)', faza: 'PTE', kind: 'gen', grup: 'Securitate la incendiu' },
    { id: 'FAZE', titlu: 'Program de control al calității pe faze determinante', faza: 'PTE', kind: 'tpl', file: 'files/tpl-faze-determinante.docx', grup: 'Execuție' },
    { id: 'URM', titlu: 'Program de urmărire curentă a comportării în timp', faza: 'PTE', kind: 'tpl', file: 'files/tpl-urmarire-in-timp.docx', grup: 'Execuție' },
    { id: 'CS_ARH', titlu: 'Caiet de sarcini arhitectură', faza: 'PTE', kind: 'tpl', file: 'files/tpl-caiet-sarcini-arh.docx', grup: 'Execuție' }
  ];

  return { LEGI, COMUNE, T2, T2_COLS, t2col, F, CC_TXT, DOCS, fn: id => F.find(f => f.id === id) };
})();
