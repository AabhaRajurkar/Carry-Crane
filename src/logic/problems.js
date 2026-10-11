/**
 * Problems Generator & Problem Sets
 * Guarantees carries and borrows appropriate for each level and learning mode.
 */

export function toDigits(n) {
  const hundreds = Math.floor(n / 100);
  const tens = Math.floor((n % 100) / 10);
  const units = n % 10;
  return { hundreds, tens, units };
}

export function fromDigits(hundreds, tens, units) {
  return hundreds * 100 + tens * 10 + units;
}

export const LEARN_ADD_PROBLEMS = [
  { num1: 18, num2: 15, hint: '8 + 5 makes 13. That gives 1 ten and 3 units!' },
  { num1: 27, num2: 14, hint: '7 + 4 makes 11. Carry 1 ten to the green platform!' },
  { num1: 36, num2: 25, hint: '6 + 5 makes 11. Watch the crane carry the new bundle!' },
  { num1: 48, num2: 35, hint: '8 + 5 is 13. 1 ten carries over to make 8 tens!' },
  { num1: 59, num2: 43, hint: '9 + 3 makes 12. 1 ten carries to make 10 tens (1 hundred)!' },
];

export const LEARN_SUBTRACT_PROBLEMS = [
  { num1: 32, num2: 15, hint: 'Cannot take 5 from 2. Crane borrows 1 ten to make 12 units!' },
  { num1: 41, num2: 24, hint: 'Borrow 1 ten from 4 tens. Now you have 11 units!' },
  { num1: 52, num2: 27, hint: 'Borrow 1 ten so 2 becomes 12. 12 - 7 = 5 units!' },
  { num1: 73, num2: 38, hint: 'Borrow 1 ten from 7 tens. 13 - 8 = 5 units!' },
  { num1: 104, num2: 26, hint: 'Borrow across to get tens, then units!' },
];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates a practice problem strictly adhering to level constraints.
 *
 * Level 1: 2-digit with no carry (addition or subtraction)
 * Level 2: 2-digit with carry (addition)
 * Level 3: 3-digit with carry (addition)
 * Level 4: subtraction with borrow (2-digit or 3-digit)
 * Level 5: mixed with hundreds carry or borrow (e.g. 185 + 246, 305 - 128)
 */
export function generateProblem(level = 1) {
  let operation = 'add';
  let num1 = 0;
  let num2 = 0;

  switch (level) {
    case 1: {
      // 2-digit NO CARRY / NO BORROW
      operation = Math.random() > 0.5 ? 'add' : 'subtract';
      if (operation === 'add') {
        const u1 = randInt(1, 5);
        const u2 = randInt(1, 9 - u1); // sum <= 9
        const t1 = randInt(1, 5);
        const t2 = randInt(1, 8 - t1); // sum <= 8
        num1 = t1 * 10 + u1;
        num2 = t2 * 10 + u2;
      } else {
        const u1 = randInt(4, 9);
        const u2 = randInt(1, u1); // u1 >= u2, no borrow
        const t1 = randInt(3, 8);
        const t2 = randInt(1, t1 - 1);
        num1 = t1 * 10 + u1;
        num2 = t2 * 10 + u2;
      }
      break;
    }

    case 2: {
      // 2-digit WITH CARRY (units carry: u1 + u2 >= 10, total tens < 10)
      operation = 'add';
      const u1 = randInt(4, 9);
      const u2 = randInt(10 - u1, 9); // guarantees u1 + u2 >= 10
      const t1 = randInt(1, 4);
      const t2 = randInt(1, 7 - t1);
      num1 = t1 * 10 + u1;
      num2 = t2 * 10 + u2;
      break;
    }

    case 3: {
      // 3-digit WITH CARRY
      operation = 'add';
      const u1 = randInt(4, 9);
      const u2 = randInt(10 - u1, 9); // units carry
      const t1 = randInt(2, 6);
      const t2 = randInt(1, 4);
      const h1 = randInt(1, 4);
      const h2 = randInt(1, 3);
      num1 = h1 * 100 + t1 * 10 + u1;
      num2 = h2 * 100 + t2 * 10 + u2;
      break;
    }

    case 4: {
      // Subtraction WITH BORROW
      operation = 'subtract';
      const u1 = randInt(1, 5);
      const u2 = randInt(u1 + 1, 9); // guarantees borrow from tens!
      const t1 = randInt(3, 8);
      const t2 = randInt(1, t1 - 1);
      num1 = t1 * 10 + u1;
      num2 = t2 * 10 + u2;
      break;
    }

    case 5:
    default: {
      // Mixed: Hundreds carry or borrow across zero
      operation = Math.random() > 0.5 ? 'add' : 'subtract';
      if (operation === 'add') {
        // Hundreds carry: tens sum >= 10
        const u1 = randInt(3, 9);
        const u2 = randInt(2, 9);
        const t1 = randInt(5, 9);
        const t2 = randInt(10 - t1, 8); // tens carry to hundreds!
        const h1 = randInt(1, 3);
        const h2 = randInt(1, 3);
        num1 = h1 * 100 + t1 * 10 + u1;
        num2 = h2 * 100 + t2 * 10 + u2;
      } else {
        // Borrow across a zero or high borrow, e.g. 305 - 128
        const borrowAcrossZero = Math.random() > 0.5;
        if (borrowAcrossZero) {
          const h1 = randInt(2, 5);
          const t1 = 0; // zero in tens requires cascading borrow!
          const u1 = randInt(2, 5);
          num1 = h1 * 100 + t1 * 10 + u1;
          const h2 = randInt(1, h1 - 1);
          const t2 = randInt(1, 4);
          const u2 = randInt(u1 + 1, 9);
          num2 = h2 * 100 + t2 * 10 + u2;
        } else {
          const h1 = randInt(3, 6);
          const t1 = randInt(1, 4);
          const u1 = randInt(1, 4);
          num1 = h1 * 100 + t1 * 10 + u1;
          const h2 = randInt(1, h1 - 1);
          const t2 = randInt(t1 + 1, 8); // tens borrow from hundreds
          const u2 = randInt(u1 + 1, 9); // units borrow from tens
          num2 = h2 * 100 + t2 * 10 + u2;
        }
      }
      break;
    }
  }

  const answer = operation === 'add' ? num1 + num2 : num1 - num2;

  const d1 = toDigits(num1);
  const d2 = toDigits(num2);
  const requiresCarry = operation === 'add' && (d1.units + d2.units >= 10 || d1.tens + d2.tens >= 10);
  const requiresBorrow = operation === 'subtract' && (d1.units < d2.units || d1.tens < d2.tens);

  return {
    id: `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    operation,
    num1,
    num2,
    answer,
    level,
    requiresCarry,
    requiresBorrow,
    digits1: d1,
    digits2: d2
  };
}
