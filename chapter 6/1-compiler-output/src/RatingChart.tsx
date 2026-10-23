"use client";

export function RatingChart({ points }: { points: number[] }) {
  return <ol>{points.map((p, i) => <li key={i}>{p}</li>)}</ol>;
}
