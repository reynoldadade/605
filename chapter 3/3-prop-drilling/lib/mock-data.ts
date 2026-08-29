// lib/mock-data.ts
//
// Stand-in for a real user-profile lookup (a database call, an auth
// provider, whatever). The artificial delay just keeps this consistent
// with the dashboard example's mock-data.ts.

export type User = {
  name: string;
  avatarUrl: string;
  email: string;
  title: string;
  joinedAt: string;
};

function delay<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function getUser(): Promise<User> {
  return delay({
    name: "Amara Chen",
    avatarUrl: "/avatar-placeholder.png",
    email: "amara.chen@example.com",
    title: "Senior Product Designer",
    joinedAt: "2022-03-14",
  });
}
