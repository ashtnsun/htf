/**
 * Places the partner globe's hover label (a DOM element over the canvas) at a pin's screen
 * position. The three.js scene calls `place` from its frame loop and from pointer handlers,
 * so the write goes straight to the element's style and never through React state: a class
 * with methods, like SpinController, so nothing mutates a ref or a prop.
 */
export class LabelAnchor {
  private element: HTMLElement | null = null;

  attach(element: HTMLElement | null) {
    this.element = element;
  }

  /** Bottom centre of the label at (`x`, `y`) canvas pixels; hidden while `visible` is false. */
  place(x: number, y: number, visible = true) {
    const el = this.element;
    if (!el) return;
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`;
    el.style.opacity = visible ? "" : "0";
  }
}
