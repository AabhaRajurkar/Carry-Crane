import confetti from 'canvas-confetti';
import { t, getLanguage, setLanguage } from '../strings.js';
import { soundManager } from '../sound.js';

/**
 * HUD: Top bar, Mode/Level Selectors, Big Control Buttons (min 56px), and Celebrations.
 */
export class HUD {
  constructor({
    container,
    onAddUnit,
    onRemoveUnit,
    onAddTen,
    onRemoveTen,
    onAddHundred,
    onRemoveHundred,
    onCheckAnswer,
    onNextProblem,
    onReset,
    onHint,
    onModeChange,
    onLevelChange,
    onOpenTutorial,
    onLanguageChange,
    onOpenHome
  }) {
    this.container = container;
    this.onAddUnit = onAddUnit;
    this.onRemoveUnit = onRemoveUnit;
    this.onAddTen = onAddTen;
    this.onRemoveTen = onRemoveTen;
    this.onAddHundred = onAddHundred;
    this.onRemoveHundred = onRemoveHundred;
    this.onCheckAnswer = onCheckAnswer;
    this.onNextProblem = onNextProblem;
    this.onReset = onReset;
    this.onHint = onHint;
    this.onModeChange = onModeChange;
    this.onLevelChange = onLevelChange;
    this.onOpenTutorial = onOpenTutorial;
    this.onLanguageChange = onLanguageChange;
    this.onOpenHome = onOpenHome;

    this.score = 0;
    this.currentMode = 'learnAdd'; // 'learnAdd' | 'learnSub' | 'practice'
    this.currentLevel = 2; // 1 to 5
    this.isInputLocked = false;

    this.render();
  }

  setScore(score) {
    this.score = score;
    const scoreEl = document.getElementById('hud-score');
    if (scoreEl) scoreEl.textContent = `⭐ ${this.score}`;
  }

  lockInput(locked) {
    this.isInputLocked = locked;
    const buttons = this.container.querySelectorAll('.interactive-btn');
    buttons.forEach((btn) => {
      btn.disabled = locked;
      btn.setAttribute('aria-disabled', String(locked));
    });
  }

  triggerConfetti() {
    confetti({
      particleCount: 75,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#38bdf8', '#22c55e', '#f97316', '#facc15', '#ec4899']
    });
  }

  showFeedbackToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `feedback-toast toast-${type} pop-in`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 400);
    }, 2200);
  }

  render() {
    const isMuted = soundManager.isMuted();
    const lang = getLanguage();

    this.container.innerHTML = `
      <!-- Top Navigation & Header Bar -->
      <header class="hud-top-bar" role="banner">
        <div class="hud-brand">
          <span class="hud-logo-icon">🏗️</span>
          <div class="hud-title-wrap">
            <h1 class="hud-title">${t('title')}</h1>
            <span class="hud-tagline">${t('tagline')}</span>
          </div>
        </div>

        <nav class="hud-controls" aria-label="Game configuration">
          <!-- Home / Start Screen Button -->
          <button id="home-btn" class="hud-icon-btn hud-home-btn" aria-label="Go to Start Screen" title="Start Page">
            🏠 ${t('home')}
          </button>

          <!-- Mode Selector -->
          <div class="select-group">
            <label for="mode-select" class="sr-only">Game Mode</label>
            <select id="mode-select" class="hud-select" aria-label="Game Mode">
              <option value="learnAdd" ${this.currentMode === 'learnAdd' ? 'selected' : ''}>${t('learnAdd')}</option>
              <option value="learnSub" ${this.currentMode === 'learnSub' ? 'selected' : ''}>${t('learnSub')}</option>
              <option value="practice" ${this.currentMode === 'practice' ? 'selected' : ''}>${t('practice')}</option>
            </select>
          </div>

          <!-- Level Selector (shown in Practice mode) -->
          <div id="level-select-group" class="select-group ${this.currentMode === 'practice' ? '' : 'hidden'}">
            <label for="level-select" class="sr-only">Difficulty Level</label>
            <select id="level-select" class="hud-select" aria-label="Difficulty Level">
              <option value="1" ${this.currentLevel === 1 ? 'selected' : ''}>${t('level1')}</option>
              <option value="2" ${this.currentLevel === 2 ? 'selected' : ''}>${t('level2')}</option>
              <option value="3" ${this.currentLevel === 3 ? 'selected' : ''}>${t('level3')}</option>
              <option value="4" ${this.currentLevel === 4 ? 'selected' : ''}>${t('level4')}</option>
              <option value="5" ${this.currentLevel === 5 ? 'selected' : ''}>${t('level5')}</option>
            </select>
          </div>

          <!-- Stars / Score -->
          <div id="hud-score" class="hud-badge hud-score" aria-label="Stars collected">
            ⭐ ${this.score}
          </div>

          <!-- Sound Toggle -->
          <button id="sound-toggle-btn" class="hud-icon-btn" aria-label="Toggle sound" title="Sound Toggle">
            ${isMuted ? '🔇' : '🔊'}
          </button>

          <!-- Language Toggle (EN / HI) -->
          <button id="lang-toggle-btn" class="hud-icon-btn hud-lang-btn" aria-label="Switch Language" title="Language Toggle">
            🌐 ${lang === 'en' ? 'हिन्दी' : 'English'}
          </button>

          <!-- Tutorial Help Button -->
          <button id="help-btn" class="hud-icon-btn hud-help-btn" aria-label="Tutorial and Instructions" title="How to play">
            ❓
          </button>
        </nav>
      </header>

      <!-- Main Playfield Overlay: Left Column Method, Bottom Big Buttons -->
      <main class="hud-playfield">
        <aside id="column-method-container" class="hud-column-method-aside" aria-label="Math Column Sheet">
          <!-- Populated by columnMethod.js -->
        </aside>

        <!-- Center Mascot Message Bubble -->
        <section id="mascot-container" class="hud-mascot-section" aria-label="Crane Operator Assistant">
          <!-- Populated by mascot.js -->
        </section>

        <!-- Bottom Platform Controls: Big Buttons (>= 56px) for tactile touch & clicks -->
        <footer class="hud-bottom-controls" role="toolbar" aria-label="Manipulate Base-10 sticks and bundles">
          <!-- Hundreds Controls (Orange) -->
          <div class="control-cluster cluster-hundreds" aria-label="Hundreds Controls">
            <span class="cluster-label">🟧 ${t('hundreds')}</span>
            <div class="cluster-buttons">
              <button id="btn-add-hundred" class="btn btn-hundred interactive-btn" aria-label="Add 1 Hundred Slab">
                <span class="btn-icon">➕</span> ${t('addHundred')}
              </button>
              <button id="btn-sub-hundred" class="btn btn-sub interactive-btn" aria-label="Remove 1 Hundred Slab">
                <span class="btn-icon">➖</span> ${t('removeHundred')}
              </button>
            </div>
          </div>

          <!-- Tens Controls (Green) -->
          <div class="control-cluster cluster-tens" aria-label="Tens Controls">
            <span class="cluster-label">🟩 ${t('tens')}</span>
            <div class="cluster-buttons">
              <button id="btn-add-ten" class="btn btn-ten interactive-btn" aria-label="Add 1 Ten Bundle">
                <span class="btn-icon">➕</span> ${t('addTen')}
              </button>
              <button id="btn-sub-ten" class="btn btn-sub interactive-btn" aria-label="Remove 1 Ten Bundle">
                <span class="btn-icon">➖</span> ${t('removeTen')}
              </button>
            </div>
          </div>

          <!-- Units Controls (Blue) -->
          <div class="control-cluster cluster-units" aria-label="Units Controls">
            <span class="cluster-label">🟦 ${t('units')}</span>
            <div class="cluster-buttons">
              <button id="btn-add-unit" class="btn btn-unit interactive-btn" aria-label="Add 1 Unit Stick">
                <span class="btn-icon">➕</span> ${t('addUnit')}
              </button>
              <button id="btn-sub-unit" class="btn btn-sub interactive-btn" aria-label="Remove 1 Unit Stick">
                <span class="btn-icon">➖</span> ${t('removeUnit')}
              </button>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="control-cluster cluster-actions" aria-label="Problem Actions">
            <button id="btn-check" class="btn btn-check interactive-btn" aria-label="Check my answer">
              ✅ ${t('checkAnswer')}
            </button>
            <div class="action-sub-buttons">
              <button id="btn-hint" class="btn btn-action-sm interactive-btn" aria-label="Get a hint">
                💡 ${t('hint')}
              </button>
              <button id="btn-reset" class="btn btn-action-sm interactive-btn" aria-label="Reset objects">
                🔄 ${t('reset')}
              </button>
              <button id="btn-next" class="btn btn-action-sm interactive-btn" aria-label="Next problem">
                ⏭️ ${t('nextProblem')}
              </button>
            </div>
          </div>
        </footer>
      </main>

      <!-- Tutorial Overlay Container -->
      <div id="tutorial-container"></div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    // Mode Select
    const modeSelect = document.getElementById('mode-select');
    modeSelect?.addEventListener('change', (e) => {
      this.currentMode = e.target.value;
      const levelGrp = document.getElementById('level-select-group');
      if (levelGrp) {
        if (this.currentMode === 'practice') {
          levelGrp.classList.remove('hidden');
        } else {
          levelGrp.classList.add('hidden');
        }
      }
      if (this.onModeChange) this.onModeChange(this.currentMode);
    });

    // Level Select
    const levelSelect = document.getElementById('level-select');
    levelSelect?.addEventListener('change', (e) => {
      this.currentLevel = parseInt(e.target.value, 10);
      if (this.onLevelChange) this.onLevelChange(this.currentLevel);
    });

    // Sound Toggle
    const soundBtn = document.getElementById('sound-toggle-btn');
    soundBtn?.addEventListener('click', () => {
      const active = soundManager.toggleSound();
      soundBtn.textContent = active ? '🔊' : '🔇';
      this.showFeedbackToast(active ? t('soundOn') : t('soundOff'), 'info');
    });

    // Language Toggle
    const langBtn = document.getElementById('lang-toggle-btn');
    langBtn?.addEventListener('click', () => {
      const current = getLanguage();
      const nextLang = current === 'en' ? 'hi' : 'en';
      setLanguage(nextLang);
      this.render();
      if (this.onLanguageChange) this.onLanguageChange(nextLang);
    });

    // Home / Start Screen
    document.getElementById('home-btn')?.addEventListener('click', () => {
      if (this.onOpenHome) this.onOpenHome();
    });

    // Help
    document.getElementById('help-btn')?.addEventListener('click', () => {
      if (this.onOpenTutorial) this.onOpenTutorial();
    });

    // Unit / Ten / Hundred Buttons
    document.getElementById('btn-add-unit')?.addEventListener('click', () => this.onAddUnit?.());
    document.getElementById('btn-sub-unit')?.addEventListener('click', () => this.onRemoveUnit?.());
    document.getElementById('btn-add-ten')?.addEventListener('click', () => this.onAddTen?.());
    document.getElementById('btn-sub-ten')?.addEventListener('click', () => this.onRemoveTen?.());
    document.getElementById('btn-add-hundred')?.addEventListener('click', () => this.onAddHundred?.());
    document.getElementById('btn-sub-hundred')?.addEventListener('click', () => this.onRemoveHundred?.());

    // Actions
    document.getElementById('btn-check')?.addEventListener('click', () => this.onCheckAnswer?.());
    document.getElementById('btn-hint')?.addEventListener('click', () => this.onHint?.());
    document.getElementById('btn-reset')?.addEventListener('click', () => this.onReset?.());
    document.getElementById('btn-next')?.addEventListener('click', () => this.onNextProblem?.());
  }
}
