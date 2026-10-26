import { critterCards, TYPE_ADVANTAGES } from '../../data/cardGame/index.js';

const BOARD_SIZE = 5;
const STARTING_HAND_SIZE = 4;
const MAX_HAND_SIZE = 8;
const PLAYER_HEALTH = 24;
const RENDER_MODE_KEY = 'critz-card-game-render-mode';

const TYPE_ICONS = {
  Normal: 'N',
  Fire: 'Fi',
  Water: 'Wa',
  Grass: 'Gr',
  Poison: 'Po',
  Ice: 'Ic',
  Steel: 'St',
  Ground: 'Gd',
  Lightning: 'Lt',
  Flying: 'Fl',
  Fighting: 'Fg',
  Dark: 'Dk',
  Psychic: 'Ps',
  Sound: 'So',
};

const STARTER_DECK_IDS = [
  1, 2, 3, 4, 5, 8, 10, 11, 13, 16, 18, 20, 23, 27, 31, 36, 48, 49, 52, 57,
];

const ENEMY_DECK_IDS = [
  37, 40, 47, 50, 53, 54, 55, 56, 58, 60, 62, 63, 64, 65, 66, 78, 82, 88, 92, 95,
];

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (char) => {
    const replacements = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return replacements[char];
  });

const normalize = (value) => String(value ?? '').trim().toLowerCase();

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const shuffle = (items) => {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
};

const toRarityClass = (rarity) => `rarity-${normalize(rarity).replace(/\s+/g, '-')}`;

const getFirstNumber = (text, fallback = 0) => {
  const match = String(text ?? '').match(/\b(\d+)\b/);
  return match ? Number(match[1]) : fallback;
};

const parseHits = (text, fallback = 1) => {
  if (/twice/i.test(text)) return 2;
  if (/three times/i.test(text)) return 3;
  const match = String(text ?? '').match(/(\d+)\s+times/i);
  return match ? Number(match[1]) : fallback;
};

const parseDamageTypes = (text, fallbackTypes = ['Normal']) => {
  const match = String(text ?? '').match(
    /Deal\s+(?:damage equal to [^.]+?|\d+)\s*([A-Z][A-Za-z]*(?:\/[A-Z][A-Za-z]*)?)?\s+damage/i
  );

  if (!match || !match[1]) {
    return fallbackTypes.length ? fallbackTypes : ['Normal'];
  }

  return match[1]
    .split('/')
    .map((type) => type.trim())
    .filter(Boolean);
};

export class MinigameCardGame {
  constructor() {
    this.root = null;
    this.state = null;
    this.cardMap = new Map(critterCards.map((card) => [card.id, card]));
    this.instanceCount = 0;
    this.boundClick = (event) => this.handleClick(event);
    this.boundInput = (event) => this.handleInput(event);
  }

  mount(container) {
    if (!container) return;
    this.unmount();

    if (!this.state) {
      this.state = this.createInitialState();
    }

    this.root = document.createElement('div');
    this.root.className = 'card-game';
    this.root.addEventListener('click', this.boundClick);
    this.root.addEventListener('input', this.boundInput);

    container.innerHTML = '';
    container.appendChild(this.root);
    this.render();
  }

  unmount() {
    if (this.root) {
      this.root.removeEventListener('click', this.boundClick);
      this.root.removeEventListener('input', this.boundInput);
      this.root.remove();
    }
    this.root = null;
  }

  createInitialState() {
    const storedMode = window.localStorage?.getItem(RENDER_MODE_KEY);
    const starterDeck = STARTER_DECK_IDS.filter((id) => this.cardMap.has(id));

    return {
      view: 'title',
      renderMode: storedMode === 'generated' ? 'generated' : 'png',
      collectionSearch: '',
      detailCardId: starterDeck[0] || critterCards[0]?.id || null,
      deckIds: starterDeck,
      battle: null,
    };
  }

  handleClick(event) {
    const actionElement = event.target.closest('[data-action]');
    if (!actionElement || !this.root?.contains(actionElement) || actionElement.disabled) {
      return;
    }

    const { action } = actionElement.dataset;

    if (action === 'set-render-mode') {
      this.setRenderMode(actionElement.dataset.mode);
      return;
    }

    if (action === 'set-view') {
      this.setView(actionElement.dataset.view);
      return;
    }

    if (action === 'start-battle') {
      this.startNewBattle();
      return;
    }

    if (action === 'inspect-card') {
      this.inspectCard(Number(actionElement.dataset.cardId));
      return;
    }

    if (action === 'add-card') {
      this.addCardToDeck(Number(actionElement.dataset.cardId));
      return;
    }

    if (action === 'remove-card') {
      this.removeCardFromDeck(Number(actionElement.dataset.cardId));
      return;
    }

    if (action === 'auto-deck') {
      this.state.deckIds = STARTER_DECK_IDS.filter((id) => this.cardMap.has(id));
      this.render();
      return;
    }

    if (action === 'clear-deck') {
      this.state.deckIds = [];
      this.render();
      return;
    }

    if (action === 'play-hand') {
      this.playHandCard(Number(actionElement.dataset.handIndex));
      return;
    }

    if (action === 'select-board') {
      this.selectBoardUnit(actionElement.dataset.side, Number(actionElement.dataset.boardIndex));
      return;
    }

    if (action === 'use-weapon' || action === 'use-ability' || action === 'defend') {
      const kind = action === 'use-weapon' ? 'weapon' : action === 'use-ability' ? 'ability' : 'defend';
      this.performSelectedPlayerAction(kind);
      return;
    }

    if (action === 'end-turn') {
      this.endPlayerTurn();
    }
  }

