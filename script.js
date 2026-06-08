/* ════════════════════════════════════════════════════
   BLAZER — script.js
   1. Search
   2. Game popup
   3. Admin panel (password-gated, localStorage CRUD)
   4. Card entrance animations
════════════════════════════════════════════════════ */

const ADMIN_PASSWORD = 'ilovev3n104';
const LS_DELETED     = 'blazer_deleted';
const LS_EDITS       = 'blazer_edits';
const LS_ADDED       = 'blazer_added';

/* ── 1. SEARCH ──────────────────────────────────────── */
const navSearch = document.getElementById('navSearch');

navSearch.addEventListener('input', () => {
  const q = navSearch.value.toLowerCase().trim();
  document.querySelectorAll('.game-card, .feat-card').forEach(card => {
    const name = (card.dataset.name || card.querySelector('img')?.alt || '').toLowerCase();
    card.style.display = (!q || name.includes(q)) ? '' : 'none';
  });
  document.querySelectorAll('.section-header').forEach(hdr => {
    const grid = hdr.nextElementSibling;
    if (!grid) return;
    const anyVisible = [...grid.querySelectorAll('.game-card')].some(c => c.style.display !== 'none');
    hdr.style.display = (q && !anyVisible) ? 'none' : '';
    grid.style.display = (q && !anyVisible) ? 'none' : '';
  });
});

/* ── 2. GAME POPUP ──────────────────────────────────── */
const overlay    = document.getElementById('popupOverlay');
const popupImg   = document.getElementById('popupImg');
const popupTitle = document.getElementById('popupTitle');
const popupDesc  = document.getElementById('popupDesc');
const popupStart = document.getElementById('popupStart');
const popupClose = document.getElementById('popupClose');

