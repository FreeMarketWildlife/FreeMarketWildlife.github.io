// Appearance follows stable story IDs, never names, collision boxes or save data.
const NPC_ART = Object.freeze({
  mom: 'mom', nugget: 'professor', kaid: 'kaid',
  rivalMom: 'rival-mom', rivalDad: 'rival-dad',
  'shop-critz': 'juniper', 'shop-vet': 'dr-fern',
  'shop-pharmacy': 'mina', 'shop-bike': 'ollie', 'shop-glass': 'aunt-ember',
});

export function npcAppearance(entity, playerGender = 'boy') {
  if (entity.id === 'rival') return `hero.${playerGender === 'boy' ? 'girl' : 'boy'}`;
  const id = NPC_ART[entity.id];
  if (!id) throw new Error(`Missing character appearance: ${entity.id}`);
  return id;
}
