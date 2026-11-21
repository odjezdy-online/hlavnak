// One-off import of the Publii site into Markdown files for Eleventy.
// Reads the Publii database read-only and never touches the Publii folder.
//   node scripts/import-publii.mjs [path to the Publii site's input folder]
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const PUBLII = args.find((a) => !a.startsWith('--')) || 'C:/Users/plain/Documents/Publii/sites/odjezdyonline-obnova/input';

// Posts are edited in this repo now (and new ones are written here), and the import
// replaces src/posts and src/pages completely. Refuse unless asked explicitly.
if (fs.existsSync('src/posts') && fs.readdirSync('src/posts').some((f) => f.endsWith('.md')) && !FORCE) {
  console.error('src/posts already has posts; importing would overwrite every edit and delete posts written since.\nRun with --force only if that is what you want.');
  process.exit(1);
}
const db = new DatabaseSync(path.join(PUBLII, 'db.sqlite'), { readOnly: true });

// only the columns we need (the authors table also holds a password hash; it is never read)
const tags = db.prepare('SELECT id, name, slug, description, additional_data FROM tags').all();
// robots defaults from the Publii site settings (categories and authors are noindex unless set otherwise)
const advanced = JSON.parse(fs.readFileSync(path.join(PUBLII, 'config/site.config.json'), 'utf8')).advanced || {};
const authors = db.prepare('SELECT id, name, username FROM authors').all();
const posts = db.prepare('SELECT id, title, authors, slug, text, featured_image_id, created_at, modified_at, status FROM posts').all();
const postTags = db.prepare('SELECT post_id, tag_id FROM posts_tags').all();
const images = db.prepare('SELECT id, post_id, url, additional_data FROM posts_images').all();
const extra = db.prepare('SELECT post_id, key, value FROM posts_additional_data').all();

const json = (s) => { try { return JSON.parse(s || '{}'); } catch { return {}; } };
const tagById = new Map(tags.map((t) => [t.id, t]));
const authorById = new Map(authors.map((a) => [String(a.id), a]));
const postById = new Map(posts.map((p) => [p.id, p]));
const imageById = new Map(images.map((i) => [i.id, i]));
const extraOf = (id, key) => json(extra.find((e) => e.post_id === id && e.key === key)?.value);

const td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', codeBlockStyle: 'fenced', emDelimiter: '*' });
td.use(gfm);
td.keep(['figure', 'iframe', 'video', 'audio', 'footer']);

