/* Fraction Feast — a 4th-grade fractions food-truck adventure. */
(function () {
  'use strict';

  const app = document.getElementById('app');
  const muteBtn = document.getElementById('muteBtn');
  const rand = (n) => Math.floor(Math.random() * n);
  const pick = (arr) => arr[rand(arr.length)];
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = rand(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const STORE_KEY = 'fractionFeast.v2';
  const DEFAULT_STATE = { coins: 0, served: 0, worlds: {}, upgrades: [], days: {}, muted: false };

  function loadState() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      return Object.assign({}, DEFAULT_STATE, raw ? JSON.parse(raw) : {});
    } catch (e) {
      return Object.assign({}, DEFAULT_STATE);
    }
  }

  function saveState() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  let state = loadState();
  if (!state.days) state.days = {};

  const todayStr = () => new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  const CUSTOMERS = ['🐶', '🐱', '🐰', '🦊', '🐼', '🐨', '🦁', '🐯', '🐸', '🐵', '🐷', '🐮'];
  const WORLDS = [
    { emoji: '🍕', name: 'Pizza Pier', skill: 'Build fractions', type: 'build', food: 'pizza' },
    { emoji: '🍫', name: 'Candy Canyon', skill: 'Recognize fractions', type: 'recognize', food: 'chocolate' },
    { emoji: '🧁', name: 'Bakery Boulevard', skill: 'Equivalent fractions', type: 'equiv', food: 'cupcake' },
    { emoji: '🥞', name: 'Pancake Peak', skill: 'Compare fractions', type: 'compare', food: 'pancake' },
    { emoji: '🌮', name: 'Taco Town', skill: 'Order fractions', type: 'order', food: 'taco' },
    { emoji: '🍪', name: 'Cookie Café', skill: 'Add fractions', type: 'add', food: 'cookie' },
    { emoji: '🧇', name: 'Waffle Works', skill: 'Subtract fractions', type: 'subtract', food: 'waffle' },
    { emoji: '🎂', name: 'Party Catering', skill: 'Mixed numbers', type: 'mixed', food: 'cake' },
    { emoji: '🏰', name: 'Royal Banquet', skill: 'Fraction mastery', type: 'mastery', food: 'feast' }
  ];

  const UPGRADES = [
    ['🪩', 'Disco Ball'], ['🤖', 'Robot Chef'], ['🐶', 'Puppy Waiter'],
    ['🌈', 'Rainbow Oven'], ['🐠', 'Aquarium'], ['🏆', 'Golden Mixer'],
    ['🎡', 'Ferris Wheel'], ['🚀', 'Rocket Booster'], ['🦄', 'Unicorn Mascot'],
    ['🍦', 'Ice Cream Machine'], ['🎆', 'Firework Show'], ['🐉', 'Dragon Grill']
  ];
  const TREASURE_COST = 100;

  function startAudio() {
    if (!state.muted && window.Music) Music.ensureStarted();
  }
  document.addEventListener('pointerdown', startAudio, { once: true });

  muteBtn.textContent = state.muted ? '🔇' : '🔊';
  muteBtn.addEventListener('click', () => {
    state.muted = !state.muted;
    muteBtn.textContent = state.muted ? '🔇' : '🔊';
    if (window.Music) Music.setEnabled(!state.muted);
    saveState();
  });

  function gcd(a, b) {
    while (b) [a, b] = [b, a % b];
    return Math.abs(a);
  }

  function sameFraction(a, b) {
    return a[0] * b[1] === b[0] * a[1];
  }

  function fractionValue(a) {
    return a[0] / a[1];
  }

  function coinMarkup() {
    return '<span class="coin-icon" aria-hidden="true">★</span>';
  }

  function fracLabel(a) {
    if (a[0] > a[1] && a[0] % a[1] !== 0) {
      const whole = Math.floor(a[0] / a[1]);
      return whole + ' ' + (a[0] % a[1]) + '/' + a[1];
    }
    if (a[0] === a[1]) return '1 whole';
    return a[0] + '/' + a[1];
  }

  function randomProper(denoms) {
    const d = pick(denoms || [2, 3, 4, 5, 6, 8, 10, 12]);
    return [1 + rand(d - 1), d];
  }

  function setScreen(mode) {
    document.body.classList.toggle('welcome-active', mode === 'welcome');
    app.className = mode === 'welcome' ? 'welcome-mode' : '';
  }

  function renderWelcome() {
    setScreen('welcome');
    app.innerHTML = `
      <main class="welcome-screen" aria-label="Fraction Feast main menu">
        <div class="welcome-art-wrap">
          <img class="welcome-art" src="assets/welcome.png" alt="Fraction Feast food truck adventure with animal customers and fraction foods">
          <button class="welcome-hotspot random-hotspot" id="randomLevelBtn" aria-label="Play a random level"><span>Random Level</span></button>
          <button class="welcome-hotspot map-hotspot" id="welcomeMapBtn" aria-label="Open the map"><span>Map</span></button>
          <button class="welcome-hotspot collection-hotspot" id="welcomeCollectionBtn" aria-label="Open My Collection"><span>My Collection</span></button>
          <button class="welcome-hotspot sound-hotspot" id="welcomeSoundBtn" aria-label="Toggle music"><span>Toggle music</span></button>
        </div>
      </main>
    `;
    document.getElementById('randomLevelBtn').addEventListener('click', () => playWorld(rand(WORLDS.length)));
    document.getElementById('welcomeMapBtn').addEventListener('click', renderMap);
    document.getElementById('welcomeCollectionBtn').addEventListener('click', renderCollection);
    document.getElementById('welcomeSoundBtn').addEventListener('click', () => muteBtn.click());
    window.scrollTo(0, 0);
  }

  function renderMap() {
    setScreen('map');
    const totalStars = Object.values(state.worlds).reduce((sum, n) => sum + Number(n || 0), 0);
    const days = state.days || {};
    const historyRows = WORLDS.map((w, i) => {
      const list = days[i] || [];
      if (!list.length) return '';
      const counts = {};
      list.forEach(d => { counts[d] = (counts[d] || 0) + 1; });
      const txt = Object.keys(counts).map(d => d + (counts[d] > 1 ? ` (×${counts[d]})` : '')).join(' · ');
      return `<div class="history-row"><div class="history-world">${w.emoji} ${w.name}</div><div class="history-dates">${txt}</div></div>`;
    }).filter(Boolean).join('');
    app.innerHTML = `
      <div class="page-topbar">
        <button id="welcomeBtn" class="back-btn" aria-label="Back to welcome screen">←</button>
        <div class="page-title"><span>🗺️</span><div><h1>Fraction Feast Map</h1><p>Choose where the food truck goes next!</p></div></div>
      </div>

      <div class="stats">
        <div class="pill"><b>${coinMarkup()} ${state.coins}</b><span>coins</span></div>
        <div class="pill"><b>${state.served}</b><span>customers served</span></div>
        <div class="pill"><b>${totalStars} ⭐</b><span>rushes finished</span></div>
      </div>

      <div class="section">🗺️ Choose a Stop</div>
      <div class="worlds">
        ${WORLDS.map((w, i) => {
          const wins = Number(state.worlds[i] || 0);
          const list = days[i] || [];
          const lastDay = list.length ? list[list.length - 1] : '';
          return `<button class="world tint${i % 5}" data-world="${i}">
            <div class="emoji">${w.emoji}</div>
            <h3>${w.name}</h3>
            <small>${w.skill}</small>
            <div class="stars">${wins ? '⭐ ' + wins + (wins === 1 ? ' rush' : ' rushes') : 'Ready to play!'}</div>
            ${lastDay ? `<div class="world-lastday">📅 last: ${lastDay}</div>` : ''}
          </button>`;
        }).join('')}
      </div>

      <div class="section">📅 Days Completed</div>
      <div class="level-history">
        ${historyRows || '<div class="history-empty">No rushes finished yet — pick a stop above to start! 🌟</div>'}
      </div>
    `;

    document.getElementById('welcomeBtn').addEventListener('click', renderWelcome);
    app.querySelectorAll('[data-world]').forEach((b) => {
      b.addEventListener('click', () => playWorld(Number(b.dataset.world)));
    });
    window.scrollTo(0, 0);
  }

  function celebrateTreasure(index) {
    const [emoji, name] = UPGRADES[index];
    const colors = ['#ff6ec7', '#ffd93b', '#6ec1ff', '#8affc1', '#c79bff', '#ff9f5a'];
    const confetti = Array.from({ length: 28 }, () => {
      const c = colors[rand(colors.length)];
      const left = Math.floor(Math.random() * 100);
      const delay = (Math.random() * 0.5).toFixed(2);
      const dur = (1.6 + Math.random() * 1.3).toFixed(2);
      const rot = Math.floor(Math.random() * 360);
      return `<span class="confetti-piece" style="left:${left}%;background:${c};animation-delay:${delay}s;animation-duration:${dur}s;transform:rotate(${rot}deg)"></span>`;
    }).join('');
    const overlay = document.createElement('div');
    overlay.className = 'treasure-celebration';
    overlay.innerHTML = `
      <div class="celebration-confetti">${confetti}</div>
      <div class="celebration-card">
        <div class="celebration-title">🎉 New Treasure! 🎉</div>
        <div class="celebration-burst"><span class="celebration-emoji">${emoji}</span></div>
        <div class="celebration-name">${name}</div>
        <div class="celebration-sub">added to your collection</div>
        <button class="serve-btn celebration-btn">Awesome!</button>
      </div>
    `;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector('.celebration-btn').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  }

  function renderCollection() {
    setScreen('collection');
    const ownedCount = state.upgrades.length;
    app.innerHTML = `
      <div class="page-topbar">
        <button id="collectionBackBtn" class="back-btn" aria-label="Back to welcome screen">←</button>
        <div class="page-title"><span>🎁</span><div><h1>My Collection</h1><p>Decorate the truck with treasures you earn!</p></div></div>
        <div class="collection-coins">${coinMarkup()} ${state.coins}</div>
      </div>

      <div class="collection-summary">
        <div class="collection-truck"><img src="sprites/truck.svg" alt="Fraction Feast food truck"></div>
        <div><b>${ownedCount} / ${UPGRADES.length}</b><span> treasures collected</span></div>
      </div>

      <div class="section">💖 Your Treasures</div>
      <div class="upgrade-grid collection-grid">
        ${UPGRADES.map((u, i) => {
          const owned = state.upgrades.includes(i);
          return `<button class="upgrade-card ${owned ? 'owned' : ''}" data-upgrade="${i}">
            <span class="upgrade-emoji">${owned ? u[0] : '❓'}</span>
            <b>${owned ? u[1] : 'Mystery Treasure'}</b>
            <small>${owned ? 'Collected ✓' : coinMarkup() + ' ' + TREASURE_COST + ' to unlock'}</small>
          </button>`;
        }).join('')}
      </div>
      <p class="collection-tip">Tap a mystery treasure to buy it for ${coinMarkup()} ${TREASURE_COST}.</p>
      <div class="small-actions"><button id="resetBtn" class="link-btn">Reset progress</button></div>
    `;

    document.getElementById('collectionBackBtn').addEventListener('click', renderWelcome);
    app.querySelectorAll('[data-upgrade]').forEach((b) => {
      b.addEventListener('click', () => {
        const i = Number(b.dataset.upgrade);
        if (state.upgrades.includes(i)) {
          toast(`${UPGRADES[i][1]} is already in your collection!`);
          return;
        }
        if (state.coins < TREASURE_COST) {
          toast(`You need ${TREASURE_COST} coins for that treasure!`);
          return;
        }
        state.coins -= TREASURE_COST;
        state.upgrades.push(i);
        saveState();
        if (window.Music) Music.chime('win');
        renderCollection();
        celebrateTreasure(i);
      });
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
      if (confirm('Reset all Fraction Feast progress?')) {
        const muted = state.muted;
        state = { coins: 0, served: 0, worlds: {}, upgrades: [], days: {}, muted };
        saveState();
        renderCollection();
      }
    });
    window.scrollTo(0, 0);
  }

  function toast(message) {
    const old = document.querySelector('.toast-message');
    if (old) old.remove();
    const node = document.createElement('div');
    node.className = 'toast-message';
    node.textContent = message;
    document.body.appendChild(node);
    setTimeout(() => node.classList.add('show'), 10);
    setTimeout(() => {
      node.classList.remove('show');
      setTimeout(() => node.remove(), 250);
    }, 1500);
  }

  function buildProblem() {
    const target = randomProper([2, 3, 4, 6, 8]);
    return {
      type: 'build', target,
      prompt: `I'd like <b>${target[0]}/${target[1]}</b> of a pizza, please!`,
      hint: 'Choose how many equal slices, then tap slices onto the plate.'
    };
  }

  function recognizeProblem() {
    const target = randomProper([2, 3, 4, 5, 6, 8]);
    const wrong = [];
    const candidates = [
      [Math.max(1, target[0] - 1), target[1]],
      [Math.min(target[1] - 1, target[0] + 1), target[1]],
      [target[0], Math.min(10, target[1] + 1)],
      [1, target[1]]
    ];
    for (const c of candidates) {
      if (!sameFraction(c, target) && !wrong.some(w => w[0] === c[0] && w[1] === c[1])) wrong.push(c);
    }
    return {
      type: 'recognize', target,
      prompt: `Which tray shows <b>${target[0]}/${target[1]}</b>?`,
      hint: 'Count the equal pieces first, then count the filled pieces.',
      options: shuffle([target, ...wrong.slice(0, 3)])
    };
  }

  function equivProblem() {
    const base = randomProper([2, 3, 4, 5, 6]);
    const g = gcd(base[0], base[1]);
    const simple = [base[0] / g, base[1] / g];
    const k = pick([2, 3]);
    const target = [simple[0] * k, simple[1] * k];
    const wrong = [
      [target[0] + 1, target[1]],
      [Math.max(1, target[0] - 1), target[1]],
      [target[0], target[1] + 1]
    ];
    return {
      type: 'equiv', base: simple, target,
      prompt: `Which order is the <b>same amount</b> as <b>${simple[0]}/${simple[1]}</b>?`,
      hint: 'Equivalent fractions cover the same amount of the whole.',
      options: shuffle([target, ...wrong])
    };
  }

  function compareProblem() {
    let a, b;
    do {
      a = randomProper([2, 3, 4, 5, 6, 8]);
      b = randomProper([2, 3, 4, 5, 6, 8]);
    } while (sameFraction(a, b));
    const answer = fractionValue(a) > fractionValue(b) ? 'a' : 'b';
    return {
      type: 'compare', a, b, answer,
      prompt: 'Which customer ordered <b>more</b>?',
      hint: 'The pancakes are the same size, so compare how much of each circle is filled.'
    };
  }

  function orderProblem() {
    let values;
    do {
      values = [
        randomProper([2, 3, 4, 5, 6, 8]),
        randomProper([2, 3, 4, 5, 6, 8]),
        randomProper([2, 3, 4, 5, 6, 8])
      ];
    } while (new Set(values.map(v => v[0] / v[1])).size < 3);
    return {
      type: 'order', values,
      sorted: values.slice().sort((x, y) => fractionValue(x) - fractionValue(y)),
      prompt: 'Put these taco orders from <b>smallest to largest</b>.',
      hint: 'Tap the smallest first. Your serving tray will fill from left to right.'
    };
  }

  function addProblem() {
    const d = pick([4, 6, 8, 10, 12]);
    const x = 1 + rand(Math.max(1, Math.floor(d / 2)));
    const y = 1 + rand(Math.max(1, d - x));
    const target = [x + y, d];
    return {
      type: 'add', a: [x, d], b: [y, d], target,
      prompt: `Combine <b>${x}/${d}</b> of a cookie tray and <b>${y}/${d}</b> more. How much is that?`,
      hint: 'The pieces are the same size, so keep the denominator and add the numerators.'
    };
  }

  function subtractProblem() {
    const d = pick([4, 6, 8, 10, 12]);
    const x = 2 + rand(d - 1);
    const y = 1 + rand(x - 1);
    const target = [x - y, d];
    return {
      type: 'subtract', a: [x, d], b: [y, d], target,
      prompt: `We had <b>${x}/${d}</b> of a waffle tray. The customer ate <b>${y}/${d}</b>. What's left?`,
      hint: 'The pieces are the same size, so keep the denominator and subtract the numerators.'
    };
  }

  function mixedProblem() {
    const whole = 1 + rand(2);
    const d = pick([2, 3, 4, 6, 8]);
    const n = 1 + rand(d - 1);
    const target = [whole * d + n, d];
    return {
      type: 'mixed', whole, part: [n, d], target,
      prompt: `Serve exactly <b>${whole} ${n}/${d}</b> cakes!`,
      hint: 'Build the whole cakes first, then the fraction of the next cake.'
    };
  }

  function problemFor(type) {
    if (type === 'mastery') {
      return problemFor(pick(['build', 'recognize', 'equiv', 'compare', 'order', 'add', 'subtract', 'mixed']));
    }
    return {
      build: buildProblem,
      recognize: recognizeProblem,
      equiv: equivProblem,
      compare: compareProblem,
      order: orderProblem,
      add: addProblem,
      subtract: subtractProblem,
      mixed: mixedProblem
    }[type]();
  }

  function fractionBar(frac, opts) {
    const n = frac[0], d = frac[1];
    const o = opts || {};
    const cells = Array.from({ length: d }, (_, i) => {
      const on = i < n;
      return `<span class="bar-cell ${on ? 'filled' : ''} ${o.removed && i >= n ? 'removed' : ''}"></span>`;
    }).join('');
    return `<div class="fraction-bar" style="--den:${d}">${cells}</div>`;
  }

  function polarPoint(cx, cy, radius, angle) {
    const a = (angle - 90) * Math.PI / 180;
    return [cx + radius * Math.cos(a), cy + radius * Math.sin(a)];
  }

  function sectorPath(index, total, radius) {
    const cx = 50, cy = 50;
    const start = index * 360 / total;
    const end = (index + 1) * 360 / total;
    const p1 = polarPoint(cx, cy, radius, start);
    const p2 = polarPoint(cx, cy, radius, end);
    const large = end - start > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${p1[0].toFixed(3)} ${p1[1].toFixed(3)} A ${radius} ${radius} 0 ${large} 1 ${p2[0].toFixed(3)} ${p2[1].toFixed(3)} Z`;
  }

  function fractionCircle(frac, kind, showLabel) {
    const n = frac[0], d = frac[1];
    const cls = kind || 'generic';
    const slices = Array.from({ length: d }, (_, i) =>
      `<path d="${sectorPath(i, d, 45)}" class="circle-slice ${i < n ? 'filled' : ''}"/>`
    ).join('');
    const garnish = cls === 'pizza'
      ? '<circle cx="38" cy="31" r="3.2" class="pizza-pepper"/><circle cx="61" cy="42" r="3" class="pizza-pepper"/><circle cx="48" cy="65" r="3.1" class="pizza-pepper"/>'
      : cls === 'pancake' ? '<circle cx="50" cy="50" r="7" class="butter-pat"/>' : '';
    return `<div class="fraction-circle-wrap ${cls}"><svg class="fraction-circle" viewBox="0 0 100 100" aria-hidden="true">${slices}${garnish}<circle cx="50" cy="50" r="45" class="circle-outline"/></svg>${showLabel ? `<b>${fracLabel(frac)}</b>` : ''}</div>`;
  }

  function cutCircleChoice(den) {
    return fractionCircle([0, den], 'pizza', false);
  }

  function foodTray(frac, kind) {
    const n = frac[0], d = frac[1];
    const items = Array.from({ length: d }, (_, i) => {
      const filled = i < n;
      if (kind === 'cookie') {
        const chipCount = 3 + ((i * 5 + d) % 4);
        const chips = Array.from({ length: chipCount }, (_, c) => `<i class="chip-dot chip-${(i + c) % 6}"></i>`).join('');
        return `<span class="tray-slot ${filled ? 'filled' : ''}"><span class="cookie-piece">${chips}</span></span>`;
      }
      return `<span class="tray-slot ${filled ? 'filled' : ''}"><span class="waffle-piece"></span></span>`;
    }).join('');
    return `<div class="food-tray ${kind}-tray" style="--den:${d}">${items}</div>`;
  }

  function optionCard(frac, label, opts) {
    const o = opts || {};
    const visual = o.circle ? fractionCircle(frac, o.kind || 'generic', false) : fractionBar(frac);
    return `<div class="option-visual">${visual}${o.hideLabel ? '' : `<b>${label || fracLabel(frac)}</b>`}</div>`;
  }

  function playWorld(worldIndex) {
    startAudio();
    const world = WORLDS[worldIndex];
    const session = { worldIndex, round: 0, score: 0, locked: false };

    function nextRound() {
      if (session.round >= 8) {
        finishWorld();
        return;
      }
      session.round++;
      session.locked = false;
      renderRound(problemFor(world.type));
    }

    function shell(problem, bodyHtml) {
      const boss = session.round === 4 || session.round === 8;
      document.body.classList.remove('welcome-active');
      app.className = 'play-mode';
      app.innerHTML = `
        <div class="play-screen">
          <header class="play-header">
            <button id="backBtn" class="back-btn" aria-label="Back to map">←</button>
            <div>
              <h2>${world.emoji} ${world.name}</h2>
              <small>${world.skill}</small>
            </div>
            <div class="grow"></div>
            <div class="coin-count">${coinMarkup()} ${state.coins}</div>
          </header>
          <div class="progress"><div style="width:${((session.round - 1) / 8) * 100}%"></div></div>
          <section class="order-card ${boss ? 'special-order' : ''}">
            ${boss ? '<div class="special-badge">⭐ SPECIAL ORDER ⭐</div>' : ''}
            <div class="customer">${pick(CUSTOMERS)}</div>
            <div class="speech">${problem.prompt}</div>
            <div class="order-count">Order ${session.round} of 8</div>
          </section>
          <main class="game-counter">${bodyHtml}</main>
          <div class="skill-hint">💡 ${problem.hint}</div>
        </div>
      `;
      document.getElementById('backBtn').addEventListener('click', renderMap);
    }

    function success(button) {
      if (session.locked) return;
      session.locked = true;
      if (button) button.classList.add('good');
      session.score++;
      state.coins += 3;
      state.served++;
      saveState();
      if (window.Music) Music.chime('good');
      toast(pick(['Perfect order! 🎉', 'Delicious math! 🌟', 'Customer served! 💛', 'You got it! 🍽️']));
      setTimeout(nextRound, 750);
    }

    function wrong(button, problem, explanation) {
      if (session.locked) return;
      if (button) {
        button.classList.add('bad');
        setTimeout(() => button.classList.remove('bad'), 450);
      }
      if (window.Music) Music.buzz();
      showTeaching(problem, explanation);
    }

    function renderRound(problem) {
      switch (problem.type) {
        case 'build': return renderBuild(problem);
        case 'recognize': return renderRecognize(problem);
        case 'equiv': return renderEquivalent(problem);
        case 'compare': return renderCompare(problem);
        case 'order': return renderOrder(problem);
        case 'add': return renderOperation(problem, '+');
        case 'subtract': return renderOperation(problem, '−');
        case 'mixed': return renderMixed(problem);
      }
    }

    function renderBuild(problem) {
      shell(problem, `
        <section class="work-card big-work">
          <div id="pizzaBuild" class="build-area"></div>
          <div class="denom-label">Cut the pizza into...</div>
          <div id="denomChoices" class="chip-row"></div>
          <button id="serveBtn" class="serve-btn">Serve it! 🍽️</button>
        </section>
      `);
      let denominator = null;
      let filled = new Set();
      const denoms = [2, 3, 4, 6, 8];
      const build = document.getElementById('pizzaBuild');
      const choices = document.getElementById('denomChoices');

      function draw() {
        if (!denominator) {
          build.innerHTML = `<div class="pizza-placeholder">🍕<span>Choose a cut below</span></div>`;
          choices.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
          return;
        }
        const slices = Array.from({ length: denominator }, (_, i) =>
          `<path d="${sectorPath(i, denominator, 44)}" class="pizza-build-slice ${filled.has(i) ? 'selected' : ''}" data-slice="${i}"/>`
        ).join('');
        build.innerHTML = `
          <svg class="pizza-builder" viewBox="0 0 100 100" aria-label="Pizza cut into equal slices">
            ${slices}
            <circle cx="50" cy="50" r="44" class="pizza-builder-outline"/>
            <circle cx="37" cy="31" r="2.7" class="pizza-pepper"/><circle cx="61" cy="39" r="2.7" class="pizza-pepper"/><circle cx="48" cy="65" r="2.7" class="pizza-pepper"/>
          </svg>
          <div class="built-label">Tap pizza slices to fill the order</div>
        `;
        build.querySelectorAll('[data-slice]').forEach((b) => {
          b.addEventListener('click', () => {
            const i = Number(b.dataset.slice);
            if (filled.has(i)) filled.delete(i);
            else filled.add(i);
            draw();
          });
        });
        choices.querySelectorAll('button').forEach((b) => b.classList.toggle('active', Number(b.dataset.den) === denominator));
      }

      choices.innerHTML = denoms.map(d => `<button class="cut-choice" data-den="${d}" aria-label="Cut pizza into ${d} equal slices">${cutCircleChoice(d)}</button>`).join('');
      choices.querySelectorAll('button').forEach((b) => {
        b.addEventListener('click', () => {
          denominator = Number(b.dataset.den);
          filled = new Set();
          draw();
        });
      });
      draw();

      document.getElementById('serveBtn').addEventListener('click', (e) => {
        if (denominator && sameFraction([filled.size, denominator], problem.target)) success(e.currentTarget);
        else wrong(e.currentTarget, problem, denominator ? `You served <b>${filled.size}/${denominator}</b>, but the order was <b>${fracLabel(problem.target)}</b>.` : 'Choose how to cut the pizza first.');
      });
    }

    function renderRecognize(problem) {
      shell(problem, `
        <section class="work-card">
          <div class="visual-question-title">Pick the correct tray</div>
          <div class="visual-options">
            ${problem.options.map((f, i) => `<button class="visual-choice" data-option="${i}">${optionCard(f, null, { hideLabel: true })}</button>`).join('')}
          </div>
        </section>
      `);
      app.querySelectorAll('[data-option]').forEach((b) => {
        b.addEventListener('click', () => {
          const f = problem.options[Number(b.dataset.option)];
          if (sameFraction(f, problem.target)) success(b);
          else wrong(b, problem, `This tray shows <b>${fracLabel(f)}</b>. Count the filled pieces and the total equal pieces.`);
        });
      });
    }

    function renderEquivalent(problem) {
      shell(problem, `
        <section class="work-card">
          <div class="equiv-source">
            <span>Match this amount:</span>
            ${fractionBar(problem.base)}
            <b>${fracLabel(problem.base)}</b>
          </div>
          <div class="equals-mark">= ?</div>
          <div class="visual-options">
            ${problem.options.map((f, i) => `<button class="visual-choice" data-option="${i}">${optionCard(f)}</button>`).join('')}
          </div>
        </section>
      `);
      app.querySelectorAll('[data-option]').forEach((b) => {
        b.addEventListener('click', () => {
          const f = problem.options[Number(b.dataset.option)];
          if (sameFraction(f, problem.base)) success(b);
          else wrong(b, problem, `<b>${fracLabel(f)}</b> does not cover the same amount as <b>${fracLabel(problem.base)}</b>.`);
        });
      });
    }

    function renderCompare(problem) {
      shell(problem, `
        <section class="work-card compare-layout">
          <button class="compare-card" data-compare="a">
            <div class="mini-customer">🐰</div>
            ${fractionCircle(problem.a, 'pancake', false)}
            <b>${fracLabel(problem.a)}</b>
          </button>
          <div class="versus">VS</div>
          <button class="compare-card" data-compare="b">
            <div class="mini-customer">🦊</div>
            ${fractionCircle(problem.b, 'pancake', false)}
            <b>${fracLabel(problem.b)}</b>
          </button>
        </section>
      `);
      app.querySelectorAll('[data-compare]').forEach((b) => {
        b.addEventListener('click', () => {
          if (b.dataset.compare === problem.answer) success(b);
          else wrong(b, problem, `${fracLabel(problem.a)} and ${fracLabel(problem.b)} are easier to compare when the pancakes are the same total size.`);
        });
      });
    }

    function renderOrder(problem) {
      shell(problem, `
        <section class="work-card">
          <div class="order-tray" id="orderTray">
            <span>1st</span><span>2nd</span><span>3rd</span>
          </div>
          <div class="order-picks">
            ${shuffle(problem.values).map((f, i) => `<button class="order-pick numeric-order-pick" data-frac="${f[0]}/${f[1]}" data-pick="${i}"><b class="fraction-number">${fracLabel(f)}</b></button>`).join('')}
          </div>
          <button id="clearOrder" class="secondary-btn">Start over</button>
        </section>
      `);
      const picked = [];
      const tray = document.getElementById('orderTray');
      const buttons = Array.from(app.querySelectorAll('[data-frac]'));

      function redrawTray() {
        tray.innerHTML = [0, 1, 2].map(i => picked[i] ? `<span class="tray-filled">${fracLabel(picked[i])}</span>` : `<span>${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : 'rd'}</span>`).join('');
      }

      buttons.forEach((b) => {
        b.addEventListener('click', () => {
          if (b.disabled || picked.length >= 3) return;
          const [n, d] = b.dataset.frac.split('/').map(Number);
          picked.push([n, d]);
          b.disabled = true;
          b.classList.add('picked');
          redrawTray();
          if (picked.length === 3) {
            const correct = picked.every((f, idx) => sameFraction(f, problem.sorted[idx]));
            if (correct) success(tray);
            else wrong(tray, problem, `The correct order is <b>${problem.sorted.map(fracLabel).join(' → ')}</b>.`);
          }
        });
      });
      document.getElementById('clearOrder').addEventListener('click', () => {
        picked.length = 0;
        buttons.forEach(b => { b.disabled = false; b.classList.remove('picked'); });
        redrawTray();
      });
    }

    function operationChoices(target) {
      const [n, d] = target;
      const candidates = [
        target,
        [Math.max(0, n - 1), d],
        [n + 1, d],
        [n, Math.min(12, d + 1)]
      ];
      const out = [];
      for (const c of candidates) {
        if (!out.some(x => x[0] === c[0] && x[1] === c[1])) out.push(c);
      }
      while (out.length < 4) out.push([n + out.length, d]);
      return shuffle(out.slice(0, 4));
    }

    function renderOperation(problem, symbol) {
      const opts = operationChoices(problem.target);
      shell(problem, `
        <section class="work-card">
          <div class="operation-visual">
            <div>${foodTray(problem.a, problem.type === 'add' ? 'cookie' : 'waffle')}<b>${fracLabel(problem.a)}</b></div>
            <div class="operation-symbol">${symbol}</div>
            <div>${foodTray(problem.b, problem.type === 'add' ? 'cookie' : 'waffle')}<b>${fracLabel(problem.b)}</b></div>
          </div>
          <div class="choice-grid">
            ${opts.map((f, i) => `<button class="number-choice" data-option="${i}">${fracLabel(f)}</button>`).join('')}
          </div>
        </section>
      `);
      app.querySelectorAll('[data-option]').forEach((b) => {
        b.addEventListener('click', () => {
          const f = opts[Number(b.dataset.option)];
          if (sameFraction(f, problem.target)) success(b);
          else wrong(b, problem, `Because the pieces are all ${problem.target[1]}ths, the denominator stays <b>${problem.target[1]}</b>.`);
        });
      });
    }

    function renderMixed(problem) {
      shell(problem, `
        <section class="work-card big-work">
          <div id="mixedBuild" class="mixed-build"></div>
          <div class="mixed-controls">
            <button id="minusPiece" class="round-control">−</button>
            <div id="mixedCount" class="mixed-count"></div>
            <button id="plusPiece" class="round-control">+</button>
          </div>
          <button id="serveMixed" class="serve-btn">Serve the cakes! 🎂</button>
        </section>
      `);
      let pieces = 0;
      const d = problem.target[1];
      const maxPieces = d * 3;
      const build = document.getElementById('mixedBuild');
      const count = document.getElementById('mixedCount');

      function draw() {
        const wholeCount = Math.floor(pieces / d);
        const remainder = pieces % d;
        const groups = [];
        for (let i = 0; i < Math.max(3, wholeCount + (remainder ? 1 : 0)); i++) {
          const fill = i < wholeCount ? d : (i === wholeCount ? remainder : 0);
          groups.push(`<div class="cake-unit">${fractionCircle([fill, d], 'cake', false)}</div>`);
        }
        build.innerHTML = groups.join('');
        count.innerHTML = `<b>${pieces} piece${pieces === 1 ? '' : 's'} served</b>`;
      }
      document.getElementById('minusPiece').addEventListener('click', () => { pieces = Math.max(0, pieces - 1); draw(); });
      document.getElementById('plusPiece').addEventListener('click', () => { pieces = Math.min(maxPieces, pieces + 1); draw(); });
      document.getElementById('serveMixed').addEventListener('click', (e) => {
        if (sameFraction([pieces, d], problem.target)) success(e.currentTarget);
        else wrong(e.currentTarget, problem, `The order <b>${problem.whole} ${problem.part[0]}/${problem.part[1]}</b> equals <b>${problem.target[0]}/${problem.target[1]}</b> pieces.`);
      });
      draw();
    }

    function showTeaching(problem, explanation) {
      const overlay = document.createElement('div');
      overlay.className = 'overlay teaching-overlay';
      let visual = '';
      if (problem.type === 'compare') {
        visual = `${optionCard(problem.a, null, { circle: true, kind: 'pancake' })}<div class="teach-vs">and</div>${optionCard(problem.b, null, { circle: true, kind: 'pancake' })}`;
      } else if (problem.type === 'equiv') {
        visual = `${optionCard(problem.base)}<div class="teach-equals">=</div>${optionCard(problem.target)}`;
      } else if (problem.target) {
        const proper = problem.target[0] <= problem.target[1] ? problem.target : [problem.target[0] % problem.target[1] || problem.target[1], problem.target[1]];
        visual = problem.type === 'build' || problem.type === 'mixed' ? optionCard(proper, fracLabel(problem.target), { circle: true, kind: problem.type === 'build' ? 'pizza' : 'cake' }) : optionCard(proper, fracLabel(problem.target));
      }
      overlay.innerHTML = `
        <div class="modal teaching-card">
          <div class="teach-bulb">💡</div>
          <h2>Take a closer look</h2>
          ${visual ? `<div class="teach-visual">${visual}</div>` : ''}
          <p>${explanation}</p>
          <p class="teach-tip">${problem.hint}</p>
          <button class="serve-btn">Got it 👍</button>
        </div>
      `;
      document.body.appendChild(overlay);
      overlay.querySelector('button').addEventListener('click', () => overlay.remove());
    }

    function finishWorld() {
      state.worlds[worldIndex] = Number(state.worlds[worldIndex] || 0) + 1;
      if (!state.days) state.days = {};
      if (!state.days[worldIndex]) state.days[worldIndex] = [];
      state.days[worldIndex].push(todayStr());
      const bonus = session.score >= 7 ? 10 : 5;
      state.coins += bonus;
      saveState();
      if (window.Music) Music.chime('win');

      app.innerHTML = `
        <div class="finish-screen">
          <div class="finish-card">
            <div class="finish-emoji">🎉 ${world.emoji} 🚚</div>
            <h1>Rush complete!</h1>
            <p>You served <b>${session.score}/8</b> orders correctly.</p>
            <div class="bonus">${coinMarkup()} +${bonus} bonus coins</div>
            <div class="finish-actions">
              <button id="againBtn" class="serve-btn">Play again</button>
              <button id="mapBtn" class="secondary-btn">Back to map</button>
            </div>
          </div>
        </div>
      `;
      document.getElementById('againBtn').addEventListener('click', () => playWorld(worldIndex));
      document.getElementById('mapBtn').addEventListener('click', renderMap);
    }

    nextRound();
  }

  if (window.Music) Music.setEnabled(!state.muted);
  renderWelcome();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }
})();
