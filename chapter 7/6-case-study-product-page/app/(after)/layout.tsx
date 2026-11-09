import type { ReactNode } from "react";
import { WebVitals } from "@/components/WebVitals";
import { ChatButton } from "@/components/ChatButton";
import "../globals.css";

export default function AfterLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WebVitals />
        <header>Storefront</header>
        {children}
        <ChatButton />
      </body>
    </html>
  );
}
