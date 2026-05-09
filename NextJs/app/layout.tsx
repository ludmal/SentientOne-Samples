import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SentientOne · Next.js Sample",
  description: "Minimal Next.js sample that calls a SentientOne agent."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