  handleInput(event) {
    const input = event.target.closest('[data-action="search-collection"]');
    if (!input) return;
    this.state.collectionSearch = input.value;
    this.render();
  }

  setRenderMode(mode) {
    this.state.renderMode = mode === 'generated' ? 'generated' : 'png';
    window.localStorage?.setItem(RENDER_MODE_KEY, this.state.renderMode);
    this.render();
  }

  setView(view) {
    this.state.view = view || 'title';
    if (this.state.view === 'battle' && !this.state.battle) {
      this.startNewBattle({ render: false });
    }
    this.render();
  }

  inspectCard(cardId) {
    if (!this.cardMap.has(cardId)) return;
    this.state.detailCardId = cardId;
    this.state.view = 'detail';
    this.render();
  }

  addCardToDeck(cardId) {
    if (!this.cardMap.has(cardId)) return;
    if (this.state.deckIds.includes(cardId) || this.state.deckIds.length >= 24) return;
    this.state.deckIds = [...this.state.deckIds, cardId];
    this.render();
  }

  removeCardFromDeck(cardId) {
    const index = this.state.deckIds.indexOf(cardId);
    if (index < 0) return;
    this.state.deckIds = this.state.deckIds.filter((_, cardIndex) => cardIndex !== index);
    this.render();
  }

  startNewBattle({ render = true } = {}) {
    const playerDeckIds = this.state.deckIds.length >= 10 ? this.state.deckIds : STARTER_DECK_IDS;
    const enemyDeckIds = ENEMY_DECK_IDS.filter((id) => this.cardMap.has(id));

    this.state.battle = {
      turn: 'player',
      turnNumber: 1,
      selectedBoardIndex: null,
      playedCardThisTurn: false,
      winner: null,
      log: ['The critter duel begins.'],
      player: this.createParticipant('You', PLAYER_HEALTH, playerDeckIds),
      enemy: this.createParticipant('Rootport Rival', PLAYER_HEALTH, enemyDeckIds),
    };

    this.drawCards('player', STARTING_HAND_SIZE, { silent: true });
    this.drawCards('enemy', STARTING_HAND_SIZE, { silent: true });
    this.setupEnemyOpeningBoard();
    this.drawCards('player', 1);

    this.state.view = 'battle';
    if (render) {
      this.render();
    }
  }

  createParticipant(name, health, deckIds) {
    const validDeckIds = deckIds.filter((id) => this.cardMap.has(id));
    return {
      name,
      health,
      maxHealth: health,
      deck: shuffle(validDeckIds),
      hand: [],
      board: Array.from({ length: BOARD_SIZE }, () => null),
      discard: [],
      fatigue: 0,
    };
  }

  setupEnemyOpeningBoard() {
    const battle = this.state.battle;
    if (!battle) return;

    [1, 2, 3].forEach((slotIndex) => {
      const cardId = battle.enemy.hand.shift();
      if (cardId) {
        battle.enemy.board[slotIndex] = this.createUnit(cardId);
      }
    });
  }

  createUnit(cardId) {
    const card = this.cardMap.get(cardId);
    return {
      id: `${card.slug}-${this.instanceCount += 1}`,
      cardId,
      currentHp: card.hp,
      hasActed: false,
      defenseBonus: 0,
      attackBuff: 0,
      attackDebuff: 0,
      status: {
        concealed: false,
        dodge: false,
        sleep: 0,
        poisonDamage: 0,
        poisonTurns: 0,
      },
    };
  }

  getCard(unitOrId) {
    const cardId = typeof unitOrId === 'object' ? unitOrId.cardId : unitOrId;
    return this.cardMap.get(cardId) || null;
  }

  getParticipant(side) {
    return this.state.battle?.[side] || null;
  }

  getOpponentSide(side) {
    return side === 'player' ? 'enemy' : 'player';
  }

  drawCards(side, count = 1, { silent = false } = {}) {
    const participant = this.getParticipant(side);
    if (!participant) return;

    for (let index = 0; index < count; index += 1) {
      if (participant.deck.length === 0) {
        participant.fatigue += 1;
        participant.health = Math.max(0, participant.health - participant.fatigue);
        this.addLog(`${participant.name} takes ${participant.fatigue} fatigue damage.`);
        this.checkWinner();
        continue;
      }

      const cardId = participant.deck.shift();
      if (participant.hand.length >= MAX_HAND_SIZE) {
        participant.discard.push(cardId);
        if (!silent) this.addLog(`${participant.name}'s hand is full. A card was discarded.`);
      } else {
        participant.hand.push(cardId);
        if (!silent && side === 'player') {
          this.addLog(`You draw ${this.getCard(cardId)?.name || 'a card'}.`);
        }
      }
    }
  }

