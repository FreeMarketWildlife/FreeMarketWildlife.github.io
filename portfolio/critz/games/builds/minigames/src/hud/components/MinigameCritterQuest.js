const HEROES = [
  {
    id: 'turtle',
    name: 'Turtle',
    title: 'Shellbound Sentinel',
    stats: { hp: 120, power: 12, defense: 7, energy: 8 },
    skill: {
      name: 'Shell Spin',
      cost: 3,
      description: 'Spins in place, dealing steady damage and raising guard.',
    },
    palette: { primary: '#5aa66a', shell: '#3f6f4a', accent: '#f7e08d' },
  },
  {
    id: 'lizard',
    name: 'Lizard',
    title: 'Sunlit Scout',
    stats: { hp: 95, power: 16, defense: 4, energy: 11 },
    skill: {
      name: 'Sunflare',
      cost: 4,
      description: 'Blinds foes with warm light, adding burn damage.',
    },
    palette: { primary: '#7bdc8d', shell: '#3f9152', accent: '#ffb75d' },
  },
  {
    id: 'salamander',
    name: 'Salamander',
    title: 'Ember Wanderer',
    stats: { hp: 105, power: 14, defense: 5, energy: 12 },
    skill: {
      name: 'Ember Rush',
      cost: 4,
      description: 'Charges through foes for multi-hit damage.',
    },
    palette: { primary: '#ff8966', shell: '#d4583b', accent: '#ffd6a0' },
  },
  {
    id: 'frog',
    name: 'Frog',
    title: 'Mist Hopper',
    stats: { hp: 100, power: 13, defense: 5, energy: 10 },
    skill: {
      name: 'Tongue Snap',
      cost: 3,
      description: 'Snaps a foe from afar, with a chance to stun.',
    },
    palette: { primary: '#6fd0ff', shell: '#3a86b1', accent: '#c8f1ff' },
  },
];

const NPCS = [
  'Elder Twig',
  'Moss Mouse',
  'Petal Beetle',
  'Lumen Firefly',
  'Dapper Cricket',
  'Sable Snail',
  'Willow Wren',
  'Pebble Pika',
  'Bramble Weevil',
  'Honey Moth',
  'Clover Chipmunk',
];

const ENEMIES = {
  wisp: {
    id: 'wisp',
    name: 'Bramble Wisp',
    stats: { hp: 45, power: 7, defense: 2 },
    palette: { primary: '#9ed36a', shell: '#3d6c3c', accent: '#f6f1a1' },
  },
  boglet: {
    id: 'boglet',
    name: 'Boglet Tad',
    stats: { hp: 55, power: 8, defense: 3 },
    palette: { primary: '#6ab2ff', shell: '#316c9b', accent: '#c8f2ff' },
  },
  mole: {
    id: 'mole',
    name: 'Tunnel Mole',
    stats: { hp: 70, power: 10, defense: 4 },
    palette: { primary: '#b07a4e', shell: '#6f4630', accent: '#f1d0b0' },
  },
  stag: {
    id: 'stag',
    name: 'Stump Stag-Beetle',
    stats: { hp: 85, power: 12, defense: 5 },
    palette: { primary: '#6c4b2a', shell: '#3d2915', accent: '#caa25f' },
  },
  owl: {
    id: 'owl',
    name: 'Root Owl',
    stats: { hp: 95, power: 13, defense: 6 },
    palette: { primary: '#8aa0b5', shell: '#4f5f73', accent: '#f2d38f' },
  },
  boss: {
    id: 'boss',
    name: 'Grand Toad Sage',
    stats: { hp: 125, power: 16, defense: 7 },
    palette: { primary: '#4aa887', shell: '#2f6a54', accent: '#f5d97a' },
  },
};

const QUESTS = {
  'shimmer-seed': {
    id: 'shimmer-seed',
    title: 'Shimmer Seed',
    summary: 'Retrieve the glowing seed hidden in Moonroot Caves.',
  },
  'lantern-lost': {
    id: 'lantern-lost',
    title: 'Lost Lantern',
    summary: 'Return Lumen Firefly\'s lantern from the marsh.',
  },
  'twig-bridge': {
    id: 'twig-bridge',
    title: 'Bridge of Twigs',
    summary: 'Collect twig nails to repair the village bridge.',
  },
};

