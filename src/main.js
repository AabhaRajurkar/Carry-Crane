import * as THREE from 'three';
import { PlaceValueStateMachine, EventType } from './logic/placeValue.js';
import { generateProblem, LEARN_ADD_PROBLEMS, LEARN_SUBTRACT_PROBLEMS, toDigits } from './logic/problems.js';
import { ThreeScene } from './scene/scene.js';
import { AnimationQueue, tween, easeOutBounce, easeInOutQuad } from './scene/animations.js';
import { createTenBundle, createHundredSlab, createUnitStick, getUnitSlotPosition, getTenSlotPosition } from './scene/objects.js';
import { HUD } from './ui/hud.js';
import { ColumnMethodView } from './ui/columnMethod.js';
import { MascotView } from './ui/mascot.js';
import { TutorialModal } from './ui/tutorial.js';
import { StartPageView } from './ui/startPage.js';
import { soundManager } from './sound.js';
import { t, getLanguage } from './strings.js';

class CarryCraneApp {
  constructor() {
    this.canvasContainer = document.getElementById('webgl-canvas-container');
    this.hudContainer = document.getElementById('hud-overlay');

    // 1. Logic State Machine & Animation Queue
    this.logic = new PlaceValueStateMachine({ hundreds: 0, tens: 0, units: 0 });
    this.animationQueue = new AnimationQueue();

    // 2. Three.js Scene
    this.scene = new ThreeScene(this.canvasContainer);

    // 3. UI State
    this.score = 0;
    this.currentMode = 'learnAdd';
    this.currentLevel = 2;
    this.learnIndex = 0;
    this.currentProblem = null;

    // 4. Initialize HUD & Components
    this.initHUD();
    this.initSubscribers();
    this.initStartPage();

    // 5. Check Tutorial
    this.initTutorial();

    // 6. Start Initial Problem
    this.loadProblem();
  }

  initHUD() {
    this.hud = new HUD({
      container: this.hudContainer,
      onAddUnit: () => this.handleAddUnit(),
      onRemoveUnit: () => this.handleRemoveUnit(),
      onAddTen: () => this.handleAddTen(),
      onRemoveTen: () => this.handleRemoveTen(),
      onAddHundred: () => this.handleAddHundred(),
      onRemoveHundred: () => this.handleRemoveHundred(),
      onCheckAnswer: () => this.checkAnswer(),
      onNextProblem: () => this.nextProblem(),
      onReset: () => this.resetProblem(),
      onHint: () => this.showHint(),
      onModeChange: (mode) => this.setMode(mode),
      onLevelChange: (lvl) => this.setLevel(lvl),
      onOpenTutorial: () => this.tutorialModal?.show(),
      onLanguageChange: () => this.handleLanguageChanged(),
      onOpenHome: () => this.startPage?.show()
    });

    // Sub-components mounted inside HUD containers
    const cmContainer = document.getElementById('column-method-container');
    this.columnMethod = new ColumnMethodView(cmContainer);

    const mascotContainer = document.getElementById('mascot-container');
    this.mascot = new MascotView(mascotContainer);

    const tutContainer = document.getElementById('tutorial-container');
    this.tutorialModal = new TutorialModal(tutContainer);

    // Lock input when animation queue is busy
    this.animationQueue.onStateChange((isBusy) => {
      this.hud.lockInput(isBusy);
    });
  }

