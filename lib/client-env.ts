'use client';

import { useSyncExternalStore } from 'react';

const noop = () => () => {};

/** True after hydration on the client; false during SSR and the hydration pass. */
export function useIsClient() {
  return useSyncExternalStore(noop, () => true, () => false);
}

/** Subscribes to a CSS media query (false during SSR). */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', cb);
      return () => mql.removeEventListener('change', cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

let webglCache: boolean | undefined;
function detectWebgl() {
  if (webglCache === undefined) {
    try {
      const c = document.createElement('canvas');
      webglCache = !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch {
      webglCache = false;
    }
  }
  return webglCache;
}

/** WebGL support (false during SSR). */
export function useWebgl() {
  return useSyncExternalStore(noop, detectWebgl, () => false);
}
