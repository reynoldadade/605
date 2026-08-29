import "./globals.css";

export const metadata = {
  title: "RSC Ch.3 — bad boundary example",
  description: "Chapter 3 comparison: client boundary drawn too high",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