  initSubscribers() {
    // Listen for logic events to trigger queued Three.js crane animations
    this.logic.subscribe(async (event) => {
      switch (event.type) {
        case EventType.UNIT_ADDED:
          soundManager.playDrop();
          this.scene.syncObjects(event.state);
          this.columnMethod.updateLiveDigits(event.state);
          break;

        case EventType.UNIT_REMOVED:
          soundManager.playDrop();
          this.scene.syncObjects(event.state);
          this.columnMethod.updateLiveDigits(event.state);
          break;

        case EventType.TEN_ADDED:
        case EventType.TEN_REMOVED:
        case EventType.HUNDRED_ADDED:
        case EventType.HUNDRED_REMOVED:
        case EventType.STATE_SET:
        case EventType.RESET:
          this.scene.syncObjects(event.state);
          this.columnMethod.updateLiveDigits(event.state);
          break;

        case EventType.CARRY_UNITS_TO_TENS:
          await this.animationQueue.enqueue(
            () => this.animateCarryUnitsToTens(event.payload),
            'Carry Units to Tens'
          );
          break;

        case EventType.CARRY_TENS_TO_HUNDREDS:
          await this.animationQueue.enqueue(
            () => this.animateCarryTensToHundreds(event.payload),
            'Carry Tens to Hundreds'
          );
          break;

        case EventType.BORROW_TENS_TO_UNITS:
          await this.animationQueue.enqueue(
            () => this.animateBorrowTensToUnits(event.payload),
            'Borrow Tens to Units'
          );
          break;

        case EventType.BORROW_HUNDREDS_TO_TENS:
          await this.animationQueue.enqueue(
            () => this.animateBorrowHundredsToTens(event.payload),
            'Borrow Hundreds to Tens'
          );
          break;

        case EventType.CANNOT_BORROW_BELOW_ZERO:
          soundManager.playWobble();
          this.scene.crane.shakeHead();
          this.mascot.say(t('cannotBorrowZero'), 'thinking');
          this.hud.showFeedbackToast(t('cannotBorrowZero'), 'warning');
          break;

        case EventType.OVERFLOW_1000:
          soundManager.playWobble();
          this.scene.crane.shakeHead();
          this.mascot.say(t('cannotOverflow'), 'thinking');
          this.hud.showFeedbackToast(t('cannotOverflow'), 'warning');
          break;
      }
    });
  }

  initStartPage() {
    const startContainer = document.getElementById('start-page-container');
    this.startPage = new StartPageView({
      container: startContainer,
      onStartGame: (mode, level) => {
        this.setMode(mode);
        this.setLevel(level);
        // Sync HUD dropdowns
        const modeSelect = document.getElementById('mode-select');
        if (modeSelect) modeSelect.value = mode;
        const levelSelect = document.getElementById('level-select');
        if (levelSelect) levelSelect.value = String(level);
        const levelGrp = document.getElementById('level-select-group');
        if (levelGrp) {
          if (mode === 'practice') levelGrp.classList.remove('hidden');
          else levelGrp.classList.add('hidden');
        }
      },
      onOpenTutorial: () => this.tutorialModal?.show(),
      onLanguageChange: () => this.handleLanguageChanged()
    });
  }

  initTutorial() {
    const hasSeen = localStorage.getItem('carry_crane_tut_seen');
    if (!hasSeen) {
      setTimeout(() => {
        this.tutorialModal.show();
        localStorage.setItem('carry_crane_tut_seen', 'true');
      }, 500);
    }
  }

  handleLanguageChanged() {
    // Re-mount columnMethod, mascot, and tutorial to the freshly rendered containers
    const cmContainer = document.getElementById('column-method-container');
    if (cmContainer) {
      this.columnMethod = new ColumnMethodView(cmContainer);
    }
    const mascotContainer = document.getElementById('mascot-container');
    if (mascotContainer) {
      this.mascot = new MascotView(mascotContainer);
    }
    const tutContainer = document.getElementById('tutorial-container');
    if (tutContainer) {
      this.tutorialModal = new TutorialModal(tutContainer);
    }

    this.startPage?.render();
    this.scene.updatePlatformCounters(this.logic.getState());
    if (this.currentProblem) {
      this.columnMethod.setProblem(this.currentProblem);
      this.columnMethod.updateLiveDigits(this.logic.getState());
    }
    this.mascot.say(t('welcomeMsg'), 'happy');
  }

