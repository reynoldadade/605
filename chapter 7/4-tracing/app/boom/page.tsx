import { Suspense } from "react";
import { connection } from "next/server";

async function Fails(): Promise<React.ReactNode> {
  await connection();
  throw new Error("boom: render failed");
}

export default function Boom() {
  return <Suspense fallback={<p>Loading…</p>}><Fails /></Suspense>;
}
