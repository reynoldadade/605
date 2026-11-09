"use client";

export function HandlerButtons() {
  return (
    <>
      <button onClick={() => { throw new Error("add to cart handler failed"); }}>
        Throw in a handler
      </button>
      <button onClick={() => { Promise.reject(new Error("recommendations fetch failed")); }}>
        Reject a promise
      </button>
    </>
  );
}
