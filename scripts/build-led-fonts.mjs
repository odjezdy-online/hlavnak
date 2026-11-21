// Turns BUSE panel fonts into WOFF2 web fonts, so BUSE-look pages are normal HTML text
// (links, selection, search engines) that still renders dot by dot.
// One font pixel = 100 font units, drawn as an 80x80 square: the gaps make it look like LEDs.
// At font-size = rows * 3px, one dot = 3px.
//
// Sources:
//   data/buse-font.json    letters of the text faces (from odjezdy-system's font.json)
//   data/fonts/<id>.json   every face and code of the gBUSE files (scripts/read-buse-fonts.mjs)
// Builds the hand-picked fonts in FONTS, then one font for every other distinct face found in any
// gBUSE file (identical faces in several panel files are built once). Every glyph is also placed at
// U+E000 + its BUSE code (Private Use Area), so any pictogram can be addressed from a post.
// Writes src/assets/fonts/*.woff2, src/assets/css/pikto-fonts.css and src/_data/pikto.json.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import opentype from 'opentype.js';
import wawoff2 from 'wawoff2';

const OUT = 'src/assets/fonts';
const P = 100, DOT = 80, INSET = (P - DOT) / 2;
const PUA = 0xe000;

// hand-picked fonts used by the site itself
const FONTS = [
  { id: 'small', family: 'BUSE Small', text: 'small', raw: ['font', '1'], note: 'Malé písmo (10 bodů) s piktogramy' },
  { id: 'normal', family: 'BUSE Normal', text: 'normal', raw: ['font', '3'], note: 'Základní písmo (10 bodů) s piktogramy' },
  { id: 'big', family: 'BUSE Big', text: 'big', raw: ['font', '5'], note: 'Velké písmo (19 bodů)' },
  { id: 'vozy', family: 'BUSE Vozy', raw: ['font', '10'], note: 'Vozidla z boku (19 bodů)' },
  { id: 'pikto', family: 'BUSE Pikto', raw: ['teplice', '7'], note: 'Velké piktogramy (28 bodů), panel Teplice' },
  { id: 'pikto2', family: 'BUSE Pikto 2', raw: ['teplice', '8'], note: 'Velké piktogramy, druhá sada (28 bodů), panel Teplice' },
  { id: 'brno', family: 'BUSE Brno', raw: ['brno-2005-09-adcel0', '15'], note: 'Piktogramy (28 bodů), panel IDS Brno 2005' },
];

// short names for the gBUSE files (files with identical fonts share one name)
const SOURCES = {
  'font': ['zaklad', 'font.fnt (OMSI BUSE TOOL)'],
  'bukovec-a-mozna-i-pre-2015-bilina': ['zaklad', 'Bukovec / Bílina'],
  'teplice': ['teplice', 'Teplice'], 'omsi-gge': ['teplice', 'OMSI GGE'], 'the-fuck-bukovc': ['teplice', 'Bukovec'],
  'adr-text-predni': ['adr', 'ADR přední text'],
  'adleda': ['brno-led', 'Brno 2005, vnitřní LED'], 'brno-2005-09-adleda': ['brno-led', 'Brno 2005, vnitřní LED'], 'brno-2005-09-adledb': ['brno-led', 'Brno 2005, vnitřní LED'],
  'brno-2005-09-adcel0': ['brno-cel', 'Brno 2005, čelní panel'], 'brno-2005-09-adbok4': ['brno-bok', 'Brno 2005, boční panel'], 'brno-2005-09-adzad7': ['brno-zad', 'Brno 2005, zadní panel'],
  'anti-001': ['ostrava', 'Ostrava'], 'ostrava': ['ostrava', 'Ostrava'], 'ostravskamuzejninoc': ['ostrava', 'Ostravská muzejní noc'],
  // ostravskamuzejninoc2017 is left out: its one face holds pieces of a banner, not letters or pictograms
  'decin-mhd': ['decin', 'Děčín MHD'], 'ids-brno-adcel': ['decin', 'IDS Brno'], 'trs-mapa': ['decin', 'TRS mapa'], 'above-autobusy-v-ceskui': ['decin', 'autobusy v ČR'],
  'kosice-2001-01-dispa': ['kosice-disp', 'Košice 2001, displej'], 'kosice-2001-01-dispalol': ['kosice-disp', 'Košice 2001, displej'],
  'kosice-2001-01-panel1': ['kosice1', 'Košice 2001, panel 1'], 'kosice-2001-01-panel2': ['kosice2', 'Košice 2001, panel 2'],
  'tram-praha': ['kosice2', 'Tram Praha'], 'kosice-2001-01-panel3': ['kosice3', 'Košice 2001, panel 3'],
};

