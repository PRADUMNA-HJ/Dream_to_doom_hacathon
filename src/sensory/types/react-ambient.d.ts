/**
 * Dream-to-Doom: Sensory Domain — React Ambient Declarations
 * Provides ambient type safety for React hooks, functional components, and JSX
 * without requiring root dependencies or modifications to package.json.
 */

declare namespace JSX {
  interface Element {
    [key: string]: any;
  }
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare namespace React {
  export type ReactNode = any;
  export type FC<P = {}> = (props: P) => JSX.Element | null;
  export type FunctionComponent<P = {}> = FC<P>;

  export function useState<T>(
    initialState: T | (() => T)
  ): [T, (action: T | ((prevState: T) => T)) => void];

  export function useEffect(
    effect: () => void | (() => void),
    deps?: readonly any[]
  ): void;

  export function useRef<T>(initialValue: T): { current: T };
  export function useRef<T = undefined>(): { current: T | undefined };

  export function useCallback<T extends (...args: any[]) => any>(
    callback: T,
    deps: readonly any[]
  ): T;

  export function useId(): string;

  export interface ChangeEvent<T = any> {
    target: T & { value: string };
  }

  export interface KeyboardEvent<T = any> {
    key: string;
    shiftKey: boolean;
    preventDefault: () => void;
  }

  export interface FormEvent<T = any> {
    preventDefault: () => void;
  }

  export interface MouseEvent<T = any> {
    preventDefault: () => void;
  }

  export namespace JSX {
    interface Element {
      [key: string]: any;
    }
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

declare module 'react' {
  export = React;
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}
