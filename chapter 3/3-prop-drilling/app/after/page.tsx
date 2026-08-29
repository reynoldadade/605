// app/after/page.tsx
//
// Still the only place `user` gets fetched, but now it stays a Server
// Component all the way down through ProfileCard and ProfileHeader.
// Only the two fields ProfileAvatarMenu actually needs are handed to
// it, built here and passed down as an already-rendered element —
// ProfileHeader never has to know those fields exist at all.
//
// (The technique of passing a pre-rendered child through a Server
// Component's `children` slot gets a full treatment later in this
// chapter, under Composition Patterns. This is the minimum slice of it
// needed to fix the prop list here.)
import { getUser } from "../../lib/mock-data";
import ProfileCard from "./ProfileCard";
import ProfileHeader from "./ProfileHeader";
import ProfileAvatarMenu from "./ProfileAvatarMenu";

export default async function Page() {
  const user = await getUser();
  return (
    <ProfileCard>
      <ProfileHeader title={user.title} joinedAt={user.joinedAt}>
        <ProfileAvatarMenu name={user.name} avatarUrl={user.avatarUrl} email={user.email} />
      </ProfileHeader>
    </ProfileCard>
  );
}
