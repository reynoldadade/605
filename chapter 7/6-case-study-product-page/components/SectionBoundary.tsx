"use client";

import { useEffect } from "react";
import { catchError, type ErrorInfo } from "next/error";
import { sendError } from "@/lib/send-error";

// A section-level error boundary (Chapter 5). `report` is the case
// study's fix: without it, what this boundary catches never reaches error
// reporting, because Next.js only logs caught errors to the console.
function Fallback(props: { report?: boolean }, { error, retry }: ErrorInfo) {
  useEffect(() => {
    if (props.report) {
      const digest = (error as { digest?: string }).digest;
      sendError({ source: "boundary", error, digest });
    }
  }, [error, props.report]);
  return (
    <p className="section-error">
      Reviews are unavailable right now. <button onClick={() => retry()}>Retry</button>
    </p>
  );
}

export const SectionBoundary = catchError(Fallback);
