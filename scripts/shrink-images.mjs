// Shrinks the photos in src/media in place: at most 1600 px wide, JPEG q82 (mozjpeg),
// PNG re-compressed (palette when it is smaller). Metadata such as camera GPS is dropped;
// orientation is applied first. A file is only replaced when the new one is smaller,
// so running this again does no harm. Paths and file names stay the same.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.argv[2] || 'src/media';
const MAX_W = 1600;

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p); else yield p;
  }
}

let before = 0, after = 0, changed = 0;
for (const file of walk(ROOT)) {
  const ext = path.extname(file).toLowerCase();
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) continue;
  const orig = fs.readFileSync(file);
  before += orig.length;
  let img = sharp(orig, { failOn: 'none' }).rotate();
  const meta = await img.metadata();
  if (meta.width > MAX_W) img = img.resize({ width: MAX_W, withoutEnlargement: true });
  let out;
  if (ext === '.png') {
    const lossless = await img.clone().png({ compressionLevel: 9, effort: 10 }).toBuffer();
    const palette = await img.clone().png({ palette: true, quality: 90, compressionLevel: 9, effort: 10 }).toBuffer();
    out = palette.length < lossless.length ? palette : lossless;
  } else {
    out = await img.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  }
  if (out.length < orig.length) { fs.writeFileSync(file, out); changed++; after += out.length; }
  else after += orig.length;
}
const mb = (n) => (n / 1048576).toFixed(1) + ' MB';
console.log(`images: ${mb(before)} → ${mb(after)} (${changed} files rewritten)`);
