import { Suspense } from "react";
import { connection } from "next/server";
import { CrashButton } from "@/components/CrashButton";

export function generateStaticParams() {
  return [{ id: "trail-sock" }];
}

async function Stock({ id }: { id: string }) {
  await connection();
  if (id === "broken") throw new Error("inventory service returned 500");
  return <p>In stock</p>;
}

export default async function Page({ params }: PageProps<"/product/[id]">) {
  const { id } = await params;
  return (
    <main>
      <h1>{id}</h1>
      <Suspense fallback={<p>Checking stock…</p>}>
        <Stock id={id} />
      </Suspense>
      <CrashButton />
    </main>
  );
}
