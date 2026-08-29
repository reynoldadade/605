// app/before/page.tsx
//
// The only Server Component in this route. It fetches the user once,
// then hands the whole object to ProfileCard. Everything from here
// down is inside a client subtree (see ProfileCard.tsx), so this is
// also the last point where "just fetch what you need" is an option.
import { getUser } from "../../lib/mock-data";
import ProfileCard from "./ProfileCard";

export default async function Page() {
  const user = await getUser();
  return <ProfileCard user={user} />;
}
