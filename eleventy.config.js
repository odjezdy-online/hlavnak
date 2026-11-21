import fs from 'node:fs';
import crypto from 'node:crypto';

// short labels for category boxes (PID) and the category column (BUSE)
const CODES = {
  'Info / Update': 'INFO', 'MHD': 'MHD', 'Uzavírky': 'UZ', 'OMSI': 'OMSI', 'Blog': 'BLOG', 'BLOG': 'BLOG',
  'Z mého okolí': 'OKOLÍ', 'Affiliate': 'AFF', 'Murder Drones': 'MD', 'Radio': 'RÁDIO', 'INFO': 'INFO',
};
// categories that mark a closure / diversion: the post gets the warning triangle
const CLOSURE = new Set(['Uzavírky']);

// warning triangle: glyph '#' of the BUSE "line" face (odjezdy-system font.json), as dot squares
const WARN = ['0', '6000', 'f000', '1f800', '39c00', '70e00', 'e6700', '1c6380', '3861c0', '7060e0', 'e06070', '1c06038', '380001c', '700600e', 'e000007', 'fffffff', '7fffffe'];
const WARN_SVG = (() => {
  let r = '';
  WARN.forEach((h, y) => { const v = parseInt(h, 16); for (let x = 0; x < 28; x++) if ((v >> (27 - x)) & 1) r += `<rect x="${x + 0.1}" y="${y + 0.1}" width=".8" height=".8"/>`; });
  return `<svg class="warn warn-led" viewBox="0 1 28 16" role="img" aria-label="Uzavírka"><title>Uzavírka</title><g fill="currentColor">${r}</g></svg>`
    + '<svg class="warn warn-std" viewBox="0 0 24 22" role="img" aria-label="Uzavírka"><title>Uzavírka</title><path d="M12 1.5 23 20.5H1Z" fill="#f9b21f" stroke="#f9b21f" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 8v6.2" stroke="#111" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="17.4" r="1.45" fill="#111"/></svg>';
})();

let catCache = null;
const categories = () => { if (!catCache) { try { catCache = JSON.parse(fs.readFileSync('src/_data/categoryList.json', 'utf8')); } catch { return []; } } return catCache; };
const stripHtml = (s) => String(s || '').replace(/<[^>]+>/g, ' ');