// Publii placeholders → real paths
function fixLinks(html, id) {
  return html
    .replace(/#DOMAIN_NAME#/g, `/media/posts/${id}/`)
    .replace(/#INTERNAL_LINK#\/post\/(\d+)/g, (_, n) => { const p = postById.get(+n); return p ? `/${p.slug}/` : '/'; })
    .replace(/#INTERNAL_LINK#\/tag\/(\d+)/g, (_, n) => { const t = tagById.get(+n); return t ? `/tags/${t.slug}/` : '/tags/'; })
    .replace(/#INTERNAL_LINK#\/author\/(\d+)/g, (_, n) => { const a = authorById.get(n); return a ? `/authors/${a.username}/` : '/'; })
    .replace(/#INTERNAL_LINK#\/frontpage\/\d+/g, '/')
    .replace(/#INTERNAL_LINK#\/file\/([^"'\s)]+)/g, '/media/files/$1');
}

const yaml = (v) => JSON.stringify(v); // JSON strings and arrays are valid YAML
function frontMatter(obj) {
  return '---\n' + Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && !v.length))
    .map(([k, v]) => `${k}: ${typeof v === 'object' && !Array.isArray(v) ? '\n' + Object.entries(v).filter(([, x]) => x).map(([a, b]) => `  ${a}: ${yaml(b)}`).join('\n') : yaml(v)}`).join('\n') + '\n---\n';
}

for (const dir of ['src/posts', 'src/pages']) { fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true }); }
// directory data: every file in src/posts uses the post layout, src/pages the page layout
fs.writeFileSync('src/posts/posts.11tydata.json', JSON.stringify({ layout: 'post.njk' }, null, 2) + '\n');
fs.writeFileSync('src/pages/pages.11tydata.json', JSON.stringify({ layout: 'page.njk' }, null, 2) + '\n');
fs.mkdirSync('src/_data', { recursive: true });

let nPosts = 0, nPages = 0, skipped = 0;
for (const p of posts) {
  const st = p.status.split(',');
  if (st.includes('trashed') || st.includes('draft') || !st.includes('published')) { skipped++; continue; }
  const isPage = st.includes('is-page');
  const core = extraOf(p.id, '_core');
  const view = extraOf(p.id, 'postViewSettings');
  const img = imageById.get(p.featured_image_id);
  const imgData = img ? json(img.additional_data) : {};
  const fm = {
    title: p.title,
    date: new Date(p.created_at).toISOString(),
    updated: p.modified_at ? new Date(p.modified_at).toISOString() : undefined,
    // Publii's main tag goes first: it is the one shown in lists
    categories: postTags.filter((x) => x.post_id === p.id).sort((a, b) => (b.tag_id === core.mainTag) - (a.tag_id === core.mainTag)).map((x) => tagById.get(x.tag_id)?.name).filter(Boolean),
    author: authorById.get(String(p.authors).split(',')[0])?.username,
    featured: st.includes('featured') || undefined,
    hidden: st.includes('hidden') || undefined,
    homepage: st.includes('excluded_homepage') ? false : undefined,
    description: core.metaDesc || undefined,
    metaTitle: core.metaTitle ? core.metaTitle.replace(/\s*-?\s*%sitename\s*$/, '') || undefined : undefined,
    lead: view.displayPostLead?.value || undefined,
    image: img?.url ? { src: `/media/posts/${p.id}/${img.url}`, alt: imgData.alt, caption: imgData.caption, credits: imgData.credits } : undefined,
    permalink: `/${p.slug}/`,
    publiiId: p.id,
    // imported bodies are plain Markdown/HTML; new posts may use {% linka "501" %}
    templateEngineOverride: 'md',
  };
  // posts written in Publii's Markdown editor are already Markdown; the rest is TinyMCE HTML
  const body = core.editor === 'markdown' ? fixLinks(p.text || '', p.id) : td.turndown(fixLinks(p.text || '', p.id));
  const file = path.join(isPage ? 'src/pages' : 'src/posts', `${p.slug}.md`);
  fs.writeFileSync(file, frontMatter(fm) + '\n' + body.trim() + '\n');
  isPage ? nPages++ : nPosts++;

  // media: originals only (Publii's responsive copies are regenerated, not needed)
  const mdir = path.join(PUBLII, 'media/posts', String(p.id));
  if (fs.existsSync(mdir)) {
    fs.cpSync(mdir, path.join('src/media/posts', String(p.id)), { recursive: true, filter: (src) => !src.split(/[\\/]/).includes('responsive') });
  }
}
const files = path.join(PUBLII, 'media/files');
if (fs.existsSync(files)) fs.cpSync(files, 'src/media/files', { recursive: true });

fs.writeFileSync('src/_data/categoryList.json', JSON.stringify(tags.map(({ name, slug, description, additional_data }) => ({ name, slug, description: description || '', robots: json(additional_data).metaRobots || advanced.metaRobotsTags || 'index, follow' })), null, 2) + '\n');
fs.writeFileSync('src/_data/authors.json', JSON.stringify(authors.map(({ name, username }) => ({ name, username, robots: advanced.metaRobotsAuthors || 'index, follow' })), null, 2) + '\n');
console.log(`imported ${nPosts} posts and ${nPages} pages, skipped ${skipped} (trashed or drafts), ${tags.length} categories, ${authors.length} authors`);

// always shrink after copying media, so originals (with camera metadata) never end up in the repo
await import('./shrink-images.mjs');
