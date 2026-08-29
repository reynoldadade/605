import "./globals.css";

export const metadata = {
  title: "RSC Ch.3 — prop-drilling sign",
  description: "Chapter 3: a boundary placed too high forces a long, unused prop list",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
