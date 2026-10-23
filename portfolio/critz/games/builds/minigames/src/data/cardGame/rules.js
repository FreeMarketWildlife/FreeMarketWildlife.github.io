export const DAMAGE_RULES = {
  defenseReducesIncomingDamage: true,
  minimumDamageAfterDefense: 1,
  defendActionDefenseBonus: 1,
};

export const TURN_ACTIONS = [
  {
    id: 'weapon',
    label: 'Use Weapon Attack',
    description: "Use the Critter's basic attack.",
  },
  {
    id: 'ability',
    label: 'Use Ability',
    description: "Use the Critter's special move.",
  },
  {
    id: 'defend',
    label: 'Defend',
    description: 'Gain +1 Defense until the next turn.',
  },
];

export const CARD_KEYWORDS = [
  {
    id: 'concealed',
    label: 'Concealed',
    description: 'Cannot be targeted by normal attacks until the effect ends.',
  },
  {
    id: 'sleep',
    label: 'Sleep',
    description: 'Skips the next attack.',
  },
  {
    id: 'dodge',
    label: 'Dodge',
    description: 'The next attack against this Critter misses.',
  },
  {
    id: 'poison',
    label: 'Poison',
    description: "Takes damage at the start of the affected Critter's turn.",
  },
  {
    id: 'adjacent',
    label: 'Adjacent',
    description: 'Directly next to a Critter in the battlefield/grid/board position.',
  },
  {
    id: 'draw',
    label: 'Draw',
    description: 'Add 1 card from the deck to the hand.',
  },
  {
    id: 'restore',
    label: 'Restore',
    description: 'Heal HP, but not above maximum HP unless stated otherwise.',
  },
  {
    id: 'ignore-defense',
    label: 'Ignore Defense',
    description: "Damage is not reduced by the target's Defense stat.",
  },
];

export const TYPE_ADVANTAGES = {
  Fire: ['Grass', 'Ice', 'Steel'],
  Water: ['Fire', 'Ground'],
  Grass: ['Water', 'Ground'],
  Lightning: ['Water', 'Flying'],
  Ice: ['Grass', 'Flying'],
  Poison: ['Grass'],
  Flying: ['Grass', 'Fighting'],
  Dark: ['Psychic'],
  Psychic: ['Poison', 'Fighting'],
  Steel: ['Ice', 'Flying'],
  Ground: ['Fire', 'Lightning', 'Steel'],
  Fighting: ['Dark', 'Steel'],
  Sound: ['Flying', 'Concealed'],
};

export const TYPE_MATCHUP_RULES = {
  superEffectiveBonusDamage: 2,
  resistedDamagePenalty: 1,
  useResistanceRules: false,
};

export const RARITY_STAT_GUIDELINES = {
  Common: {
    hp: [3, 6],
    attack: [1, 2],
    defense: [0, 2],
  },
  Uncommon: {
    hp: [5, 9],
    attack: [2, 4],
    defense: [0, 3],
  },
  Rare: {
    hp: [5, 12],
    attack: [3, 5],
    defense: [0, 4],
  },
};