  playHandCard(handIndex) {
    const battle = this.state.battle;
    if (!battle || battle.turn !== 'player' || battle.winner) return;
    if (battle.playedCardThisTurn) {
      this.addLog('Only one Critter can enter the board each turn.');
      this.render();
      return;
    }

    const emptyIndex = battle.player.board.findIndex((unit) => !unit);
    if (emptyIndex < 0) {
      this.addLog('Your board is full.');
      this.render();
      return;
    }

    const cardId = battle.player.hand[handIndex];
    if (!cardId) return;

    battle.player.hand.splice(handIndex, 1);
    battle.player.board[emptyIndex] = this.createUnit(cardId);
    battle.playedCardThisTurn = true;
    this.addLog(`${this.getCard(cardId).name} enters lane ${emptyIndex + 1}.`);
    this.render();
  }

  selectBoardUnit(side, boardIndex) {
    const battle = this.state.battle;
    if (!battle || side !== 'player' || battle.turn !== 'player') return;
    if (!battle.player.board[boardIndex]) return;
    battle.selectedBoardIndex = boardIndex;
    this.render();
  }

  performSelectedPlayerAction(kind) {
    const battle = this.state.battle;
    if (!battle || battle.turn !== 'player' || battle.winner) return;
    if (battle.selectedBoardIndex === null || battle.selectedBoardIndex === undefined) {
      this.addLog('Choose one of your board Critters first.');
      this.render();
      return;
    }

    this.performUnitAction('player', battle.selectedBoardIndex, kind);
    this.render();
  }

  endPlayerTurn() {
    const battle = this.state.battle;
    if (!battle || battle.turn !== 'player' || battle.winner) return;

    battle.turn = 'enemy';
    battle.selectedBoardIndex = null;
    this.addLog('The rival takes a turn.');
    this.runEnemyTurn();
    this.render();
  }

  runEnemyTurn() {
    const battle = this.state.battle;
    if (!battle || battle.winner) return;

    this.beginTurn('enemy');
    if (battle.winner) return;
    this.drawCards('enemy', 1, { silent: true });

    this.enemyPlayCard();

    battle.enemy.board.forEach((unit, index) => {
      if (!unit || battle.winner) return;
      this.performUnitAction('enemy', index, 'weapon', { render: false });
    });

    if (battle.winner) return;

    battle.turnNumber += 1;
    battle.turn = 'player';
    battle.playedCardThisTurn = false;
    this.beginTurn('player');
    this.drawCards('player', 1);
    this.addLog(`Turn ${battle.turnNumber}: your move.`);
  }

  beginTurn(side) {
    const participant = this.getParticipant(side);
    if (!participant) return;

    participant.board.forEach((unit, index) => {
      if (!unit) return;
      unit.hasActed = false;
      unit.defenseBonus = 0;
      unit.attackDebuff = 0;
      unit.status.concealed = false;

      if (unit.status.poisonTurns > 0 && unit.status.poisonDamage > 0) {
        const card = this.getCard(unit);
        unit.currentHp -= unit.status.poisonDamage;
        unit.status.poisonTurns -= 1;
        this.addLog(`${card.name} takes ${unit.status.poisonDamage} poison damage.`);
        if (unit.currentHp <= 0) {
          this.defeatUnit(side, index);
        }
      }
    });
  }

  enemyPlayCard() {
    const battle = this.state.battle;
    const emptyIndex = battle.enemy.board.findIndex((unit) => !unit);
    if (emptyIndex < 0 || battle.enemy.hand.length === 0) return;

    const cardId = battle.enemy.hand.shift();
    battle.enemy.board[emptyIndex] = this.createUnit(cardId);
    this.addLog(`${battle.enemy.name} plays ${this.getCard(cardId).name}.`);
  }

  performUnitAction(side, boardIndex, kind) {
    const battle = this.state.battle;
    const participant = this.getParticipant(side);
    const unit = participant?.board[boardIndex];
    if (!battle || !participant || !unit || battle.winner) return;

    const card = this.getCard(unit);
    if (unit.hasActed) {
      if (side === 'player') this.addLog(`${card.name} has already acted.`);
      return;
    }

    if (unit.status.sleep > 0) {
      unit.status.sleep = 0;
      unit.hasActed = true;
      this.addLog(`${card.name} wakes up and misses the action.`);
      return;
    }

    if (kind === 'defend') {
      unit.defenseBonus += 1;
      unit.hasActed = true;
      this.addLog(`${card.name} defends and gains +1 Defense.`);
      return;
    }

    if (kind === 'ability') {
      this.resolveAbility(side, boardIndex);
      unit.hasActed = true;
      this.checkWinner();
      return;
    }

    this.resolveWeaponAttack(side, boardIndex);
    unit.hasActed = true;
    this.checkWinner();
  }

