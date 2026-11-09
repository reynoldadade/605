import type { ReactNode } from "react";
import Link from "next/link";
import { WebVitals } from "./_components/WebVitals";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WebVitals />
        <header><Link href="/">Storefront</Link></header>
        {children}
      </body>
    </html>
  );
}
