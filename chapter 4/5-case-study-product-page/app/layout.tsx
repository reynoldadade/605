export const metadata = { title: "Ch4 — Case Study: Product Page" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui", maxWidth: 640, margin: "40px auto" }}>
        {children}
      </body>
    </html>
  );
}
