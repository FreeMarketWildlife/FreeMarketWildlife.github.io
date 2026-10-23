// Height is measured in viewport heights. At 3.4, the dream escapes gravity.
export const SPACE_HEIGHT = 3.4;
export const LIFT_DELAY = 15;
export const createLevitation = () => ({ calm: 0, height: 0, velocity: 0, falling: false, fallTime: 0, impact: 0, space: false });

export function stepLevitation(state, dt, buildingRage) {
  state.impact = Math.max(0, state.impact - dt * 1.25);
  if (state.height >= SPACE_HEIGHT && !state.falling) state.space = true;
  if (state.space) {
    state.falling = false; state.fallTime = 0;
    state.velocity = .023; state.height += state.velocity * dt;
    return 0;
  }
  if (buildingRage) {
    state.calm = 0;
    if (state.height > 0 && !state.falling) {
      state.falling = true;
      state.fallTime = 0;
      state.velocity = 0;
    }
  }
  if (state.falling) {
    // A suspended beat, then a gathering plunge. Height makes the fall longer.
    state.fallTime += dt;
    const plunge = Math.max(0, state.fallTime - .5);
    state.velocity -= (.035 + plunge * plunge * .85) * dt;
    state.height += state.velocity * dt;
    if (state.height <= 0) {
      state.height = state.velocity = state.calm = state.fallTime = 0;
      state.falling = false;
      state.impact = 1;
      return 0;
    }
  } else if (!buildingRage) {
    const before = state.calm;
    state.calm += dt;
    const liftTime = Math.max(0, state.calm - Math.max(before, LIFT_DELAY));
    if (liftTime > 0) {
      const dreaming = state.calm - LIFT_DELAY;
      // Ease in over eight seconds; even the eventual drift is under 3% of a screen/second.
      state.velocity = (.016 + .012 * (1 - Math.exp(-dreaming / 100))) * (1 - Math.exp(-dreaming / 8));
      state.height += state.velocity * liftTime;
    }
  }
  return 0;
}

// Gradually pick up the camera instead of abruptly locking onto the wolf.
export const cameraHeight = height => height - .32 * (1 - Math.exp(-height / .32));
