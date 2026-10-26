import { safeGridPosition, buildings } from "./world.js";

import {northOfBear} from './route-bear.js';

export const GRID_VERSION = 1;

// Schema/save keys stay v1. Old coordinates already represent map-tile units,
// so changing the visual tile size does not multiply player coordinates.
// The caller must preserve raw pre-migration bytes before saving this result.
// This pure conversion never reads or writes storage and never alters money,
// inventory, story flags, tank data or posts. Optional bear access preserves
// earlier northern travel before the new route obstruction is considered.
export function migrateGridState(state) {
  if (!state || typeof state !== "object" || !state.player)
    throw new TypeError("A validated game state is required for grid migration.");
  if (state.gridVersion !== undefined && state.gridVersion !== GRID_VERSION)
    throw new RangeError(`Unsupported grid version: ${state.gridVersion}`);
  if (state.worldVersion !== undefined && state.worldVersion !== 2) throw new RangeError(`Unsupported world version: ${state.worldVersion}`);
  const migrated = structuredClone(state);
  if (migrated.worldVersion === undefined && migrated.scene === 'town') {
    // Retain the nearest familiar doorstep when the town layout changes.
    const oldDoors = [[5,7],[15,7],[25,7],[5,16],[15,16],[25,16],[9,25],[22,25]];
    let nearest=0,distance=Infinity;
    oldDoors.forEach(([x,y],i)=>{const d=(migrated.player.x-x)**2+(migrated.player.y-y)**2;if(d<distance){nearest=i;distance=d;}});
    const b=buildings[nearest];migrated.player.x=b.doorX;migrated.player.y=b.doorY+1;
  }
  // Classify old forest positions on the original connected map before the
  // new obstruction can recover them south. Preserve already-earned access.
  const oldFloor=migrated.scene==='forest'?safeGridPosition('forest',migrated.player.x,migrated.player.y,{...migrated,omitRouteBear:true}):null;
  if(northOfBear(migrated)||(oldFloor&&oldFloor.y<=21))migrated.liarsvilleBearAccess=true;
  else migrated.liarsvilleBearAccess ||= false;
  migrated.worldVersion = 2;
  const position = safeGridPosition(migrated.scene, migrated.player.x, migrated.player.y, migrated);
  migrated.player = { ...migrated.player, ...position };
  migrated.gridVersion = GRID_VERSION;
  return migrated;
}
