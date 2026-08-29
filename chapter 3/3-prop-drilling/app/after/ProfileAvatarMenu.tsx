// app/after/ProfileAvatarMenu.tsx
//
// The only "use client" file in this route, and it takes exactly the
// three fields it uses (name, avatarUrl, email) as its own explicit
// props, built by page.tsx and handed straight in. Nothing about this
// file changed from what the leaf genuinely needs.
"use client";

import { useState } from "react";

export default function ProfileAvatarMenu({
  name,
  avatarUrl,
  email,
}: {
  name: string;
  avatarUrl: string;
  email: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="avatar-menu">
      <button onClick={() => setOpen((v) => !v)} aria-label={name}>
        {name.split(" ").map((p) => p[0]).join("")}
      </button>
      {open && (
        <div className="avatar-menu__dropdown">
          Signed in as {name}
          <br />
          {email}
        </div>
      )}
    </div>
  );
}