export default function (cfg) {
  cfg.addPassthroughCopy({ 'src/assets': 'assets', 'src/media': 'media' });
  cfg.addPassthroughCopy('src/robots.txt');
  cfg.addPassthroughCopy('src/sitemap.xsl');
  cfg.addPassthroughCopy('src/_redirects'); // Cloudflare Pages: old Publii addresses
  cfg.addPassthroughCopy('src/_headers'); // Cloudflare Pages: cache rules
  cfg.addWatchTarget('src/assets/');

  const byDate = (a, b) => b.date - a.date;
  cfg.addCollection('posts', (api) => api.getFilteredByGlob('src/posts/*.md').sort(byDate));
  cfg.addCollection('listed', (api) => api.getFilteredByGlob('src/posts/*.md').filter((p) => !p.data.hidden).sort(byDate));
  cfg.addCollection('home', (api) => api.getFilteredByGlob('src/posts/*.md').filter((p) => !p.data.hidden && p.data.homepage !== false).sort(byDate));

  cfg.addFilter('shortDate', (d) => { d = new Date(d); return `${d.getDate()}. ${d.getMonth() + 1}.`; });
  cfg.addFilter('ledDate', (d) => { d = new Date(d); return `${d.getDate()}.${d.getMonth() + 1}.`; });
  cfg.addFilter('csDate', (d) => { d = new Date(d); return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`; });
  cfg.addFilter('isoDate', (d) => new Date(d).toISOString());
  cfg.addFilter('rfcDate', (d) => new Date(d).toUTCString());
  cfg.addFilter('code', (name) => CODES[name] || String(name || '').toUpperCase().slice(0, 5));
  cfg.addFilter('codeClass', (name) => 'c-' + (CODES[name] || 'x').toLowerCase().normalize('NFD').replace(/[^a-z]/g, ''));
  cfg.addFilter('catSlug', (name) => categories().find((c) => c.name === name)?.slug || '');
  cfg.addFilter('isClosure', (cats) => (cats || []).some((c) => CLOSURE.has(c)));
  cfg.addFilter('inCategory', (posts, name) => posts.filter((p) => (p.data.categories || []).includes(name)));
  cfg.addFilter('withCounts', (list, posts) => (list || []).map((c) => ({ ...c, n: posts.filter((p) => (p.data.categories || []).includes(c.name)).length })).filter((c) => c.n).sort((a, b) => b.n - a.n));
  cfg.addFilter('byAuthor', (posts, user) => posts.filter((p) => p.data.author === user));
  cfg.addFilter('readMin', (html) => Math.max(1, Math.round(stripHtml(html).split(/\s+/).filter(Boolean).length / 200)));
  cfg.addFilter('excerpt', (html, n = 180) => { const t = stripHtml(html).replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n).replace(/\s\S*$/, '') + '…' : t; });
  cfg.addFilter('absUrls', (html, base) => String(html).replace(/(src|href)="\//g, `$1="${base}/`));
  // ISO date in Prague time with its offset (2024-05-28T17:56:46+02:00), as Publii writes lastmod
  cfg.addFilter('pragueIso', (d) => {
    d = new Date(d);
    const f = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Prague', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(d).map((p) => [p.type, p.value]));
    const local = Date.UTC(+f.year, +f.month - 1, +f.day, +f.hour, +f.minute, +f.second);
    const off = Math.round((local - Math.floor(d.getTime() / 1000) * 1000) / 60000);
    const sign = off >= 0 ? '+' : '-', a = Math.abs(off);
    return `${f.year}-${f.month}-${f.day}T${f.hour}:${f.minute}:${f.second}${sign}${String(Math.floor(a / 60)).padStart(2, '0')}:${String(a % 60).padStart(2, '0')}`;
  });
  // images in a post for the image sitemap: [{src, alt}] in page order, featured image first.
  // Read from the source file (HTML <img> and Markdown ![alt](src)): the sitemap renders before post bodies.
  cfg.addFilter('imagesIn', (inputPath, base, featured) => {
    const out = [];
    if (featured && featured.src) out.push({ src: featured.src, alt: featured.alt || '' });
    let raw = '';
    try { raw = fs.readFileSync(inputPath, 'utf8').replace(/^---[\s\S]*?\n---/, ''); } catch {}
    const unq = (t) => String(t || '').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    for (const m of raw.matchAll(/<img\b[^>]*>|!\[([^\]]*)\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g)) {
      if (m[0][0] === '<') {
        const src = (m[0].match(/\ssrc="([^"]+)"/) || [])[1];
        if (src) out.push({ src: unq(src), alt: unq((m[0].match(/\salt="([^"]*)"/) || [])[1]) });
      } else out.push({ src: m[2], alt: m[1] });
    }
    return out.filter((x, i) => out.findIndex((y) => y.src === x.src) === i).map((x) => ({ ...x, src: x.src.startsWith('/') ? base + x.src : x.src }));
  });
  // Publii sorts sitemap entries by slug, so /update/ comes before /update-11102024/
  cfg.addFilter('sortByUrl', (arr) => [...(arr || [])].sort((a, b) => { const x = a.url.replace(/\/$/, ''), y = b.url.replace(/\/$/, ''); return x < y ? -1 : x > y ? 1 : 0; }));
  cfg.addFilter('head', (arr, n) => (arr || []).slice(0, n));
  // /assets/x → /assets/x?v=<hash of the file>: a changed file gets a new URL, so no stale CSS, JS or fonts
  cfg.addFilter('v', (url) => { try { return `${url}?v=${crypto.createHash('md5').update(fs.readFileSync('src' + url)).digest('hex').slice(0, 10)}`; } catch { return url; } });
  cfg.addFilter('isUrl', (s) => /^https?:\/\//.test(String(s || '')));
  cfg.addFilter('shortUrl', (s) => String(s || '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''));
  cfg.addFilter('host', (s) => { try { return new URL(s).hostname.replace(/^www\./, ''); } catch { return s; } });

  // BUSE pictograms in posts:
  //   <logocd>, <bus>, <zastavka>, …   named glyphs (list in src/_data/pikto.json, shown on /pisma/)
  //   <pikto-FONT-CODE>               any glyph, e.g. <pikto-vozy-246>
  //   🚌 🚏 🚊 …                      on the BUSE board the emoji becomes the panel pictogram; PID keeps the emoji
  // Only text inside <main> is touched; <script>, <style>, <code> and <pre> are left alone.
  cfg.addTransform('pikto', function (content) {
    if (!String(this.page.outputPath || '').endsWith('.html')) return content;
    let P; try { P = JSON.parse(fs.readFileSync('src/_data/pikto.json', 'utf8')); } catch { return content; }
    const a = content.indexOf('<main'), b = content.lastIndexOf('</main>');
    if (a < 0 || b < 0) return content;
    const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const glyph = (font, code, label, hidden) => `<span class="pk pk-${font}"${hidden ? ' aria-hidden="true"' : ` role="img" aria-label="${esc(label)}"`}>${[].concat(code).map((c) => `&#x${(0xe000 + c).toString(16)};`).join('')}</span>`;
    // the PID look never shows gBUSE fonts: emoji, an icon, a text box or plain text instead
    const pidPart = (p, label) => {
      if (!p) return '';
      if (typeof p === 'string') return `<span class="pk-pid" role="img" aria-label="${esc(label)}">${p}</span>`;
      if (p.img) return `<img class="pk-pid pk-img" src="${p.img}" alt="${esc(label)}" style="height:${p.h || 1}em" loading="lazy" decoding="async">`;
      if (p.badge) return `<span class="pk-pid pk-badge" style="background:${p.bg};color:${p.fg}" role="img" aria-label="${esc(label)}">${esc(p.badge)}</span>`;
      if (p.text) return `<span class="pk-pid">${esc(p.text)}</span>`;
      return '';
    };
    const named = (n) => `<span class="pk-pair">${glyph(n.font, n.codes || n.code, n.label)}${pidPart(n.pid, n.label)}</span>`;
    const fonts = new Set(P.fonts.map((f) => f.id));
    const emojiRe = /(\p{Extended_Pictographic})\uFE0F?/gu;
    let skip = 0;
    const out = content.slice(a, b).split(/(<[^>]+>)/).map((tok) => {
      if (tok.startsWith('<')) {
        const t = tok.match(/^<(\/?)([a-z][a-z0-9-]*)\b/i);
        if (t && /^(script|style|code|pre)$/i.test(t[2])) skip += t[1] ? -1 : 1;
        if (skip > 0 || !t) return tok;
        const name = t[2].toLowerCase();
        const n = P.names[name];
        if (n) return t[1] ? '' : named(n);
        const g = name.match(/^pikto-([a-z0-9-]+?)-(\d+)$/); // font ids may contain '-' (kosice1-7, brno-led-0)
        if (g && fonts.has(g[1])) return t[1] ? '' : `<span class="pk-pair pk-buse-only">${glyph(g[1], Number(g[2]), `piktogram ${g[1]} ${g[2]}`)}</span>`;
        return tok;
      }
      if (skip > 0) return tok;
      return tok.replace(emojiRe, (m, e) => {
        const n = P.names[P.emoji[e]];
        return n ? `<span class="emo-pair">${glyph(n.font, n.code, n.label, true)}<span class="emo">${m}</span></span>` : `<span class="emo emo-only">${m}</span>`;
      });
    }).join('');
    return content.slice(0, a) + out + content.slice(b);
  });
  cfg.addFilter('hex', (n) => Number(n).toString(16).toUpperCase());

  // {% linka "501" %} → a line-number box, styled per look
  cfg.addShortcode('linka', (n) => `<span class="ln">${String(n).replace(/[<>&"]/g, '')}</span>`);
  cfg.addShortcode('warn', () => WARN_SVG);

  return {
    dir: { input: 'src', output: '_site', includes: '_includes', layouts: '_includes/layouts', data: '_data' },
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    templateFormats: ['md', 'njk', 'html'],
  };
}
