import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DIRECT YOUR LIFE",
  description: "A cinematic interactive story game about the life your choices create."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
