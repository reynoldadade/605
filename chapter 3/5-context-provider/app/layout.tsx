// app/layout.tsx
//
// A Server Component, no directive. `{children}` here is the entire
// routed page tree at runtime, including Page (below), which does a
// real server-only fetch. RootLayout never imports Page directly — it
// receives it already-rendered as `children` and hands it straight to
// ThemeProvider, which never inspects what's inside.
import "./globals.css";
import { ThemeProvider } from "./ThemeProvider";

export const metadata = {
  title: "RSC Ch.3 — Context Provider wrapping server content",
  description: "Chapter 3: a Client Context Provider wrapping Server Component children",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <main>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
