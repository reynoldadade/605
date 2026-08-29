// app/before/ProfileCard.tsx
//
// ANTI-PATTERN: "use client" goes here because whoever wrote this knew
// the avatar menu, two components down, needed a click handler, and
// this was the first ancestor that seemed convenient to mark. Nothing
// in ProfileCard itself needs the browser.
"use client";

import type { User } from "../../lib/mock-data";
import ProfileHeader from "./ProfileHeader";

export default function ProfileCard({ user }: { user: User }) {
  return (
    <div className="card">
      {/* ProfileCard has no use for `user` itself beyond handing it
          onward — it is already an example of the prop list problem,
          just a mild one, since it only has to forward one prop. */}
      <ProfileHeader user={user} />
    </div>
  );
}