  setMode(mode) {
    this.currentMode = mode;
    this.learnIndex = 0;
    this.loadProblem();
  }

  setLevel(level) {
    this.currentLevel = level;
    this.loadProblem();
  }

  loadProblem() {
    let prob = null;

    if (this.currentMode === 'learnAdd') {
      const template = LEARN_ADD_PROBLEMS[this.learnIndex % LEARN_ADD_PROBLEMS.length];
      prob = {
        id: `learn-add-${this.learnIndex}`,
        operation: 'add',
        num1: template.num1,
        num2: template.num2,
        answer: template.num1 + template.num2,
        digits1: toDigits(template.num1),
        digits2: toDigits(template.num2),
        hint: template.hint
      };
      this.mascot.say(template.hint || t('readyToAdd'), 'happy');
    } else if (this.currentMode === 'learnSub') {
      const template = LEARN_SUBTRACT_PROBLEMS[this.learnIndex % LEARN_SUBTRACT_PROBLEMS.length];
      prob = {
        id: `learn-sub-${this.learnIndex}`,
        operation: 'subtract',
        num1: template.num1,
        num2: template.num2,
        answer: template.num1 - template.num2,
        digits1: toDigits(template.num1),
        digits2: toDigits(template.num2),
        hint: template.hint
      };
      this.mascot.say(template.hint || t('readyToSubtract'), 'happy');
    } else {
      // Practice mode
      prob = generateProblem(this.currentLevel);
      this.mascot.say(
        prob.operation === 'add' ? t('readyToAdd') : t('readyToSubtract'),
        'happy'
      );
    }

    this.currentProblem = prob;
    this.columnMethod.setProblem(prob);

    // Initial setup:
    // For Subtraction, start with the bigger number (num1) already placed on the platforms!
    if (prob.operation === 'subtract') {
      const d1 = prob.digits1;
      this.logic.set(d1.hundreds, d1.tens, d1.units);
    } else {
      // For addition, start empty (0) or start with num1
      // Starting with num1 allows child to add num2 stick-by-stick to experience carrying!
      const d1 = prob.digits1;
      this.logic.set(d1.hundreds, d1.tens, d1.units);
    }

    this.columnMethod.updateLiveDigits(this.logic.getState());
  }

  resetProblem() {
    if (!this.currentProblem) return;
    const d1 = this.currentProblem.digits1;
    this.logic.set(d1.hundreds, d1.tens, d1.units);
    this.columnMethod.clearAnnotations();
    this.columnMethod.setProblem(this.currentProblem);
    this.columnMethod.updateLiveDigits(this.logic.getState());
    this.mascot.say(t('welcomeMsg'), 'happy');
  }

  nextProblem() {
    this.learnIndex++;
    this.loadProblem();
  }

  showHint() {
    if (!this.currentProblem) return;
    if (this.currentProblem.hint) {
      this.mascot.say(this.currentProblem.hint, 'thinking');
      return;
    }

    const target = this.currentProblem.answer;
    const current = this.logic.getValue();
    const diff = target - current;

    if (diff > 0) {
      this.mascot.say(`Add ${diff} more to reach the target!`, 'thinking');
      this.scene.highlightPlatform('units');
    } else if (diff < 0) {
      this.mascot.say(`Remove ${Math.abs(diff)} to reach the target!`, 'thinking');
      this.scene.highlightPlatform('units');
    } else {
      this.mascot.say('Target reached! Click Check Answer!', 'excited');
    }
  }

