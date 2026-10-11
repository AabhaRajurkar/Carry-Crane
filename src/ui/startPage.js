import { t, getLanguage, setLanguage } from '../strings.js';
import { soundManager } from '../sound.js';

/**
 * StartPage View: Welcoming, vibrant kid-friendly landing screen.
 * Allows children and teachers to pick modes, levels, language, sound, or view the tutorial.
 */
export class StartPageView {
  constructor({ container, onStartGame, onOpenTutorial, onLanguageChange }) {
    this.container = container;
    this.onStartGame = onStartGame;
    this.onOpenTutorial = onOpenTutorial;
    this.onLanguageChange = onLanguageChange;

    this.selectedMode = 'learnAdd';
    this.selectedLevel = 2;
    this.isVisible = true;

    this.render();
  }

  show() {
    this.isVisible = true;
    this.render();
  }

  hide() {
    const el = document.getElementById('start-page-overlay');
    if (el) {
      el.classList.add('fade-out');
      setTimeout(() => {
        this.isVisible = false;
        this.container.innerHTML = '';
      }, 350);
    } else {
      this.isVisible = false;
      this.container.innerHTML = '';
    }
  }

  render() {
    if (!this.isVisible) {
      this.container.innerHTML = '';
      return;
    }

    const lang = getLanguage();
    const isMuted = soundManager.isMuted();

    this.container.innerHTML = `
      <div id="start-page-overlay" class="start-page-overlay">
        <!-- Floating decorative clouds / shapes -->
        <div class="start-bg-decorations">
          <div class="start-cloud cloud-1">☁️</div>
          <div class="start-cloud cloud-2">☁️</div>
          <div class="start-cloud cloud-3">☁️</div>
          <div class="start-sparkle sparkle-1">✨</div>
          <div class="start-sparkle sparkle-2">🌟</div>
        </div>

        <div class="start-card pop-in">
          <!-- Top Utility Bar (Language, Sound, Tutorial) -->
          <div class="start-top-bar">
            <button id="start-lang-btn" class="hud-icon-btn hud-lang-btn" aria-label="Toggle Language" title="Language">
              🌐 ${lang === 'en' ? 'हिन्दी' : 'English'}
            </button>
            <div class="start-top-right">
              <button id="start-sound-btn" class="hud-icon-btn" aria-label="Toggle Sound" title="Sound">
                ${isMuted ? '🔇' : '🔊'}
              </button>
              <button id="start-help-btn" class="hud-icon-btn hud-help-btn" aria-label="How to Play" title="Tutorial">
                ❓
              </button>
            </div>
          </div>

          <!-- Hero Branding -->
          <div class="start-hero">
            <div class="start-crane-avatar bounce-in">
              <span class="start-crane-icon">🏗️</span>
              <span class="start-badge-star">⭐</span>
            </div>
            <h1 class="start-title">${t('title')}</h1>
            <p class="start-subtitle">${t('startSubtitle')}</p>
          </div>

          <!-- Game Mode Selector Cards -->
          <div class="start-modes-section">
            <h2 class="start-section-heading">${t('chooseMode')}</h2>
            
            <div class="start-modes-grid" role="radiogroup" aria-label="Game Modes">
              <!-- Mode 1: Learn Add -->
              <div class="mode-card mode-add ${this.selectedMode === 'learnAdd' ? 'selected' : ''}" data-mode="learnAdd" role="radio" aria-checked="${this.selectedMode === 'learnAdd'}" tabindex="0">
                <div class="mode-icon-wrap">➕</div>
                <div class="mode-info">
                  <h3 class="mode-title">${t('learnAdd')}</h3>
                  <p class="mode-desc">${t('learnAddDesc')}</p>
                </div>
                <div class="mode-badge-radio">${this.selectedMode === 'learnAdd' ? '✓' : ''}</div>
              </div>

              <!-- Mode 2: Learn Subtract -->
              <div class="mode-card mode-sub ${this.selectedMode === 'learnSub' ? 'selected' : ''}" data-mode="learnSub" role="radio" aria-checked="${this.selectedMode === 'learnSub'}" tabindex="0">
                <div class="mode-icon-wrap">➖</div>
                <div class="mode-info">
                  <h3 class="mode-title">${t('learnSub')}</h3>
                  <p class="mode-desc">${t('learnSubDesc')}</p>
                </div>
                <div class="mode-badge-radio">${this.selectedMode === 'learnSub' ? '✓' : ''}</div>
              </div>

              <!-- Mode 3: Practice -->
              <div class="mode-card mode-practice ${this.selectedMode === 'practice' ? 'selected' : ''}" data-mode="practice" role="radio" aria-checked="${this.selectedMode === 'practice'}" tabindex="0">
                <div class="mode-icon-wrap">🎯</div>
                <div class="mode-info">
                  <h3 class="mode-title">${t('practice')}</h3>
                  <p class="mode-desc">${t('practiceDesc')}</p>
                </div>
                <div class="mode-badge-radio">${this.selectedMode === 'practice' ? '✓' : ''}</div>
              </div>
            </div>

            <!-- Level Selector Pills (visible when Practice mode is selected) -->
            <div id="start-levels-wrap" class="start-levels-wrap ${this.selectedMode === 'practice' ? '' : 'hidden'}">
              <span class="levels-label">Level:</span>
              <div class="level-pills">
                ${[1, 2, 3, 4, 5].map((lvl) => `
                  <button class="level-pill ${this.selectedLevel === lvl ? 'active' : ''}" data-level="${lvl}" aria-label="Level ${lvl}">
                    ${lvl}
                  </button>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Giant Play Now Action Button -->
          <div class="start-action-row">
            <button id="start-play-btn" class="btn btn-giant-play" aria-label="Play Game Now">
              ${t('playNow')}
            </button>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    // Mode Card Clicks
    const cards = this.container.querySelectorAll('.mode-card');
    cards.forEach((card) => {
      card.addEventListener('click', () => {
        soundManager.playDrop();
        this.selectedMode = card.dataset.mode;
        this.render();
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          soundManager.playDrop();
          this.selectedMode = card.dataset.mode;
          this.render();
        }
      });
    });

    // Level Pills
    const levelPills = this.container.querySelectorAll('.level-pill');
    levelPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        soundManager.playDrop();
        this.selectedLevel = parseInt(pill.dataset.level, 10);
        levelPills.forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
      });
    });

    // Language Toggle
    const langBtn = document.getElementById('start-lang-btn');
    langBtn?.addEventListener('click', () => {
      const current = getLanguage();
      const nextLang = current === 'en' ? 'hi' : 'en';
      setLanguage(nextLang);
      if (this.onLanguageChange) this.onLanguageChange(nextLang);
      this.render();
    });

    // Sound Toggle
    const soundBtn = document.getElementById('start-sound-btn');
    soundBtn?.addEventListener('click', () => {
      const active = soundManager.toggleSound();
      soundBtn.textContent = active ? '🔊' : '🔇';
    });

    // Help / Tutorial
    const helpBtn = document.getElementById('start-help-btn');
    helpBtn?.addEventListener('click', () => {
      if (this.onOpenTutorial) this.onOpenTutorial();
    });

    // Play Now Button
    const playBtn = document.getElementById('start-play-btn');
    playBtn?.addEventListener('click', () => {
      soundManager.playSuccess();
      if (this.onStartGame) {
        this.onStartGame(this.selectedMode, this.selectedLevel);
      }
      this.hide();
    });
  }
}
