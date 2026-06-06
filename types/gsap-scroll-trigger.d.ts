declare module 'gsap/ScrollTrigger' {
  interface ScrollTriggerBatchVars {
    interval?: number;
    batchMax?: number;
    start?: string;
    once?: boolean;
    onEnter?: (elements: Element[]) => void;
  }

  export interface ScrollTriggerStatic {
    batch(selector: string, vars: ScrollTriggerBatchVars): void;
    refresh(): void;
  }

  export const ScrollTrigger: ScrollTriggerStatic;
}