  checkAnswer() {
    if (!this.currentProblem) return;

    const current = this.logic.getValue();
    const expected = this.currentProblem.answer;

    if (current === expected) {
      // Victory!
      soundManager.playSuccess();
      this.score += 1;
      this.hud.setScore(this.score);
      this.hud.triggerConfetti();
      this.scene.crane.nodHead();
      this.mascot.say(t('correctMsg'), 'excited');
      this.hud.showFeedbackToast(`🌟 ${t('correctMsg')}`, 'success');

      // Auto advance after 2.5s
      setTimeout(() => {
        this.nextProblem();
      }, 2500);
    } else {
      // Gentle retry
      soundManager.playWobble();
      this.scene.crane.shakeHead();
      this.mascot.say(t('wrongMsg'), 'thinking');
      this.hud.showFeedbackToast(t('wrongMsg'), 'warning');

      // Highlight the mismatched platform
      const curDigits = toDigits(current);
      const expDigits = toDigits(expected);

      if (curDigits.units !== expDigits.units) {
        this.scene.highlightPlatform('units');
      } else if (curDigits.tens !== expDigits.tens) {
        this.scene.highlightPlatform('tens');
      } else if (curDigits.hundreds !== expDigits.hundreds) {
        this.scene.highlightPlatform('hundreds');
      }
    }
  }

  // --- Button Handlers ---
  handleAddUnit() {
    this.logic.addUnit();
  }

  handleRemoveUnit() {
    this.logic.removeUnit();
  }

  handleAddTen() {
    this.logic.addTen();
  }

  handleRemoveTen() {
    this.logic.removeTen();
  }

  handleAddHundred() {
    this.logic.addHundred();
  }

  handleRemoveHundred() {
    this.logic.removeHundred();
  }

  // =========================================================================
  // Core Animated Place Value Transformations
  // =========================================================================

  /**
   * Addition Carry: Units to Tens
   * 1. Sticks glow and shake on UNITS.
   * 2. Morph into ten-bundle.
   * 3. Crane hooks bundle, lifts, carries to TENS.
   * 4. Column method displays small "1" carry mark in sync.
   * 5. Placed on TENS.
   */
  async animateCarryUnitsToTens(payload) {
    const crane = this.scene.crane;
    const unitContainer = this.scene.platforms.units.userData.itemsContainer;
    const tenContainer = this.scene.platforms.tens.userData.itemsContainer;

    this.mascot.say(t('carryUnitsToTens'), 'excited');
    soundManager.playBundle();

    // 1. Glow & shake sticks on units platform
    const sticksToShake = [...this.scene.unitMeshes];
    sticksToShake.forEach((s) => s.userData.setGlow?.(true));

    await tween({
      duration: 500,
      onUpdate: (t) => {
        const shake = Math.sin(t * Math.PI * 8) * 0.06;
        unitContainer.position.x = shake;
      }
    });
    unitContainer.position.x = 0;

    // 2. Remove the 10 loose sticks from units and replace with temporary new bundle
    this.scene.unitMeshes.forEach((mesh) => unitContainer.remove(mesh));
    this.scene.unitMeshes = [];

    const tempBundle = createTenBundle();
    tempBundle.position.set(0, 0, 0);
    tempBundle.scale.set(0.1, 0.1, 0.1);
    unitContainer.add(tempBundle);

    // Pop bundle into existence
    await tween({
      duration: 350,
      easing: easeOutBounce,
      onUpdate: (t) => {
        tempBundle.scale.setScalar(t);
      }
    });

    // 3. Crane slides to UNITS (x = 4.2)
    await crane.slideTo(this.scene.platformPositions.units, 700);

    // 4. Lower hook to bundle
    soundManager.playLift();
    await crane.lowerHook(0.38 + 0.88, 500);

    // 5. Attach bundle to crane hook
    crane.attach(tempBundle);

    // 6. Lift hook up
    await crane.raiseHook(500);

    // 7. Carry bundle over to TENS (x = 0)
    // Synchronize Column Method carry mark halfway through!
    const carryPromise = crane.slideTo(this.scene.platformPositions.tens, 900);
    setTimeout(() => {
      this.columnMethod.showCarryMark('tens');
    }, 450);
    await carryPromise;

    // 8. Lower hook to place bundle on TENS platform
    const targetSlotPos = getTenSlotPosition(this.scene.tenMeshes.length);
    await crane.lowerHook(0.38 + 0.88, 500);

    // 9. Detach bundle into TENS container at correct slot
    crane.detach(tenContainer);
    tempBundle.position.copy(targetSlotPos);
    this.scene.tenMeshes.push(tempBundle);

    soundManager.playDrop();

    // 10. Crane retracts hook
    await crane.raiseHook(450);

    // Update scene counters & sync
    this.scene.updatePlatformCounters(this.logic.getState());
  }

