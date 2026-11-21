// Turns BUSE panel fonts into WOFF2 web fonts, so BUSE-look pages are normal HTML text
// (links, selection, search engines) that still renders dot by dot.
// One font pixel = 100 font units, drawn as an 80x80 square: the gaps make it look like LEDs.
// At font-size = rows * 3px, one dot = 3px.
//
// Sources:
//   data/buse-font.json    letters of the text faces (from odjezdy-system's font.json)
//   data/fonts/<id>.json   every face and code of the gBUSE files (scripts/read-buse-fonts.mjs)
// Every glyph of a face is also placed at U+E000 + its BUSE code (Private Use Area), so any
// pictogram can be addressed: the post tags (<logocd>, <bus>, …) and the emoji swap use that.
// Writes src/assets/fonts/*.woff2 and src/_data/pikto.json (names, fonts, codes for templates).
import fs from 'node:fs';
import path from 'node:path';
import opentype from 'opentype.js';
import wawoff2 from 'wawoff2';

const OUT = 'src/assets/fonts';
const P = 100, DOT = 80, INSET = (P - DOT) / 2;
const PUA = 0xe000;

// web font name → where its glyphs come from
const FONTS = [
  { id: 'small', family: 'BUSE Small', text: 'small', raw: ['font', '1'], note: 'Malé písmo (10 bodů) s piktogramy' },
  { id: 'normal', family: 'BUSE Normal', text: 'normal', raw: ['font', '3'], note: 'Základní písmo (10 bodů) s piktogramy' },
  { id: 'big', family: 'BUSE Big', text: 'big', raw: ['font', '5'], note: 'Velké písmo (19 bodů)' },
  { id: 'vozy', family: 'BUSE Vozy', raw: ['font', '10'], spacing: 1, note: 'Vozidla z boku (19 bodů)' },
  { id: 'pikto', family: 'BUSE Pikto', raw: ['teplice', '7'], spacing: 2, note: 'Velké piktogramy (28 bodů), panel Teplice' },
  { id: 'pikto2', family: 'BUSE Pikto 2', raw: ['teplice', '8'], spacing: 2, note: 'Velké piktogramy, druhá sada (28 bodů), panel Teplice' },
  { id: 'brno', family: 'BUSE Brno', raw: ['brno-2005-09-adcel0', '15'], spacing: 2, note: 'Piktogramy (28 bodů), panel IDS Brno 2005' },
];

// names usable as <name> in posts → font + BUSE code. Only glyphs we could identify by eye.
const NAMES = {
  zastavka: ['normal', 241, 'zastávka'], bus: ['normal', 242, 'autobus'], tramvaj: ['normal', 243, 'tramvaj'],
  trolejbus: ['normal', 244, 'trolejbus'], lod: ['normal', 245, 'loď / přívoz'], vlak: ['normal', 246, 'vlak'],
  letadlo: ['normal', 247, 'letadlo'], vozik: ['normal', 175, 'bezbariérový'], nemocnice: ['normal', 250, 'nemocnice'],
  vlevo: ['normal', 252, 'šipka vlevo'], nahoru: ['normal', 253, 'šipka nahoru'], vpravo: ['normal', 254, 'šipka vpravo'],
  logocd: ['pikto', 240, 'logo Českých drah'], logocd2: ['brno', 174, 'logo Českých drah (Brno)'],
  pozor: ['pikto', 244, 'pozor'], kocarek: ['pikto', 174, 'kočárek'], plachetnice: ['pikto', 175, 'plachetnice'],
  deti: ['pikto', 241, 'děti'], letadlovelke: ['pikto', 242, 'letadlo'], vozikvelky: ['pikto', 243, 'bezbariérový'],
  parnik: ['pikto', 248, 'parní lokomotiva'], ikea: ['pikto2', 245, 'IKEA'], vozovna: ['pikto2', 246, 'VOZ (vozovna)'],
  sluzebni: ['pikto2', 247, 'SLUŽ. (služební jízda)'], divadlo: ['brno', 249, 'divadlo'], lide: ['brno', 172, 'lidé'],
};
// emoji → pictogram on the BUSE board (the PID look keeps the emoji itself)
const EMOJI = {
  '🚏': 'zastavka', '🚌': 'bus', '🚍': 'bus', '🚐': 'bus', '🚊': 'tramvaj', '🚋': 'tramvaj', '🚃': 'tramvaj', '🚎': 'trolejbus',
  '⚓': 'lod', '⛴': 'lod', '🚢': 'lod', '🚆': 'vlak', '🚂': 'parnik', '🚄': 'vlak', '🚅': 'vlak', '🚈': 'vlak',
  '✈': 'letadlo', '🛫': 'letadlo', '🛬': 'letadlo', '♿': 'vozik', '🏥': 'nemocnice', '⬅': 'vlevo', '⬆': 'nahoru', '➡': 'vpravo',
};

