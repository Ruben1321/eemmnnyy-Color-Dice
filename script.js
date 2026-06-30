const colors = {
    blue: '#2563eb',
    red: '#e11d2e',
    yellow: '#facc15',
    orange: '#f97316',
    purple: '#9333ea',
    green: '#22c55e'
};
const colorNamesEN = { blue: 'BLUE', red: 'RED', yellow: 'YELLOW', orange: 'ORANGE', purple: 'PURPLE', green: 'GREEN' };
const allColorKeys = Object.keys(colors);
const gridContainer = document.getElementById('dice-grid');
const rollBtn = document.getElementById('roll-btn');
const megaBtn = document.getElementById('mega-btn');
const soundBtn = document.getElementById('sound-btn');
const selectTrigger = document.getElementById('custom-select-trigger');
const optionsList = document.getElementById('custom-options-list');
const selectedValueText = document.getElementById('selected-value-text');
const customOptions = document.querySelectorAll('.custom-option');
const selectedThemeText = document.getElementById('selected-theme-text');
const funkoFigure = document.querySelector('.funko-figure');
const funkoStage = document.querySelector('.funko-stage');
const voyageScreen = document.getElementById('voyage-screen');
const voyageShip = document.getElementById('voyage-ship');
const voyageColors = document.getElementById('voyage-colors');

let currentTheme = 'onepice';
let globalAudioCtx = null;
let isSoundEnabled = true;
let currentDiceCount = 3;

function initAudio() {
    if (!globalAudioCtx) globalAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (globalAudioCtx.state === 'suspended') globalAudioCtx.resume();
}

function applyLoadedTheme() {
    document.body.className = 'onepice-theme';
    currentTheme = 'onepice';
    if (selectedThemeText) selectedThemeText.innerText = 'THEME: ONEPICE';
}

if (selectTrigger && optionsList) {
    selectTrigger.onclick = (e) => {
        initAudio();
        e.stopPropagation();
        selectTrigger.classList.toggle('dropdown-open');
        optionsList.classList.toggle('show-menu');
    };
}

customOptions.forEach(opt => {
    opt.onclick = (e) => {
        e.stopPropagation();
        currentDiceCount = parseInt(opt.dataset.value, 10);
        if (selectedValueText) selectedValueText.innerText = currentDiceCount + ' Dice';
        if (optionsList) optionsList.classList.remove('show-menu');
        if (selectTrigger) selectTrigger.classList.remove('dropdown-open');
        renderStartingDice();
    };
});

document.onclick = () => {
    if (optionsList) optionsList.classList.remove('show-menu');
    if (selectTrigger) selectTrigger.classList.remove('dropdown-open');
};

function playSound(type) {
    if (!isSoundEnabled) return;
    try {
        initAudio();
        const now = globalAudioCtx.currentTime;
        const osc = globalAudioCtx.createOscillator();
        const gainNode = globalAudioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(globalAudioCtx.destination);

        if (type === 'normal') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(520, now + 0.14);
            gainNode.gain.setValueAtTime(0.25, now);
            gainNode.gain.linearRampToValueAtTime(0.01, now + 0.16);
            osc.start(now);
            osc.stop(now + 0.16);
        } else if (type === 'mega-start') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(90, now);
            osc.frequency.linearRampToValueAtTime(160, now + 0.35);
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.linearRampToValueAtTime(0.01, now + 0.35);
            osc.start(now);
            osc.stop(now + 0.35);
        } else if (type === 'mega-tick') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(620, now);
            gainNode.gain.setValueAtTime(0.08, now);
            gainNode.gain.linearRampToValueAtTime(0.01, now + 0.04);
            osc.start(now);
            osc.stop(now + 0.04);
        } else if (type === 'mega-reveal') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(360, now);
            osc.frequency.exponentialRampToValueAtTime(920, now + 0.3);
            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.linearRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (type === 'confetti') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(280, now);
            osc.frequency.setValueAtTime(520, now + 0.12);
            osc.frequency.exponentialRampToValueAtTime(1050, now + 0.5);
            gainNode.gain.setValueAtTime(0.32, now);
            gainNode.gain.linearRampToValueAtTime(0.01, now + 0.5);
            osc.start(now);
            osc.stop(now + 0.5);
        }
    } catch (e) {}
}

function triggerConfetti() {
    playSound('confetti');
    for (let i = 0; i < 100; i++) {
        const p = document.createElement('div');
        p.classList.add('confetti');
        p.style.backgroundColor = Object.values(colors)[Math.floor(Math.random() * allColorKeys.length)];
        p.style.left = Math.random() * 100 + 'vw';
        p.style.top = '-10px';
        p.style.transform = `scale(${Math.random() * 0.6 + 0.4})`;
        const duration = Math.random() * 2 + 2;
        const delay = Math.random() * 0.5;
        p.style.animation = `confettiFall ${duration}s linear ${delay}s forwards`;
        document.body.appendChild(p);
        setTimeout(() => p.remove(), (duration + delay) * 1000);
    }
}

