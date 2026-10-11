# 🏗️ Carry Crane

> **A playful, tactile 3D browser-based place value game for Class 2–3 children (ages 7–9), built with Three.js, Vite, and vanilla ES modules.**

Carry Crane teaches place value, addition carrying, and subtraction borrowing by letting children see and manipulate real physical objects. The fundamental rule of mathematics taught is: **"Carry 1" is never an abstract digit written on paper—it is literally one bundle of ten sticks carried over to the tens column!**

---

## 🌟 Key Features

1. **Welcoming Start Page**:
   - Bright, whimsical landing screen with floating clouds, sparkles, and cartoon crane branding.
   - Interactive game mode selector cards (Learn Addition, Learn Subtraction, Practice) with live difficulty level pills (Levels 1–5).
   - Instant language switch (English & Hindi) and sound controls directly on the landing screen.
   - Accessible "🏠 Home" navigation button in the HUD to return to the Start Page anytime.

2. **Physicalized Base-10 Metaphor**:
   - **Units** (🟦 Blue Platform): Individual rounded toy sticks.
   - **Tens** (🟩 Green Platform): 10 sticks tied together with a visible golden rope into a chunky rod.
   - **Hundreds** (🟧 Orange Platform): 10 bundles fused into a solid $10 \times 10$ slab.

2. **The Cartoon Crane**:
   - Elevated overhead steel rail spanning across all three platforms.
   - Friendly animated crane cab with big cartoon eyes, rosy cheeks, hard-hat, and smiling mouth.
   - Pendulum cable sway physics when traveling horizontally.
   - Winch and hook system that lowers, hooks bundles, lifts, transports, and lowers them onto adjacent platforms.
   - Head-shake animation ("Let's borrow first!") when a child attempts an invalid operation.

3. **Synchronized Column Method**:
   - Beside the 3D scene sits the written column method math card.
   - When 10 units turn into a ten-bundle and the crane carries it, a small **"1" carry mark** pops above the tens column in perfect real-time synchronization with the crane's motion.
   - During borrowing, a red cross-out slashes the tens digit, updates the tens count, and displays the borrowed 10 units in the units column.

4. **Game Modes**:
   - **Learn: Add (+)**: Hands-on addition problems (e.g. $48 + 35$) where sticks are added to trigger carries.
   - **Learn: Subtract (-)**: Hands-on subtraction problems (e.g. $52 - 27$) starting with the minuend on the platforms and removing sticks, triggering crane borrows.
   - **Practice**: Infinite randomized problems across 5 levels:
     - *Level 1*: 2-digit with no carry / no borrow.
     - *Level 2*: 2-digit with units carry.
     - *Level 3*: 3-digit with carry.
     - *Level 4*: Subtraction with borrow.
     - *Level 5*: Master challenge (hundreds carry or borrow across zero, e.g. $305 - 128$).

5. **Kid-Friendly UI / UX**:
   - Large touch targets ($\ge 56\text{px}$) with high contrast and friendly typography (*Nunito* / *Baloo 2*).
   - Mascot dialogue bubble with short, cheerful guidance (max 8–10 words per prompt).
   - Full bilingual support (**English & Hindi 🌐**) with instant language switching.
   - Celebratory confetti and star rewards on correct answers.
   - Gentle "Try again" feedback highlighting the specific platform needing adjustment.
   - Built-in 3-step illustrated tutorial.
   - Accessible Web Audio API sound synthesizers (muted by default until toggled).

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+ or later)
- npm

### Installation & Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Start Vite development server
npm run dev
```

Open your browser at `http://localhost:5173/`.

### Running Unit Tests

```bash
# Run Vitest test suite
npm test
```

The test suite executes:
- **1,000+ random additions** (0–999), simulating stick-by-stick additions and verifying base-10 invariants after every single step.
- **1,000+ random subtractions** (never negative), simulating stick-by-stick removals.
- Critical boundary edge cases: $9+1$, $99+1$, $100-1$, $305-8$ (borrowing across zero), $1000$ boundary overflow rejection, and negative subtraction rejection.
- Animation queue serialization tests ensuring crane moves are strictly serialized.

---

## 🏛️ Project Architecture

```
carry-crane/
├── index.html                   # Shell with HTML/CSS overlay and Three.js canvas container
├── package.json                 # Three.js, Vite, Vitest, canvas-confetti
├── vite.config.js               # Dev server and test runner configuration
├── src/
│   ├── main.js                  # App coordinator; connects logic events to 3D animations
│   ├── strings.js               # i18n localization dictionary (English & Hindi)
│   ├── sound.js                 # Web Audio API synthesizers (drop, bundle, lift, fanfare)
│   ├── style.css                # Responsive kid-friendly design system (mobile 360px to 1280px+)
│   ├── logic/
│   │   ├── placeValue.js        # Pure base-10 state machine & event dispatcher (no Three.js / DOM)
│   │   └── problems.js          # Generator enforcing carries and borrows per level
│   ├── scene/
│   │   ├── scene.js             # Three.js scene, warm lighting, soft PCF shadows, camera controls
│   │   ├── crane.js             # Animated 3D cartoon crane, rail, cable sway physics, and hook
│   │   ├── objects.js           # Stick, Ten-Bundle, and Hundred-Slab mesh factories & slots
│   │   └── animations.js        # Strict sequential animation queue & easing utilities
│   └── ui/
│       ├── hud.js               # Top bar, big button toolbar, mode/level selector, score
│       ├── columnMethod.js      # Synchronized written column method component
│       ├── mascot.js            # Craney speech bubble assistant
│       └── tutorial.js          # 3-step interactive onboarding overlay
└── tests/
    └── placeValue.test.js       # Vitest unit & fuzz test suite
```

