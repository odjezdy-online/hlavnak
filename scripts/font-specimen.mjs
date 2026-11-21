// Draws every glyph of every face of one or more font JSON files (from read-buse-fonts.mjs)
// into a PNG specimen sheet, with the code under each glyph. Pictograms (codes outside
// ASCII and the Czech letters) are drawn in white so they stand out.
//   node scripts/font-specimen.mjs <font id> [face ids comma-separated] [--pict-only] > writes data/fonts/specimen-<id>.png
import fs from 'node:fs';
import sharp from 'sharp';

const [id, faceArg] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const pictOnly = process.argv.includes('--pict-only');
const font = JSON.parse(fs.readFileSync(`data/fonts/${id}.json`, 'utf8'));
const CZ = new Set([...Array(44)].map((_, i) => 128 + i));
const isPict = (n) => n < 32 || (n > 126 && !CZ.has(n));
const faces = faceArg ? faceArg.split(',') : Object.keys(font.faces);
const P = 3, PAD = 6, LABEL = 12, MAXW = 1500;

let y = 0; const parts = [];
for (const fid of faces) {
  const glyphs = font.faces[fid]; if (!glyphs) continue;
  const items = Object.entries(glyphs).filter(([c, g]) => g && (!pictOnly || isPict(+c)));
  if (!items.length) continue;
  parts.push(`<text x="4" y="${y + 14}" font-family="Arial" font-size="13" fill="#9aa">${font.source} · face ${fid} · ${items.length} glyphs</text>`);
  y += 20;
  let x = 4, rowH = 0;
  for (const [c, g] of items) {
    const gw = Math.max(g.w * P, 30), gh = g.h * P + LABEL;
    if (x + gw > MAXW) { x = 4; y += rowH + PAD; rowH = 0; }
    const col = isPict(+c) ? '#ffffff' : '#ff8800';
    g.rows.forEach((h, r) => { const v = BigInt('0x' + h); for (let i = 0; i < g.w; i++) if ((v >> BigInt(g.w - 1 - i)) & 1n) parts.push(`<rect x="${x + i * P}" y="${y + r * P}" width="${P - 0.6}" height="${P - 0.6}" fill="${col}"/>`); });
    parts.push(`<text x="${x}" y="${y + g.h * P + 10}" font-family="Arial" font-size="9" fill="${isPict(+c) ? '#7cf' : '#777'}">${c}</text>`);
    x += gw + PAD; rowH = Math.max(rowH, gh);
  }
  y += rowH + 14;
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${MAXW + 8}" height="${y + 8}"><rect width="100%" height="100%" fill="#000"/>${parts.join('')}</svg>`;
const out = `data/fonts/specimen-${id}${pictOnly ? '-pict' : ''}.png`;
await sharp(Buffer.from(svg)).png().toFile(out);
console.log(out, MAXW + 8, 'x', y + 8);
