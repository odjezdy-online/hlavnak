// odjezdy.online: look switch (BUSE / PID tablo), board clock, photo viewer, supporters embed colour.
(() => {
  const root = document.documentElement;
  const LOOKS = ['buse', 'pid'];
  const ACCENT = { buse: '%23ff8800', pid: '%23c8d42a' };

  function applyLook(look) {
    if (!LOOKS.includes(look)) look = 'buse';
    root.dataset.look = look;
    document.querySelectorAll('[data-switch]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.switch === look)));
    document.querySelectorAll('iframe.donos').forEach((f) => {
      const src = `${f.dataset.base}&accent=${ACCENT[look]}`;
      if (f.getAttribute('src') !== src) f.setAttribute('src', src);
    });
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

  let saved = '';
  try { saved = localStorage.getItem('odjezdy-look') || ''; } catch (_) {}
  applyLook(saved || root.dataset.look);
})();
