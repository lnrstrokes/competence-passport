import Link from "next/link";
import { SITE } from "@/config/site";
import { getOperators } from "@/lib/sheet";
import { computeBacs } from "@/lib/bacs";
import { BEHAVIORAL } from "@/lib/behavioral";

export const revalidate = 300;

export default async function Home() {
  if (!SITE.sheetCsvUrl) {
    return (
      <main className="container">
        <div className="notice">
          <h1>{SITE.name}</h1>
          <p>
            Add <code>SHEET_CSV_URL</code> to your Vercel environment variables,
            then redeploy.
          </p>
        </div>
      </main>
    );
  }

  const operators = await getOperators();
  const scored = operators
    .map((op) => ({ op, bacs: computeBacs(op) }))
    .sort((a, b) => b.bacs.score - a.bacs.score);

  return (
    <main className="container">
      <header className="hero">
        <p className="eyebrow">{SITE.tagline}</p>
        <h1>Find a verified operator in seconds.</h1>
        <p className="sub">
          Every profile is video-verified, BACS-scored, and ready to negotiate
          directly — no signup, no middlemen.
        </p>
      </header>

      <section className="grid">
        {scored.map(({ op, bacs }) => (
          <Link key={op.id} href={`/operators/${op.id}`} className="card">
            <div className="cardTop">
              <span className="badge" data-status={op.status}>{op.status}</span>
              <span className="score">{bacs.score.toFixed(1)}</span>
            </div>
            <h2>{op.name}</h2>
            <p className="trade">{op.trade} · {op.location}</p>
            <p className="machines">{op.machines.join(" · ") || "Machines: —"}</p>
            <p className="terrains">{op.terrains.join(" · ") || "Terrains: —"}</p>
            <div className="evidenceRow">
              <span>{BEHAVIORAL.evidenceLabel}: {bacs.evidenceDensity}%</span>
              <div className="bar">
                <div className="barFill" style={{ width: `${bacs.evidenceDensity}%` }} />
              </div>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}