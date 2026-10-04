import type { ReactNode } from "react";
import "./globals.css";

export const metadata = { title: "Chapter 5 example" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
