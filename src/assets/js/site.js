// odjezdy.online: look switch (BUSE / PID tablo), board clock, photo viewer, supporters embed colour.
(() => {
  const root = document.documentElement;
  const LOOKS = ['buse', 'pid'];

  function applyLook(look) {
    if (!LOOKS.includes(look)) look = 'buse';
    root.dataset.look = look;
    document.querySelectorAll('[data-switch]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.switch === look)));
    tick();
  }
  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-switch]');
    if (!b) return;
    try { localStorage.setItem('odjezdy-look', b.dataset.switch); } catch (_) {}
    applyLook(b.dataset.switch);
  });

  // clock: HH:MM:SS on the BUSE board when there is room, HH:MM otherwise; PID adds the date
  const p2 = (n) => String(n).padStart(2, '0');
  const DAYS = ['ne', 'po', 'út', 'st', 'čt', 'pá', 'so'];
  function tick() {
    const d = new Date();
    const secs = root.dataset.look === 'buse' ? window.innerWidth >= 720 : true;
    document.querySelectorAll('.clk').forEach((el) => { el.textContent = `${p2(d.getHours())}:${p2(d.getMinutes())}${secs ? ':' + p2(d.getSeconds()) : ''}`; });
    document.querySelectorAll('.dte').forEach((el) => { el.textContent = `${DAYS[d.getDay()]} ${d.getDate()}. ${d.getMonth() + 1}.`; });
  }
  setInterval(tick, 1000);

  // photos in posts open full size (on the BUSE board they are drawn in amber dots)
  const dlg = document.getElementById('photo');
  document.addEventListener('click', (ev) => {
    const img = ev.target.closest('.feat img, .prose img');
    if (!img || img.closest('a') || !dlg) return;
    const big = document.getElementById('photo-img');
    big.src = img.currentSrc || img.src; big.alt = img.alt || '';
    const cap = img.closest('figure')?.querySelector('figcaption');
    document.getElementById('photo-cap').textContent = cap ? cap.textContent.trim() : (img.alt || '');
    try { dlg.showModal(); } catch (_) { dlg.setAttribute('open', ''); }
  });
  if (dlg) dlg.addEventListener('click', (ev) => { if (ev.target === dlg) dlg.close(); });

  // supporters: public feed from the donations API (CORS, cached 60 s), drawn in the current look.
  // Every record keeps its own currency; amounts are never converted.
  const SOURCES = { patreon: 'Patreon', kofi: 'Ko-fi', crypto: 'Krypto' };
  const money = (cents, cur) => {
    // '$' is a pictogram in the BUSE font, so dollars are written as "USD"
    try { return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: cur || 'USD', currencyDisplay: /^(USD|CAD|AUD)$/.test(cur || 'USD') ? 'code' : 'symbol', minimumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100); }
    catch (_) { return `${(cents / 100).toFixed(2)} ${cur || ''}`; }
  };
  function renderSupporters(box, data) {
    const fill = (key, rows) => {
      const col = box.querySelector(`[data-list="${key}"]`);
      if (!col) return;
      col.querySelectorAll('ol, .sup-empty').forEach((n) => n.remove());
      if (!rows || !rows.length) {
        if (key === 'recent') { col.hidden = true; return; }
        const p = document.createElement('p'); p.className = 'sup-empty'; p.textContent = 'Zatím žádní podporovatelé. Buďte první!'; col.append(p); return;
      }
      col.hidden = false;
      const ol = document.createElement('ol'); ol.className = 'sup-list';
      for (const r of rows) {
        const li = document.createElement('li');
        const name = document.createElement('span'); name.className = 'sup-name'; name.textContent = r.displayName || 'Anonym';
        const src = document.createElement('span'); src.className = 'sup-src'; src.textContent = SOURCES[r.source] || r.source || '';
        const amt = document.createElement('span'); amt.className = 'sup-amt'; amt.textContent = r.amountCents > 0 ? money(r.amountCents, r.currency) : '';
        li.append(name, src, amt); ol.append(li);
      }
      col.append(ol);
    };
    fill('top', data.top); fill('recent', data.recent);
    const links = data.links || {};
    document.querySelectorAll('.sup-links [data-link]').forEach((a) => {
      const url = links[a.dataset.link];
      if (url) { a.href = url; a.hidden = false; } else if (a.dataset.link === 'crypto' && a.getAttribute('href') === '#') a.hidden = true;
    });
  }
  document.querySelectorAll('.sup[data-feed]').forEach((box) => {
    fetch(box.dataset.feed).then((r) => (r.ok ? r.json() : Promise.reject(r.status))).then((d) => renderSupporters(box, d)).catch(() => {});
  });
  window.odjezdySupporters = renderSupporters; // for previewing with sample data

  // "Kopírovat adresu" on /projekty/; if the clipboard is refused, select the address instead
  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-copy]');
    if (!b) return;
    const done = () => { const t = b.textContent; b.textContent = 'Zkopírováno'; setTimeout(() => { b.textContent = t; }, 1600); };
    const select = () => { const c = b.parentElement.querySelector('.p-addr'); if (c) { const r = document.createRange(); r.selectNodeContents(c); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } };
    if (navigator.clipboard) navigator.clipboard.writeText(b.dataset.copy).then(done, select); else select();
  });

  let saved = '';
  try { saved = localStorage.getItem('odjezdy-look') || ''; } catch (_) {}
  applyLook(saved || root.dataset.look);
})();