function openPopup(name, desc, img, url) {
  popupTitle.textContent = name;
  popupDesc.textContent  = desc || 'No description available.';
  popupImg.src           = img  || '';
  popupImg.alt           = name;
  popupStart.href        = url  || '#';
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closePopup() {
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

// Intercept ALL game-card and feat-card clicks → show popup
document.addEventListener('click', e => {
  const card = e.target.closest('.game-card, .feat-card');
  if (!card) return;
  // Don't intercept if admin panel is open
  if (document.getElementById('adminPanel').classList.contains('open')) return;
  e.preventDefault();
  openPopup(
    card.dataset.name || card.querySelector('.game-label')?.textContent || 'Game',
    card.dataset.desc || '',
    card.dataset.img  || card.querySelector('img')?.src || '',
    card.getAttribute('href') || '#'
  );
});

popupClose.addEventListener('click', closePopup);
overlay.addEventListener('click', e => { if (e.target === overlay) closePopup(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closePopup(); });

// Start button opens game in same tab
popupStart.addEventListener('click', e => {
  e.stopPropagation();
  closePopup();
  // navigation happens via href
});

/* ── 3. ADMIN PANEL ─────────────────────────────────── */

// ── State helpers
function getDeleted()  { try { return JSON.parse(localStorage.getItem(LS_DELETED) || '[]'); } catch { return []; } }
function getEdits()    { try { return JSON.parse(localStorage.getItem(LS_EDITS)   || '{}'); } catch { return {}; } }
function getAdded()    { try { return JSON.parse(localStorage.getItem(LS_ADDED)   || '[]'); } catch { return []; } }
function saveDeleted(v){ localStorage.setItem(LS_DELETED, JSON.stringify(v)); }
function saveEdits(v)  { localStorage.setItem(LS_EDITS,   JSON.stringify(v)); }
function saveAdded(v)  { localStorage.setItem(LS_ADDED,   JSON.stringify(v)); }

// ── Apply stored changes to existing DOM cards on page load
function applyStoredChanges() {
  const deleted = getDeleted();
  const edits   = getEdits();

  document.querySelectorAll('.game-card, .feat-card').forEach(card => {
    const url = card.getAttribute('href') || '';
    // Deletions
    if (deleted.includes(url)) card.style.display = 'none';
    // Edits
    if (edits[url]) {
      const e = edits[url];
      if (e.name) {
        card.dataset.name = e.name;
        const lbl = card.querySelector('.game-label');
        if (lbl) lbl.textContent = e.name;
        const ov = card.querySelector('.feat-overlay span');
        if (ov) ov.textContent = e.name;
      }
      if (e.desc) card.dataset.desc = e.desc;
      if (e.img) {
        card.dataset.img = e.img;
        const img = card.querySelector('img');
        if (img) img.src = e.img;
      }
      if (e.url) card.setAttribute('href', e.url);
    }
  });
}
applyStoredChanges();

// ── Render admin-added games
function renderAddedGames() {
  const added   = getAdded();
  const section = document.getElementById('adminSection');
  const grid    = document.getElementById('adminGames');
  if (!added.length) { section.style.display = 'none'; return; }
  section.style.display = '';
  grid.innerHTML = '';
  added.forEach(g => {
    const a = document.createElement('a');
    a.href         = g.url;
    a.className    = 'game-card';
    a.dataset.name = g.name;
    a.dataset.desc = g.desc || '';
    a.dataset.img  = g.img  || '';
    a.innerHTML    = `<img src="${g.img||''}" alt="${g.name}"><div class="game-label">${g.name}</div>`;
    grid.appendChild(a);
    animateCard(a, grid.children.length * 35);
  });
}
renderAddedGames();

// ── Build admin game list
function buildAdminList(filter = '') {
  const list    = document.getElementById('adminGameList');
  const deleted = getDeleted();
  const edits   = getEdits();
  const added   = getAdded();
  list.innerHTML = '';

  // Collect all base cards from DOM
  const baseCards = [...document.querySelectorAll('.game-card, .feat-card')]
    .filter(c => !c.closest('#adminGames'));

  const allItems = [];
  baseCards.forEach(card => {
    const url  = card.getAttribute('href') || '';
    const edit = edits[url] || {};
    allItems.push({
      name:   edit.name || card.dataset.name || card.querySelector('.game-label')?.textContent || 'Game',
      url:    edit.url  || url,
      img:    edit.img  || card.dataset.img  || card.querySelector('img')?.src || '',
      desc:   edit.desc || card.dataset.desc || '',
      origUrl: url,
      type:   'base',
      deleted: deleted.includes(url),
    });
  });

  // Add custom games
  added.forEach((g, i) => {
    allItems.push({ ...g, origUrl: null, type: 'custom', index: i, deleted: false });
  });

  // Deduplicate by name (base cards appear multiple times for featured + grid)
  const seen = new Set();
  const unique = allItems.filter(item => {
    if (seen.has(item.origUrl || item.url)) return false;
    seen.add(item.origUrl || item.url); return true;
  });

  const filtered = filter
    ? unique.filter(i => i.name.toLowerCase().includes(filter.toLowerCase()))
    : unique;

  document.getElementById('adminGameCount').textContent = filtered.length;

  if (!filtered.length) {
    list.innerHTML = '<div style="color:var(--text-dim);font-size:.85rem;padding:.5rem">No games found.</div>';
    return;
  }

  filtered.forEach(item => {
    const row = document.createElement('div');
    row.className = 'admin-game-row' + (item.deleted ? ' admin-row-deleted' : '');

    const thumb = document.createElement('img');
    thumb.className = 'admin-row-thumb';
    thumb.src = item.img || '';
    thumb.onerror = () => thumb.style.background = 'var(--surface)';

    const info = document.createElement('div');
    info.className = 'admin-row-info';
    info.innerHTML = `<div class="admin-row-name">${item.name}</div>
                      <div class="admin-row-url">${item.url}</div>`;

    const badge = document.createElement('span');
    badge.className = `admin-row-badge ${item.type === 'custom' ? 'badge-custom' : 'badge-base'}`;
    badge.textContent = item.type === 'custom' ? 'Added' : 'Base';

    const actions = document.createElement('div');
    actions.className = 'admin-row-actions';

    if (!item.deleted) {
      const editBtn = document.createElement('button');
      editBtn.className = 'admin-btn-edit';
      editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
      editBtn.title = 'Edit';
      editBtn.addEventListener('click', () => openEditModal(item));
      actions.appendChild(editBtn);
    }

    const delBtn = document.createElement('button');
    if (item.deleted) {
      delBtn.className = 'admin-btn-restore admin-btn-edit';
      delBtn.innerHTML = '<i class="fa-solid fa-rotate-left"></i>';
      delBtn.title = 'Restore';
      delBtn.addEventListener('click', () => {
        const d = getDeleted().filter(u => u !== item.origUrl);
        saveDeleted(d);
        applyStoredChanges();
        buildAdminList(document.getElementById('adminSearch').value);
      });
    } else if (item.type === 'custom') {
      delBtn.className = 'admin-btn-del';
      delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
      delBtn.title = 'Delete';
      delBtn.addEventListener('click', () => {
        if (!confirm(`Delete "${item.name}"?`)) return;
        const a = getAdded().filter(g => g.url !== item.url);
        saveAdded(a);
        renderAddedGames();
        buildAdminList(document.getElementById('adminSearch').value);
      });
    } else {
      delBtn.className = 'admin-btn-del';
      delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
      delBtn.title = 'Hide game';
      delBtn.addEventListener('click', () => {
        if (!confirm(`Hide "${item.name}" from the site?`)) return;
        const d = getDeleted();
        if (!d.includes(item.origUrl)) d.push(item.origUrl);
        saveDeleted(d);
        applyStoredChanges();
        buildAdminList(document.getElementById('adminSearch').value);
      });
    }
    actions.appendChild(delBtn);

    row.append(thumb, info, badge, actions);
    list.appendChild(row);
  });
}

// ── Edit modal
function openEditModal(item) {
  document.getElementById('editIndex').value = item.origUrl || item.url;
  document.getElementById('editName').value  = item.name;
  document.getElementById('editUrl').value   = item.url;
  document.getElementById('editImg').value   = item.img;
  document.getElementById('editDesc').value  = item.desc;
  document.getElementById('editModal').dataset.itemType = item.type;
  document.getElementById('editModal').classList.add('open');
}

document.getElementById('editCancel').addEventListener('click', () =>
  document.getElementById('editModal').classList.remove('open'));
document.getElementById('editModal').addEventListener('click', e => {
  if (e.target === document.getElementById('editModal'))
    document.getElementById('editModal').classList.remove('open');
});

document.getElementById('editSave').addEventListener('click', () => {
  const origUrl  = document.getElementById('editIndex').value;
  const newName  = document.getElementById('editName').value.trim();
  const newUrl   = document.getElementById('editUrl').value.trim();
  const newImg   = document.getElementById('editImg').value.trim();
  const newDesc  = document.getElementById('editDesc').value.trim();
  const itemType = document.getElementById('editModal').dataset.itemType;

  if (!newName) { alert('Name is required.'); return; }

  if (itemType === 'custom') {
    const added = getAdded();
    const idx   = added.findIndex(g => g.url === origUrl);
    if (idx !== -1) {
      added[idx] = { name: newName, url: newUrl||origUrl, img: newImg, desc: newDesc };
      saveAdded(added);
      renderAddedGames();
    }
  } else {
    const edits = getEdits();
    edits[origUrl] = { name: newName, url: newUrl, img: newImg, desc: newDesc };
    saveEdits(edits);
    applyStoredChanges();
  }

  document.getElementById('editModal').classList.remove('open');
  buildAdminList(document.getElementById('adminSearch').value);
});

// ── Add game
document.getElementById('adminAddBtn').addEventListener('click', () => {
  const name = document.getElementById('aName').value.trim();
  const url  = document.getElementById('aUrl').value.trim();
  const img  = document.getElementById('aImg').value.trim();
  const desc = document.getElementById('aDesc').value.trim();
  if (!name || !url) { alert('Name and URL are required.'); return; }
  const added = getAdded();
  added.push({ name, url, img, desc });
  saveAdded(added);
  renderAddedGames();
  buildAdminList(document.getElementById('adminSearch').value);
  ['aName','aUrl','aImg','aDesc'].forEach(id => document.getElementById(id).value = '');
});

// ── Admin search filter
document.getElementById('adminSearch').addEventListener('input', e =>
  buildAdminList(e.target.value));

// ── FAB → password gate
document.getElementById('adminFab').addEventListener('click', () => {
  document.getElementById('adminPwInput').value = '';
  document.getElementById('adminGateErr').textContent = '';
  document.getElementById('adminGate').classList.add('open');
  setTimeout(() => document.getElementById('adminPwInput').focus(), 100);
});

document.getElementById('adminGateCancel').addEventListener('click', () =>
  document.getElementById('adminGate').classList.remove('open'));
document.getElementById('adminGate').addEventListener('click', e => {
  if (e.target === document.getElementById('adminGate'))
    document.getElementById('adminGate').classList.remove('open');
});

function submitPassword() {
  const pw = document.getElementById('adminPwInput').value;
  if (pw === ADMIN_PASSWORD) {
    document.getElementById('adminGate').classList.remove('open');
    buildAdminList();
    document.getElementById('adminPanel').classList.add('open');
    document.body.style.overflow = 'hidden';
  } else {
    document.getElementById('adminGateErr').textContent = 'Incorrect password.';
    document.getElementById('adminPwInput').value = '';
    document.getElementById('adminPwInput').focus();
  }
}
document.getElementById('adminGateSubmit').addEventListener('click', submitPassword);
document.getElementById('adminPwInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') submitPassword();
});

document.getElementById('adminPanelClose').addEventListener('click', () => {
  document.getElementById('adminPanel').classList.remove('open');
  document.body.style.overflow = '';
});
document.getElementById('adminPanel').addEventListener('click', e => {
  if (e.target === document.getElementById('adminPanel')) {
    document.getElementById('adminPanel').classList.remove('open');
    document.body.style.overflow = '';
  }
});

/* ── 4. CARD ENTRANCE ANIMATIONS + PLAY BUTTON INJECTION ── */
const PLAY_SVG = `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M3 2.5l10 5.5-10 5.5z"/></svg>`;

const cardObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity   = '1';
      entry.target.style.transform = 'translateY(0)';
      cardObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.05 });

function animateCard(card, delayMs) {
  card.style.opacity   = '0';
  card.style.transform = 'translateY(16px)';
  card.style.transition = `opacity 0.4s ${delayMs}ms ease, transform 0.4s ${delayMs}ms ease, box-shadow 0.25s, border-color 0.25s`;
}

// Inject play button into every game/feat card
document.querySelectorAll('.game-card, .feat-card').forEach((card, i) => {
  // Play button
  const btn = document.createElement('div');
  btn.className = 'card-play';
  btn.innerHTML = PLAY_SVG;
  btn.setAttribute('aria-hidden', 'true');
  card.appendChild(btn);

  // Entrance animation
  animateCard(card, (i % 10) * 35);
  cardObserver.observe(card);
});
