(function () {
  const btn = document.getElementById('checkBtn');
  const statusEl = document.getElementById('status');
  const streakEl = document.getElementById('streakNumber');
  const dateEl = document.getElementById('date');
  const bestEl = document.getElementById('bestLabel');

  // --- Helpers ---
  function todayStr() {
    return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  }

  function yesterdayStr() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }

  function formatDate(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
      weekday: 'long', month: 'long', day: 'numeric'
    });
  }

  // --- State ---
  function loadState() {
    return {
      lastCheckIn: localStorage.getItem('lastCheckIn') || null,
      streak: parseInt(localStorage.getItem('streak') || '0', 10),
      bestStreak: parseInt(localStorage.getItem('bestStreak') || '0', 10),
    };
  }

  function saveState(state) {
    localStorage.setItem('lastCheckIn', state.lastCheckIn);
    localStorage.setItem('streak', String(state.streak));
    localStorage.setItem('bestStreak', String(state.bestStreak));
  }

  // --- Render ---
  function render(state, animate) {
    const today = todayStr();
    const checked = state.lastCheckIn === today;

    dateEl.textContent = formatDate(today);

    if (checked) {
      btn.classList.add('checked');
      statusEl.textContent = 'Done for today!';
      statusEl.classList.add('done');
    } else {
      btn.classList.remove('checked');
      statusEl.textContent = 'Tap to check in';
      statusEl.classList.remove('done');
    }

    streakEl.textContent = state.streak;
    if (state.streak >= 3) {
      streakEl.classList.add('on-fire');
    } else {
      streakEl.classList.remove('on-fire');
    }

    if (state.bestStreak > 1) {
      bestEl.textContent = 'Best: ' + state.bestStreak + ' days';
    } else {
      bestEl.textContent = '';
    }

    if (animate) {
      btn.classList.add('just-checked');
      btn.addEventListener('animationend', () => btn.classList.remove('just-checked'), { once: true });
    }
  }

  // --- Check in ---
  function checkIn() {
    const state = loadState();
    const today = todayStr();

    if (state.lastCheckIn === today) return; // already done

    // Calculate new streak
    let newStreak;
    if (state.lastCheckIn === yesterdayStr()) {
      newStreak = state.streak + 1;
    } else {
      newStreak = 1; // streak broken or first time
    }

    const newBest = Math.max(newStreak, state.bestStreak);

    const newState = {
      lastCheckIn: today,
      streak: newStreak,
      bestStreak: newBest,
    };

    saveState(newState);
    render(newState, true);
  }

  // --- Init ---
  function init() {
    const state = loadState();
    const today = todayStr();

    // If last check-in was more than yesterday ago, streak is broken (but don't reset yet — only reset on next check-in)
    // However, display should reflect a broken streak visually
    if (state.lastCheckIn && state.lastCheckIn !== today && state.lastCheckIn !== yesterdayStr()) {
      // Streak is broken — show 0 until they check in again
      render({ ...state, streak: 0 }, false);
    } else {
      render(state, false);
    }

    btn.addEventListener('click', checkIn);
  }

  init();
})();
