/**
 * PlaceValueStateMachine: Pure Base-10 State Machine
 *
 * Models physical units, tens, and hundreds platforms without any 3D or DOM dependencies.
 * Enforces base-10 carrying (>=10 bundles to next platform) and borrowing (borrow 1 to get 10).
 * Emits sequential events for animations and UI synchronization.
 */

export const EventType = {
  UNIT_ADDED: 'UNIT_ADDED',
  UNIT_REMOVED: 'UNIT_REMOVED',
  TEN_ADDED: 'TEN_ADDED',
  TEN_REMOVED: 'TEN_REMOVED',
  HUNDRED_ADDED: 'HUNDRED_ADDED',
  HUNDRED_REMOVED: 'HUNDRED_REMOVED',
  CARRY_UNITS_TO_TENS: 'CARRY_UNITS_TO_TENS',
  CARRY_TENS_TO_HUNDREDS: 'CARRY_TENS_TO_HUNDREDS',
  BORROW_TENS_TO_UNITS: 'BORROW_TENS_TO_UNITS',
  BORROW_HUNDREDS_TO_TENS: 'BORROW_HUNDREDS_TO_TENS',
  CANNOT_BORROW_BELOW_ZERO: 'CANNOT_BORROW_BELOW_ZERO',
  OVERFLOW_1000: 'OVERFLOW_1000',
  STATE_SET: 'STATE_SET',
  RESET: 'RESET'
};

export class PlaceValueStateMachine {
  constructor(initial = { hundreds: 0, tens: 0, units: 0 }) {
    this.hundreds = Math.max(0, initial.hundreds || 0);
    this.tens = Math.max(0, initial.tens || 0);
    this.units = Math.max(0, initial.units || 0);
    this.eventQueue = [];
    this.listeners = [];
  }

  /**
   * Subscribe to state machine events.
   * @param {Function} listener (event) => void
   * @returns {Function} unsubscribe function
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx !== -1) this.listeners.splice(idx, 1);
    };
  }

  emit(type, payload = {}) {
    const event = {
      type,
      payload,
      state: this.getState(),
      value: this.getValue(),
      timestamp: Date.now()
    };
    this.eventQueue.push(event);
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in PlaceValue listener:', err);
      }
    }
  }

  /**
   * Consumes and clears all queued events since last drain.
   * @returns {Array} List of events
   */
  drainEvents() {
    const events = [...this.eventQueue];
    this.eventQueue = [];
    return events;
  }

  getState() {
    return {
      hundreds: this.hundreds,
      tens: this.tens,
      units: this.units
    };
  }

  getValue() {
    return this.hundreds * 100 + this.tens * 10 + this.units * 1;
  }

  /**
   * Verifies if total value matches expected arithmetic invariant
   * and normal canonical range (units: 0-9, tens: 0-9, hundreds: 0-9).
   */
  isValid() {
    return this.units >= 0 && this.tens >= 0 && this.hundreds >= 0 &&
           this.units < 10 && this.tens < 10 && this.hundreds < 10;
  }

  set(hundreds = 0, tens = 0, units = 0) {
    this.hundreds = Math.max(0, hundreds);
    this.tens = Math.max(0, tens);
    this.units = Math.max(0, units);
    this.emit(EventType.STATE_SET, { hundreds: this.hundreds, tens: this.tens, units: this.units });
    this.resolveCarries();
  }

  reset() {
    this.hundreds = 0;
    this.tens = 0;
    this.units = 0;
    this.emit(EventType.RESET, { hundreds: 0, tens: 0, units: 0 });
  }

  /**
   * Add 1 unit stick.
   * If units reach 10, triggers a carry to tens.
   */
  addUnit() {
    if (this.getValue() >= 999) {
      this.emit(EventType.OVERFLOW_1000, { message: 'Maximum value 999 reached' });
      return false;
    }
    this.units += 1;
    this.emit(EventType.UNIT_ADDED, { units: this.units });
    this.resolveCarries();
    return true;
  }