function checkSameColorMatch(rolledColors) {
    if (rolledColors.length > 1) {
        const first = rolledColors[0];
        const allSame = rolledColors.every(c => c === first);
        if (allSame) {
            reactFunko(first, true);
            setTimeout(triggerConfetti, 400);
            return;
        }
    }
    reactFunko(getDominantColor(rolledColors), false);
}

function getDominantColor(rolledColors) {
    const totals = rolledColors.reduce((acc, colorName) => {
        acc[colorName] = (acc[colorName] || 0) + 1;
        return acc;
    }, {});
    return rolledColors.reduce((best, colorName) => totals[colorName] > totals[best] ? colorName : best, rolledColors[0]);
}

function reactFunko(colorName, isTreasure) {
    if (!funkoFigure || !colorName) return;
    const reactionClass = isTreasure ? 'funko-treasure' : 'funko-react';
    funkoFigure.style.setProperty('--funko-reaction-color', colors[colorName]);
    funkoFigure.classList.remove('funko-react', 'funko-treasure');
    void funkoFigure.offsetWidth;
    funkoFigure.classList.add(reactionClass);
    setTimeout(() => funkoFigure.classList.remove(reactionClass), isTreasure ? 1150 : 860);
}

function buildDice(randomColorName, isNormal = false) {
    const diceWrapper = document.createElement('div');
    diceWrapper.classList.add('dice-wrapper');
    const dice = document.createElement('div');
    dice.classList.add('dice');
    const label = document.createElement('div');
    label.classList.add('dice-label');

    if (isNormal) {
        dice.classList.add('dice-normal', 'dice-glow-active');
        dice.style.backgroundColor = colors[randomColorName];
        dice.style.setProperty('--dice-glow-color', colors[randomColorName]);
        label.innerText = colorNamesEN[randomColorName];
        label.style.color = colors[randomColorName];
        label.style.setProperty('--dice-glow-color', colors[randomColorName]);
    } else {
        dice.classList.add('dice-mega-template');
        dice.innerText = '?';
        label.innerText = 'WAIT...';
        label.style.color = '#ffffff';
        label.style.setProperty('--dice-glow-color', 'rgba(255,255,255,0.1)');
    }

    diceWrapper.appendChild(dice);
    diceWrapper.appendChild(label);
    return { wrapper: diceWrapper, dice, label };
}

