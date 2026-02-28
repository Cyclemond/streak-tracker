(function () {
  'use strict';

  // ── Helpers ──────────────────────────────────────────────
  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function yesterdayStr() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }

  function uid() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function esc(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Data ─────────────────────────────────────────────────
  function getHabits() {
    try { return JSON.parse(localStorage.getItem('habits') || '[]'); }
    catch { return []; }
  }

  function saveHabits(arr) {
    localStorage.setItem('habits', JSON.stringify(arr));
  }

  // ── CRUD ─────────────────────────────────────────────────
  function addHabit(name) {
    const habits = getHabits();
    habits.push({ id: uid(), name: name.trim(), lastCheckIn: null, streak: 0, bestStreak: 0 });
    saveHabits(habits);
    renderGrid();
  }

  function renameHabit(id, newName) {
    const habits = getHabits();
    const h = habits.find(h => h.id === id);
    if (h) { h.name = newName.trim(); saveHabits(habits); renderGrid(); }
  }

  function deleteHabit(id) {
    saveHabits(getHabits().filter(h => h.id !== id));
    renderGrid();
  }

  function checkIn(id) {
    const habits = getHabits();
    const h = habits.find(h => h.id === id);
    if (!h || h.lastCheckIn === todayStr()) return;

    const newStreak = h.lastCheckIn === yesterdayStr() ? h.streak + 1 : 1;
    h.streak = newStreak;
    h.bestStreak = Math.max(newStreak, h.bestStreak || 0);
    h.lastCheckIn = todayStr();
    saveHabits(habits);
    renderGrid(id); // pass id so we can pulse that card
  }

  // ── Render ───────────────────────────────────────────────
  function displayStreak(h) {
    if (h.lastCheckIn && h.lastCheckIn !== todayStr() && h.lastCheckIn !== yesterdayStr()) {
      return 0; // streak is broken
    }
    return h.streak;
  }

  function makeCard(h, pulseId) {
    const checked = h.lastCheckIn === todayStr();
    const streak = displayStreak(h);
    const onFire = streak >= 3;

    const card = document.createElement('div');
    card.className = 'card' + (checked ? ' checked' : '') + (h.id === pulseId ? ' just-checked' : '');
    card.dataset.id = h.id;

    card.innerHTML =
      '<div class="card-top">' +
        '<span class="card-name">' + esc(h.name) + '</span>' +
        '<button class="menu-btn" aria-label="Options">&#8942;</button>' +
      '</div>' +
      '<div class="card-check">' +
        '<svg class="card-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' +
          '<circle class="c-circle" cx="50" cy="50" r="44"/>' +
          '<polyline class="c-mark" points="25,52 42,68 75,34"/>' +
        '</svg>' +
      '</div>' +
      '<div class="card-streak">' +
        '<span class="streak-num' + (onFire ? ' on-fire' : '') + '">' + streak + '</span>' +
        '<span class="streak-days">day' + (streak === 1 ? '' : 's') + '</span>' +
      '</div>';

    // Pulse cleanup
    if (h.id === pulseId) {
      card.addEventListener('animationend', () => card.classList.remove('just-checked'), { once: true });
    }

    // Check-in on card tap (not menu btn)
    card.addEventListener('click', function (e) {
      if (e.target.closest('.menu-btn')) return;
      checkIn(h.id);
    });

    // Three-dot menu
    card.querySelector('.menu-btn').addEventListener('click', function (e) {
      e.stopPropagation();
      openSheet(h.id, h.name);
    });

    return card;
  }

  function renderGrid(pulseId) {
    const habits = getHabits();
    const grid = document.getElementById('grid');
    const empty = document.getElementById('emptyState');

    grid.innerHTML = '';

    if (habits.length === 0) {
      empty.style.display = 'flex';
    } else {
      empty.style.display = 'none';
      habits.forEach(h => grid.appendChild(makeCard(h, pulseId)));
    }
  }

  // ── Modal (add / rename) ──────────────────────────────────
  const modalBackdrop = document.getElementById('modalBackdrop');
  const modalTitle    = document.getElementById('modalTitle');
  const modalInput    = document.getElementById('modalInput');
  const modalSave     = document.getElementById('modalSave');
  const modalCancel   = document.getElementById('modalCancel');

  let modalMode = null; // 'add' | 'rename'
  let modalTargetId = null;

  function openModal(mode, habitId, currentName) {
    modalMode = mode;
    modalTargetId = habitId || null;
    modalTitle.textContent = mode === 'add' ? 'New Habit' : 'Rename Habit';
    modalSave.textContent  = mode === 'add' ? 'Add' : 'Save';
    modalInput.value = currentName || '';
    modalBackdrop.classList.add('open');
    setTimeout(() => modalInput.focus(), 50);
  }

  function closeModal() {
    modalBackdrop.classList.remove('open');
    modalInput.value = '';
    modalMode = null;
    modalTargetId = null;
  }

  function submitModal() {
    const name = modalInput.value.trim();
    if (!name) return;
    if (modalMode === 'add') { addHabit(name); }
    else if (modalMode === 'rename') { renameHabit(modalTargetId, name); }
    closeModal();
  }

  document.getElementById('addBtn').addEventListener('click', () => openModal('add'));
  modalCancel.addEventListener('click', closeModal);
  modalSave.addEventListener('click', submitModal);
  modalInput.addEventListener('keydown', e => {
    if (e.key === 'Enter')  submitModal();
    if (e.key === 'Escape') closeModal();
  });
  modalBackdrop.addEventListener('click', e => {
    if (e.target === modalBackdrop) closeModal();
  });

  // ── Action sheet (three-dot) ──────────────────────────────
  const sheetBackdrop = document.getElementById('sheetBackdrop');
  const sheetName     = document.getElementById('sheetName');
  const sheetRename   = document.getElementById('sheetRename');
  const sheetDelete   = document.getElementById('sheetDelete');
  const sheetCancel   = document.getElementById('sheetCancel');

  let activeSheetId   = null;
  let activeSheetName = null;

  function openSheet(id, name) {
    activeSheetId   = id;
    activeSheetName = name;
    sheetName.textContent = name;
    sheetBackdrop.classList.add('open');
  }

  function closeSheet() {
    sheetBackdrop.classList.remove('open');
    activeSheetId   = null;
    activeSheetName = null;
  }

  sheetBackdrop.addEventListener('click', e => {
    if (e.target === sheetBackdrop) closeSheet();
  });
  sheetCancel.addEventListener('click', closeSheet);

  sheetRename.addEventListener('click', () => {
    const id   = activeSheetId;
    const name = activeSheetName;
    closeSheet();
    openModal('rename', id, name);
  });

  sheetDelete.addEventListener('click', () => {
    const id = activeSheetId;
    closeSheet();
    deleteHabit(id);
  });

  // ── Init ─────────────────────────────────────────────────
  renderGrid();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
  }
})();
