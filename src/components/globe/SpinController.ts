import { shortestAngle } from "@/lib/geo";

/** Seconds a chosen pin stays in front before the slow spin resumes. */
const HOLD_SECONDS = 6;

/**
 * Rotation state of the partner globe about its polar axis, shared by the wrapper (which
 * turns pointer drags into rotation) and the three.js scene (which advances it every
 * frame). A plain object with methods so React's compiler rules about mutating props stay
 * satisfied: nothing here is React state, and nothing re-renders when it changes.
 */
export class SpinController {
  /** Current rotation, radians. */
  spin: number;
  private target: number | null = null;
  private dragBase: number | null = null;
  private holdUntil = 0;

  constructor(initial: number) {
    this.spin = initial;
  }

  get dragging(): boolean {
    return this.dragBase !== null;
  }

  startDrag() {
    this.dragBase = this.spin;
    this.target = null;
  }

  /** Rotate by `delta` radians from where the drag started. */
  drag(delta: number) {
    if (this.dragBase !== null) this.spin = this.dragBase + delta;
  }

  endDrag() {
    this.dragBase = null;
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
    if (this.target !== null) {
      const d = shortestAngle(this.spin, this.target);
      if (snap || Math.abs(d) < 0.002) {
        this.spin = this.target;
        this.target = null;
        this.holdUntil = now + HOLD_SECONDS;
        return false;
      }
      this.spin += d * Math.min(1, dt * 5);
      return true;
    }
    if (autoSpin > 0 && now > this.holdUntil) {
      this.spin += autoSpin * dt;
    }
    return false;
  }
}
