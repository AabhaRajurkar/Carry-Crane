/**
 * AnimationQueue & Tween Engine
 *
 * Guarantees that 3D animations (especially Crane moves and bundle transforms)
 * are strictly serialized and never run concurrently or desync from logic state.
 * Disables user interactions while isBusy is true.
 */

export class AnimationQueue {
  constructor() {
    this.queue = [];
    this.isBusy = false;
    this.listeners = [];
    this.activeTaskDescription = null;
    this.prefersReducedMotion = false;

    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.prefersReducedMotion = mediaQuery.matches;
      mediaQuery.addEventListener('change', (e) => {
        this.prefersReducedMotion = e.matches;
      });
    }
  }

  /**
   * Register state listener for busy state changes.
   * @param {Function} callback (isBusy, activeTaskDescription) => void
   */
  onStateChange(callback) {
    this.listeners.push(callback);
    return () => {
      const idx = this.listeners.indexOf(callback);
      if (idx !== -1) this.listeners.splice(idx, 1);
    };
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.isBusy, this.activeTaskDescription);
      } catch (e) {
        console.error('AnimationQueue listener error:', e);
      }
    }
  }

  /**
   * Adds an async animation task to the sequential queue.
   * @param {Function} taskAsync async function () => Promise<void>
   * @param {string} description Human-readable label for debugging / state
   * @returns {Promise<any>}
   */
  enqueue(taskAsync, description = 'animation') {
    return new Promise((resolve, reject) => {
      this.queue.push({
        taskAsync,
        description,
        resolve,
        reject
      });
      this.processNext();
    });
  }

  async processNext() {
    if (this.isBusy || this.queue.length === 0) {
      return;
    }

    this.isBusy = true;
    const current = this.queue.shift();
    this.activeTaskDescription = current.description;
    this.notify();

    try {
      const result = await current.taskAsync();
      current.resolve(result);
    } catch (err) {
      console.error(`Error executing animation [${current.description}]:`, err);
      current.reject(err);
    } finally {
      this.isBusy = false;
      this.activeTaskDescription = null;
      this.notify();
      // Process next in line
      this.processNext();
    }
  }

  clear() {
    this.queue = [];
    this.isBusy = false;
    this.activeTaskDescription = null;
    this.notify();
  }

  get length() {
    return this.queue.length;
  }
}

/**
 * Basic tween helper for smooth Three.js property animations.
 */
export function tween({
  duration = 500,
  easing = easeInOutQuad,
  onUpdate,
  queue
}) {
  return new Promise((resolve) => {
    // If reduced motion is requested, compress duration
    const effectiveDuration = queue && queue.prefersReducedMotion ? Math.min(duration, 150) : duration;
    const startTime = (typeof performance !== 'undefined' ? performance.now() : Date.now());

    function step() {
      const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / effectiveDuration);
      const eased = easing(progress);

      if (onUpdate) {
        onUpdate(eased, progress);
      }

      if (progress < 1) {
        if (typeof requestAnimationFrame !== 'undefined') {
          requestAnimationFrame(step);
        } else {
          setTimeout(step, 16);
        }
      } else {
        if (onUpdate) onUpdate(1, 1);
        resolve();
      }
    }

    step();
  });
}

// Easing formulas
export function linear(t) {
  return t;
}

export function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function easeOutBounce(t) {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75;
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375;
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
}

export function easeOutElastic(t) {
  const c4 = (2 * Math.PI) / 3;
  return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}
