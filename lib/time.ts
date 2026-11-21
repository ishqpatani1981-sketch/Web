/** Current time for server-rendered comparisons (kept out of component bodies for purity linting). */
export function nowMs() {
  return Date.now();
}

export function isFuture(d: Date | null | undefined) {
  return !!d && d.getTime() > nowMs();
}
