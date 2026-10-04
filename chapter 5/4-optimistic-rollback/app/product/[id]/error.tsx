"use client";

export default function ProductError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div role="alert">
      <h2>Something went wrong loading this product.</h2>
      <p>Reference: {error.digest}</p>
      <button onClick={() => retry()}>Try again</button>
    </div>
  );
}
