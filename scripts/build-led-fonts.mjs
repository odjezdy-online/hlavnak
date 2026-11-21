// Turns the BUSE bitmap font from odjezdy-system (data/buse-font.json) into real web fonts,
// so BUSE-look pages are normal HTML text (links, selection, search engines) that still
// renders dot by dot. One font pixel = 100 font units, drawn as an 80x80 square: the gap
// between squares is what makes it look like LEDs. At font-size = rows * 3px, one dot = 3px.
import fs from 'node:fs';
import path from 'node:path';
import opentype from 'opentype.js';
import wawoff2 from 'wawoff2';

const SRC = 'data/buse-font.json';
const OUT = 'src/assets/fonts';
const P = 100;      // units per font pixel
const DOT = 80;     // lit square size
const INSET = (P - DOT) / 2;

const faces = JSON.parse(fs.readFileSync(SRC, 'utf8'));
fs.mkdirSync(OUT, { recursive: true });

// characters the bitmap lacks, drawn with a glyph it has
const ALIASES = {
  ' ': ' ', '„': "'", '“': "'", '”': "'", '‚': "'", '‘': "'", '’': "'", '"': "'",
  '–': '-', '—': '-', '−': '-', '×': 'x', '•': '·', '«': '<', '»': '>',
};

function baselineRow(face) {
  // bottom lit row of capital H (or 0) marks the baseline
  const g = face.glyphs.H || face.glyphs['0'];
  let last = 0;
  g[1].forEach((h, r) => { if (h !== '0') last = r; });
  return last;
}

for (const [name, face] of Object.entries(faces)) {
  if (name === 'line') continue; // the pictogram face is only used for the warning triangle, which is inline SVG
  const rows = face.rows, sp = face.spacing;
  const base = baselineRow(face);
  const glyphs = [new opentype.Glyph({ name: '.notdef', unicode: 0, advanceWidth: 4 * P, path: new opentype.Path() })];
  const make = (ch, data) => {
    const [w, bits] = data;
    const pth = new opentype.Path();
    bits.forEach((h, r) => {
      const v = parseInt(h, 16);
      if (!v) return;
      const top = (base - r + 1) * P - INSET, bottom = top - DOT;
      for (let x = 0; x < w; x++) {
        if (!((v >> (w - 1 - x)) & 1)) continue;
        const l = x * P + INSET, rr = l + DOT;
        pth.moveTo(l, bottom); pth.lineTo(rr, bottom); pth.lineTo(rr, top); pth.lineTo(l, top); pth.close();
      }
    });
    return new opentype.Glyph({ name: 'u' + ch.codePointAt(0).toString(16), unicode: ch.codePointAt(0), advanceWidth: (w + sp) * P, path: pth });
  };
  const done = new Set();
  for (const [ch, data] of Object.entries(face.glyphs)) {
    if ([...ch].length !== 1) continue;
    glyphs.push(make(ch, data)); done.add(ch);
  }
  for (const [ch, target] of Object.entries(ALIASES)) {
    if (!done.has(ch) && face.glyphs[target]) { glyphs.push(make(ch, face.glyphs[target])); done.add(ch); }
  }
  const family = 'BUSE ' + name[0].toUpperCase() + name.slice(1);
  const font = new opentype.Font({
    familyName: family, styleName: 'Regular', unitsPerEm: rows * P,
    ascender: (base + 1) * P, descender: -(rows - 1 - base) * P, glyphs,
  });
  const otf = new Uint8Array(font.toArrayBuffer());
  const woff2 = await wawoff2.compress(otf);
  const file = path.join(OUT, `buse-${name}.woff2`);
  fs.writeFileSync(file, woff2);
  console.log(`${file}: ${glyphs.length - 1} glyphs, ${rows} rows, baseline row ${base}, ${(otf.length / 1024).toFixed(0)} KB OTF → ${(woff2.length / 1024).toFixed(0)} KB WOFF2`);
}