async function rollDice(count = 3, isMega = false) {
    if (rollBtn) rollBtn.disabled = true;
    if (megaBtn) megaBtn.disabled = true;
    const finalRolledColors = [];
    gridContainer.innerHTML = '';
    const diceElements = [];

    for (let i = 0; i < count; i++) {
        const randomColorName = allColorKeys[Math.floor(Math.random() * allColorKeys.length)];
        finalRolledColors.push(randomColorName);
        const block = buildDice(randomColorName, false);
        gridContainer.appendChild(block.wrapper);
        diceElements.push({ wrapper: block.wrapper, dice: block.dice, label: block.label, targetColor: randomColorName });
    }

    playSound(isMega ? 'mega-start' : 'mega-tick');
    await spinDice(diceElements, isMega ? 1250 : 760, isMega ? 38 : 62);
    if (isMega) {
        await playMainSailAway();
        await playVoyageScene(finalRolledColors);
    }
    playSound('normal');

    for (const item of diceElements) {
        revealDice(item, isMega);
        playSound(isMega ? 'mega-reveal' : 'mega-tick');
        await delay(isMega ? 180 : 90);
    }

    finishRoll(finalRolledColors);
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function spinDice(diceElements, duration, intervalTime) {
    return new Promise(resolve => {
        let elapsed = 0;
        const roulette = setInterval(() => {
            playSound('mega-tick');
            diceElements.forEach(item => {
                item.dice.style.backgroundColor = colors[allColorKeys[Math.floor(Math.random() * allColorKeys.length)]];
            });
            elapsed += intervalTime;
            if (elapsed >= duration) {
                clearInterval(roulette);
                resolve();
            }
        }, intervalTime);
    });
}

async function playMainSailAway() {
    if (!funkoStage) return;
    funkoStage.classList.remove('mega-departing');
    void funkoStage.offsetWidth;
    funkoStage.classList.add('mega-departing');
    playSound('mega-start');
    await delay(1250);
}

async function playVoyageScene(rolledColors) {
    if (!voyageScreen || !voyageColors || !voyageShip) return;
    voyageColors.innerHTML = '';
    voyageScreen.querySelectorAll('.voyage-beam').forEach(beam => beam.remove());
    voyageScreen.classList.remove('hide');
    voyageScreen.classList.add('show');
    voyageScreen.setAttribute('aria-hidden', 'false');
    voyageShip.style.animation = 'none';
    void voyageShip.offsetWidth;
    voyageShip.style.animation = '';

    await delay(1550);

    for (const colorName of rolledColors) {
        showVoyageColor(colorName);
        playSound('mega-reveal');
        await delay(980);
    }

    await delay(900);
    voyageScreen.classList.add('hide');
    await delay(420);
    voyageScreen.classList.remove('show', 'hide');
    voyageScreen.setAttribute('aria-hidden', 'true');
    if (funkoStage) {
        funkoStage.classList.remove('mega-departing');
    }
}

function showVoyageColor(colorName) {
    if (!voyageColors || !voyageShip || !voyageScreen) return;
    const colorValue = colors[colorName];
    const tokenIndex = voyageColors.children.length;
    voyageShip.classList.remove('collecting');
    voyageShip.style.setProperty('--cast-color', colorValue);
    void voyageShip.offsetWidth;
    voyageShip.classList.add('collecting');
    setTimeout(() => voyageShip.classList.remove('collecting'), 650);

    const beam = document.createElement('span');
    beam.className = 'voyage-beam';
    beam.style.setProperty('--beam-color', colorValue);
    beam.style.setProperty('--beam-angle', `${(tokenIndex - 1) * 8}deg`);
    voyageScreen.appendChild(beam);
    setTimeout(() => beam.remove(), 900);

    const token = document.createElement('div');
    token.className = 'voyage-token';
    token.style.setProperty('--token-color', colorValue);
    token.textContent = colorNamesEN[colorName];
    voyageColors.appendChild(token);
}

function animateColorInsert(items) {
    if (!funkoFigure || !items.length) return;
    const funkoRect = funkoFigure.getBoundingClientRect();
    funkoFigure.classList.remove('funko-casting');
    void funkoFigure.offsetWidth;
    funkoFigure.classList.add('funko-casting');
    setTimeout(() => funkoFigure.classList.remove('funko-casting'), 620);

    items.forEach((item, index) => {
        const diceRect = item.dice.getBoundingClientRect();
        const handSide = index % 2 === 0 ? 0.28 : 0.72;
        const startX = funkoRect.left + funkoRect.width * handSide;
        const startY = funkoRect.top + funkoRect.height * 0.64;
        const endX = diceRect.left + diceRect.width / 2;
        const endY = diceRect.top + diceRect.height / 2;
        const arcTop = Math.min(startY, endY) - 90;
        const midX = (startX + endX) / 2;
        const orb = document.createElement('span');
        orb.className = 'color-orb';
        orb.style.setProperty('--orb-color', colors[item.targetColor]);
        orb.style.left = `${startX}px`;
        orb.style.top = `${startY}px`;
        document.body.appendChild(orb);
        orb.animate([
            { transform: 'translate(0px, 0px) scale(0.35)', opacity: 0 },
            { transform: `translate(${midX - startX}px, ${arcTop - startY}px) scale(1.15)`, opacity: 1, offset: 0.45 },
            { transform: `translate(${endX - startX}px, ${endY - startY}px) scale(0.95)`, opacity: 1, offset: 0.82 },
            { transform: `translate(${endX - startX}px, ${endY - startY}px) scale(1.45)`, opacity: 0 }
        ], {
            duration: 720,
            easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
            fill: 'forwards'
        });
        setTimeout(() => orb.remove(), 700);
    });
}

function revealDice(item, isMega = false) {
    const finalColor = item.targetColor;
    item.dice.innerText = '';
    item.dice.style.backgroundColor = colors[finalColor];
    item.dice.style.borderColor = '#fff7d6';
    item.dice.style.setProperty('--dice-glow-color', colors[finalColor]);
    item.dice.classList.remove('dice-mega-template');
    item.dice.classList.add(isMega ? 'dice-reveal' : 'dice-normal', 'dice-glow-active');
    item.label.innerText = colorNamesEN[finalColor];
    item.label.style.color = colors[finalColor];
    item.label.style.setProperty('--dice-glow-color', colors[finalColor]);
}

function finishRoll(finalRolledColors) {
    if (rollBtn) rollBtn.disabled = false;
    if (megaBtn) megaBtn.disabled = false;
    checkSameColorMatch(finalRolledColors);
}

function renderStartingDice() {
    if (!gridContainer) return;
    gridContainer.innerHTML = '';
    for (let i = 0; i < currentDiceCount; i++) {
        const block = buildDice(allColorKeys[Math.floor(Math.random() * allColorKeys.length)], true);
        gridContainer.appendChild(block.wrapper);
    }
}

if (soundBtn) {
    soundBtn.onclick = () => {
        initAudio();
        isSoundEnabled = !isSoundEnabled;
        soundBtn.innerText = isSoundEnabled ? 'SOUND: ON' : 'SOUND: OFF';
    };
}
if (rollBtn) rollBtn.onclick = () => { initAudio(); rollDice(currentDiceCount, false); };
if (megaBtn) megaBtn.onclick = () => { initAudio(); rollDice(currentDiceCount, true); };

applyLoadedTheme();
renderStartingDice();
