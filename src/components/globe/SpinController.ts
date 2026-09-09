import { shortestAngle } from "@/lib/geo";

/** Seconds a chosen pin stays in front before the slow spin resumes. */
const HOLD_SECONDS = 6;
/** How far the globe can be tipped away from its resting tilt, radians (about 70°). */
const MAX_TILT = 1.2;
/** Easing rate (per second) for the pin aim and for the tilt settling back to rest. */
const EASE = 5;

/**
 * Rotation state of the partner globe, shared by the wrapper (which turns pointer drags into
 * rotation) and the three.js scene (which advances it every frame): `spin` about the polar
 * axis, `tilt` about the screen's horizontal axis on top of the resting GLOBE_TILT, so a drag
 * in any direction turns the globe that way. The tilt is clamped short of the poles and
 * settles back to rest once the globe is left alone, and everything freezes while a labelled
 * pin is hovered. A plain object with methods so React's
 * compiler rules about mutating props stay satisfied: nothing here is React state, and
 * nothing re-renders when it changes.
 */
export class SpinController {
  /** Current rotation about the polar axis, radians. */
  spin: number;
  /** Current extra tilt about the screen's horizontal axis, radians (0 at rest). */
  tilt = 0;
  private target: number | null = null;
  private dragBase: { spin: number; tilt: number } | null = null;
  private holdUntil = 0;
  private hovering = false;

  constructor(initial: number) {
    this.spin = initial;
  }

  get dragging(): boolean {
    return this.dragBase !== null;
  }

  startDrag() {
    this.dragBase = { spin: this.spin, tilt: this.tilt };
    this.target = null;
  }

  /** Rotate by `dx` (spin) and `dy` (tilt) radians from where the drag started. */
  drag(dx: number, dy = 0) {
    if (this.dragBase === null) return;
    this.spin = this.dragBase.spin + dx;
    this.tilt = Math.max(-MAX_TILT, Math.min(MAX_TILT, this.dragBase.tilt + dy));
  }

  endDrag() {
    this.dragBase = null;
  }

  /** A pin is under the pointer: freeze the globe until `hover(false)`. */
  hover(active: boolean) {
    this.hovering = active;
  }

  /** Ease toward `target` radians (a pin brought to the front) and hold there. */
  aim(target: number) {
    this.target = target;
    this.holdUntil = Infinity;
  }

  /**
   * Advance by `dt` seconds at clock time `now`. `autoSpin` adds the slow idle rotation;
   * `snap` jumps to the target instead of easing (reduced motion). Returns true while an
   * easing is still in progress, so on-demand renderers know to draw another frame.
   */
  step(dt: number, now: number, autoSpin: number, snap: boolean): boolean {
    if (this.dragBase !== null) {
      this.holdUntil = now + HOLD_SECONDS;
      return false;
    }
    if (this.hovering) return false;
    let easing = false;
    // Once let go (and whenever a pin is aimed at) the tilt settles back to rest.
    if (this.tilt !== 0 && (this.target !== null || now > this.holdUntil)) {
      if (snap || Math.abs(this.tilt) < 0.002) {
        this.tilt = 0;
      } else {
        this.tilt -= this.tilt * Math.min(1, dt * EASE);
        easing = true;
      }
    }
    if (this.target !== null) {
      const d = shortestAngle(this.spin, this.target);
      if (snap || Math.abs(d) < 0.002) {
        this.spin = this.target;
        this.target = null;
        this.holdUntil = now + HOLD_SECONDS;
        return easing;
      }
      this.spin += d * Math.min(1, dt * EASE);
      return true;
    }
    if (autoSpin > 0 && now > this.holdUntil) {
      this.spin += autoSpin * dt;
    }
    return easing;
  }
}