---

## 🧠 How the Carry & Borrow Logic Works

### 1. Pure State Machine (`src/logic/placeValue.js`)
The logic layer is a pure TypeScript/JavaScript class with zero dependencies on Three.js or DOM APIs.
- State: `{ hundreds, tens, units }`
- Invariant:
  $$\text{Value} = \text{units} \times 1 + \text{tens} \times 10 + \text{hundreds} \times 100$$

### 2. The Addition Carry Sequence
1. Each stick placed on UNITS increments `units`.
2. When `units` reaches 10:
   - State machine subtracts 10 from units and adds 1 to tens, emitting `CARRY_UNITS_TO_TENS`.
   - The UI locks buttons to prevent conflicting user input.
   - The 10 unit sticks on the blue platform shake and glow.
   - The sticks fuse into a 10-stick bundle wrapped with a golden rope band.
   - The Crane slides along its rail to the blue platform, lowers its hook, and latches onto the bundle.
   - The Crane lifts the bundle and carries it to the green platform.
   - Halfway across the rail, the written column method displays the **small "1" carry mark** above the tens column.
   - The Crane lowers the bundle onto the green platform and releases it.
   - The tens counter increments by 1, and the input locks release.

### 3. The Subtraction Borrow Sequence
1. When removing a unit when `units === 0` (or during a problem requiring borrow):
   - State machine borrows from tens: `tens` decreases by 1 and `units` increases by 10, emitting `BORROW_TENS_TO_UNITS`.
   - If tens is also 0 (e.g. in $305 - 8$), the state machine automatically cascades: borrowing 1 from hundreds first to make 10 tens, then borrowing 1 from tens to make 10 units!
   - Crane picks up one ten-bundle from the green platform and transports it to the blue platform.
   - Simultaneously, the written column method slashes the tens digit with a red mark and writes the new units count.
   - On the blue platform, the golden rope unties and the bundle bursts into 10 loose unit sticks.

### 4. Negative Subtraction Rejection
If the user attempts to remove items when the total value is 0, `PlaceValueStateMachine` emits `CANNOT_BORROW_BELOW_ZERO`. The crane shakes its head in a gentle "no-no" wobble and Craney says: *"Let's borrow first! Can't go below zero."*

---

## 🛠️ How to Add New Levels or Problems

All problem generation rules are located in [`src/logic/problems.js`](file:///c:/Users/HP/OneDrive/Desktop/carry%20crane/src/logic/problems.js).

### Adding a New Practice Level
1. Open [`src/logic/problems.js`](file:///c:/Users/HP/OneDrive/Desktop/carry%20crane/src/logic/problems.js).
2. Inside `generateProblem(level)`, add a new case to the switch statement:

```javascript
case 6: {
  // Example: 3-digit subtraction with double borrowing across hundreds & tens
  operation = 'subtract';
  const u1 = randInt(1, 4);
  const u2 = randInt(u1 + 1, 9); // guarantees units borrow
  const t1 = randInt(1, 3);
  const t2 = randInt(t1 + 1, 8); // guarantees tens borrow
  const h1 = randInt(4, 8);
  const h2 = randInt(1, h1 - 1);
  num1 = h1 * 100 + t1 * 10 + u1;
  num2 = h2 * 100 + t2 * 10 + u2;
  break;
}
```

3. Add the level label in [`src/strings.js`](file:///c:/Users/HP/OneDrive/Desktop/carry%20crane/src/strings.js):
```javascript
level6: 'Level 6: Double Borrow Challenge',
```
and Hindi translation:
```javascript
level6: 'स्तर 6: दोहरा उधार चुनौती',
```

4. Add the option to the `<select id="level-select">` inside [`src/ui/hud.js`](file:///c:/Users/HP/OneDrive/Desktop/carry%20crane/src/ui/hud.js).

---

## 🎨 Aesthetics & Performance

- **Lighting & Shadows**: One Hemisphere light for ambient bounce + one directional sun light with PCF soft shadows.
- **Rendering & DPR**: Perspective camera with OrbitControls clamped within safe angles so children can look around without getting disoriented. Device pixel ratio is capped at 2 for smooth 60fps on mobile tablets.
- **Resource Management**: Geometries and materials are reused across stick instances, and removed items are properly removed from Three.js groups.
- **Responsiveness**: Adapts smoothly from a 360px mobile portrait screen up to 1280px+ desktop widescreen.

---

## 📄 License
MIT