  resolveWeaponAttack(side, boardIndex) {
    const unit = this.getParticipant(side).board[boardIndex];
    const card = this.getCard(unit);
    const weapon = card.weapon || {};
    const amount = Number(weapon.damage || card.attack || 1);
    const damageTypes = [weapon.damageType || 'Normal'];
    const hits = Number(weapon.hits || 1);
    const targetSide = this.getOpponentSide(side);
    const target = this.getParticipant(targetSide).board[boardIndex];

    if (!target) {
      const totalDamage = amount * hits;
      this.applyDamageToHero(targetSide, totalDamage, `${card.name}'s ${weapon.name || 'attack'}`);
      unit.hasActed = true;
      return;
    }

    if (target.status.concealed && !damageTypes.includes('Sound')) {
      this.addLog(`${this.getCard(target).name} is concealed and evades ${card.name}.`);
      return;
    }

    for (let hit = 0; hit < hits; hit += 1) {
      this.applyDamageToUnit(targetSide, boardIndex, amount, {
        sourceName: `${card.name}'s ${weapon.name || 'attack'}`,
        damageTypes,
      });
      if (!this.getParticipant(targetSide).board[boardIndex]) break;
    }

    const remainingTarget = this.getParticipant(targetSide).board[boardIndex];
    const remainingAttacker = this.getParticipant(side).board[boardIndex];
    if (remainingTarget && remainingAttacker) {
      const targetCard = this.getCard(remainingTarget);
      const retaliation = this.getUnitAttack(remainingTarget);
      this.applyDamageToUnit(side, boardIndex, retaliation, {
        sourceName: `${targetCard.name}'s retaliation`,
        damageTypes: [targetCard.weapon?.damageType || 'Normal'],
      });
    }
  }

  resolveAbility(side, boardIndex) {
    const participant = this.getParticipant(side);
    const unit = participant.board[boardIndex];
    const card = this.getCard(unit);
    const ability = card.ability || {};
    const text = ability.text || '';
    const targetSide = this.getOpponentSide(side);
    const targetParticipant = this.getParticipant(targetSide);
    const damage = this.getAbilityDamage(unit, text);
    const hits = parseHits(text, 1);
    const damageTypes = parseDamageTypes(text, card.types);
    const ignoreDefense = /ignore Defense/i.test(text);
    const targetIndexes = this.getAbilityTargetIndexes(targetParticipant, boardIndex, text);

    this.addLog(`${card.name} uses ${ability.name || 'an ability'}.`);

    if (damage > 0) {
      if (targetIndexes.length === 0) {
        this.applyDamageToHero(targetSide, damage * hits, `${card.name}'s ${ability.name}`);
      } else {
        targetIndexes.forEach((targetIndex) => {
          for (let hit = 0; hit < hits; hit += 1) {
            this.applyDamageToUnit(targetSide, targetIndex, damage, {
              sourceName: `${card.name}'s ${ability.name}`,
              damageTypes,
              ignoreDefense,
            });
            if (!targetParticipant.board[targetIndex]) break;
          }
        });
      }
    }

    this.applyAbilityStatusEffects(side, boardIndex, targetIndexes, text);
    this.applyAbilityHealing(side, boardIndex, text);

    if (/draw 1 card/i.test(text)) {
      this.drawCards(side, 1);
    }

    if (/Voltcrest takes 2 damage/i.test(text)) {
      this.applyDamageToUnit(side, boardIndex, 2, {
        sourceName: 'Overcharge recoil',
        damageTypes: ['Lightning'],
        ignoreDefense: true,
      });
    }

    if (/Nimbus takes 1 damage/i.test(text)) {
      const hitCount = targetIndexes.length || 1;
      this.applyDamageToUnit(side, boardIndex, hitCount, {
        sourceName: 'Storm Swarm recoil',
        damageTypes: ['Lightning'],
        ignoreDefense: true,
      });
    }
  }

  getAbilityDamage(unit, text) {
    if (/damage equal to .*Defense/i.test(text)) {
      return this.getUnitDefense(unit);
    }

    const dealMatch = String(text ?? '').match(/Deal\s+(\d+)\s*(?:[A-Za-z/]+)?\s*damage/i);
    if (dealMatch) {
      return Number(dealMatch[1]);
    }

    return 0;
  }

  getAbilityTargetIndexes(targetParticipant, boardIndex, text) {
    if (/all enemies/i.test(text)) {
      return targetParticipant.board
        .map((unit, index) => (unit ? index : null))
        .filter((index) => index !== null);
    }

    if (/adjacent enemies/i.test(text)) {
      return [boardIndex - 1, boardIndex, boardIndex + 1].filter(
        (index) => index >= 0 && index < BOARD_SIZE && targetParticipant.board[index]
      );
    }

    return targetParticipant.board[boardIndex] ? [boardIndex] : [];
  }

