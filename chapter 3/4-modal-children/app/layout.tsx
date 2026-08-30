import "./globals.css";

export const metadata = {
  title: "RSC Ch.3 — Server Components as children",
  description: "Chapter 3: a Client Component providing chrome around Server Component content passed as children",
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
