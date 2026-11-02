/* Construcția fișierelor .docx în browser, cu antet text (numele proiectantului) și subsol cu paginare. */
window.DOCX = (function () {
  const FONT = 'Arial Narrow';
  const MISS_RE = /⟦([^⟧]*)⟧/g;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  function rpr(o = {}) {
    let x = `<w:rFonts w:ascii="${FONT}" w:hAnsi="${FONT}" w:cs="${FONT}"/>`;
    if (o.b) x += '<w:b/><w:bCs/>';
    if (o.i) x += '<w:i/><w:iCs/>';
    if (o.caps) x += '<w:caps/>';
    if (o.color) x += `<w:color w:val="${o.color}"/>`;
    if (o.sz) x += `<w:sz w:val="${o.sz}"/><w:szCs w:val="${o.sz}"/>`;
    if (o.hl) x += '<w:highlight w:val="yellow"/>';
    x += '<w:lang w:val="ro-RO"/>';
    return `<w:rPr>${x}</w:rPr>`;
  }
  // text cu **bold** și ⟦lipsă⟧ marcat galben
  function runs(text, o = {}) {
    if (text == null) return '';
    const out = [];
    String(text).split(/(\*\*[^*]+\*\*)/g).forEach(seg => {
      if (!seg) return;
      let bo = { ...o };
      if (/^\*\*[^*]+\*\*$/.test(seg)) { seg = seg.slice(2, -2); bo.b = true; }
      let last = 0; let m;
      MISS_RE.lastIndex = 0;
      while ((m = MISS_RE.exec(seg))) {
        if (m.index > last) out.push(run(seg.slice(last, m.index), bo));
        out.push(run('[de completat: ' + m[1] + ']', { ...bo, hl: true }));
        last = m.index + m[0].length;
      }
      if (last < seg.length) out.push(run(seg.slice(last), bo));
    });
    return out.join('');
  }
  function run(t, o) {
    const parts = String(t).split('\n');
    return parts.map((p, i) => (i ? `<w:r>${rpr(o)}<w:br/></w:r>` : '') + `<w:r>${rpr(o)}<w:t xml:space="preserve">${esc(p)}</w:t></w:r>`).join('');
  }
  function p(text, o = {}) {
    const jc = o.jc || 'both';
    const sp = `<w:spacing w:before="${o.before || 0}" w:after="${o.after == null ? 80 : o.after}"/>`;
    const ind = o.ind ? `<w:ind w:left="${o.ind}" w:hanging="${o.hang || 0}"/>` : '';
    const kn = o.keep ? '<w:keepNext/>' : '';
    const pb = o.pageBefore ? '<w:pageBreakBefore/>' : '';
    return `<w:p><w:pPr>${kn}${pb}${sp}${ind}<w:jc w:val="${jc}"/></w:pPr>${runs(text, o.r || {})}</w:p>`;
  }

  // blocuri
  const B = {
    h1: (t, o = {}) => p(t, { keep: true, before: 240, after: 120, jc: 'left', pageBefore: o.page, r: { b: true, sz: 28 } }),
    h2: t => p(t, { keep: true, before: 180, after: 80, jc: 'left', r: { b: true, caps: true, sz: 24 } }),
    h3: t => p(t, { keep: true, before: 120, after: 60, jc: 'left', r: { b: true } }),
    p: (t, o) => p(t, o),
    kv: (k, v) => p(`**${k}:** ${v}`, { after: 60 }),
    note: t => p(t, { r: { i: true, sz: 20, color: '555555' } }),
    bullets: items => items.filter(x => x != null && x !== '').map(it => `<w:p><w:pPr><w:spacing w:after="40"/><w:ind w:left="426" w:hanging="284"/><w:jc w:val="both"/></w:pPr>${runs('-')}<w:r>${rpr()}<w:tab/></w:r>${runs(it)}</w:p>`).join(''),
    title: (t, sz = 48, after = 0) => p(t, { jc: 'center', after, r: { b: true, sz } }),
    sub: (t, sz = 28, after = 240) => p(t, { jc: 'center', after, r: { sz } }),
    center: (t, o = {}) => p(t, { jc: 'center', after: 240, r: { b: true, ...o } }),
    pagebreak: () => '<w:p><w:r><w:br w:type="page"/></w:r></w:p>',
    spacer: () => '<w:p/>',
    table: (head, rows, widths, o = {}) => {
      const total = 9600;
      const n = widths ? widths.length : (head || rows.find(r => r.length > 1) || [1]).length;
      const w = widths || Array(n).fill(Math.floor(total / n));
      const cell = (txt, wi, hd, span) => {
        const shd = hd ? '<w:shd w:val="clear" w:color="auto" w:fill="E7E9EE"/>' : (o.shadeFirst && span === 'first' ? '<w:shd w:val="clear" w:color="auto" w:fill="F3F4F7"/>' : '');
        const gs = typeof span === 'number' && span > 1 ? `<w:gridSpan w:val="${span}"/>` : '';
        const paras = String(txt == null ? '' : txt).split('\n\n');
        return `<w:tc><w:tcPr><w:tcW w:w="${wi}" w:type="dxa"/>${gs}${shd}<w:vAlign w:val="center"/></w:tcPr>${paras.map(pp => `<w:p><w:pPr><w:spacing w:before="20" w:after="20"/>${o.center && !hd ? '<w:jc w:val="center"/>' : ''}</w:pPr>${runs(pp, { sz: 20, b: hd })}</w:p>`).join('')}</w:tc>`;
      };
      const tr = (cells, hd, isHead) => {
        let x = `<w:tr><w:trPr>${isHead ? '<w:tblHeader/>' : ''}<w:cantSplit/></w:trPr>`;
        if (cells.length === 1 && n > 1) return x + cell(cells[0], total, true, n) + '</w:tr>';
        cells.forEach((c, i) => { x += cell(c, w[i], hd, i === 0 ? 'first' : 0); });
        return x + '</w:tr>';
      };
      const borders = ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(b => `<w:${b} w:val="single" w:sz="4" w:space="0" w:color="808080"/>`).join('');
      let x = `<w:tbl><w:tblPr><w:tblW w:w="${total}" w:type="dxa"/><w:jc w:val="center"/><w:tblBorders>${borders}</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${w.map(x => `<w:gridCol w:w="${x}"/>`).join('')}</w:tblGrid>`;
      if (head) x += tr(head, true, true);
      rows.forEach(r => { x += tr(r, Array.isArray(r) && r.length === 1 && n > 1); });
      return x + '</w:tbl>' + p('', { after: 60 });
    },
    sign: (left, right) => B.table(null, [[left, right]], [4800, 4800])
  };

  function footerXml(text) {
    const r = `<w:rPr><w:rFonts w:ascii="${FONT}" w:hAnsi="${FONT}"/><w:color w:val="666666"/><w:sz w:val="16"/><w:szCs w:val="16"/><w:lang w:val="ro-RO"/></w:rPr>`;
    const fld = code => `<w:r>${r}<w:fldChar w:fldCharType="begin"/></w:r><w:r>${r}<w:instrText xml:space="preserve"> ${code} </w:instrText></w:r><w:r>${r}<w:fldChar w:fldCharType="separate"/></w:r><w:r>${r}<w:t>1</w:t></w:r><w:r>${r}<w:fldChar w:fldCharType="end"/></w:r>`;
    return `<w:p><w:pPr><w:pBdr><w:top w:val="single" w:sz="4" w:space="4" w:color="A6A3A3"/></w:pBdr><w:tabs><w:tab w:val="right" w:pos="9630"/></w:tabs><w:spacing w:after="0"/></w:pPr><w:r>${r}<w:t xml:space="preserve">${esc(text)}</w:t></w:r><w:r>${r}<w:tab/><w:t xml:space="preserve">Pag. </w:t></w:r>${fld('PAGE')}<w:r>${r}<w:t xml:space="preserve"> / </w:t></w:r>${fld('NUMPAGES')}</w:p>`;
  }

  const cache = {};
  async function load(path) {
    if (!cache[path]) {
      const src = path.replace(/\.docx$/, '.b64.txt');
      const res = await fetch(src);
      if (!res.ok) throw new Error('Nu am putut încărca ' + src + ' (' + res.status + ')');
      cache[path] = (await res.text()).trim();
    }
    return JSZip.loadAsync(cache[path], { base64: true });
  }

  // document generat: corp OOXML în shell
  async function build(bodyXml, footerText, title, headerText) {
    const zip = await load('files/shell.docx');
    for (const hn of ['word/header1.xml', 'word/header2.xml']) { const hf = zip.file(hn); if (hf) zip.file(hn, (await hf.async('string')).replace('§HEADER§', esc(headerText || ''))); }
    const doc = await zip.file('word/document.xml').async('string');
    zip.file('word/document.xml', doc.replace('§BODY§', bodyXml));
    const ft = await zip.file('word/footer1.xml').async('string');
    zip.file('word/footer1.xml', ft.replace('§FOOTER§', footerXml(footerText)));
    const core = await zip.file('docProps/core.xml').async('string');
    zip.file('docProps/core.xml', core.replace('§TITLE§', esc(title)));
    return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }

  // document din model: înlocuire {{TOKEN}}
  async function fromTemplate(path, tokens, footerText, headerText) {
    const zip = await load(path);
    const hb = zip.file('word/header_brisk.xml'); if (hb) zip.file('word/header_brisk.xml', (await hb.async('string')).replace('§HEADER§', esc(headerText || '')));
    let doc = await zip.file('word/document.xml').async('string');
    doc = doc.replace(/\{\{(\w+)\}\}/g, (m, k) => {
      const v = tokens[k];
      if (v == null || v === '') return k === 'BENEFICIAR2' ? '' : esc('[de completat: ' + k + ']');
      return esc(v);
    });
    zip.file('word/document.xml', doc);
    const f = zip.file('word/footer_brisk.xml');
    if (f) zip.file('word/footer_brisk.xml', (await f.async('string')).replace('§FOOTER§', footerXml(footerText)));
    return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }

  return { B, build, fromTemplate, esc };
})();
