import { describe, it, expect } from 'vitest';
import { PlaceValueStateMachine, EventType } from '../src/logic/placeValue.js';
import { AnimationQueue } from '../src/scene/animations.js';

describe('PlaceValueStateMachine: Unit & Fuzz Tests', () => {
  it('handles 9 + 1 carry correctly', () => {
    const sm = new PlaceValueStateMachine({ hundreds: 0, tens: 0, units: 9 });
    const events = [];
    sm.subscribe((e) => events.push(e));

    const added = sm.addUnit();
    expect(added).toBe(true);
    expect(sm.getState()).toEqual({ hundreds: 0, tens: 1, units: 0 });
    expect(sm.getValue()).toBe(10);
    expect(events.some((e) => e.type === EventType.CARRY_UNITS_TO_TENS)).toBe(true);
  });

  it('handles 99 + 1 cascading carry to hundreds', () => {
    const sm = new PlaceValueStateMachine({ hundreds: 0, tens: 9, units: 9 });
    const events = [];
    sm.subscribe((e) => events.push(e));

    const added = sm.addUnit();
    expect(added).toBe(true);
    expect(sm.getState()).toEqual({ hundreds: 1, tens: 0, units: 0 });
    expect(sm.getValue()).toBe(100);
    expect(events.some((e) => e.type === EventType.CARRY_UNITS_TO_TENS)).toBe(true);
    expect(events.some((e) => e.type === EventType.CARRY_TENS_TO_HUNDREDS)).toBe(true);
  });

  it('handles 100 - 1 borrow across hundreds and tens', () => {
    const sm = new PlaceValueStateMachine({ hundreds: 1, tens: 0, units: 0 });
    const events = [];
    sm.subscribe((e) => events.push(e));

    const removed = sm.removeUnit();
    expect(removed).toBe(true);
    expect(sm.getState()).toEqual({ hundreds: 0, tens: 9, units: 9 });
    expect(sm.getValue()).toBe(99);
    expect(events.some((e) => e.type === EventType.BORROW_HUNDREDS_TO_TENS)).toBe(true);
    expect(events.some((e) => e.type === EventType.BORROW_TENS_TO_UNITS)).toBe(true);
  });

  it('handles 305 - 8 (borrow across zero tens)', () => {
    const sm = new PlaceValueStateMachine({ hundreds: 3, tens: 0, units: 5 });
    expect(sm.getValue()).toBe(305);

    // Remove 8 units stick by stick
    for (let i = 1; i <= 8; i++) {
      const ok = sm.removeUnit();
      expect(ok).toBe(true);
      expect(sm.getValue()).toBe(305 - i);
    }

    expect(sm.getValue()).toBe(297);
    expect(sm.getState()).toEqual({ hundreds: 2, tens: 9, units: 7 });
  });

  it('rejects subtraction below 0 and emits CANNOT_BORROW_BELOW_ZERO', () => {
    const sm = new PlaceValueStateMachine({ hundreds: 0, tens: 0, units: 0 });
    const events = [];
    sm.subscribe((e) => events.push(e));

    const removed = sm.removeUnit();
    expect(removed).toBe(false);
    expect(sm.getValue()).toBe(0);
    expect(events.some((e) => e.type === EventType.CANNOT_BORROW_BELOW_ZERO)).toBe(true);
  });

  it('rejects adding beyond 999 boundary', () => {
    const sm = new PlaceValueStateMachine({ hundreds: 9, tens: 9, units: 9 });
    const events = [];
    sm.subscribe((e) => events.push(e));

    const added = sm.addUnit();
    expect(added).toBe(false);
    expect(sm.getValue()).toBe(999);
    expect(events.some((e) => e.type === EventType.OVERFLOW_1000)).toBe(true);
  });

  it('Fuzz Test: 1,000+ random additions, asserting invariants after every single step', () => {
    // We will run 1,000 random addition problems
    // To ensure thorough testing, we simulate adding numbers stick-by-stick
    const numTests = 1000;
    for (let testIdx = 0; testIdx < numTests; testIdx++) {
      // Pick starting value A (0 to 800) and delta B (1 to 15)
      const a = Math.floor(Math.random() * 850);
      const b = Math.floor(Math.random() * 25) + 1;

      const h = Math.floor(a / 100);
      const t = Math.floor((a % 100) / 10);
      const u = a % 10;

      const sm = new PlaceValueStateMachine({ hundreds: h, tens: t, units: u });
      expect(sm.getValue()).toBe(a);

      let currentExpected = a;
      for (let step = 0; step < b; step++) {
        if (currentExpected >= 999) break;
        const ok = sm.addUnit();
        expect(ok).toBe(true);
        currentExpected += 1;

        // Invariant 1: value strictly matches currentExpected
        expect(sm.getValue()).toBe(currentExpected);

        // Invariant 2: units and tens are canonical (<10)
        const state = sm.getState();
        expect(state.units).toBeGreaterThanOrEqual(0);
        expect(state.units).toBeLessThan(10);
        expect(state.tens).toBeGreaterThanOrEqual(0);
        expect(state.tens).toBeLessThan(10);
        expect(state.hundreds).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('Fuzz Test: 1,000+ random subtractions, asserting invariants after every single step', () => {
    const numTests = 1000;
    for (let testIdx = 0; testIdx < numTests; testIdx++) {
      // Pick starting value A (25 to 999) and delta B (1 to 25, always <= A)
      const a = Math.floor(Math.random() * 950) + 30;
      const b = Math.floor(Math.random() * 25) + 1;

      const h = Math.floor(a / 100);
      const t = Math.floor((a % 100) / 10);
      const u = a % 10;

      const sm = new PlaceValueStateMachine({ hundreds: h, tens: t, units: u });
      expect(sm.getValue()).toBe(a);

      let currentExpected = a;
      for (let step = 0; step < b; step++) {
        const ok = sm.removeUnit();
        expect(ok).toBe(true);
        currentExpected -= 1;

        // Invariant 1: value strictly matches currentExpected
        expect(sm.getValue()).toBe(currentExpected);

        // Invariant 2: canonical units and tens
        const state = sm.getState();
        expect(state.units).toBeGreaterThanOrEqual(0);
        expect(state.units).toBeLessThan(10);
        expect(state.tens).toBeGreaterThanOrEqual(0);
        expect(state.tens).toBeLessThan(10);
        expect(state.hundreds).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe('AnimationQueue: Concurrency & Serialization Verification', () => {
  it('never runs two crane moves at once and serializes execution', async () => {
    const queue = new AnimationQueue();
    let currentlyRunning = 0;
    let maxConcurrency = 0;
    const executionOrder = [];

    const createTask = (id, delayMs) => async () => {
      currentlyRunning++;
      if (currentlyRunning > maxConcurrency) {
        maxConcurrency = currentlyRunning;
      }
      executionOrder.push(`start-${id}`);
      await new Promise((res) => setTimeout(res, delayMs));
      executionOrder.push(`finish-${id}`);
      currentlyRunning--;
    };

    // Enqueue 4 tasks simultaneously
    const p1 = queue.enqueue(createTask(1, 20), 'Move 1');
    const p2 = queue.enqueue(createTask(2, 10), 'Move 2');
    const p3 = queue.enqueue(createTask(3, 15), 'Move 3');
    const p4 = queue.enqueue(createTask(4, 5), 'Move 4');

    expect(queue.isBusy).toBe(true);

    await Promise.all([p1, p2, p3, p4]);

    expect(maxConcurrency).toBe(1); // STRICTLY 1 at a time!
    expect(executionOrder).toEqual([
      'start-1', 'finish-1',
      'start-2', 'finish-2',
      'start-3', 'finish-3',
      'start-4', 'finish-4'
    ]);
    expect(queue.isBusy).toBe(false);
  });
});
