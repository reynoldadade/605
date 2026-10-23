"use client";

import { useState } from "react";
import { StockWatcher } from "./StockWatcher";

export function StockPage({ productId }: { productId: string }) {
  const [muted, setMuted] = useState(false);
  return (
    <>
      <button onClick={() => setMuted(!muted)}>{muted ? "Unmute" : "Mute"}</button>
      <StockWatcher productId={productId} muted={muted} />
      <p id="log" />
    </>
  );
}
