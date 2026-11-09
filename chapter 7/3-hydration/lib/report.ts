// Stand-in for sending a timing to field data (see example 2); here the
// value is kept on window for the measurement script.
export function reportTiming(name: string, ms: number) {
  const w = window as unknown as { __TIMINGS__?: Record<string, number> };
  (w.__TIMINGS__ ??= {})[name] = ms;
}
