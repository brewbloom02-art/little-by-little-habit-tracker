/**
 * Little by Little — Calm, Mobile-First Habit Tracker MVP
 * Zero dependencies, works offline, GitHub Pages & Capacitor ready.
 */

// --- Audio Feedback (Calming Web Audio Synthesizer) ---
class SoundEffects {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  playGentleChime() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      // Gentle dual-tone pentatonic chime (E5 + B5)
      const freqs = [659.25, 987.77];
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.08 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.65);
      });
    } catch (e) {
      // Audio autoplay policy or unavailable, fail silently
    }
  }
}

const sounds = new SoundEffects();

// --- Storage & State Management ---
const STORAGE_KEYS = {
  HABITS: 'lbl_habits_v1',
  CHECKINS: 'lbl_checkins_v1',
  SETTINGS: 'lbl_settings_v1',
  DISMISSED_REMINDERS: 'lbl_dismissed_reminders_v1'
};

const DEFAULT_HABITS = [
  {
    id: 'demo-1',
    name: 'Morning Glass of Water',
    description: 'A gentle glass of water to wake up hydrated.',
    emoji: '💧',
    frequency: { type: 'everyday' },
    reminderTime: '08:00',
    reminderEnabled: true,
    paused: false,
    isDemo: true,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: 'demo-2',
    name: 'Read 5 Pages',
    description: 'A few quiet pages before turning out the lamp.',
    emoji: '📖',
    frequency: { type: 'everyday' },
    reminderTime: '21:00',
    reminderEnabled: true,
    paused: false,
    isDemo: true,
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString()
  },
  {
    id: 'demo-3',
    name: 'Gentle Walk or Stretch',
    description: 'A short step outside for fresh air.',
    emoji: '🌿',
    frequency: { type: 'custom', days: [1, 2, 3, 4, 5] }, // Mon - Fri
    reminderTime: '17:30',
    reminderEnabled: false,
    paused: false,
    isDemo: true,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
  }
];

// Helper: Format Date to YYYY-MM-DD in local time
function getLocalDateStr(dateObj = new Date()) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Generate pre-populated checkins for demo habits so user sees history right away
function generateDemoCheckins() {
  const checkins = {};
  const today = new Date();
  
  // Create realistic gentle past 5 days of checkins
  for (let i = 1; i <= 4; i++) {
    const past = new Date(today);
    past.setDate(past.getDate() - i);
    const dateStr = getLocalDateStr(past);
    
    // Water completed on days 1, 2, 3, 4
    checkins[`demo-1_${dateStr}`] = {
      habitId: 'demo-1',
      date: dateStr,
      completed: true,
      note: i === 1 ? 'Added a slice of lemon' : '',
      completedAt: past.toISOString()
    };

    // Reading completed on days 1, 2, 4 (day 3 was a rest day, naturally)
    if (i !== 3) {
      checkins[`demo-2_${dateStr}`] = {
        habitId: 'demo-2',
        date: dateStr,
        completed: true,
        note: i === 1 ? 'Finished chapter 4' : '',
        completedAt: past.toISOString()
      };
    }

    // Walk on weekdays
    const dayOfWeek = past.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      checkins[`demo-3_${dateStr}`] = {
        habitId: 'demo-3',
        date: dateStr,
        completed: true,
        note: 'Sunny afternoon stroll',
        completedAt: past.toISOString()
      };
    }
  }

  return checkins;
}

class Store {
  constructor() {
    this.habits = [];
    this.checkins = {};
    this.settings = {
      notificationsAllowed: false,
      hasSeenDemoNotice: true
    };
    this.init();
  }

