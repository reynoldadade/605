"use client";

import { useState } from "react";

// after: the widget's script loads when a reader asks for help
export function ChatButton() {
  const [state, setState] = useState<"idle" | "loading">("idle");
  return (
    <button className="chat" disabled={state !== "idle"} onClick={() => {
      setState("loading");
      const s = document.createElement("script");
      s.src = "/chat-widget.js";
      document.body.append(s);
    }}>
      {state === "idle" ? "Chat with us" : "Connecting…"}
    </button>
  );
}
