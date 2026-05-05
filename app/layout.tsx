import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DIRECT YOUR LIFE",
  description: "A playful story game about how your choices can change your life."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
