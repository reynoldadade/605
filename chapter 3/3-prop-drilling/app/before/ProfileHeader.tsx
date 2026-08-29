// app/before/ProfileHeader.tsx
//
// No "use client" directive of its own — it does not need one to BE a
// client component. It is imported and rendered by ProfileCard, which
// is already client, so this file is part of that same client subtree
// regardless of what its own top line says. (This is the "a boundary
// cannot be undone below itself" rule from earlier in the chapter,
// showing up as a concrete cost rather than an abstract rule.)
//
// This is Sign 2 in full: `user` carries five fields. ProfileHeader
// only ever reads two of them (`title`, `joinedAt`) for its own
// rendering. The other three (`name`, `avatarUrl`, `email`) pass
// through this component's props untouched, purely so ProfileAvatarMenu
// two levels down can read them. Delete `name`, `avatarUrl`, and
// `email` from this file's logic entirely and nothing about
// ProfileHeader's own rendered output would change — the only reason
// they are here at all is that something deeper needs them and this
// component sits in between.
import type { User } from "../../lib/mock-data";
import ProfileAvatarMenu from "./ProfileAvatarMenu";

export default function ProfileHeader({ user }: { user: User }) {
  return (
    <div className="header">
      <h2>{user.title}</h2>
      <p>Joined {new Date(user.joinedAt).toLocaleDateString()}</p>
      <ProfileAvatarMenu user={user} />
    </div>
  );
}
