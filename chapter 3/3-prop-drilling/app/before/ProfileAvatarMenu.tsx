// app/before/ProfileAvatarMenu.tsx
//
// This is the actual leaf that needs the browser: a click handler and
// a bit of local state for whether the dropdown is open. No directive
// of its own needed either, for the same reason as ProfileHeader — it
// inherits "use client" from ProfileCard, two levels up.
//
// This is the only one of the three "before" files that genuinely
// needs all three of `name`, `avatarUrl`, and `email` — which is
// exactly why those fields belonged here, not threaded through
// ProfileHeader's props on the way.
"use client";

import { useState } from "react";
import type { User } from "../../lib/mock-data";

export default function ProfileAvatarMenu({ user }: { user: User }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="avatar-menu">
      <button onClick={() => setOpen((v) => !v)} aria-label={user.name}>
        {user.name.split(" ").map((p) => p[0]).join("")}
      </button>
      {open && (
        <div className="avatar-menu__dropdown">
          Signed in as {user.name}
          <br />
          {user.email}
        </div>
      )}
    </div>
  );
}