// names usable as <name> in posts → [file, face, code or codes, label]. Only glyphs identified by eye.
const NAMES = {
  zastavka: ['font', 3, 241, 'zastávka'], bus: ['font', 3, 242, 'autobus'], tramvaj: ['font', 3, 243, 'tramvaj'],
  trolejbus: ['font', 3, 244, 'trolejbus'], lod: ['font', 3, 245, 'loď / přívoz'], vlak: ['font', 3, 246, 'vlak'],
  letadlo: ['font', 3, 247, 'letadlo'], vozik: ['font', 3, 175, 'bezbariérový'], nemocnice: ['font', 3, 250, 'nemocnice'],
  vlevo: ['font', 3, 252, 'šipka vlevo'], nahoru: ['font', 3, 253, 'šipka nahoru'], vpravo: ['font', 3, 254, 'šipka vpravo'],
  // in the text faces '%' is the ČD logo and '`' the word "Praha," (the text fonts get real % and ` drawn instead)
  logocd: ['font', 1, 37, 'logo Českých drah'], praha: ['font', 1, 96, 'Praha,'],
  sipky: ['teplice', 7, 240, 'logo se šipkami (Teplice)'], sipky2: ['brno-2005-09-adcel0', 15, 174, 'logo se šipkami (Brno)'],
  sipky3: ['teplice', 8, 240, 'logo se šipkami, pruhy (Teplice)'],
  pozor: ['teplice', 7, 244, 'pozor'], kocarek: ['teplice', 7, 174, 'kočárek'], plachetnice: ['teplice', 7, 175, 'plachetnice'],
  deti: ['teplice', 7, 241, 'děti'], letadlovelke: ['teplice', 7, 242, 'letadlo'], vozikvelky: ['teplice', 7, 243, 'bezbariérový'],
  parnik: ['teplice', 7, 248, 'parní lokomotiva'], ikea: ['teplice', 8, 245, 'IKEA'], vozovna: ['teplice', 8, 246, 'VOZ (vozovna)'],
  sluzebni: ['teplice', 8, 247, 'SLUŽ. (služební jízda)'], divadlo: ['brno-2005-09-adcel0', 15, 249, 'divadlo'], lide: ['brno-2005-09-adcel0', 15, 172, 'lidé'],
  metro: ['kosice-2001-01-panel1', 2, 175, 'metro'], metroa: ['kosice-2001-01-panel1', 7, 246, 'metro A'],
  metrob: ['kosice-2001-01-panel1', 7, 247, 'metro B'], metroc: ['kosice-2001-01-panel1', 7, 248, 'metro C'],
  letiste: ['kosice-2001-01-panel1', 7, 242, 'letiště'], dostihy: ['kosice-2001-01-panel1', 7, 250, 'dostihy (kůň)'],
  tramvajvelka: ['kosice-2001-01-panel1', 8, 240, 'tramvaj zepředu'], lokomotiva: ['kosice-2001-01-panel1', 8, 241, 'parní lokomotiva'],
  inv: ['kosice-2001-01-dispa', 3, 243, 'INV (invalidé)'], idol: ['adr-text-predni', 11, [254, 255], 'logo IDOL'],
};
// emoji → pictogram on the BUSE board (the PID look keeps the emoji itself)
const EMOJI = {
  '🚏': 'zastavka', '🚌': 'bus', '🚍': 'bus', '🚐': 'bus', '🚊': 'tramvaj', '🚋': 'tramvaj', '🚃': 'tramvaj', '🚎': 'trolejbus',
  '⚓': 'lod', '⛴': 'lod', '🚢': 'lod', '🚆': 'vlak', '🚂': 'parnik', '🚄': 'vlak', '🚅': 'vlak', '🚈': 'vlak', '🚇': 'metro',
  '✈': 'letadlo', '🛫': 'letadlo', '🛬': 'letadlo', '♿': 'vozik', '🏥': 'nemocnice', '⬅': 'vlevo', '⬆': 'nahoru', '➡': 'vpravo',
};

