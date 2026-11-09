import type { ReactNode } from "react";
import Script from "next/script";
import { WebVitals } from "@/components/WebVitals";
import "../globals.css";

export default function BeforeLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WebVitals />
        <header>Storefront</header>
        {children}
        {/* loads and starts before the page becomes interactive */}
        <Script src="/chat-widget.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