  init() {
    try {
      const storedHabits = localStorage.getItem(STORAGE_KEYS.HABITS);
      const storedCheckins = localStorage.getItem(STORAGE_KEYS.CHECKINS);
      const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);

      if (storedHabits) {
        this.habits = JSON.parse(storedHabits);
      } else {
        // First run: load default demo habits
        this.habits = DEFAULT_HABITS;
        this.saveHabits();
      }

      if (storedCheckins) {
        this.checkins = JSON.parse(storedCheckins);
      } else {
        this.checkins = generateDemoCheckins();
        this.saveCheckins();
      }

      if (storedSettings) {
        this.settings = Object.assign(this.settings, JSON.parse(storedSettings));
      }
    } catch (e) {
      console.warn('Storage initialisation fallback', e);
      this.habits = DEFAULT_HABITS;
      this.checkins = {};
    }
  }

  saveHabits() {
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(this.habits));
  }

  saveCheckins() {
    localStorage.setItem(STORAGE_KEYS.CHECKINS, JSON.stringify(this.checkins));
  }

  saveSettings() {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
  }

  getHabit(id) {
    return this.habits.find(h => h.id === id);
  }

  addHabit(habitData) {
    const newHabit = {
      id: 'habit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name: habitData.name.trim(),
      description: (habitData.description || '').trim(),
      emoji: habitData.emoji || '🌿',
      frequency: habitData.frequency || { type: 'everyday' },
      reminderTime: habitData.reminderTime || '',
      reminderEnabled: Boolean(habitData.reminderEnabled && habitData.reminderTime),
      paused: false,
      isDemo: false,
      createdAt: new Date().toISOString()
    };
    this.habits.push(newHabit);
    this.saveHabits();
    return newHabit;
  }

  updateHabit(id, updateData) {
    const index = this.habits.findIndex(h => h.id === id);
    if (index !== -1) {
      this.habits[index] = { ...this.habits[index], ...updateData };
      this.saveHabits();
      return this.habits[index];
    }
    return null;
  }

  deleteHabit(id) {
    this.habits = this.habits.filter(h => h.id !== id);
    // Optionally clean checkins
    Object.keys(this.checkins).forEach(key => {
      if (key.startsWith(id + '_')) {
        delete this.checkins[key];
      }
    });
    this.saveHabits();
    this.saveCheckins();
  }

  toggleCheckin(habitId, dateStr) {
    const key = `${habitId}_${dateStr}`;
    const current = this.checkins[key];
    const isNowCompleted = !(current && current.completed);

    if (isNowCompleted) {
      this.checkins[key] = {
        habitId,
        date: dateStr,
        completed: true,
        note: current ? current.note : '',
        completedAt: new Date().toISOString()
      };
    } else {
      this.checkins[key] = {
        habitId,
        date: dateStr,
        completed: false,
        note: current ? current.note : '',
        completedAt: null
      };
    }

    this.saveCheckins();
    return isNowCompleted;
  }

  setNote(habitId, dateStr, noteText) {
    const key = `${habitId}_${dateStr}`;
    if (!this.checkins[key]) {
      this.checkins[key] = {
        habitId,
        date: dateStr,
        completed: false,
        note: noteText.trim(),
        completedAt: null
      };
    } else {
      this.checkins[key].note = noteText.trim();
    }
    this.saveCheckins();
  }

  getCheckin(habitId, dateStr) {
    return this.checkins[`${habitId}_${dateStr}`] || null;
  }

  clearDemoHabits() {
    this.habits = this.habits.filter(h => !h.isDemo);
    Object.keys(this.checkins).forEach(key => {
      if (key.startsWith('demo-')) {
        delete this.checkins[key];
      }
    });
    this.saveHabits();
    this.saveCheckins();
  }

  claimDemoHabits() {
    this.habits.forEach(h => {
      if (h.isDemo) h.isDemo = false;
    });
    this.saveHabits();
  }
}

const store = new Store();

