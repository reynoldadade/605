"use client";

import { catchError, type ErrorInfo } from "next/error";

function SectionFallback(props: { label: string }, { retry }: ErrorInfo) {
  return (
    <div role="alert" data-testid="section-error">
      <p>We couldn&apos;t load {props.label}.</p>
      <button onClick={() => retry()}>Try again</button>
    </div>
  );
}

export default catchError(SectionFallback);