const ALIASES = { ' ': ' ', '„': "'", '“': "'", '”': "'", '‚': "'", '‘': "'", '’': "'", '"': "'", '–': '-', '—': '-', '−': '-', '×': 'x', '•': '·', '«': '<', '»': '>' };
const CZ = new Set([...Array(44)].map((_, i) => 128 + i));
const isPict = (n) => n < 32 || (n > 126 && !CZ.has(n));

const textFaces = JSON.parse(fs.readFileSync('data/buse-font.json', 'utf8'));
const rawCache = {};
const raw = (src) => (rawCache[src] ||= JSON.parse(fs.readFileSync(`data/fonts/${src}.json`, 'utf8')));
const faceHash = (face) => crypto.createHash('md5').update(JSON.stringify(face)).digest('hex');

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (/\.(otf|woff2)$/.test(f)) fs.rmSync(path.join(OUT, f));

// the hand-picked fonts first, then one per distinct face of every file
const defs = FONTS.map((d) => ({ ...d, curated: true }));
const byHash = new Map(defs.map((d) => [faceHash(raw(d.raw[0]).faces[d.raw[1]]), d.id]));
const fileFace = new Map(defs.map((d) => [`${d.raw[0]}:${d.raw[1]}`, d.id]));
const index = JSON.parse(fs.readFileSync('data/fonts/index.json', 'utf8'));
for (const src of index) {
  const [short, label] = SOURCES[src.id] || [];
  if (!short) continue;
  for (const [face, glyphs] of Object.entries(raw(src.id).faces)) {
    const real = Object.values(glyphs).filter((g) => g && g.h > 0);
    // empty faces, and tiny ones without pictograms (fragments of a banner, not a font), carry nothing new
    if (real.length < 2 || (real.length < 5 && !Object.keys(glyphs).some((c) => glyphs[c] && isPict(Number(c))))) continue;
    const h = faceHash(glyphs);
    if (byHash.has(h)) { fileFace.set(`${src.id}:${face}`, byHash.get(h)); continue; }
    const id = `${short}-${face}`;
    if (defs.some((d) => d.id === id)) { fileFace.set(`${src.id}:${face}`, id); continue; }
    defs.push({ id, family: `BUSE ${short} ${face}`, raw: [src.id, face], note: `${label}, písmo ${face}`, group: label });
    byHash.set(h, id); fileFace.set(`${src.id}:${face}`, id);
  }
}

