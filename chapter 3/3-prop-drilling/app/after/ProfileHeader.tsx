// app/after/ProfileHeader.tsx
//
// Also a Server Component, no directive needed. Compare this prop
// list to ../before/ProfileHeader.tsx directly: two fields instead of
// a five-field `user` object. `name`, `avatarUrl`, and `email` don't
// appear here at all, because this file never had a reason to know
// about them — `children` carries an already-built ProfileAvatarMenu
// straight from page.tsx to wherever `{children}` renders below,
// without ProfileHeader unwrapping or re-threading it.
export default function ProfileHeader({
  title,
  joinedAt,
  children,
}: {
  title: string;
  joinedAt: string;
  children: React.ReactNode;
}) {
  return (
    <div className="header">
      <h2>{title}</h2>
      <p>Joined {new Date(joinedAt).toLocaleDateString()}</p>
      {children}
    </div>
  );
}