const DUNGEONS = {
  moonroot: {
    id: 'moonroot',
    name: 'Moonroot Caves',
    rooms: [
      {
        id: 'entry',
        title: 'Echoing Entry',
        description: 'Crystals hum softly as you step inside.',
        encounter: { type: 'dialog', speaker: 'Sable Snail', text: 'Mind the slippery glow-stones!' },
      },
      {
        id: 'glimmer',
        title: 'Glimmer Hollow',
        description: 'A wisp circles the shimmer seed.',
        encounter: { type: 'combat', enemyId: 'wisp' },
      },
      {
        id: 'seed',
        title: 'Seed Chamber',
        description: 'The shimmer seed rests in a mossy cradle.',
        encounter: { type: 'treasure', item: 'Shimmer Seed' },
      },
    ],
  },
  marsh: {
    id: 'marsh',
    name: 'Marsh of Mist',
    rooms: [
      {
        id: 'misty',
        title: 'Misty Banks',
        description: 'Fog drifts across a quiet pool.',
        encounter: { type: 'combat', enemyId: 'boglet' },
      },
      {
        id: 'lantern',
        title: 'Lantern Nook',
        description: 'A lantern glows faintly in the reeds.',
        encounter: { type: 'treasure', item: 'Lost Lantern' },
      },
      {
        id: 'mire',
        title: 'Mire Crossing',
        description: 'Roots tangle the path forward.',
        encounter: { type: 'dialog', speaker: 'Petal Beetle', text: 'Use the light to find safe stones.' },
      },
    ],
  },
  thicket: {
    id: 'thicket',
    name: 'Thicket Tower',
    rooms: [
      {
        id: 'grove',
        title: 'Bramble Grove',
        description: 'The tower rises above a knotted grove.',
        encounter: { type: 'combat', enemyId: 'mole' },
      },
      {
        id: 'ladder',
        title: 'Woven Ladder',
        description: 'Vines climb toward the canopy.',
        encounter: { type: 'dialog', speaker: 'Dapper Cricket', text: 'I\'ll lend you twig nails for the climb.' },
      },
      {
        id: 'crown',
        title: 'Canopy Crown',
        description: 'A stag-beetle guards the tower\'s crest.',
        encounter: { type: 'combat', enemyId: 'stag' },
      },
    ],
  },
};