const manifest = { fonts: [], names: {}, emoji: EMOJI };
for (const def of defs) {
  const rawFace = raw(def.raw[0]).faces[def.raw[1]] || {};
  const text = def.text ? textFaces[def.text] : null;
  const rows = text ? text.rows : Math.max(...Object.values(rawFace).filter((g) => g && g.h > 0).map((g) => g.h));
  const spacing = text ? text.spacing : rows > 10 ? 2 : 1;
  // baseline: bottom lit row of 'H' (or '0'); pictogram-only faces sit on their bottom row
  let base = rows - 1;
  const H = text ? text.glyphs.H || text.glyphs['0'] : null;
  if (H) { base = 0; H[1].forEach((h, r) => { if (h !== '0') base = r; }); }
  else { const g = rawFace[72] || rawFace[48]; if (g) { base = 0; g.rows.forEach((h, r) => { if (h !== '0') base = r; }); } }

  const glyphs = [new opentype.Glyph({ name: '.notdef', unicode: 0, advanceWidth: 4 * P, path: new opentype.Path() })];
  const seen = new Set();
  const add = (cp, w, rowsHex) => {
    if (seen.has(cp) || !(w > 0)) return; seen.add(cp);
    const pth = new opentype.Path();
    rowsHex.forEach((h, r) => {
      const v = BigInt('0x' + (h || '0'));
      if (!v) return;
      const top = (base - r + 1) * P - INSET, bottom = top - DOT;
      for (let x = 0; x < w; x++) {
        if (!((v >> BigInt(w - 1 - x)) & 1n)) continue;
        const l = x * P + INSET, rr = l + DOT;
        pth.moveTo(l, bottom); pth.lineTo(rr, bottom); pth.lineTo(rr, top); pth.lineTo(l, top); pth.close();
      }
    });
    glyphs.push(new opentype.Glyph({ name: 'u' + cp.toString(16), unicode: cp, advanceWidth: (w + spacing) * P, path: pth }));
  };
  if (text) {
    // In BUSE fonts '<' and '>' are pictograms. Text needs real chevrons (code, "<logocd>", arrows in
    // the UI), so draw them; the original pictograms stay reachable at U+E03C / U+E03E (<pikto-normal-60>).
    const CHEV = { small: [7, 4, 1, 2], normal: [7, 5, 2, 2], big: [13, 8, 2, 3] }[def.text];
    const tg = { ...text.glyphs };
    if (CHEV) {
      const [n, w, thick, start] = CHEV, mid = (n - 1) / 2;
      const draw = (left) => {
        const out = Array(rows).fill('0');
        for (let k = 0; k < n; k++) {
          const col = Math.round((w - thick) * Math.abs(k - mid) / mid);
          const c = left ? col : w - thick - col;
          let v = 0n; for (let t = 0; t < thick; t++) v |= 1n << BigInt(w - 1 - (c + t));
          out[start + k] = v.toString(16);
        }
        return [w, out];
      };
      tg['<'] = draw(true); tg['>'] = draw(false);
    }
    // More ASCII codes are pictograms in the text faces ('%' ČD logo, '$' a logo, '\\' plane, '`' "Praha,",
    // '~' a vehicle) or empty ('@'). Draw the real characters so "50 %" and e-mail addresses read right;
    // the pictograms stay at U+E000+code (<logocd>, <praha>, <pikto-small-36> …).
    const SYNTH = { // 7 rows (cap height), thin strokes; bold and big variants are derived below
      '%': [5, ['11001', '11010', '00010', '00100', '01000', '01011', '10011']],
      '@': [6, ['011110', '100001', '100111', '101001', '100111', '100000', '011110']],
      '$': [5, ['00100', '01111', '10100', '01110', '00101', '11110', '00100']],
      '#': [5, ['01010', '11111', '01010', '01010', '11111', '01010', '00000']],
      '&': [5, ['01100', '10010', '10100', '01000', '10101', '10010', '01101']],
      '\\': [4, ['1000', '1000', '0100', '0100', '0010', '0010', '0001']],
      '`': [2, ['10', '01', '00', '00', '00', '00', '00']],
      '~': [5, ['00000', '00000', '01001', '10110', '00000', '00000', '00000']],
    };
    const capTop = { small: 2, normal: 2, big: 3 }[def.text];
    if (capTop !== undefined) for (const [ch, [w0, bits]] of Object.entries(SYNTH)) {
      let w = w0, rowsBits = bits.map((b) => BigInt('0b' + b));
      if (def.text === 'normal') { rowsBits = rowsBits.map((v) => (v << 1n) | v); w = w0 + 1; } // bold
      if (def.text === 'big') { // twice as tall and wide, bold strokes
        rowsBits = rowsBits.flatMap((v) => { let o = 0n; for (let x = 0; x < w0; x++) if ((v >> BigInt(w0 - 1 - x)) & 1n) o |= 3n << BigInt(2 * (w0 - 1 - x)); return [o, o]; });
        w = w0 * 2;
      }
      const out = Array(rows).fill('0');
      rowsBits.forEach((v, i) => { if (capTop + i < rows) out[capTop + i] = v.toString(16); });
      tg[ch] = [w, out];
    }
    for (const [ch, [w, bits]] of Object.entries(tg)) if ([...ch].length === 1) add(ch.codePointAt(0), w, bits);
    for (const [ch, t] of Object.entries(ALIASES)) if (text.glyphs[t]) add(ch.codePointAt(0), text.glyphs[t][0], text.glyphs[t][1]);
  }
  const codes = [];
  for (const [code, g] of Object.entries(rawFace)) {
    if (!g || !(g.h > 0)) continue;
    const n = Number(code);
    // glyphs shorter than the face sit on its bottom row, like on the panel (e.g. small letters in Teplice 9)
    const r = g.h < rows ? Array(rows - g.h).fill('0').concat(g.rows) : g.rows;
    add(PUA + n, g.w, r);
    if (!text && n >= 32 && n < 127 && n !== 60 && n !== 62) add(n, g.w, r); // letters of pictogram faces too
    codes.push(n);
  }
  if (!codes.length) continue;
  const font = new opentype.Font({ familyName: def.family, styleName: 'Regular', unitsPerEm: rows * P, ascender: (base + 1) * P, descender: -(rows - 1 - base) * P, glyphs });
  const woff2 = await wawoff2.compress(new Uint8Array(font.toArrayBuffer()));
  fs.writeFileSync(path.join(OUT, `buse-${def.id}.woff2`), woff2);
  codes.sort((a, b) => a - b);
  manifest.fonts.push({
    id: def.id, family: def.family, rows, note: def.note, curated: !!def.curated, group: def.group || 'Písma webu',
    source: raw(def.raw[0]).source, face: Number(def.raw[1]), codes, pict: codes.filter(isPict),
    letters: codes.filter((c) => c >= 65 && c <= 90).length > 10, kb: +(woff2.length / 1024).toFixed(1),
  });
}