  applyAbilityStatusEffects(side, boardIndex, targetIndexes, text) {
    const participant = this.getParticipant(side);
    const targetSide = this.getOpponentSide(side);
    const targetParticipant = this.getParticipant(targetSide);
    const unit = participant.board[boardIndex];

    if (!unit) return;

    if (/dodge/i.test(text) || /Prevent all damage from the next attack/i.test(text)) {
      unit.status.dodge = true;
    }

    if (/become concealed/i.test(text) || /conceal [^.]*until/i.test(text)) {
      unit.status.concealed = true;
    }

    if (/conceal all allies/i.test(text)) {
      participant.board.forEach((ally) => {
        if (ally) ally.status.concealed = true;
      });
    }

    if (/\+1 Attack/i.test(text)) {
      if (/all allies/i.test(text)) {
        participant.board.forEach((ally) => {
          if (ally) ally.attackBuff += 1;
        });
      } else {
        unit.attackBuff += 1;
      }
    }

    const attackDebuffMatch = text.match(/reduce (?:the enemy's|its|one enemy's|the target's) Attack by (\d+)/i);
    if (attackDebuffMatch) {
      targetIndexes.forEach((targetIndex) => {
        const target = targetParticipant.board[targetIndex];
        if (target) target.attackDebuff = Math.max(target.attackDebuff, Number(attackDebuffMatch[1]));
      });
    }

    if (/Sleep/i.test(text)) {
      targetIndexes.forEach((targetIndex) => {
        const target = targetParticipant.board[targetIndex];
        if (target) target.status.sleep = 1;
      });
    }

    if (/Poison one enemy|Poisoned|takes \d+ Poison damage at the start/i.test(text)) {
      const poisonDamage =
        Number(text.match(/takes (\d+) Poison damage/i)?.[1]) ||
        Number(text.match(/for (\d+) damage/i)?.[1]) ||
        2;
      const poisonTurns = Number(text.match(/next (\d+) turns/i)?.[1]) || 1;
      targetIndexes.forEach((targetIndex) => {
        const target = targetParticipant.board[targetIndex];
        if (target) {
          target.status.poisonDamage = poisonDamage;
          target.status.poisonTurns = Math.max(target.status.poisonTurns, poisonTurns);
        }
      });
    }
  }

  applyAbilityHealing(side, boardIndex, text) {
    const participant = this.getParticipant(side);
    const restoreMatch = text.match(/Restore\s+(\d+)\s+HP/i);
    if (!restoreMatch) return;

    const amount = Number(restoreMatch[1]);
    if (/all allies|each/i.test(text)) {
      participant.board.forEach((unit) => this.restoreUnit(unit, amount));
      return;
    }

    this.restoreUnit(participant.board[boardIndex], amount);
  }

  restoreUnit(unit, amount) {
    if (!unit) return;
    const card = this.getCard(unit);
    const previousHp = unit.currentHp;
    unit.currentHp = clamp(unit.currentHp + amount, 0, card.hp);
    if (unit.currentHp > previousHp) {
      this.addLog(`${card.name} restores ${unit.currentHp - previousHp} HP.`);
    }
  }

  applyDamageToUnit(side, boardIndex, amount, options = {}) {
    const participant = this.getParticipant(side);
    const unit = participant?.board[boardIndex];
    if (!unit) return { damage: 0, defeated: false };

    const card = this.getCard(unit);
    if (unit.status.dodge) {
      unit.status.dodge = false;
      this.addLog(`${card.name} dodges ${options.sourceName || 'the attack'}.`);
      return { damage: 0, defeated: false };
    }

    const damageTypes = options.damageTypes?.length ? options.damageTypes : ['Normal'];
    const typeBonus = this.getTypeBonus(damageTypes, card.types, unit.status.concealed);
    const defense = options.ignoreDefense ? 0 : this.getUnitDefense(unit);
    const damage = Math.max(1, Number(amount || 0) + typeBonus - defense);

    unit.currentHp -= damage;
    this.addLog(`${options.sourceName || 'Attack'} deals ${damage} damage to ${card.name}.`);

    if (unit.currentHp <= 0) {
      this.defeatUnit(side, boardIndex);
      return { damage, defeated: true };
    }

    return { damage, defeated: false };
  }

  applyDamageToHero(side, amount, sourceName) {
    const participant = this.getParticipant(side);
    if (!participant) return;

    participant.health = Math.max(0, participant.health - amount);
    this.addLog(`${sourceName} hits ${participant.name} for ${amount}.`);
    this.checkWinner();
  }

  defeatUnit(side, boardIndex) {
    const participant = this.getParticipant(side);
    const unit = participant?.board[boardIndex];
    if (!unit) return;

    const card = this.getCard(unit);
    participant.discard.push(unit.cardId);
    participant.board[boardIndex] = null;
    this.addLog(`${card.name} is defeated.`);
  }

  getTypeBonus(damageTypes, targetTypes, targetConcealed = false) {
    let bestBonus = 0;
    damageTypes.forEach((damageType) => {
      const advantages = TYPE_ADVANTAGES[damageType] || [];
      const hitsType = targetTypes.some((type) => advantages.includes(type));
      const hitsConceal = targetConcealed && advantages.includes('Concealed');
      if (hitsType || hitsConceal) {
        bestBonus = Math.max(bestBonus, 2);
      }
    });
    return bestBonus;
  }

  getUnitAttack(unit) {
    const card = this.getCard(unit);
    return Math.max(0, Number(card.attack || 0) + unit.attackBuff - unit.attackDebuff);
  }

  getUnitDefense(unit) {
    const card = this.getCard(unit);
    return Math.max(0, Number(card.defense || 0) + unit.defenseBonus);
  }

  checkWinner() {
    const battle = this.state.battle;
    if (!battle || battle.winner) return;

    if (battle.enemy.health <= 0) {
      battle.winner = 'player';
      this.addLog('Victory! The rival is out of health.');
    } else if (battle.player.health <= 0) {
      battle.winner = 'enemy';
      this.addLog('Defeat. Your Critters fall back to regroup.');
    }
  }

  addLog(message) {
    const battle = this.state.battle;
    if (!battle) return;
    battle.log = [message, ...battle.log].slice(0, 8);
  }

  render() {
    if (!this.root || !this.state) return;
    this.root.dataset.renderMode = this.state.renderMode;
    this.root.innerHTML = `
      <div class="card-game__chrome">
        <div class="card-game__masthead">
          <div>
            <p class="card-game__eyebrow">Minigame Prototype</p>
            <h3>Critz Card Game</h3>
          </div>
          <div class="card-game__count">${critterCards.length} asset-backed cards</div>
        </div>
        <div class="card-game__toolbar">
          <nav class="card-game__tabs" aria-label="Card game screens">
            ${this.renderTab('title', 'Title')}
            ${this.renderTab('collection', 'Collection')}
            ${this.renderTab('deck', 'Deck')}
            ${this.renderTab('battle', 'Battle')}
            ${this.renderTab('detail', 'Detail')}
          </nav>
          <div class="card-game__toggle" aria-label="Card render style">
            <button type="button" data-action="set-render-mode" data-mode="png" aria-pressed="${
              this.state.renderMode === 'png'
            }">PNG</button>
            <button type="button" data-action="set-render-mode" data-mode="generated" aria-pressed="${
              this.state.renderMode === 'generated'
            }">Generated</button>
          </div>
        </div>
      </div>
      <div class="card-game__viewport">
        ${this.renderActiveView()}
      </div>
    `;
  }

  renderTab(view, label) {
    const isActive = this.state.view === view;
    return `
      <button type="button" data-action="set-view" data-view="${view}" aria-pressed="${isActive}">
        ${escapeHtml(label)}
      </button>
    `;
  }

  renderActiveView() {
    if (this.state.view === 'collection') return this.renderCollectionView();
    if (this.state.view === 'deck') return this.renderDeckView();
    if (this.state.view === 'battle') return this.renderBattleView();
    if (this.state.view === 'detail') return this.renderDetailView();
    return this.renderTitleView();
  }

  renderTitleView() {
    const featureCards = [1, 63, 95]
      .map((id) => this.cardMap.get(id))
      .filter(Boolean)
      .map((card) => this.renderCard(card, { action: 'inspect-card', scale: 0.86 }))
      .join('');

    return `
      <section class="card-game-title">
        <div class="card-game-title__copy">
          <p class="card-game__eyebrow">Rootport Table Rules</p>
          <h4>Build a lane board, swing with weapons, and fire off creature abilities.</h4>
          <div class="card-game-title__actions">
            <button type="button" class="minigame-btn minigame-btn--accent" data-action="start-battle">Start Battle</button>
            <button type="button" class="minigame-btn" data-action="set-view" data-view="collection">Browse Cards</button>
            <button type="button" class="minigame-btn" data-action="set-view" data-view="deck">Build Deck</button>
          </div>
        </div>
        <div class="card-game-title__cards">
          ${featureCards}
        </div>
      </section>
    `;
  }

  renderCollectionView() {
    const search = normalize(this.state.collectionSearch);
    const cards = critterCards.filter((card) => {
      if (!search) return true;
      return [card.name, card.species, card.rarity, card.role, ...card.types]
        .map(normalize)
        .some((value) => value.includes(search));
    });

    return `
      <section class="card-game-panel card-game-panel--collection">
        <div class="card-game-panel__header">
          <div>
            <h4>Collection</h4>
            <p>${cards.length} visible cards</p>
          </div>
          <input
            class="card-game-search"
            type="search"
            value="${escapeHtml(this.state.collectionSearch)}"
            placeholder="Search cards"
            data-action="search-collection"
          />
        </div>
        <div class="card-game-collection-grid">
          ${cards.map((card) => this.renderCard(card, { action: 'inspect-card', scale: 0.76 })).join('')}
        </div>
      </section>
    `;
  }

  renderDeckView() {
    const deckCards = this.state.deckIds.map((id) => this.cardMap.get(id)).filter(Boolean);
    const availableCards = critterCards.filter((card) => !this.state.deckIds.includes(card.id));

    return `
      <section class="card-game-deck">
        <div class="card-game-deck__column">
          <div class="card-game-panel__header">
            <div>
              <h4>Deck</h4>
              <p>${deckCards.length}/24 cards</p>
            </div>
            <div class="card-game-deck__buttons">
              <button type="button" class="minigame-btn" data-action="auto-deck">Starter</button>
              <button type="button" class="minigame-btn minigame-btn--ghost" data-action="clear-deck">Clear</button>
            </div>
          </div>
          <div class="card-game-card-list">
            ${
              deckCards.length
                ? deckCards
                    .map(
                      (card) => `
                        <button type="button" class="card-game-list-card" data-action="remove-card" data-card-id="${card.id}">
                          <span>${escapeHtml(card.name)}</span>
                          <small>${escapeHtml(card.rarity)} · ${escapeHtml(card.types.join('/'))}</small>
                        </button>
                      `
                    )
                    .join('')
                : '<p class="card-game-empty">No cards selected.</p>'
            }
          </div>
        </div>
        <div class="card-game-deck__column">
          <div class="card-game-panel__header">
            <div>
              <h4>Available</h4>
              <p>${availableCards.length} cards</p>
            </div>
            <button type="button" class="minigame-btn minigame-btn--accent" data-action="start-battle" ${
              deckCards.length < 10 ? 'disabled' : ''
            }>Battle</button>
          </div>
          <div class="card-game-card-list">
            ${availableCards
              .slice(0, 56)
              .map(
                (card) => `
                  <button type="button" class="card-game-list-card" data-action="add-card" data-card-id="${card.id}" ${
                    this.state.deckIds.length >= 24 ? 'disabled' : ''
                  }>
                    <span>${escapeHtml(card.name)}</span>
                    <small>${escapeHtml(card.rarity)} · ${escapeHtml(card.types.join('/'))}</small>
                  </button>
                `
              )
              .join('')}
          </div>
        </div>
      </section>
    `;
  }

  renderDetailView() {
    const card = this.cardMap.get(this.state.detailCardId) || critterCards[0];
    if (!card) return '<p class="card-game-empty">No card selected.</p>';

    return `
      <section class="card-game-detail">
        <div class="card-game-detail__card">
          ${this.renderCard(card, { action: 'inspect-card', scale: 1.08 })}
        </div>
        <div class="card-game-detail__sheet">
          <p class="card-game__eyebrow">#${card.id} · ${escapeHtml(card.rarity)}</p>
          <h4>${escapeHtml(card.name)}</h4>
          <p class="card-game-detail__species">${escapeHtml(card.species)}</p>
          <div class="card-game-detail__types">${this.renderTypePills(card.types)}</div>
          <dl class="card-game-detail__stats">
            <div><dt>HP</dt><dd>${card.hp}</dd></div>
            <div><dt>ATK</dt><dd>${card.attack}</dd></div>
            <div><dt>DEF</dt><dd>${card.defense}</dd></div>
          </dl>
          <div class="card-game-detail__moves">
            <article>
              <h5>${escapeHtml(card.weapon?.name || 'Weapon')}</h5>
              <p>${escapeHtml(card.weapon?.text || '')}</p>
            </article>
            <article>
              <h5>${escapeHtml(card.ability?.name || 'Ability')}</h5>
              <p>${escapeHtml(card.ability?.text || '')}</p>
            </article>
          </div>
          <button type="button" class="minigame-btn minigame-btn--accent" data-action="add-card" data-card-id="${card.id}" ${
            this.state.deckIds.includes(card.id) || this.state.deckIds.length >= 24 ? 'disabled' : ''
          }>Add To Deck</button>
        </div>
      </section>
    `;
  }

  renderBattleView() {
    if (!this.state.battle) {
      this.startNewBattle({ render: false });
    }

    const battle = this.state.battle;
    const selectedUnit =
      battle.selectedBoardIndex !== null && battle.selectedBoardIndex !== undefined
        ? battle.player.board[battle.selectedBoardIndex]
        : null;
    const selectedCard = selectedUnit ? this.getCard(selectedUnit) : null;
    const canAct = battle.turn === 'player' && selectedUnit && !selectedUnit.hasActed && !battle.winner;

    return `
      <section class="card-game-battle">
        <div class="card-game-battle__topline">
          ${this.renderHeroBadge('enemy')}
          <div class="card-game-battle__turn">
            <strong>${battle.winner ? (battle.winner === 'player' ? 'Victory' : 'Defeat') : `Turn ${battle.turnNumber}`}</strong>
            <span>${battle.turn === 'player' ? 'Your turn' : 'Rival turn'}</span>
          </div>
          ${this.renderHeroBadge('player')}
        </div>
        <div class="card-game-board">
          <div class="card-game-board__row card-game-board__row--enemy">
            ${battle.enemy.board
              .map((unit, index) => this.renderBoardSlot('enemy', index, unit, { scale: 0.39 }))
              .join('')}
          </div>
          <div class="card-game-board__actions">
            <div class="card-game-actions">
              <strong>${selectedCard ? escapeHtml(selectedCard.name) : 'Choose a Critter'}</strong>
              <div>
                <button type="button" class="minigame-btn" data-action="use-weapon" ${!canAct ? 'disabled' : ''}>Weapon</button>
                <button type="button" class="minigame-btn" data-action="use-ability" ${!canAct ? 'disabled' : ''}>Ability</button>
                <button type="button" class="minigame-btn" data-action="defend" ${!canAct ? 'disabled' : ''}>Defend</button>
                <button type="button" class="minigame-btn minigame-btn--accent" data-action="end-turn" ${
                  battle.turn !== 'player' || battle.winner ? 'disabled' : ''
                }>End Turn</button>
              </div>
            </div>
            <ol class="card-game-log">
              ${battle.log.map((entry) => `<li>${escapeHtml(entry)}</li>`).join('')}
            </ol>
          </div>
          <div class="card-game-board__row card-game-board__row--player">
            ${battle.player.board
              .map((unit, index) =>
                this.renderBoardSlot('player', index, unit, {
                  scale: 0.39,
                  selected: battle.selectedBoardIndex === index,
                })
              )
              .join('')}
          </div>
        </div>
        <div class="card-game-hand">
          <div class="card-game-hand__label">
            <strong>Hand</strong>
            <span>Deck ${battle.player.deck.length} · Discard ${battle.player.discard.length}</span>
          </div>
          <div class="card-game-hand__cards">
            ${
              battle.player.hand.length
                ? battle.player.hand
                    .map((cardId, index) =>
                      this.renderCard(this.cardMap.get(cardId), {
                        action: 'play-hand',
                        handIndex: index,
                        scale: 0.38,
                        disabled:
                          battle.turn !== 'player' || battle.playedCardThisTurn || battle.winner,
                      })
                    )
                    .join('')
                : '<p class="card-game-empty">No cards in hand.</p>'
            }
          </div>
        </div>
      </section>
    `;
  }

  renderHeroBadge(side) {
    const participant = this.getParticipant(side);
    if (!participant) return '';
    const healthPercent = (participant.health / participant.maxHealth) * 100;
    return `
      <div class="card-game-hero card-game-hero--${side}">
        <span>${escapeHtml(participant.name)}</span>
        <strong>${participant.health}/${participant.maxHealth}</strong>
        <div><i style="width: ${clamp(healthPercent, 0, 100)}%"></i></div>
      </div>
    `;
  }

  renderBoardSlot(side, index, unit, { scale, selected = false }) {
    return `
      <div class="card-game-slot ${unit ? 'is-filled' : ''} ${selected ? 'is-selected' : ''}">
        <span class="card-game-slot__lane">Lane ${index + 1}</span>
        ${
          unit
            ? this.renderCard(this.getCard(unit), {
                action: 'select-board',
                side,
                boardIndex: index,
                unit,
                scale,
                selected,
              })
            : '<span class="card-game-slot__empty">Open</span>'
        }
      </div>
    `;
  }

  renderCard(card, options = {}) {
    if (!card) return '';
    const scale = Number(options.scale || 1);
    const action = options.action || 'inspect-card';
    const unit = options.unit || null;
    const currentHp = unit ? unit.currentHp : card.hp;
    const attack = unit ? this.getUnitAttack(unit) : card.attack;
    const defense = unit ? this.getUnitDefense(unit) : card.defense;
    const rarityClass = toRarityClass(card.rarity);
    const attrs = [
      `data-action="${escapeHtml(action)}"`,
      `data-card-id="${card.id}"`,
      options.handIndex !== undefined ? `data-hand-index="${options.handIndex}"` : '',
      options.boardIndex !== undefined ? `data-board-index="${options.boardIndex}"` : '',
      options.side ? `data-side="${escapeHtml(options.side)}"` : '',
      options.disabled ? 'disabled' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const buttonClass = [
      'card-game-card',
      this.state.renderMode === 'png' ? 'card-game-card--png' : 'card-game-card--generated',
      rarityClass,
      options.selected ? 'is-selected' : '',
      unit?.hasActed ? 'has-acted' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return `
      <div class="card-game-card-shell" style="--card-scale: ${scale}">
        <button type="button" class="${buttonClass}" ${attrs} aria-label="${escapeHtml(card.name)}">
          ${
            this.state.renderMode === 'png'
              ? this.renderPngCard(card, unit)
              : this.renderGeneratedCard(card, { unit, currentHp, attack, defense })
          }
        </button>
      </div>
    `;
  }

  renderPngCard(card, unit) {
    return `
      <img src="${escapeHtml(card.imagePath)}" alt="${escapeHtml(card.name)} card" />
      ${unit ? this.renderUnitBadge(unit) : ''}
    `;
  }

  renderGeneratedCard(card, { unit, currentHp, attack, defense }) {
    return `
      <div class="card-game-card__top">
        <span>#${card.id}</span>
        <strong>${escapeHtml(card.name)}</strong>
        <em>${escapeHtml(card.rarity)}</em>
      </div>
      <div class="card-game-card__types">${this.renderTypePills(card.types)}</div>
      <div class="card-game-card__art">
        <img src="${escapeHtml(card.imagePath)}" alt="${escapeHtml(card.name)} pixel art" />
      </div>
      <div class="card-game-card__stats">
        <span><b>HP</b>${currentHp}</span>
        <span><b>ATK</b>${attack}</span>
        <span><b>DEF</b>${defense}</span>
      </div>
      <div class="card-game-card__text">
        <p><strong>${escapeHtml(card.weapon?.name || 'Weapon')}</strong>${escapeHtml(card.weapon?.text || '')}</p>
        <p><strong>${escapeHtml(card.ability?.name || 'Ability')}</strong>${escapeHtml(card.ability?.text || '')}</p>
      </div>
      ${unit ? this.renderUnitBadge(unit) : ''}
    `;
  }

  renderTypePills(types) {
    return types
      .map(
        (type) => `
          <span class="card-game-type card-game-type--${normalize(type)}">
            <i>${escapeHtml(TYPE_ICONS[type] || type.slice(0, 2))}</i>${escapeHtml(type)}
          </span>
        `
      )
      .join('');
  }

  renderUnitBadge(unit) {
    const statuses = [];
    if (unit.hasActed) statuses.push('Spent');
    if (unit.status.concealed) statuses.push('Concealed');
    if (unit.status.dodge) statuses.push('Dodge');
    if (unit.status.sleep) statuses.push('Sleep');
    if (unit.status.poisonTurns) statuses.push(`Poison ${unit.status.poisonTurns}`);
    if (!statuses.length) return '';

    return `
      <div class="card-game-card__badges">
        ${statuses.map((status) => `<span>${escapeHtml(status)}</span>`).join('')}
      </div>
    `;
  }
}
