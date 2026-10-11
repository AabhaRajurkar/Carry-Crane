/**
 * Internationalization strings for Carry Crane (English & Hindi)
 * Simple, kid-friendly messages (max 8-10 words per message).
 */

export const STRINGS = {
  en: {
    title: 'Carry Crane',
    tagline: 'Place Value & Carrying Game',
    
    // Platforms & Place Values
    units: 'UNITS',
    tens: 'TENS',
    hundreds: 'HUNDREDS',
    unitPlural: 'units',
    tenPlural: 'tens',
    hundredPlural: 'hundreds',
    
    // Modes
    learnAdd: 'Learn: Add (+)',
    learnSub: 'Learn: Subtract (-)',
    practice: 'Practice',
    
    // Level labels
    level1: 'Level 1: 2-Digit Easy',
    level2: 'Level 2: 2-Digit Carry',
    level3: 'Level 3: 3-Digit Carry',
    level4: 'Level 4: Borrowing',
    level5: 'Level 5: Master Challenge',

    // Buttons
    addUnit: '+1 Unit',
    addTen: '+10 Ten',
    addHundred: '+100 Hundred',
    removeUnit: '-1 Unit',
    removeTen: '-10 Ten',
    removeHundred: '-100 Hundred',
    checkAnswer: 'Check Answer',
    nextProblem: 'Next Problem',
    hint: 'Hint',
    reset: 'Reset',
    soundOn: 'Sound: ON',
    soundOff: 'Sound: OFF',
    tutorialBtn: 'How to Play',
    close: 'Got it!',

    // Mascot & Crane Captions (Short, max 8-10 words)
    carryUnitsToTens: '10 units = 1 ten bundle carried!',
    carryTensToHundreds: '10 tens = 1 hundred slab carried!',
    borrowTensToUnits: '1 ten unties into 10 unit sticks!',
    borrowHundredsToTens: '1 hundred splits into 10 ten bundles!',
    cannotBorrowZero: "Let's borrow first! Can't go below zero.",
    cannotOverflow: 'Whoa! Number cannot be bigger than 999.',
    correctMsg: 'Awesome job! You got it right!',
    wrongMsg: 'Not quite! Look at the highlighted platform.',
    welcomeMsg: 'Hi! Help me build numbers and carry bundles!',
    readyToAdd: 'Add sticks to match the numbers!',
    readyToSubtract: 'Remove sticks to find what is left!',
    borrowHelpMsg: 'Not enough units? Tap borrow to unpack a ten!',

    // Tutorial Steps
    tutorialStep1Title: '1. Three Colorful Platforms',
    tutorialStep1Text: 'Blue is Units, Green is Tens, Orange is Hundreds. Each holds place values!',
    tutorialStep2Title: '2. The Magic Carry Crane',
    tutorialStep2Text: 'Gather 10 sticks on Units, and the Crane bundles them into 1 Ten!',
    tutorialStep3Title: '3. Column Math Sidekick',
    tutorialStep3Text: 'Watch the written math numbers change in sync with our real 3D objects!',

    // Start Page
    home: 'Home',
    startSubtitle: 'Where Numbers Turn into Real 3D Objects!',
    playNow: 'Play Now! 🚀',
    chooseMode: 'Choose a Game Mode',
    learnAddDesc: 'Watch 10 loose sticks turn into 1 ten-bundle!',
    learnSubDesc: 'Borrow & unpack ten-bundles when units run out!',
    practiceDesc: '5 challenge levels with stars to collect!'
  },

  hi: {
    title: 'कैरी क्रेन (Carry Crane)',
    tagline: 'स्थान मान और हासिल का खेल',
    
    // Platforms & Place Values
    units: 'इकाई (Units)',
    tens: 'दहाई (Tens)',
    hundreds: 'सैकड़ा (Hundreds)',
    unitPlural: 'इकाइयाँ',
    tenPlural: 'दहाइयाँ',
    hundredPlural: 'सैकड़े',

    // Modes
    learnAdd: 'सीखें: जोड़ (+)',
    learnSub: 'सीखें: घटाव (-)',
    practice: 'अभ्यास (Practice)',

    // Level labels
    level1: 'स्तर 1: 2-अंक सरल',
    level2: 'स्तर 2: 2-अंक हासिल',
    level3: 'स्तर 3: 3-अंक हासिल',
    level4: 'स्तर 4: उधार घटाव',
    level5: 'स्तर 5: महा चुनौती',

    // Buttons
    addUnit: '+1 इकाई',
    addTen: '+10 दहाई',
    addHundred: '+100 सैकड़ा',
    removeUnit: '-1 इकाई',
    removeTen: '-10 दहाई',
    removeHundred: '-100 सैकड़ा',
    checkAnswer: 'उत्तर जांचें',
    nextProblem: 'अगला सवाल',
    hint: 'संकेत',
    reset: 'रीसेट',
    soundOn: 'ध्वनि: चालू',
    soundOff: 'ध्वनि: बंद',
    tutorialBtn: 'कैसे खेलें',
    close: 'समझ गया!',

    // Mascot & Crane Captions
    carryUnitsToTens: '10 इकाइयाँ = 1 दहाई बंडल पहुँचाया गया!',
    carryTensToHundreds: '10 दहाइयाँ = 1 सैकड़ा स्लैब बन गया!',
    borrowTensToUnits: '1 दहाई खुली और 10 इकाइयाँ बन गई!',
    borrowHundredsToTens: '1 सैकड़ा 10 दहाइयों में बदल गया!',
    cannotBorrowZero: 'पहले उधार लेते हैं! शून्य से कम नहीं।',
    cannotOverflow: 'अरे! संख्या 999 से अधिक नहीं हो सकती।',
    correctMsg: 'शानदार! आपका उत्तर बिल्कुल सही है!',
    wrongMsg: 'फिर से सोचें! हाइलाइट किए मंच को देखें।',
    welcomeMsg: 'नमस्ते! संख्याएं बनाने और बंडल ले जाने में मदद करें!',
    readyToAdd: 'संख्याओं के अनुसार तीलियाँ जोड़ें!',
    readyToSubtract: 'बचे हुए निकालने के लिए तीलियाँ हटाएं!',
    borrowHelpMsg: 'इकाइयाँ कम हैं? 1 दहाई खोलकर 10 इकाइयाँ बनाएं!',

    // Tutorial Steps
    tutorialStep1Title: '1. तीन रंगीन मंच',
    tutorialStep1Text: 'नीला इकाई है, हरा दहाई है, नारंगी सैकड़ा है।',
    tutorialStep2Title: '2. जादुई कैरी क्रेन',
    tutorialStep2Text: '10 तीलियाँ मिलकर 1 दहाई बंडल बनती हैं जिसे क्रेन उठाती है!',
    tutorialStep3Title: '3. लिखित जोड़-घटाव',
    tutorialStep3Text: 'देखें कि कैसे 3D बंडल के साथ लिखित संख्याएं भी बदलती हैं!',

    // Start Page
    home: 'होम',
    startSubtitle: 'जहाँ संख्याएँ असली 3D वस्तुओं में बदलती हैं!',
    playNow: 'खेल शुरू करें! 🚀',
    chooseMode: 'खेल का तरीका चुनें',
    learnAddDesc: '10 तीलियाँ मिलकर 1 दहाई बंडल बनती हैं!',
    learnSubDesc: 'इकाइयाँ कम होने पर दहाई बंडल खोलें!',
    practiceDesc: 'सितारों के साथ 5 रोमांचक स्तर!'
  }
};

let currentLang = 'en';

export function setLanguage(lang) {
  if (STRINGS[lang]) {
    currentLang = lang;
  }
}

export function getLanguage() {
  return currentLang;
}

export function t(key) {
  return STRINGS[currentLang][key] || STRINGS.en[key] || key;
}
