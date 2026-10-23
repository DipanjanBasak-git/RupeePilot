import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RupeePilot | Personal Finance",
  description: "Plan your income, allocations, and expenses."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
