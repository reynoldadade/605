import "./globals.css";

export const metadata = {
  title: "RSC Ch.3 — good boundary example",
  description: "Chapter 3 comparison: client boundary pushed to the leaves",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
