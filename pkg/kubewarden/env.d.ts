import { VNode, ComponentPublicInstance } from 'vue';

declare global {
  namespace JSX {
    // Extend or create the JSX element interface so TS recognizes <div>, <span>, etc.
    interface Element extends VNode {}
    interface ElementClass extends ComponentPublicInstance {}
    interface IntrinsicElements {
      [elem: string]: any;
    }
  }
}