  /**
   * Addition Carry: Tens to Hundreds
   */
  async animateCarryTensToHundreds(payload) {
    const crane = this.scene.crane;
    const tenContainer = this.scene.platforms.tens.userData.itemsContainer;
    const hundredContainer = this.scene.platforms.hundreds.userData.itemsContainer;

    this.mascot.say(t('carryTensToHundreds'), 'excited');
    soundManager.playBundle();

    // 1. Shake tens
    await tween({
      duration: 500,
      onUpdate: (t) => {
        tenContainer.position.x = Math.sin(t * Math.PI * 8) * 0.06;
      }
    });
    tenContainer.position.x = 0;

    // 2. Clear loose bundles, spawn temp slab
    this.scene.tenMeshes.forEach((mesh) => tenContainer.remove(mesh));
    this.scene.tenMeshes = [];

    const tempSlab = createHundredSlab();
    tempSlab.position.set(0, 0, 0);
    tempSlab.scale.set(0.1, 0.1, 0.1);
    tenContainer.add(tempSlab);

    await tween({
      duration: 350,
      easing: easeOutBounce,
      onUpdate: (t) => tempSlab.scale.setScalar(t)
    });

    // 3. Crane moves to TENS
    await crane.slideTo(this.scene.platformPositions.tens, 600);

    // 4. Hook and lift
    soundManager.playLift();
    await crane.lowerHook(0.38 + 0.35, 500);
    crane.attach(tempSlab);
    await crane.raiseHook(500);

    // 5. Carry to HUNDREDS (x = -4.2)
    const carryPromise = crane.slideTo(this.scene.platformPositions.hundreds, 900);
    setTimeout(() => {
      this.columnMethod.showCarryMark('hundreds');
    }, 450);
    await carryPromise;

    // 6. Lower and place
    await crane.lowerHook(0.38 + 0.35, 500);
    crane.detach(hundredContainer);
    tempSlab.position.set(0, this.scene.hundredMeshes.length * 0.25 + 0.05, 0);
    this.scene.hundredMeshes.push(tempSlab);

    soundManager.playDrop();
    await crane.raiseHook(450);

    this.scene.updatePlatformCounters(this.logic.getState());
  }

