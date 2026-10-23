// Ordinary on-foot source contract: pret/pokeemerald
// 5eff78649e7170a877b961ef0b3da13b81a16038; see docs/REFERENCE_MEASUREMENTS.md.
// Source tables are not emulator captures. First/last presented action frames,
// special terrain, ledges and full door sequences are outside this controller.
export const TICK_SECONDS = 280896 / 16777216;
export const TILE_PIXELS = 16;

const DIRECTIONS = ["up", "down", "left", "right"];
const DELTAS = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};
// Critz transport policy, not an Emerald speed: five tiles in 32 ticks is
// exactly 1.25 times normal running over a full cadence. Displacement stays
// integer at every tick; individual steps deliberately alternate 6/7 ticks.
const BOARD_TICKS = [6, 7, 6, 7, 6];

/** Keep the save-facing player on its last completed integer tile.
 * Rendering uses getMotionView; save mid-step resumes at that completed tile.
 * Recreate the controller after travel or replacement of the player object.
 */
export function createMotion(player) {
  if (!player || !Number.isInteger(player.x) || !Number.isInteger(player.y) ||
      !DIRECTIONS.includes(player.facing))
    throw new TypeError("Motion requires integer tile coordinates and a cardinal facing.");
  return {
    player,
    tick: 0,
    action: null,
    inputState: "rest",
    nextStride: 0,
    boardStep: 0,
    movedThisTick: false,
  };
}

function heldDirection(held) {
  return DIRECTIONS.find((direction) => held.has(direction));
}

function destination(motion, direction) {
  const [dx, dy] = DELTAS[direction];
  return { x: motion.player.x + dx, y: motion.player.y + dy };
}

function beginAction(motion, direction, run, canEnter, opts) {
  if (!direction) {
    motion.action = null;
    motion.inputState = "rest";
    return;
  }
  let kind, duration, target = null;
  if (direction !== motion.player.facing && motion.inputState !== "moving") {
    kind = "turn";
    duration = 8;
    motion.inputState = "turn";
  } else {
    // Like the reference runningState, a blocked attempt still counts as
    // MOVING for direction-change acceptance. It can turn away immediately.
    motion.inputState = "moving";
    target = destination(motion, direction);
    if (!canEnter(target.x, target.y)) {
      kind = "blocked";
      duration = 32;
      target = null;
    } else {
      kind = run && opts.runAllowed !== false ? "run" : "walk";
      duration = kind === "run" ? 8 : 16;
      if (kind === "run" && opts.board) {
        duration = BOARD_TICKS[motion.boardStep % BOARD_TICKS.length];
        motion.boardStep += 1;
      }
    }
  }
  motion.player.facing = direction;
  motion.action = {
    kind,
    direction,
    duration,
    elapsed: 0,
    from: { x: motion.player.x, y: motion.player.y },
    target,
    stride: motion.nextStride,
  };
}

/** Advance exactly one simulation tick. Input is sampled held state, not a
 * queued turn. canEnter is a pure destination check; the caller's world must
 * account for other objects' reservations. Committed steps are never stopped
 * or redirected halfway through a tile.
 * opts.board should be true only where the owned skateboard is permitted.
 */
export function advanceMotion(motion, held, run, canEnter, opts = {}) {
  const direction = heldDirection(held);
  let action = motion.action;
  motion.tick += 1;
  motion.movedThisTick = false;
  // A released collision is immediately at rest; never keep shuffling after
  // the player lets go. Committed traversable steps still finish normally.
  if (action?.kind === "blocked" && !direction) {
    motion.action = null;
    action = null;
  }
  if (action?.kind === "blocked" && action.elapsed < action.duration && direction) {
    const target = destination(motion, direction);
    if (direction !== action.direction || canEnter(target.x, target.y)) {
      motion.action = null;
      action = null;
    }
  }
  if (!action || action.elapsed === action.duration) {
    beginAction(motion, direction, run, canEnter, opts);
    action = motion.action;
  }
  if (action) {
    action.elapsed += 1;
    motion.movedThisTick = action.target !== null;
    if (action.elapsed === action.duration) {
      if (action.target) {
        motion.player.x = action.target.x;
        motion.player.y = action.target.y;
      }
      motion.nextStride = 1 - action.stride;
    }
  }
  return getMotionView(motion);
}

