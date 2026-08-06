import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/config/site";
import "./globals.css";

export const metadata: Metadata = {
  title: "Competence Passport — Verified Skill. Negotiated Rates. Zero Friction.",
  description:
    "AI-verified competence passports for skilled operators. Video proof, international skill normalization, and BACS evidence scoring.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="topnav">
          <Link href="/" className="logo">{SITE.name}</Link>
          <nav>
            <Link href="/">Home</Link>
            <Link href="/skills">Skills</Link>
            <a href="/#matchmaker">Matchmaker</a>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}