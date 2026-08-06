import Link from "next/link";
import { SITE } from "@/config/site";
import { getOperators } from "@/lib/sheet";
import { computeBacs } from "@/lib/bacs";
import { BEHAVIORAL } from "@/lib/behavioral";
import { initials } from "@/lib/format";
import { Matchmaker } from "@/components/Matchmaker";

export const revalidate = 300;

export default async function Home() {
  const operators = await getOperators();

  if (!SITE.sheetCsvUrl) {
    return (
      <main className="container">
        <div className="notice">
          <h1>{SITE.name}</h1>
          <p>Add <code>SHEET_CSV_URL</code> to your Vercel environment variables, then redeploy.</p>
        </div>
      </main>
    );
  }

  const scored = operators
    .map((op) => ({ op, bacs: computeBacs(op) }))
    .sort((a, b) => b.bacs.score - a.bacs.score);

  return (
    <main className="container">
      <header className="hero">
        <p className="eyebrow">{SITE.tagline}</p>
        <h1>Find a verified operator in seconds.</h1>
        <p className="sub">
          Every profile is video-verified, BACS-scored, and ready to negotiate directly —
          no signup, no middlemen. Employers are vetted before connection.
        </p>
        <div className="heroActions">
          <a
            className="btn"
            href={BEHAVIORAL.cta.href(BEHAVIORAL.ownerWhatsapp, BEHAVIORAL.cta.joinMessage())}
            target="_blank"
            rel="noopener noreferrer"
          >
            {BEHAVIORAL.cta.joinLabel}
          </a>
        </div>
      </header>

      <Matchmaker />

      {scored.length === 0 ? (
        <div className="notice">
          <p>No operators found yet. Check your sheet data and try again.</p>
        </div>
      ) : (
        <section className="grid">
          {scored.map(({ op, bacs }) => (
            <article key={op.id} className="card">
              <div className="cardTop">
                <span className="badge" data-status={op.status}>{op.status}</span>
                <span className="score">{bacs.score.toFixed(1)}</span>
              </div>
              <div className="cardIdentity">
                {op.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={op.photoUrl} alt={op.name} className="avatarSmall" />
                ) : (
                  <div className="avatarSmall avatarFallback">{initials(op.name)}</div>
                )}
                <div>
                  <Link href={`/operators/${op.id}`} className="cardName">{op.name}</Link>
                  <p className="trade">{op.trade} · {op.location}</p>
                </div>
              </div>
              <p className="machines">{op.machines.join(" · ") || "Machines: —"}</p>
              <p className="terrains">{op.terrains.join(" · ") || "Terrains: —"}</p>
              <p className="statLine"><strong>{op.seatHours.toLocaleString()}</strong> seat hours</p>
              <div className="evidenceRow">
                <span>{BEHAVIORAL.evidenceLabel}: {bacs.evidenceDensity}%</span>
                <div className="bar">
                  <div className="barFill" style={{ width: `${bacs.evidenceDensity}%` }} />
                </div>
              </div>
              <div className="cardActions">
                <a
                  className="btn btnPrimary"
                  href={BEHAVIORAL.cta.href(op.whatsapp, BEHAVIORAL.cta.hireMessage(op.name, op.trade))}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {BEHAVIORAL.cta.hireLabel}
                </a>
                <Link href={`/operators/${op.id}`} className="btn btnGhost">Profile →</Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