  /**
   * Remove 1 unit stick.
   * If units is 0, attempts to borrow from tens (or hundreds if tens is 0).
   * Never allows negative value.
   */
  removeUnit() {
    if (this.getValue() <= 0) {
      this.emit(EventType.CANNOT_BORROW_BELOW_ZERO, { platform: 'units' });
      return false;
    }

    if (this.units === 0) {
      // Need to borrow first!
      const borrowed = this.applyBorrow('units');
      if (!borrowed) {
        this.emit(EventType.CANNOT_BORROW_BELOW_ZERO, { platform: 'units' });
        return false;
      }
    }

    this.units -= 1;
    this.emit(EventType.UNIT_REMOVED, { units: this.units });
    return true;
  }

  /**
   * Add 1 ten-bundle.
   */
  addTen() {
    if (this.getValue() + 10 > 999) {
      this.emit(EventType.OVERFLOW_1000, { message: 'Maximum value 999 reached' });
      return false;
    }
    this.tens += 1;
    this.emit(EventType.TEN_ADDED, { tens: this.tens });
    this.resolveCarries();
    return true;
  }

  /**
   * Remove 1 ten-bundle.
   */
  removeTen() {
    if (this.hundreds * 100 + this.tens * 10 < 10) {
      this.emit(EventType.CANNOT_BORROW_BELOW_ZERO, { platform: 'tens' });
      return false;
    }

    if (this.tens === 0) {
      const borrowed = this.applyBorrow('tens');
      if (!borrowed) {
        this.emit(EventType.CANNOT_BORROW_BELOW_ZERO, { platform: 'tens' });
        return false;
      }
    }

    this.tens -= 1;
    this.emit(EventType.TEN_REMOVED, { tens: this.tens });
    return true;
  }

  /**
   * Add 1 hundred-slab.
   */
  addHundred() {
    if (this.hundreds >= 9) {
      this.emit(EventType.OVERFLOW_1000, { message: 'Maximum value 999 reached' });
      return false;
    }
    this.hundreds += 1;
    this.emit(EventType.HUNDRED_ADDED, { hundreds: this.hundreds });
    return true;
  }

  /**
   * Remove 1 hundred-slab.
   */
  removeHundred() {
    if (this.hundreds <= 0) {
      this.emit(EventType.CANNOT_BORROW_BELOW_ZERO, { platform: 'hundreds' });
      return false;
    }
    this.hundreds -= 1;
    this.emit(EventType.HUNDRED_REMOVED, { hundreds: this.hundreds });
    return true;
  }

  /**
   * Automatically resolves any platform with 10 or more items.
   * Emits CARRY events.
   */
  resolveCarries() {
    let changed = false;

    // Units -> Tens carry
    while (this.units >= 10) {
      this.units -= 10;
      this.tens += 1;
      this.emit(EventType.CARRY_UNITS_TO_TENS, {
        from: 'units',
        to: 'tens',
        unitsRemaining: this.units,
        tensResult: this.tens
      });
      changed = true;
    }

    // Tens -> Hundreds carry
    while (this.tens >= 10) {
      this.tens -= 10;
      this.hundreds += 1;
      this.emit(EventType.CARRY_TENS_TO_HUNDREDS, {
        from: 'tens',
        to: 'hundreds',
        tensRemaining: this.tens,
        hundredsResult: this.hundreds
      });
      changed = true;
    }

    return changed;
  }

  /**
   * Executes a borrow operation for the target platform ('units' or 'tens').
   * If borrowing for units and tens is 0, cascades from hundreds to tens first!
   */
  applyBorrow(targetPlatform = 'units') {
    if (targetPlatform === 'units') {
      if (this.tens === 0) {
        if (this.hundreds > 0) {
          // Cascade: borrow from hundreds to tens first
          this.applyBorrow('tens');
        } else {
          // Cannot borrow!
          return false;
        }
      }

      if (this.tens > 0) {
        this.tens -= 1;
        this.units += 10;
        this.emit(EventType.BORROW_TENS_TO_UNITS, {
          from: 'tens',
          to: 'units',
          tensRemaining: this.tens,
          unitsResult: this.units
        });
        return true;
      }
      return false;
    }

    if (targetPlatform === 'tens') {
      if (this.hundreds > 0) {
        this.hundreds -= 1;
        this.tens += 10;
        this.emit(EventType.BORROW_HUNDREDS_TO_TENS, {
          from: 'hundreds',
          to: 'tens',
          hundredsRemaining: this.hundreds,
          tensResult: this.tens
        });
        return true;
      }
      return false;
    }

    return false;
  }
}
