/**
 * Mascot View: Friendly speech bubble for "Craney"
 * Speaks in short, encouraging kid-friendly sentences (max 8-10 words).
 */

export class MascotView {
  constructor(containerElement) {
    this.container = containerElement;
    this.currentText = '';
    this.render();
  }

  say(text, mood = 'happy') {
    this.currentText = text;
    const bubbleText = document.getElementById('mascot-text');
    const bubble = document.getElementById('mascot-bubble');
    const avatar = document.getElementById('mascot-avatar');

    if (bubbleText) {
      bubbleText.textContent = text;
    }

    if (bubble) {
      bubble.classList.remove('bounce-in');
      void bubble.offsetWidth; // Trigger reflow
      bubble.classList.add('bounce-in');
    }

    if (avatar) {
      avatar.dataset.mood = mood;
      if (mood === 'excited') {
        avatar.classList.add('jump');
        setTimeout(() => avatar.classList.remove('jump'), 600);
      } else if (mood === 'thinking') {
        avatar.classList.add('wobble');
        setTimeout(() => avatar.classList.remove('wobble'), 500);
      }
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="mascot-widget" aria-live="polite">
        <div id="mascot-avatar" class="mascot-avatar" title="Craney the Operator">
          <div class="avatar-hat">⛑️</div>
          <div class="avatar-face">🏗️</div>
        </div>
        <div id="mascot-bubble" class="mascot-bubble bounce-in">
          <span id="mascot-text" class="mascot-text">${this.currentText || 'Hi! Let\'s build numbers and carry bundles!'}</span>
        </div>
      </div>
    `;
  }
}
