// Reads BUSE panel fonts from gBUSE files and writes them as JSON, one file per source:
//   .fnt  — the font file used by OMSI BUSE TOOL / app.odjezdy.online (cedulomat)
//   .hex  — Intel HEX memory images of real panels; the font table sits after "FNT:" in memory
// Every face (0–15) and every code (0–255) is kept, pictograms included.
//   node scripts/read-buse-fonts.mjs <folder with .fnt/.hex files> [out folder]
import fs from 'node:fs';
import path from 'node:path';

const SRC = process.argv[2] || 'C:/Users/plain/Desktop/Desktop/gBuse';
const OUT = process.argv[3] || 'data/fonts';

function intelHex(text) {
  const mem = new Uint8Array(1 << 20);
  let base = 0, max = 0;
  for (const line of text.split(/\r?\n/)) {
    if (!line.startsWith(':')) continue;
    const b = Buffer.from(line.slice(1).trim(), 'hex');
    const n = b[0], addr = b.readUInt16BE(1), type = b[3];
    if (type === 0) { for (let i = 0; i < n; i++) { mem[base + addr + i] = b[4 + i]; } max = Math.max(max, base + addr + n); }
    else if (type === 2) base = b.readUInt16BE(4) << 4;
    else if (type === 4) base = b.readUInt16BE(4) << 16;
    else if (type === 1) break;
  }
  return Buffer.from(mem.subarray(0, max));
}

const bytesYFor = (h) => (h > 24 ? 4 : h > 16 ? 3 : h > 8 ? 2 : 1);
const rev = (v) => { let o = 0; for (let i = 0; i < 8; i++) if (v & (1 << i)) o |= 1 << (7 - i); return o; };

// face blocks: 0xE0+id, length (BE16), then glyph records: code, n bytes, height, n bytes of column data
function parseFaces(buf, pos) {
  const faces = {};
  while (pos + 3 <= buf.length) {
    const id = buf[pos] - 0xe0;
    if (id < 0 || id > 15) break;
    const len = buf.readUInt16BE(pos + 1);
    let p = pos + 3; const end = Math.min(p + len, buf.length);
    const glyphs = {};
    while (p < end) {
      const code = buf[p++]; if (p >= end) break;
      const n = buf[p++];
      if (n === 0) { glyphs[code] = null; continue; }
      const height = buf[p++];
      const data = buf.subarray(p, p + n); p += n;
      const by = bytesYFor(height), w = Math.floor(data.length / by);
      const rows = Array.from({ length: height }, () => 0n);
      for (let j = 0; j < w * by; j++) {
        const col = Math.floor(j / by), yOff = 8 * (j % by), bits = rev(data[j]);
        for (let i = 0; i < 8; i++) if (bits & (1 << i) && yOff + i < height) rows[yOff + i] |= 1n << BigInt(w - 1 - col);
      }
      glyphs[code] = { w, h: height, rows: rows.map((r) => r.toString(16)) };
    }
    faces[id] = glyphs;
    pos = pos + 3 + len;
  }
  return faces;
}

function findFontStart(buf) {
  // .hex images: a text tag "FNT:" precedes the table; the table begins at the first 0xE0..0xEF after it
  const tag = buf.indexOf('FNT:');
  if (tag >= 0) {
    for (let p = tag; p < Math.min(buf.length, tag + 256); p++) {
      if (buf[p] >= 0xe0 && buf[p] <= 0xef && buf.readUInt16BE(p + 1) > 0 && buf.readUInt16BE(p + 1) < 0x4000) {
        const f = parseFaces(buf, p);
        if (Object.keys(f).length) return { start: p, label: buf.subarray(tag, buf.indexOf(0, tag)).toString('latin1') };
      }
    }
  }
  return { start: 0, label: '' };
}

fs.mkdirSync(OUT, { recursive: true });
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.(fnt|hex)$/i.test(e.name)) files.push(p); } })(SRC);

const index = [];
for (const file of files.sort()) {
  const raw = fs.readFileSync(file);
  const buf = /\.hex$/i.test(file) ? intelHex(raw.toString('latin1')) : raw;
  const { start, label } = /\.hex$/i.test(file) ? findFontStart(buf) : { start: 0, label: 'font.fnt' };
  const faces = parseFaces(buf, start);
  const id = path.relative(SRC, file).replace(/\\/g, '/').replace(/\.[^.]+$/, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
  const summary = Object.fromEntries(Object.entries(faces).map(([k, g]) => {
    const codes = Object.keys(g).map(Number).filter((c) => g[c]);
    return [k, { glyphs: codes.length, height: Math.max(0, ...codes.map((c) => g[c].h)), extra: codes.filter((c) => c < 32 || (c > 126 && ![128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171].includes(c))) }];
  }));
  fs.writeFileSync(path.join(OUT, id + '.json'), JSON.stringify({ source: path.basename(file), label, faces }));
  index.push({ id, source: path.relative(SRC, file).replace(/\\/g, '/'), label, faces: summary });
}
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 1));
for (const s of index) console.log(`${s.id.padEnd(34)} ${s.label.padEnd(24)} faces ${Object.entries(s.faces).map(([k, v]) => `${k}:${v.height}px/${v.glyphs}${v.extra.length ? '+' + v.extra.length + 'pict' : ''}`).join(' ')}`);
