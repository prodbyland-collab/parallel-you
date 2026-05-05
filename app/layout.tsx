import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Parallel You",
  description: "Generate alternate versions of your life from tiny decisions."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
