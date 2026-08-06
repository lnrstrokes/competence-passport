import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Competence Passport — Verified Skill. Negotiated Rates. Zero Friction.",
  description:
    "AI-verified competence passports for skilled operators. Video proof, international skill normalization, and BACS evidence scoring.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}