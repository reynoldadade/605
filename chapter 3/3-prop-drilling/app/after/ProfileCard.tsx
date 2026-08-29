// app/after/ProfileCard.tsx
//
// No directive at all: a Server Component, same as the default for
// any file that doesn't say otherwise. Its only job is layout, so its
// only prop is `children` — it was never part of the problem, and
// isn't part of the fix either.
export default function ProfileCard({ children }: { children: React.ReactNode }) {
  return <div className="card">{children}</div>;
}
