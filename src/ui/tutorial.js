import { t } from '../strings.js';

/**
 * Tutorial Modal: 3-step friendly interactive onboarding guide.
 * Skippable and re-openable at any time.
 */

export class TutorialModal {
  constructor(containerElement, onFinish) {
    this.container = containerElement;
    this.onFinish = onFinish;
    this.currentStep = 0;
    this.isOpen = false;
  }

  show() {
    this.currentStep = 0;
    this.isOpen = true;
    this.render();
  }

  hide() {
    this.isOpen = false;
    this.container.innerHTML = '';
    if (this.onFinish) this.onFinish();
  }

  next() {
    if (this.currentStep < 2) {
      this.currentStep++;
      this.render();
    } else {
      this.hide();
    }
  }

  prev() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.render();
    }
  }

  render() {
    if (!this.isOpen) {
      this.container.innerHTML = '';
      return;
    }

    const steps = [
      {
        icon: '🟦🟩🟧',
        title: t('tutorialStep1Title'),
        text: t('tutorialStep1Text'),
      },
      {
        icon: '🏗️✨',
        title: t('tutorialStep2Title'),
        text: t('tutorialStep2Text'),
      },
      {
        icon: '📝💡',
        title: t('tutorialStep3Title'),
        text: t('tutorialStep3Text'),
      }
    ];

    const cur = steps[this.currentStep];
    const isLast = this.currentStep === steps.length - 1;

    this.container.innerHTML = `
      <div class="tutorial-backdrop" role="dialog" aria-modal="true" aria-labelledby="tut-title">
        <div class="tutorial-card">
          <button id="tut-close-btn" class="tutorial-close-btn" aria-label="Close tutorial">✕</button>
          
          <div class="tutorial-icon-banner">${cur.icon}</div>
          
          <h2 id="tut-title" class="tutorial-title">${cur.title}</h2>
          <p class="tutorial-description">${cur.text}</p>
          
          <div class="tutorial-dots">
            ${steps.map((_, i) => `<span class="tut-dot ${i === this.currentStep ? 'active' : ''}"></span>`).join('')}
          </div>
          
          <div class="tutorial-actions">
            ${this.currentStep > 0 ? `<button id="tut-prev-btn" class="btn btn-secondary">Back</button>` : '<span></span>'}
            <button id="tut-next-btn" class="btn btn-primary">${isLast ? t('close') : 'Next ➔'}</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('tut-close-btn')?.addEventListener('click', () => this.hide());
    document.getElementById('tut-next-btn')?.addEventListener('click', () => this.next());
    document.getElementById('tut-prev-btn')?.addEventListener('click', () => this.prev());
  }
}
