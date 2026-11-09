"use client";

import { useEffect } from "react";
import { sendError } from "@/lib/send-error";

// Path 3: errors this boundary catches. In production, Next.js only
// logs these to the console; they never reach window "error", so the
// boundary reports them itself. A digest means the error happened on the
// server and onRequestError already has the full report.
export default function ProductError({ error, retry }: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    sendError({ source: "boundary", error, digest: error.digest });
  }, [error]);
  return (
    <div role="alert">
      <h2>Something went wrong loading this product.</h2>
      {error.digest && <p>Reference: {error.digest}</p>}
      <button onClick={() => retry()}>Try again</button>
    </div>
  );
}
