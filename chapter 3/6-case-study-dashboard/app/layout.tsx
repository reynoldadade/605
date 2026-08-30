import "./globals.css";

export const metadata = {
  title: "RSC Ch.3 — case study: dashboard redesign",
  description: "Chapter 3 case study: before/after of a dashboard's component boundaries",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