function actionPose(action) {
  if (!action) return "idle";
  // Present the first command on the first processed tick. Boundary display
  // alignment remains a declared source-derived convention pending capture.
  const sample = action.elapsed - 1;
  const strideTicks = action.kind === "walk" ? 8
    : action.kind === "turn" ? 4
      : action.kind === "blocked" ? 16
        // Scale running's 5/3 holds for the Critz skateboard cadence.
        : Math.ceil(action.duration * 5 / 8);
  return sample < strideTicks ? (action.stride ? "strideB" : "strideA") : "idle";
}

/** Native-pixel feet anchors; no subpixel interpolation. tileX/tileY and the
 * retained player remain completed-cell coordinates. moving means the latest
 * tick displaced the actor (including a step's final tick); settled is the
 * separate flag for interaction/warp boundaries. Completed actions retain
 * their final pose until the next simulation tick accepts a new action.
 */
export function getMotionView(motion) {
  const action = motion.action;
  let x = motion.player.x * TILE_PIXELS;
  let y = motion.player.y * TILE_PIXELS;
  if (action?.target) {
    const [dx, dy] = DELTAS[action.direction];
    const pixels = Math.floor(TILE_PIXELS * action.elapsed / action.duration);
    x = action.from.x * TILE_PIXELS + dx * pixels;
    y = action.from.y * TILE_PIXELS + dy * pixels;
  }
  return {
    x,
    y,
    tileX: motion.player.x,
    tileY: motion.player.y,
    facing: motion.player.facing,
    pose: actionPose(action),
    action: action?.kind ?? "idle",
    moving: motion.movedThisTick,
    settled: !action || action.elapsed === action.duration,
    tick: motion.tick,
    actionTick: action?.elapsed ?? 0,
    actionTicks: action?.duration ?? 0,
    destination: action?.target ? { ...action.target } : null,
  };
}

/** rAF-independent accumulator. A visible long frame processes at most eight
 * ticks by default, drops excess whole ticks, and retains its fractional tick.
 * Dropping time is an explicit responsiveness policy, not reference behavior.
 */
export function createMotionClock({ maxTicksPerFrame = 8 } = {}) {
  if (!Number.isInteger(maxTicksPerFrame) || maxTicksPerFrame < 1)
    throw new TypeError("maxTicksPerFrame must be a positive integer.");
  return { maxTicksPerFrame, accumulator: 0, tick: 0, droppedTicks: 0, droppedSeconds: 0 };
}

export function advanceMotionClock(clock, elapsedSeconds, tickFn) {
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 0)
    throw new TypeError("Elapsed time must be a finite nonnegative number.");
  const total = clock.accumulator + elapsedSeconds;
  // Tiny quotient tolerance avoids losing a tick to accumulated IEEE rounding
  // when the caller supplies a duration exactly on a simulation boundary.
  const available = Math.floor(total / TICK_SECONDS + 1e-9);
  const ticks = Math.min(available, clock.maxTicksPerFrame);
  const droppedTicks = available - ticks;
  clock.accumulator = Math.max(0, total - available * TICK_SECONDS);
  clock.droppedTicks += droppedTicks;
  clock.droppedSeconds += droppedTicks * TICK_SECONDS;
  for (let i = 0; i < ticks; i++) {
    clock.tick += 1;
    tickFn(clock.tick);
  }
  return { ticks, droppedTicks, droppedSeconds: droppedTicks * TICK_SECONDS,
    remainderSeconds: clock.accumulator, totalTicks: clock.tick };
}

/** Call on pause/background/resume alongside clearing inputs and resetting
 * the caller's last timestamp. Do not pass hidden elapsed time into advance.
 * In-flight committed steps remain frozen and can finish after resume.
 */
export function resetMotionClock(clock) {
  clock.accumulator = 0;
  return clock;
}
