import { VNode, ComponentPublicInstance } from 'vue';

declare global {
  namespace JSX {
    // Extend or create the JSX element interface so TS recognizes <div>, <span>, etc.
    export type Element = VNode
    export type ElementClass = ComponentPublicInstance
    interface IntrinsicElements {
      [elem: string]: any;
    }
  }
}