for (const [name, [file, face, code, label]] of Object.entries(NAMES)) {
  const id = fileFace.get(`${file}:${face}`);
  const f = manifest.fonts.find((x) => x.id === id);
  const list = [].concat(code);
  if (!f || !list.every((c) => f.codes.includes(c))) { console.warn(`name ${name}: ${file} face ${face} has no ${list}, skipped`); continue; }
  manifest.names[name] = { font: id, code: list[0], codes: list, label, rows: f.rows };
}

// @font-face and sizes for every font not already declared in site.css
const css = ['/* generated by scripts/build-led-fonts.mjs — every BUSE font, sized to its own dot grid */'];
for (const f of manifest.fonts) {
  // ?v= is a hash of the file: a changed font gets a new URL, so browsers never keep a stale copy
  const ver = crypto.createHash('md5').update(fs.readFileSync(path.join(OUT, `buse-${f.id}.woff2`))).digest('hex').slice(0, 10);
  css.push(`@font-face { font-family: "${f.family}"; src: url(/assets/fonts/buse-${f.id}.woff2?v=${ver}) format("woff2"); font-display: swap; }`);
  if (!f.curated) css.push(`.pk-${f.id} { font-family: "${f.family}"; }`);
  const px = f.rows * 3, em = Math.max(1.2, +(f.rows / 10 * 1.15).toFixed(2));
  if (!f.curated) css.push(`[data-look="buse"] .pk-${f.id} { font-size: ${px}px;${f.rows > 10 ? ` line-height: ${px}px; vertical-align: bottom;` : ''} }`, `[data-look="pid"] .pk-${f.id} { font-size: ${em}em;${f.rows > 10 ? ' line-height: 1; vertical-align: -.4em;' : ''} }`);
}
fs.writeFileSync('src/assets/css/pikto-fonts.css', css.join('\n') + '\n');
fs.writeFileSync('src/_data/pikto.json', JSON.stringify(manifest, null, 1) + '\n');
const total = manifest.fonts.reduce((s, f) => s + f.kb, 0);
console.log(`${manifest.fonts.length} fonts (${manifest.fonts.filter((f) => f.curated).length} used by the site), ${total.toFixed(0)} KB in all; ${Object.keys(manifest.names).length} names, ${Object.keys(EMOJI).length} emoji`);
for (const f of manifest.fonts) if (!f.curated) console.log(`  ${f.id.padEnd(16)} ${String(f.rows).padStart(2)} rows ${String(f.codes.length).padStart(3)} glyphs ${String(f.pict.length).padStart(2)} pict  ${f.note}`);