const ALIASES = { ' ': ' ', '„': "'", '“': "'", '”': "'", '‚': "'", '‘': "'", '’': "'", '"': "'", '–': '-', '—': '-', '−': '-', '×': 'x', '•': '·', '«': '<', '»': '>' };

const textFaces = JSON.parse(fs.readFileSync('data/buse-font.json', 'utf8'));
const rawCache = {};
const raw = (src) => (rawCache[src] ||= JSON.parse(fs.readFileSync(`data/fonts/${src}.json`, 'utf8')));

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (/\.(otf|woff2)$/.test(f)) fs.rmSync(path.join(OUT, f));

const manifest = { fonts: [], names: {}, emoji: EMOJI };
for (const def of FONTS) {
  const rawFace = raw(def.raw[0]).faces[def.raw[1]] || {};
  const text = def.text ? textFaces[def.text] : null;
  // face height: the text face's rows, else the tallest raw glyph
  const rows = text ? text.rows : Math.max(...Object.values(rawFace).filter(Boolean).map((g) => g.h));
  const spacing = text ? text.spacing : def.spacing;
  // baseline: bottom row of 'H' for text faces; pictogram faces sit on their bottom row
  let base = rows - 1;
  if (text) { const H = text.glyphs.H || text.glyphs['0']; base = 0; H[1].forEach((h, r) => { if (h !== '0') base = r; }); }

  const glyphs = [new opentype.Glyph({ name: '.notdef', unicode: 0, advanceWidth: 4 * P, path: new opentype.Path() })];
  const seen = new Set();
  const add = (cp, w, rowsHex) => {
    if (seen.has(cp)) return; seen.add(cp);
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
    for (const [ch, [w, bits]] of Object.entries(tg)) if ([...ch].length === 1) add(ch.codePointAt(0), w, bits);
    for (const [ch, t] of Object.entries(ALIASES)) if (text.glyphs[t]) add(ch.codePointAt(0), text.glyphs[t][0], text.glyphs[t][1]);
  }
  const codes = [];
  for (const [code, g] of Object.entries(rawFace)) {
    if (!g) continue;
    add(PUA + Number(code), g.w, g.rows);
    if (!text && Number(code) >= 32 && Number(code) < 127) add(Number(code), g.w, g.rows); // ASCII in pictogram faces too
    codes.push(Number(code));
  }
  const font = new opentype.Font({ familyName: def.family, styleName: 'Regular', unitsPerEm: rows * P, ascender: (base + 1) * P, descender: -(rows - 1 - base) * P, glyphs });
  const otf = new Uint8Array(font.toArrayBuffer());
  const woff2 = await wawoff2.compress(otf);
  fs.writeFileSync(path.join(OUT, `buse-${def.id}.woff2`), woff2);
  manifest.fonts.push({ id: def.id, family: def.family, rows, note: def.note, source: raw(def.raw[0]).source, face: Number(def.raw[1]), codes: codes.sort((a, b) => a - b) });
  console.log(`buse-${def.id}.woff2  ${rows} rows  ${glyphs.length - 1} glyphs  ${(woff2.length / 1024).toFixed(1)} KB`);
}
for (const [name, [font, code, label]] of Object.entries(NAMES)) {
  const f = manifest.fonts.find((x) => x.id === font);
  if (!f || !f.codes.includes(code)) { console.warn(`name ${name}: ${font} has no code ${code}, skipped`); continue; }
  manifest.names[name] = { font, code, label, rows: f.rows };
}
fs.writeFileSync('src/_data/pikto.json', JSON.stringify(manifest, null, 1) + '\n');
console.log(`src/_data/pikto.json: ${Object.keys(manifest.names).length} names, ${Object.keys(EMOJI).length} emoji`);