  /**
   * Subtraction Borrow: Tens to Units
   * 1. Crane slides to TENS, hooks 1 ten-bundle, lifts it.
   * 2. Crane carries bundle to UNITS.
   * 3. In sync: written column method slashes tens digit and marks 10 units!
   * 4. Placed on UNITS, rope band unties and bundle expands into 10 separate unit sticks!
   */
  async animateBorrowTensToUnits(payload) {
    const crane = this.scene.crane;
    const tenContainer = this.scene.platforms.tens.userData.itemsContainer;
    const unitContainer = this.scene.platforms.units.userData.itemsContainer;

    this.mascot.say(t('borrowTensToUnits'), 'thinking');

    // 1. Crane slides to TENS
    await crane.slideTo(this.scene.platformPositions.tens, 600);

    // 2. Pick top ten-bundle
    const bundleToBorrow = this.scene.tenMeshes.pop();
    if (!bundleToBorrow) return;

    soundManager.playLift();
    await crane.lowerHook(0.38 + 0.88, 500);
    crane.attach(bundleToBorrow);
    await crane.raiseHook(500);

    // 3. Carry to UNITS (x = 4.2)
    const movePromise = crane.slideTo(this.scene.platformPositions.units, 900);
    setTimeout(() => {
      this.columnMethod.showBorrowMark(
        'tens',
        'units',
        payload.tensRemaining,
        payload.unitsResult
      );
    }, 450);
    await movePromise;

    // 4. Lower onto UNITS
    await crane.lowerHook(0.38 + 0.88, 500);
    crane.detach(unitContainer);
    soundManager.playDrop();
    await crane.raiseHook(450);

    // 5. Bundle unties! Transform bundle into 10 loose sticks with expanding animation
    soundManager.playBundle();
    unitContainer.remove(bundleToBorrow);

    // Instantiate the 10 sticks at slot positions
    const newSticks = [];
    const startIndex = payload.unitsResult - 10;
    for (let i = 0; i < 10; i++) {
      const stick = createUnitStick();
      const pos = getUnitSlotPosition(startIndex + i);
      stick.position.set(0, 0.4, 0); // start at bundle center
      stick.scale.set(0.5, 0.5, 0.5);
      unitContainer.add(stick);
      newSticks.push({ mesh: stick, targetPos: pos });
      this.scene.unitMeshes.push(stick);
    }

    // Expand outward to slots
    await tween({
      duration: 550,
      easing: easeOutBounce,
      onUpdate: (t) => {
        newSticks.forEach(({ mesh, targetPos }) => {
          mesh.position.lerpVectors(new THREE.Vector3(0, 0.4, 0), targetPos, t);
          mesh.scale.setScalar(0.5 + 0.5 * t);
        });
      }
    });

    this.scene.updatePlatformCounters(this.logic.getState());
  }

  /**
   * Subtraction Borrow: Hundreds to Tens
   */
  async animateBorrowHundredsToTens(payload) {
    const crane = this.scene.crane;
    const hundredContainer = this.scene.platforms.hundreds.userData.itemsContainer;
    const tenContainer = this.scene.platforms.tens.userData.itemsContainer;

    this.mascot.say(t('borrowHundredsToTens'), 'thinking');

    // 1. Crane slides to HUNDREDS
    await crane.slideTo(this.scene.platformPositions.hundreds, 700);

    const slabToBorrow = this.scene.hundredMeshes.pop();
    if (!slabToBorrow) return;

    soundManager.playLift();
    await crane.lowerHook(0.38 + 0.35, 500);
    crane.attach(slabToBorrow);
    await crane.raiseHook(500);

    // 2. Carry to TENS
    const movePromise = crane.slideTo(this.scene.platformPositions.tens, 800);
    setTimeout(() => {
      this.columnMethod.showBorrowMark(
        'hundreds',
        'tens',
        payload.hundredsRemaining,
        payload.tensResult
      );
    }, 400);
    await movePromise;

    // 3. Lower and detach
    await crane.lowerHook(0.38 + 0.35, 500);
    crane.detach(tenContainer);
    soundManager.playDrop();
    await crane.raiseHook(450);

    // 4. Slab splits into 10 ten-bundles
    soundManager.playBundle();
    tenContainer.remove(slabToBorrow);

    const newBundles = [];
    const startIndex = payload.tensResult - 10;
    for (let i = 0; i < 10; i++) {
      const bundle = createTenBundle();
      const pos = getTenSlotPosition(startIndex + i);
      bundle.position.set(0, 0.4, 0);
      tenContainer.add(bundle);
      newBundles.push({ mesh: bundle, targetPos: pos });
      this.scene.tenMeshes.push(bundle);
    }

    await tween({
      duration: 550,
      easing: easeOutBounce,
      onUpdate: (t) => {
        newBundles.forEach(({ mesh, targetPos }) => {
          mesh.position.lerpVectors(new THREE.Vector3(0, 0.4, 0), targetPos, t);
        });
      }
    });

    this.scene.updatePlatformCounters(this.logic.getState());
  }
}

// Bootstrap application on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  window.app = new CarryCraneApp();
});