const STORY = [
  {
    type: 'dialog',
    speaker: 'Elder Twig',
    text: 'Ah, young traveler, the forest hums with a quest. Will you answer the call? ',
    location: 'Rootport Glade',
  },
  {
    type: 'quest',
    questId: 'shimmer-seed',
    text: 'Find the shimmer seed so we can rekindle our festival lanterns.',
  },
  {
    type: 'dialog',
    speaker: 'Moss Mouse',
    text: 'I\'ll mark the path. Watch for boglets near the marsh.',
    location: 'Mossy Trail',
  },
  {
    type: 'combat',
    enemyId: 'wisp',
    text: 'A Bramble Wisp jitters from the undergrowth!',
  },
  {
    type: 'dungeon',
    dungeonId: 'moonroot',
    text: 'The Moonroot Caves breathe with crystal light.',
  },
  {
    type: 'complete',
    questId: 'shimmer-seed',
    text: 'You return the shimmer seed to Rootport.',
  },
  {
    type: 'quest',
    questId: 'lantern-lost',
    text: 'Lumen Firefly begs you to retrieve a lost lantern from the marsh.',
  },
  {
    type: 'dungeon',
    dungeonId: 'marsh',
    text: 'Mist curls around your toes as you step into the marsh.',
  },
  {
    type: 'complete',
    questId: 'lantern-lost',
    text: 'You return the lantern to Lumen Firefly.',
  },
  {
    type: 'quest',
    questId: 'twig-bridge',
    text: 'The bridge is weak. Gather twig nails from the Thicket Tower.',
  },
  {
    type: 'dungeon',
    dungeonId: 'thicket',
    text: 'The Thicket Tower awaits in the brambles.',
  },
  {
    type: 'combat',
    enemyId: 'owl',
    text: 'A Root Owl swoops down to test your courage!',
  },
  {
    type: 'complete',
    questId: 'twig-bridge',
    text: 'The bridge is repaired with the twig nails.',
  },
  {
    type: 'dialog',
    speaker: 'Honey Moth',
    text: 'The Grand Toad Sage awaits beneath the festival canopy.',
    location: 'Festival Clearing',
  },
  {
    type: 'combat',
    enemyId: 'boss',
    text: 'The Grand Toad Sage challenges you to a friendly duel!',
  },
  {
    type: 'end',
    text: 'The critter village cheers! Your adventure echoes through the forest.',
  },
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const randomRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const shuffle = (array) => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const SPRITES = {
  turtle: [
    '..GGGG..',
    '.GSSSSG.',
    '.GSSSSG.',
    '.GGGGGG.',
    '..GGGG..',
    '.G..G...',
    '.G..G...',
    '..G.G...',
  ],
  lizard: [
    '..GGG...',
    '.GPPPG..',
    '.GPPPG..',
    '.GGGGG..',
    '..G.G...',
    '.G..G...',
    '.G..G...',
    '..G.G...',
  ],
  salamander: [
    '..RRR...',
    '.RPPPR..',
    '.RPPPR..',
    '.RRRRR..',
    '..R.R...',
    '.R..R...',
    '.R..R...',
    '..R.R...',
  ],
  frog: [
    '..BBB...',
    '.BPPPB..',
    '.BPPPB..',
    '.BBBBB..',
    '..B.B...',
    '.B..B...',
    '.B..B...',
    '..B.B...',
  ],
  enemy: [
    '..EEE...',
    '.EPPPE..',
    '.EPPPE..',
    '.EEEEE..',
    '..E.E...',
    '.E..E...',
    '.E..E...',
    '..E.E...',
  ],
};

const drawSprite = (ctx, sprite, x, y, palette, scale) => {
  const key = {
    G: palette.primary,
    S: palette.shell,
    P: palette.accent,
    R: palette.primary,
    B: palette.primary,
    E: palette.primary,
  };

  sprite.forEach((row, rowIndex) => {
    row.split('').forEach((pixel, colIndex) => {
      if (pixel === '.') return;
      ctx.fillStyle = key[pixel] || palette.primary;
      ctx.fillRect(x + colIndex * scale, y + rowIndex * scale, scale, scale);
    });
  });
};

export class MinigameCritterQuest {
  constructor() {
    this.root = null;
    this.canvas = null;
    this.context = null;
    this.overlay = null;
    this.hero = null;
    this.storyIndex = 0;
    this.location = 'Rootport Glade';
    this.day = 1;
    this.mode = 'story';
    this.dialogue = [];
    this.log = [];
    this.quests = new Map();
    this.inventory = new Map([
      ['Berry Brew', 2],
      ['Glow Pebble', 1],
    ]);
    this.enemy = null;
    this.enemyStatus = {};
    this.isCombatLocked = false;
    this.currentDungeon = null;
    this.dungeonRoomIndex = 0;
    this.boundActionClick = (event) => this.handleActionClick(event);
  }

  mount(container) {
    if (!container) return;
    this.unmount();

    this.root = document.createElement('div');
    this.root.className = 'minigame-quest';
    this.root.innerHTML = `
      <div class="minigame-quest__overlay" data-role="hero-select">
        <div class="quest-select">
          <h4>Choose Your Critter</h4>
          <p>Every great adventure begins with a brave little critter.</p>
          <div class="quest-select__grid" data-role="hero-options"></div>
        </div>
      </div>
      <header class="minigame-quest__header">
        <div class="quest-title">Critter Quest</div>
        <div class="quest-meta">
          <span data-role="location"></span>
          <span data-role="day"></span>
        </div>
      </header>
      <div class="minigame-quest__main">
        <div class="minigame-quest__scene">
          <canvas class="quest-canvas" width="256" height="160"></canvas>
          <div class="quest-scene__label" data-role="scene-label"></div>
        </div>
        <aside class="minigame-quest__side">
          <section class="quest-card" data-role="hero-card"></section>
          <section class="quest-card" data-role="inventory"></section>
          <section class="quest-card" data-role="quests"></section>
        </aside>
      </div>
      <div class="minigame-quest__log">
        <div class="quest-dialogue" data-role="dialogue"></div>
        <div class="quest-actions" data-role="actions"></div>
      </div>
    `;

    container.innerHTML = '';
    container.appendChild(this.root);

    this.canvas = this.root.querySelector('.quest-canvas');
    this.context = this.canvas.getContext('2d');
    this.context.imageSmoothingEnabled = false;
    this.overlay = this.root.querySelector('[data-role="hero-select"]');

    this.root.addEventListener('click', this.boundActionClick);

    this.renderHeroOptions();
    this.renderHeader();
    this.renderSidePanels();
    this.renderDialogue('Select a hero to begin your adventure.');
    this.drawScene();
  }

  unmount() {
    if (!this.root) return;
    this.root.removeEventListener('click', this.boundActionClick);
    this.root.remove();
    this.root = null;
    this.canvas = null;
    this.context = null;
    this.overlay = null;
    this.hero = null;
    this.storyIndex = 0;
    this.location = 'Rootport Glade';
    this.day = 1;
    this.mode = 'story';
    this.dialogue = [];
    this.log = [];
    this.quests.clear();
    this.inventory = new Map([
      ['Berry Brew', 2],
      ['Glow Pebble', 1],
    ]);
    this.enemy = null;
    this.enemyStatus = {};
    this.isCombatLocked = false;
    this.currentDungeon = null;
    this.dungeonRoomIndex = 0;
  }

  renderHeroOptions() {
    const options = this.root.querySelector('[data-role="hero-options"]');
    if (!options) return;
    options.innerHTML = '';
    HEROES.forEach((hero) => {
      const card = document.createElement('button');
      card.className = 'quest-hero-card';
      card.type = 'button';
      card.dataset.action = 'choose-hero';
      card.dataset.heroId = hero.id;

      const canvas = document.createElement('canvas');
      canvas.className = 'quest-hero-card__sprite';
      canvas.width = 48;
      canvas.height = 48;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        const sprite = SPRITES[hero.id] || SPRITES.turtle;
        drawSprite(ctx, sprite, 8, 6, hero.palette, 4);
      }

      const info = document.createElement('div');
      info.className = 'quest-hero-card__info';
      info.innerHTML = `
        <strong>${hero.name}</strong>
        <span>${hero.title}</span>
      `;

      card.appendChild(canvas);
      card.appendChild(info);
      options.appendChild(card);
    });
  }

  startAdventure(heroId) {
    this.hero = this.createHero(heroId);
    this.overlay?.classList.add('is-hidden');
    this.storyIndex = 0;
    this.mode = 'story';
    this.log = [];
    this.renderSidePanels();
    this.advanceStory();
  }

  createHero(heroId) {
    const base = HEROES.find((entry) => entry.id === heroId) || HEROES[0];
    return {
      ...base,
      currentHp: base.stats.hp,
      currentEnergy: base.stats.energy,
      guard: 0,
    };
  }

  renderHeader() {
    const locationEl = this.root.querySelector('[data-role="location"]');
    const dayEl = this.root.querySelector('[data-role="day"]');
    if (locationEl) locationEl.textContent = this.location;
    if (dayEl) dayEl.textContent = `Day ${this.day}`;
  }

  renderSidePanels() {
    this.renderHeroCard();
    this.renderInventory();
    this.renderQuests();
  }

  renderHeroCard() {
    const heroCard = this.root?.querySelector('[data-role="hero-card"]');
    if (!heroCard) return;
    if (!this.hero) {
      heroCard.innerHTML = '<h5>Hero</h5><p>Select a critter to view stats.</p>';
      return;
    }

    heroCard.innerHTML = `
      <h5>${this.hero.name}</h5>
      <p class="quest-subtitle">${this.hero.title}</p>
      <div class="quest-stat-list">
        <div><span>HP</span><strong>${this.hero.currentHp} / ${this.hero.stats.hp}</strong></div>
        <div><span>Energy</span><strong>${this.hero.currentEnergy} / ${this.hero.stats.energy}</strong></div>
        <div><span>Power</span><strong>${this.hero.stats.power}</strong></div>
        <div><span>Defense</span><strong>${this.hero.stats.defense}</strong></div>
      </div>
      <div class="quest-skill">
        <div>${this.hero.skill.name}</div>
        <span>${this.hero.skill.description}</span>
      </div>
    `;
  }

  renderInventory() {
    const inventoryEl = this.root?.querySelector('[data-role="inventory"]');
    if (!inventoryEl) return;
    const items = Array.from(this.inventory.entries());
    const list = items
      .map(([name, qty]) => `<li><span>${name}</span><strong>x${qty}</strong></li>`)
      .join('');

    inventoryEl.innerHTML = `
      <h5>Satchel</h5>
      <ul class="quest-list">${list || '<li>Empty</li>'}</ul>
    `;
  }

  renderQuests() {
    const questsEl = this.root?.querySelector('[data-role="quests"]');
    if (!questsEl) return;
    if (this.quests.size === 0) {
      questsEl.innerHTML = '<h5>Quests</h5><p>No quests yet.</p>';
      return;
    }
    const list = Array.from(this.quests.values())
      .map(
        (quest) => `
        <li class="${quest.status}">
          <span>${quest.title}</span>
          <small>${quest.summary}</small>
        </li>
      `
      )
      .join('');
    questsEl.innerHTML = `
      <h5>Quests</h5>
      <ul class="quest-list">${list}</ul>
    `;
  }

  renderDialogue(text, speaker = null) {
    const dialogueEl = this.root?.querySelector('[data-role="dialogue"]');
    if (!dialogueEl) return;
    const prefix = speaker ? `<strong>${speaker}:</strong> ` : '';
    const logLines = this.log.map((line) => `<div class="quest-log-line">${line}</div>`).join('');
    dialogueEl.innerHTML = `
      <div class="quest-dialogue__text">${prefix}${text}</div>
      <div class="quest-log">${logLines}</div>
    `;
  }

  renderActions(actions) {
    const actionsEl = this.root?.querySelector('[data-role="actions"]');
    if (!actionsEl) return;
    actionsEl.innerHTML = '';
    actions.forEach((action) => {
      const button = document.createElement('button');
      button.className = 'quest-action-btn';
      button.type = 'button';
      button.dataset.action = action.id;
      button.textContent = action.label;
      if (action.disabled) {
        button.disabled = true;
      }
      actionsEl.appendChild(button);
    });
  }

  appendLog(text) {
    this.log.push(text);
    if (this.log.length > 4) {
      this.log.shift();
    }
  }

  advanceStory() {
    if (!this.hero) return;

    const node = STORY[this.storyIndex];
    if (!node) {
      this.renderDialogue('The forest hums. More stories await.', 'Narrator');
      this.renderActions([{ id: 'restart', label: 'Restart Adventure' }]);
      this.mode = 'end';
      this.drawScene();
      return;
    }

    if (node.location) {
      this.location = node.location;
      this.day += 1;
    }

    this.renderHeader();

    switch (node.type) {
      case 'dialog':
        this.mode = 'story';
        this.appendLog(`${node.speaker} shared news.`);
        this.renderDialogue(node.text, node.speaker);
        this.renderActions([{ id: 'next', label: 'Continue' }]);
        this.storyIndex += 1;
        this.drawScene();
        break;
      case 'quest':
        this.mode = 'story';
        this.addQuest(node.questId);
        this.appendLog(`Quest started: ${QUESTS[node.questId].title}.`);
        this.renderDialogue(node.text, 'Quest Board');
        this.renderActions([{ id: 'next', label: 'Accept Quest' }]);
        this.storyIndex += 1;
        this.drawScene();
        break;
      case 'complete':
        this.mode = 'story';
        this.completeQuest(node.questId);
        this.appendLog(`Quest complete: ${QUESTS[node.questId].title}.`);
        this.renderDialogue(node.text, 'Narrator');
        this.renderActions([{ id: 'next', label: 'Celebrate' }]);
        this.storyIndex += 1;
        this.drawScene();
        break;
      case 'combat':
        this.mode = 'combat';
        this.beginCombat(node.enemyId, node.text);
        this.storyIndex += 1;
        break;
      case 'dungeon':
        this.mode = 'dungeon';
        this.beginDungeon(node.dungeonId, node.text);
        this.storyIndex += 1;
        break;
      case 'end':
        this.mode = 'end';
        this.renderDialogue(node.text, 'Narrator');
        this.renderActions([{ id: 'restart', label: 'Play Again' }]);
        this.drawScene('festival');
        this.storyIndex += 1;
        break;
      default:
        this.storyIndex += 1;
        this.advanceStory();
    }

    this.renderSidePanels();
  }

  addQuest(questId) {
    const quest = QUESTS[questId];
    if (!quest) return;
    this.quests.set(questId, { ...quest, status: 'active' });
  }

  completeQuest(questId) {
    const quest = this.quests.get(questId);
    if (!quest) return;
    quest.status = 'complete';
    this.quests.set(questId, quest);
  }

  beginDungeon(dungeonId, introText) {
    const dungeon = DUNGEONS[dungeonId];
    if (!dungeon) {
      this.advanceStory();
      return;
    }
    this.currentDungeon = dungeon;
    this.dungeonRoomIndex = 0;
    this.renderDialogue(introText, 'Narrator');
    this.renderActions([{ id: 'explore', label: 'Explore Room' }]);
    this.drawScene('cave');
  }

  exploreDungeon() {
    if (!this.currentDungeon) {
      this.advanceStory();
      return;
    }

    const room = this.currentDungeon.rooms[this.dungeonRoomIndex];
    if (!room) {
      this.currentDungeon = null;
      this.renderDialogue('You step back into the sunlight.', 'Narrator');
      this.renderActions([{ id: 'next', label: 'Continue' }]);
      this.drawScene();
      return;
    }

    this.renderDialogue(`${room.title}: ${room.description}`, this.currentDungeon.name);
    const encounter = room.encounter;

    if (encounter?.type === 'combat') {
      this.beginCombat(encounter.enemyId, `A ${ENEMIES[encounter.enemyId].name} appears!`);
      this.dungeonRoomIndex += 1;
      return;
    }

    if (encounter?.type === 'dialog') {
      this.appendLog(`${encounter.speaker} offered advice.`);
      this.renderDialogue(encounter.text, encounter.speaker);
      this.renderActions([{ id: 'explore', label: 'Explore Next' }]);
      this.dungeonRoomIndex += 1;
      this.drawScene();
      return;
    }

    if (encounter?.type === 'treasure') {
      this.addItem(encounter.item, 1);
      this.appendLog(`Found ${encounter.item}.`);
      this.renderDialogue(`You found ${encounter.item}!`, 'Narrator');
      this.renderActions([{ id: 'explore', label: 'Keep Going' }]);
      this.dungeonRoomIndex += 1;
      this.drawScene();
      return;
    }

    this.dungeonRoomIndex += 1;
    this.renderActions([{ id: 'explore', label: 'Explore Next' }]);
    this.drawScene();
  }

  beginCombat(enemyId, introText) {
    const enemy = ENEMIES[enemyId];
    if (!enemy) {
      this.advanceStory();
      return;
    }

    this.enemy = {
      ...enemy,
      currentHp: enemy.stats.hp,
      guard: 0,
    };
    this.enemyStatus = { burn: 0, stun: 0 };
    this.isCombatLocked = false;
    this.renderDialogue(introText, enemy.name);
    this.renderCombatActions();
    this.drawScene('battle');
  }

  renderCombatActions() {
    const canSkill = this.hero.currentEnergy >= this.hero.skill.cost;
    const canItem = (this.inventory.get('Berry Brew') || 0) > 0;
    this.renderActions([
      { id: 'attack', label: 'Attack' },
      { id: 'skill', label: this.hero.skill.name, disabled: !canSkill },
      { id: 'guard', label: 'Guard' },
      { id: 'item', label: 'Berry Brew', disabled: !canItem },
      { id: 'run', label: 'Run' },
    ]);
  }

  resolveCombat(action) {
    if (this.isCombatLocked) return;
    if (!this.hero || !this.enemy) return;
    this.isCombatLocked = true;

    const outcome = this.performHeroAction(action);
    if (outcome === 'escaped') {
      this.endCombat(true);
      return;
    }

    if (this.enemy.currentHp <= 0) {
      this.endCombat(false);
      return;
    }

    if (this.enemyStatus.burn > 0) {
      const burnDamage = 4 + randomRange(0, 2);
      this.enemy.currentHp = clamp(this.enemy.currentHp - burnDamage, 0, this.enemy.stats.hp);
      this.appendLog(`${this.enemy.name} takes ${burnDamage} burn damage.`);
      this.enemyStatus.burn -= 1;
      if (this.enemy.currentHp <= 0) {
        this.endCombat(false);
        return;
      }
    }

    if (this.enemyStatus.stun > 0) {
      this.enemyStatus.stun -= 1;
      this.appendLog(`${this.enemy.name} is stunned and misses a turn.`);
      this.finishCombatRound();
      return;
    }

    this.enemyTurn();
    if (this.hero.currentHp <= 0) {
      this.gameOver();
      return;
    }
    this.finishCombatRound();
  }

  finishCombatRound() {
    this.isCombatLocked = false;
    this.hero.currentEnergy = clamp(this.hero.currentEnergy + 1, 0, this.hero.stats.energy);
    this.hero.guard = 0;
    this.renderHeroCard();
    this.renderCombatActions();
  }

  performHeroAction(action) {
    switch (action) {
      case 'attack':
        this.attackEnemy();
        return 'continue';
      case 'skill':
        this.useSkill();
        return 'continue';
      case 'guard':
        this.guard();
        return 'continue';
      case 'item':
        this.useItem();
        return 'continue';
      case 'run':
        return this.tryRun();
      default:
        return 'continue';
    }
  }

  attackEnemy() {
    const baseDamage = this.hero.stats.power + randomRange(2, 6);
    const reduced = Math.max(3, baseDamage - this.enemy.stats.defense);
    this.enemy.currentHp = clamp(this.enemy.currentHp - reduced, 0, this.enemy.stats.hp);
    this.appendLog(`${this.hero.name} attacks for ${reduced} damage.`);
    this.updateCombatDialogue();
  }

  useSkill() {
    if (this.hero.currentEnergy < this.hero.skill.cost) {
      this.appendLog('Not enough energy.');
      return;
    }
    this.hero.currentEnergy -= this.hero.skill.cost;

    if (this.hero.id === 'turtle') {
      const damage = this.hero.stats.power + randomRange(4, 8);
      this.enemy.currentHp = clamp(this.enemy.currentHp - damage, 0, this.enemy.stats.hp);
      this.hero.guard = 0.4;
      this.appendLog(`Shell Spin deals ${damage} damage and raises guard.`);
    } else if (this.hero.id === 'lizard') {
      const damage = this.hero.stats.power + randomRange(5, 9);
      this.enemy.currentHp = clamp(this.enemy.currentHp - damage, 0, this.enemy.stats.hp);
      this.enemyStatus.burn = 2;
      this.appendLog(`Sunflare scorches for ${damage} damage.`);
    } else if (this.hero.id === 'salamander') {
      const hits = 2 + randomRange(0, 1);
      let total = 0;
      for (let i = 0; i < hits; i += 1) {
        total += Math.max(2, this.hero.stats.power + randomRange(1, 4) - this.enemy.stats.defense);
      }
      this.enemy.currentHp = clamp(this.enemy.currentHp - total, 0, this.enemy.stats.hp);
      this.appendLog(`Ember Rush hits ${hits} times for ${total} damage.`);
    } else if (this.hero.id === 'frog') {
      const damage = this.hero.stats.power + randomRange(3, 7);
      this.enemy.currentHp = clamp(this.enemy.currentHp - damage, 0, this.enemy.stats.hp);
      this.enemyStatus.stun = Math.random() < 0.35 ? 1 : 0;
      this.appendLog(`Tongue Snap deals ${damage} damage.`);
      if (this.enemyStatus.stun) {
        this.appendLog(`${this.enemy.name} is stunned!`);
      }
    }

    this.updateCombatDialogue();
  }

  guard() {
    this.hero.guard = 0.5;
    this.appendLog(`${this.hero.name} braces for impact.`);
    this.updateCombatDialogue();
  }

  useItem() {
    const count = this.inventory.get('Berry Brew') || 0;
    if (count <= 0) {
      this.appendLog('No Berry Brew left.');
      return;
    }
    this.inventory.set('Berry Brew', count - 1);
    const heal = 28;
    this.hero.currentHp = clamp(this.hero.currentHp + heal, 0, this.hero.stats.hp);
    this.appendLog(`${this.hero.name} sips Berry Brew and heals ${heal} HP.`);
    this.renderInventory();
    this.updateCombatDialogue();
  }

  tryRun() {
    if (Math.random() < 0.4) {
      this.appendLog(`${this.hero.name} dashes away safely.`);
      return 'escaped';
    }
    this.appendLog('Escape failed!');
    return 'continue';
  }

  enemyTurn() {
    const baseDamage = this.enemy.stats.power + randomRange(1, 5);
    const reduced = Math.max(2, baseDamage - this.hero.stats.defense);
    const guardMultiplier = this.hero.guard ? 1 - this.hero.guard : 1;
    const finalDamage = Math.max(1, Math.floor(reduced * guardMultiplier));
    this.hero.currentHp = clamp(this.hero.currentHp - finalDamage, 0, this.hero.stats.hp);
    const move = shuffle(['swipes', 'lunges', 'kicks', 'whirls'])[0];
    this.appendLog(`${this.enemy.name} ${move} for ${finalDamage} damage.`);
    this.updateCombatDialogue();
  }

  endCombat(escaped) {
    if (escaped) {
      this.renderDialogue('You slip back into the tall grass.', 'Narrator');
    } else {
      this.renderDialogue(`${this.enemy.name} has been calmed!`, 'Narrator');
      this.addItem('Berry Brew', 1);
    }

    this.enemy = null;
    this.enemyStatus = {};
    this.isCombatLocked = false;
    this.renderSidePanels();
    this.renderActions([{ id: 'next', label: 'Continue' }]);
    this.drawScene();
  }

  updateCombatDialogue() {
    if (!this.enemy) return;
    this.renderDialogue(
      `${this.enemy.name} HP ${this.enemy.currentHp}/${this.enemy.stats.hp} · ${this.hero.name} HP ${this.hero.currentHp}/${this.hero.stats.hp}`,
      'Battle'
    );
    this.renderHeroCard();
  }

  addItem(item, qty) {
    const current = this.inventory.get(item) || 0;
    this.inventory.set(item, current + qty);
    this.renderInventory();
  }

  gameOver() {
    this.mode = 'gameover';
    this.renderDialogue('Your critter rests. The forest will wait for you.', 'Narrator');
    this.renderActions([{ id: 'restart', label: 'Try Again' }]);
    this.drawScene('night');
  }

  handleActionClick(event) {
    const source = event.target instanceof Element ? event.target : null;
    const target = source?.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;

    if (action === 'choose-hero') {
      this.startAdventure(target.dataset.heroId);
      return;
    }

    if (action === 'restart') {
      this.startAdventure(this.hero?.id || HEROES[0].id);
      return;
    }

    if (!this.hero) return;

    if (this.mode === 'combat') {
      this.resolveCombat(action);
      return;
    }

    if (action === 'explore') {
      this.exploreDungeon();
      return;
    }

    if (action === 'next') {
      this.advanceStory();
    }
  }

  drawScene(theme = 'forest') {
    if (!this.context) return;
    const ctx = this.context;
    const width = this.canvas.width;
    const height = this.canvas.height;
    ctx.clearRect(0, 0, width, height);

    const themeColors = {
      forest: ['#1b3d2a', '#2f6a41', '#5f9c6c'],
      cave: ['#181c27', '#2d3142', '#4b5166'],
      battle: ['#3a2236', '#5b2c4b', '#8a4c64'],
      night: ['#0e1320', '#1c2638', '#2c3f52'],
      festival: ['#2f4f2f', '#5f8f3a', '#f0d36a'],
    };

    const palette = themeColors[theme] || themeColors.forest;
    ctx.fillStyle = palette[0];
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = palette[1];
    for (let i = 0; i < width; i += 16) {
      ctx.fillRect(i, height - 40, 12, 40);
    }
    ctx.fillStyle = palette[2];
    for (let i = 0; i < width; i += 20) {
      ctx.fillRect(i + 4, height - 64, 8, 24);
    }

    if (this.hero) {
      const sprite = SPRITES[this.hero.id] || SPRITES.turtle;
      drawSprite(ctx, sprite, 24, 72, this.hero.palette, 6);
    }

    if (this.enemy) {
      const sprite = SPRITES.enemy;
      drawSprite(ctx, sprite, 160, 72, this.enemy.palette, 6);
    }

    const label = this.root?.querySelector('[data-role="scene-label"]');
    if (label) {
      if (this.mode === 'combat' && this.enemy) {
        label.textContent = `${this.enemy.name}`;
      } else if (this.currentDungeon) {
        label.textContent = this.currentDungeon.name;
      } else {
        label.textContent = this.location;
      }
    }
  }
}