// --- Habit Rules & Calculations ---
const HabitLogic = {
  isScheduledForDate(habit, dateObj) {
    if (habit.paused) return false;
    if (habit.frequency.type === 'everyday') return true;
    if (habit.frequency.type === 'custom' && Array.isArray(habit.frequency.days)) {
      return habit.frequency.days.includes(dateObj.getDay());
    }
    return true;
  },

  calculateStreak(habit, storeInstance) {
    // Current streak counts backward from today (or yesterday if today isn't done yet)
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    const today = new Date();
    const todayStr = getLocalDateStr(today);
    const todayCheck = storeInstance.getCheckin(habit.id, todayStr);
    const todayScheduled = this.isScheduledForDate(habit, today);
    const isTodayDone = todayCheck && todayCheck.completed;

    // Scan backwards from today (or yesterday if today isn't done yet)
    let checkDate = new Date(today);
    if (!isTodayDone) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    let broken = false;
    for (let i = 0; i < 90; i++) {
      const dateStr = getLocalDateStr(checkDate);
      const isScheduled = this.isScheduledForDate(habit, checkDate);

      if (isScheduled) {
        const check = storeInstance.getCheckin(habit.id, dateStr);
        if (check && check.completed) {
          if (!broken) currentStreak++;
        } else {
          broken = true;
        }
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Calculate best streak historically across last 90 days
    let scanDate = new Date(today);
    scanDate.setDate(scanDate.getDate() - 90);
    tempStreak = 0;

    for (let i = 0; i <= 90; i++) {
      const dateStr = getLocalDateStr(scanDate);
      const isScheduled = this.isScheduledForDate(habit, scanDate);

      if (isScheduled) {
        const check = storeInstance.getCheckin(habit.id, dateStr);
        if (check && check.completed) {
          tempStreak++;
          if (tempStreak > bestStreak) bestStreak = tempStreak;
        } else {
          tempStreak = 0;
        }
      }
      scanDate.setDate(scanDate.getDate() + 1);
    }

    if (currentStreak > bestStreak) {
      bestStreak = currentStreak;
    }

    return { currentStreak, bestStreak };
  },

  getGentleStreakMessage(currentStreak, bestStreak) {
    if (currentStreak === 0) {
      return 'Every small step counts 🌱';
    } else if (currentStreak === 1) {
      return '1 day together ✨';
    } else {
      return `${currentStreak} days together 🌿`;
    }
  }
};

// --- Reminders & Notifications Engine ---
const RemindersEngine = {
  init() {
    this.checkDueReminders();
    // Check every 30 seconds
    setInterval(() => this.checkDueReminders(), 30000);
  },

  async requestPermission() {
    if (!('Notification' in window)) {
      UI.showToast('Web notifications are not supported in this browser.');
      return false;
    }

    if (Notification.permission === 'granted') {
      store.settings.notificationsAllowed = true;
      store.saveSettings();
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        store.settings.notificationsAllowed = true;
        store.saveSettings();
        UI.showToast('Gentle reminders enabled ✨');
        return true;
      }
    }

    UI.showToast('Notifications permission was not granted.');
    return false;
  },

  checkDueReminders() {
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMinutes}`;
    const todayStr = getLocalDateStr(now);

    let dismissed = [];
    try {
      dismissed = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.DISMISSED_REMINDERS) || '[]');
    } catch (e) {}

    store.habits.forEach(habit => {
      if (!habit.reminderEnabled || !habit.reminderTime || habit.paused) return;
      if (!HabitLogic.isScheduledForDate(habit, now)) return;

      const check = store.getCheckin(habit.id, todayStr);
      if (check && check.completed) return;

      // Check if time matches current minute
      if (habit.reminderTime === currentTimeStr) {
        const reminderKey = `${habit.id}_${todayStr}_${currentTimeStr}`;
        if (dismissed.includes(reminderKey)) return;

        // Show in-app banner
        UI.showDueReminderBanner(habit, reminderKey);

        // Native Web Notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('Little by Little', {
              body: `${habit.emoji} Time for your gentle habit: ${habit.name}`,
              icon: './assets/icons/icon-192.png'
            });
          } catch (e) {}
        }

        // Capacitor Android Local Notification hook
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) {
          try {
            window.Capacitor.Plugins.LocalNotifications.schedule({
              notifications: [{
                title: 'Little by Little',
                body: `${habit.emoji} Time for ${habit.name}`,
                id: Math.floor(Math.random() * 10000),
                schedule: { at: new Date(Date.now() + 100) }
              }]
            });
          } catch (e) {}
        }
      }
    });
  }
};

// --- UI Controller ---
const UI = {
  currentTab: 'today',
  selectedEmoji: '🌿',
  selectedDays: [1, 2, 3, 4, 5], // default custom days
  frequencyType: 'everyday',
  editingHabitId: null,

  init() {
    this.setupDateDisplay();
    this.setupEventListeners();
    this.handleRoute();
    this.render();
    RemindersEngine.init();
  },

  setupDateDisplay() {
    const todayEl = document.getElementById('todayDateDisplay');
    if (!todayEl) return;
    const now = new Date();
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    todayEl.textContent = now.toLocaleDateString(undefined, options);
  },

  setupEventListeners() {
    // Hash change router
    window.addEventListener('hashchange', () => this.handleRoute());

    // Navigation buttons
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = btn.dataset.tab;
        if (tab) {
          window.location.hash = '#' + tab;
        }
      });
    });

    // New Habit modal triggers
    const openNewBtn = document.getElementById('btnOpenNewHabit');
    if (openNewBtn) {
      openNewBtn.addEventListener('click', () => this.openHabitModal());
    }

    const openEmptyBtn = document.getElementById('btnEmptyAdd');
    if (openEmptyBtn) {
      openEmptyBtn.addEventListener('click', () => this.openHabitModal());
    }

    // Modal Close
    const closeBtn = document.getElementById('btnCloseModal');
    const overlay = document.getElementById('modalOverlay');
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeHabitModal());
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.closeHabitModal();
      });
    }

    // Emoji options in modal
    document.querySelectorAll('.emoji-choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.emoji-choice-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedEmoji = btn.dataset.emoji;
        const customInput = document.getElementById('customEmojiInput');
        if (customInput) customInput.value = '';
      });
    });

    const customEmojiInput = document.getElementById('customEmojiInput');
    if (customEmojiInput) {
      customEmojiInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (val) {
          this.selectedEmoji = val;
          document.querySelectorAll('.emoji-choice-btn').forEach(b => b.classList.remove('selected'));
        }
      });
    }

    // Frequency Segmented Control
    const segEveryday = document.getElementById('segEveryday');
    const segCustom = document.getElementById('segCustom');
    const customDaysContainer = document.getElementById('customDaysContainer');

    if (segEveryday && segCustom) {
      segEveryday.addEventListener('click', () => {
        this.frequencyType = 'everyday';
        segEveryday.classList.add('active');
        segCustom.classList.remove('active');
        if (customDaysContainer) customDaysContainer.style.display = 'none';
      });

      segCustom.addEventListener('click', () => {
        this.frequencyType = 'custom';
        segCustom.classList.add('active');
        segEveryday.classList.remove('active');
        if (customDaysContainer) customDaysContainer.style.display = 'block';
      });
    }

    // Day chips for custom frequency
    document.querySelectorAll('.day-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const day = parseInt(chip.dataset.day, 10);
        chip.classList.toggle('active');
        if (chip.classList.contains('active')) {
          if (!this.selectedDays.includes(day)) this.selectedDays.push(day);
        } else {
          this.selectedDays = this.selectedDays.filter(d => d !== day);
        }
      });
    });

    // Reminder toggle listener
    const reminderToggle = document.getElementById('habitReminderEnabled');
    if (reminderToggle) {
      reminderToggle.addEventListener('change', async (e) => {
        if (e.target.checked) {
          await RemindersEngine.requestPermission();
        }
      });
    }

    // Habit Form Submit
    const habitForm = document.getElementById('habitForm');
    if (habitForm) {
      habitForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveHabitFromForm();
      });
    }

    // Demo Banner actions
    const btnClearDemo = document.getElementById('btnClearDemo');
    const btnKeepDemo = document.getElementById('btnKeepDemo');
    if (btnClearDemo) {
      btnClearDemo.addEventListener('click', () => {
        store.clearDemoHabits();
        this.render();
        this.showToast('Demo habits removed.');
      });
    }
    if (btnKeepDemo) {
      btnKeepDemo.addEventListener('click', () => {
        store.claimDemoHabits();
        this.render();
        this.showToast('Demo habits kept as your own.');
      });
    }
  },

  handleRoute() {
    const hash = window.location.hash.replace('#', '') || 'today';
    const validTabs = ['today', 'habits', 'progress', 'install'];
    this.currentTab = validTabs.includes(hash) ? hash : 'today';

    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    const activeSection = document.getElementById(`view-${this.currentTab}`);
    if (activeSection) activeSection.classList.add('active');

    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.tab === this.currentTab);
    });

    // If install tab opened, render QR code
    if (this.currentTab === 'install') {
      this.renderInstallTab();
    } else {
      this.render();
    }
  },

  render() {
    this.renderDemoBanner();
    this.renderTodayView();
    this.renderHabitsView();
    this.renderProgressView();
  },

  renderDemoBanner() {
    const banner = document.getElementById('demoBanner');
    if (!banner) return;
    const hasDemo = store.habits.some(h => h.isDemo);
    banner.style.display = hasDemo ? 'flex' : 'none';
  },

  renderTodayView() {
    const container = document.getElementById('todayHabitsList');
    const emptyState = document.getElementById('todayEmptyState');
    const summaryCard = document.getElementById('todaySummaryCard');
    const progressFill = document.getElementById('todayProgressFill');
    const summaryCount = document.getElementById('todaySummaryCount');
    const encouragementMsg = document.getElementById('todayEncouragement');

    if (!container) return;

    const today = new Date();
    const todayStr = getLocalDateStr(today);

    // Filter habits due today (not paused & matching schedule)
    const dueHabits = store.habits.filter(h => HabitLogic.isScheduledForDate(h, today));

    if (dueHabits.length === 0) {
      container.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      if (summaryCard) summaryCard.style.display = 'none';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (summaryCard) summaryCard.style.display = 'block';

    let completedCount = 0;
    container.innerHTML = '';

    dueHabits.forEach(habit => {
      const checkin = store.getCheckin(habit.id, todayStr);
      const isCompleted = checkin && checkin.completed;
      if (isCompleted) completedCount++;

      const { currentStreak, bestStreak } = HabitLogic.calculateStreak(habit, store);
      const streakMsg = HabitLogic.getGentleStreakMessage(currentStreak, bestStreak);

      const card = document.createElement('div');
      card.className = `habit-card ${isCompleted ? 'completed' : ''}`;
      card.id = `card-${habit.id}`;

      const noteText = (checkin && checkin.note) ? checkin.note : '';

      card.innerHTML = `
        <div class="habit-main-row">
          <button class="check-btn" aria-label="Mark ${habit.name} complete" data-habit-id="${habit.id}">
            <svg class="check-icon" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </button>
          <div class="habit-content">
            <div class="habit-title-row">
              <span class="habit-emoji">${habit.emoji}</span>
              <span class="habit-name">${this.escapeHTML(habit.name)}</span>
            </div>
            ${habit.description ? `<p class="habit-desc">${this.escapeHTML(habit.description)}</p>` : ''}
            <div class="habit-meta-row">
              <span class="meta-pill streak">${streakMsg}</span>
              ${habit.reminderEnabled && habit.reminderTime ? `<span class="meta-pill reminder">⏰ ${habit.reminderTime}</span>` : ''}
            </div>
          </div>
          <div class="habit-actions">
            <button class="btn-icon-soft btn-note-toggle" title="Add note" data-habit-id="${habit.id}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Note Section -->
        <div class="note-container" id="note-sec-${habit.id}" style="${noteText ? 'display:block;' : 'display:none;'}">
          <div class="note-input-row">
            <input type="text" class="note-textarea" placeholder="A quiet note or reflection for today..." value="${this.escapeHTML(noteText)}" data-habit-id="${habit.id}">
            <button class="btn-banner btn-save-note" data-habit-id="${habit.id}">Save</button>
          </div>
        </div>
      `;

      // Event listener for check button
      const checkBtn = card.querySelector('.check-btn');
      checkBtn.addEventListener('click', () => {
        const isDone = store.toggleCheckin(habit.id, todayStr);
        if (isDone) {
          sounds.playGentleChime();
          this.showToast(`Completed: ${habit.name} ✨`);
        } else {
          this.showToast(`Undone: ${habit.name}`);
        }
        this.render();
      });

      // Event listener for note toggle
      const noteToggleBtn = card.querySelector('.btn-note-toggle');
      noteToggleBtn.addEventListener('click', () => {
        const noteSec = card.querySelector(`#note-sec-${habit.id}`);
        if (noteSec) {
          const isHidden = noteSec.style.display === 'none';
          noteSec.style.display = isHidden ? 'block' : 'none';
          if (isHidden) {
            const input = noteSec.querySelector('.note-textarea');
            if (input) input.focus();
          }
        }
      });

      // Save note button
      const saveNoteBtn = card.querySelector('.btn-save-note');
      saveNoteBtn.addEventListener('click', () => {
        const input = card.querySelector('.note-textarea');
        if (input) {
          store.setNote(habit.id, todayStr, input.value);
          this.showToast('Note saved 📝');
        }
      });

      // Also save note on Enter key
      const noteInput = card.querySelector('.note-textarea');
      noteInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          store.setNote(habit.id, todayStr, noteInput.value);
          this.showToast('Note saved 📝');
        }
      });

      container.appendChild(card);
    });

    // Update summary progress
    const pct = Math.round((completedCount / dueHabits.length) * 100);
    if (progressFill) progressFill.style.width = `${pct}%`;
    if (summaryCount) summaryCount.textContent = `${completedCount} of ${dueHabits.length} done`;

    if (encouragementMsg) {
      if (completedCount === 0) {
        encouragementMsg.textContent = 'Take your time. Routine grows at its own gentle pace.';
      } else if (completedCount === dueHabits.length) {
        encouragementMsg.textContent = 'All finished for today! You took gentle care of yourself 🌿';
      } else {
        encouragementMsg.textContent = `${completedCount} steps forward. Keep moving lightly.`;
      }
    }
  },

  renderHabitsView() {
    const list = document.getElementById('allHabitsList');
    if (!list) return;

    if (store.habits.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🌱</div>
          <h3 class="empty-title">No habits created yet</h3>
          <p class="empty-text">Start small with a tiny habit you enjoy doing.</p>
          <button class="btn-primary empty-btn" onclick="UI.openHabitModal()">+ Create your first habit</button>
        </div>
      `;
      return;
    }

    list.innerHTML = '';
    store.habits.forEach(habit => {
      const card = document.createElement('div');
      card.className = `habit-card ${habit.paused ? 'paused' : ''}`;

      const freqText = habit.frequency.type === 'everyday'
        ? 'Every day'
        : 'Specific days: ' + (habit.frequency.days || []).map(d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ');

      card.innerHTML = `
        <div class="habit-main-row">
          <span class="habit-emoji" style="font-size: 1.8rem;">${habit.emoji}</span>
          <div class="habit-content">
            <div class="habit-title-row">
              <span class="habit-name">${this.escapeHTML(habit.name)}</span>
              ${habit.paused ? '<span class="meta-pill paused-badge">Paused</span>' : ''}
              ${habit.isDemo ? '<span class="meta-pill">Demo</span>' : ''}
            </div>
            ${habit.description ? `<p class="habit-desc">${this.escapeHTML(habit.description)}</p>` : ''}
            <div class="habit-meta-row">
              <span class="meta-pill">📅 ${freqText}</span>
              ${habit.reminderEnabled && habit.reminderTime ? `<span class="meta-pill reminder">⏰ ${habit.reminderTime}</span>` : ''}
            </div>
          </div>
          <div class="habit-actions">
            <button class="btn-icon-soft btn-edit" title="Edit habit" data-habit-id="${habit.id}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </button>
          </div>
        </div>
      `;

      card.querySelector('.btn-edit').addEventListener('click', () => {
        this.openHabitModal(habit.id);
      });

      list.appendChild(card);
    });
  },

  renderProgressView() {
    const statsContainer = document.getElementById('progressStatsContainer');
    const habitsHistory = document.getElementById('progressHabitsHistory');
    if (!statsContainer || !habitsHistory) return;

    // Calculate overall stats
    const today = new Date();
    let totalCompletedThisWeek = 0;
    let daysWithAtLeastOneCompletion = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dStr = getLocalDateStr(d);
      let dayCompleted = 0;

      store.habits.forEach(h => {
        const c = store.getCheckin(h.id, dStr);
        if (c && c.completed) {
          totalCompletedThisWeek++;
          dayCompleted++;
        }
      });

      if (dayCompleted > 0) daysWithAtLeastOneCompletion++;
    }

    statsContainer.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${totalCompletedThisWeek}</div>
          <div class="stat-label">Check-ins this week</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${daysWithAtLeastOneCompletion} / 7</div>
          <div class="stat-label">Active days this week</div>
        </div>
      </div>
    `;

    // Render 7-day strip for each habit
    habitsHistory.innerHTML = '';
    if (store.habits.length === 0) {
      habitsHistory.innerHTML = '<p class="form-hint">No habits to show history for.</p>';
      return;
    }

    store.habits.forEach(habit => {
      const card = document.createElement('div');
      card.className = 'habit-card';

      const { currentStreak, bestStreak } = HabitLogic.calculateStreak(habit, store);

      // Generate last 7 days dots
      let dotsHtml = '';
      for (let i = 6; i >= 0; i--) {
        const pastDate = new Date(today);
        pastDate.setDate(pastDate.getDate() - i);
        const pastDateStr = getLocalDateStr(pastDate);
        const isScheduled = HabitLogic.isScheduledForDate(habit, pastDate);
        const check = store.getCheckin(habit.id, pastDateStr);
        const isDone = check && check.completed;
        const isToday = i === 0;

        const dayName = ['Su','Mo','Tu','We','Th','Fr','Sa'][pastDate.getDay()];

        let dotClass = 'strip-dot';
        let dotContent = '';
        if (isDone) {
          dotClass += ' done';
          dotContent = '✓';
        } else if (isScheduled) {
          dotClass += ' scheduled';
        }
        if (isToday) dotClass += ' today';

        dotsHtml += `
          <div class="strip-day-col">
            <span class="strip-day-label">${dayName}</span>
            <div class="${dotClass}" title="${pastDateStr}">${dotContent}</div>
          </div>
        `;
      }

      card.innerHTML = `
        <div class="habit-main-row">
          <span class="habit-emoji">${habit.emoji}</span>
          <div class="habit-content">
            <div class="habit-title-row">
              <span class="habit-name">${this.escapeHTML(habit.name)}</span>
            </div>
            <div class="habit-meta-row">
              <span class="meta-pill streak">${currentStreak} days current</span>
              <span class="meta-pill">Best: ${bestStreak} days</span>
            </div>
          </div>
        </div>

        <div class="progress-strip-container">
          <div class="strip-label">
            <span>Recent 7 Days</span>
            <span>${habit.paused ? 'Paused' : 'Active'}</span>
          </div>
          <div class="strip-dots">
            ${dotsHtml}
          </div>
        </div>
      `;

      habitsHistory.appendChild(card);
    });
  },

  renderInstallTab() {
    const qrTarget = document.getElementById('qrCodeContainer');
    const qrUrlDisplay = document.getElementById('qrUrlDisplay');
    if (!qrTarget) return;

    // Use current URL origin + path, stripped of hash and index.html
    let currentUrl = window.location.href.split('#')[0];
    if (window.location.protocol.startsWith('file:') || currentUrl.includes('localhost') || currentUrl.includes('127.0.0.1')) {
      currentUrl = 'https://brewbloom02-art.github.io/little-by-little-habit-tracker/install.html';
    } else if (currentUrl.endsWith('index.html')) {
      currentUrl = currentUrl.replace('index.html', 'install.html');
    } else if (!currentUrl.endsWith('install.html')) {
      currentUrl = currentUrl.replace(/\/?$/, '/install.html');
    }

    if (qrUrlDisplay) qrUrlDisplay.textContent = currentUrl;

    if (window.LittleQR && typeof window.LittleQR.generateSVG === 'function') {
      qrTarget.innerHTML = window.LittleQR.generateSVG(currentUrl, {
        size: 180,
        margin: 2,
        color: '#1C382F',
        bgColor: '#FFFFFF'
      });
    }
  },

  openHabitModal(habitId = null) {
    this.editingHabitId = habitId;
    const overlay = document.getElementById('modalOverlay');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('habitForm');
    const deleteBtn = document.getElementById('btnDeleteHabit');
    const pauseBtn = document.getElementById('btnPauseHabit');

    form.reset();

    if (habitId) {
      const habit = store.getHabit(habitId);
      if (!habit) return;

      modalTitle.textContent = 'Edit Habit';
      document.getElementById('habitName').value = habit.name;
      document.getElementById('habitDescription').value = habit.description || '';
      document.getElementById('habitReminderTime').value = habit.reminderTime || '';
      document.getElementById('habitReminderEnabled').checked = Boolean(habit.reminderEnabled);

      this.selectedEmoji = habit.emoji || '🌿';
      this.frequencyType = habit.frequency.type;
      this.selectedDays = habit.frequency.days ? [...habit.frequency.days] : [1, 2, 3, 4, 5];

      if (deleteBtn) {
        deleteBtn.style.display = 'inline-block';
        deleteBtn.onclick = () => {
          if (confirm(`Remove "${habit.name}"? Progress history will be cleared.`)) {
            store.deleteHabit(habitId);
            this.closeHabitModal();
            this.render();
            this.showToast('Habit removed.');
          }
        };
      }

      if (pauseBtn) {
        pauseBtn.style.display = 'inline-block';
        pauseBtn.textContent = habit.paused ? 'Resume Habit' : 'Pause Habit';
        pauseBtn.onclick = () => {
          store.updateHabit(habitId, { paused: !habit.paused });
          this.closeHabitModal();
          this.render();
          this.showToast(habit.paused ? 'Habit resumed 🌿' : 'Habit paused gently ☕');
        };
      }
    } else {
      modalTitle.textContent = 'New Habit';
      this.selectedEmoji = '🌿';
      this.frequencyType = 'everyday';
      this.selectedDays = [1, 2, 3, 4, 5];
      if (deleteBtn) deleteBtn.style.display = 'none';
      if (pauseBtn) pauseBtn.style.display = 'none';
    }

    // Update emoji selection UI
    document.querySelectorAll('.emoji-choice-btn').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.emoji === this.selectedEmoji);
    });

    // Update frequency UI
    const segEveryday = document.getElementById('segEveryday');
    const segCustom = document.getElementById('segCustom');
    const customDaysContainer = document.getElementById('customDaysContainer');

    if (this.frequencyType === 'everyday') {
      segEveryday.classList.add('active');
      segCustom.classList.remove('active');
      if (customDaysContainer) customDaysContainer.style.display = 'none';
    } else {
      segCustom.classList.add('active');
      segEveryday.classList.remove('active');
      if (customDaysContainer) customDaysContainer.style.display = 'block';
    }

    document.querySelectorAll('.day-chip').forEach(chip => {
      const d = parseInt(chip.dataset.day, 10);
      chip.classList.toggle('active', this.selectedDays.includes(d));
    });

    overlay.classList.add('active');
  },

  closeHabitModal() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.remove('active');
    this.editingHabitId = null;
  },

  saveHabitFromForm() {
    const nameInput = document.getElementById('habitName');
    const descInput = document.getElementById('habitDescription');
    const reminderTimeInput = document.getElementById('habitReminderTime');
    const reminderCheck = document.getElementById('habitReminderEnabled');

    const name = nameInput.value.trim();
    if (!name) {
      alert('Please give your habit a name.');
      return;
    }

    const frequency = this.frequencyType === 'everyday'
      ? { type: 'everyday' }
      : { type: 'custom', days: this.selectedDays.sort() };

    const habitData = {
      name,
      description: descInput.value.trim(),
      emoji: this.selectedEmoji || '🌿',
      frequency,
      reminderTime: reminderTimeInput.value || '',
      reminderEnabled: reminderCheck.checked && Boolean(reminderTimeInput.value)
    };

    if (this.editingHabitId) {
      store.updateHabit(this.editingHabitId, habitData);
      this.showToast('Habit updated ✨');
    } else {
      store.addHabit(habitData);
      this.showToast('New habit added 🌱');
    }

    this.closeHabitModal();
    this.render();
  },

  showToast(message) {
    const toast = document.getElementById('toastNotice');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  },

  showDueReminderBanner(habit, reminderKey) {
    const banner = document.getElementById('reminderDueBanner');
    if (!banner) return;

    banner.innerHTML = `
      <div class="reminder-due-content">
        <span style="font-size: 1.5rem;">${habit.emoji}</span>
        <div>
          <strong>${this.escapeHTML(habit.name)}</strong> is due now.
          <div style="font-size: 0.75rem; color: #584A73;">A gentle moment for yourself.</div>
        </div>
      </div>
      <div style="display: flex; gap: 6px;">
        <button class="btn-banner" id="btnDueDone" style="background:#5E537B; color:white;">Done</button>
        <button class="btn-banner" id="btnDueDismiss">Dismiss</button>
      </div>
    `;

    banner.style.display = 'flex';

    const dismiss = () => {
      banner.style.display = 'none';
      try {
        const dismissed = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.DISMISSED_REMINDERS) || '[]');
        dismissed.push(reminderKey);
        sessionStorage.setItem(STORAGE_KEYS.DISMISSED_REMINDERS, JSON.stringify(dismissed));
      } catch (e) {}
    };

    const doneBtn = document.getElementById('btnDueDone');
    const dismissBtn = document.getElementById('btnDueDismiss');

    if (doneBtn) {
      doneBtn.onclick = () => {
        store.toggleCheckin(habit.id, getLocalDateStr());
        sounds.playGentleChime();
        this.showToast(`Completed: ${habit.name} ✨`);
        this.render();
        dismiss();
      };
    }
    if (dismissBtn) {
      dismissBtn.onclick = () => dismiss();
    }
  },

  escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }
};

// --- Service Worker Registration ---
if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => {
      console.warn('Service worker registration failed:', err);
    });
  });
}

// Boot application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  UI.init();
});
