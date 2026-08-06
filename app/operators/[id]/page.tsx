import Link from "next/link";
import { notFound } from "next/navigation";
import { getOperators } from "@/lib/sheet";
import { computeBacs } from "@/lib/bacs";
import { BEHAVIORAL } from "@/lib/behavioral";
import { initials, videoEmbedUrl } from "@/lib/format";
import { CompetenceSummary } from "@/components/CompetenceSummary";
import { ShareProfile } from "@/components/ShareProfile";

export const revalidate = 300;

export default async function OperatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const operators = await getOperators();
  const op = operators.find((o) => o.id === id);
  if (!op) notFound();

  const bacs = computeBacs(op);
  const embed = videoEmbedUrl(op.videoUrl);
  const hireHref = BEHAVIORAL.cta.href(op.whatsapp, BEHAVIORAL.cta.hireMessage(op.name, op.trade));
  const testHref = BEHAVIORAL.cta.href(op.whatsapp, BEHAVIORAL.cta.testMessage(op.name, op.trade));

  return (
    <main className="container">
      <Link href="/" className="back">← All operators</Link>

      <section className="profile">
        <div className="profileHeader">
          {op.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={op.photoUrl} alt={op.name} className="avatar" />
          ) : (
            <div className="avatar avatarFallback">{initials(op.name)}</div>
          )}
          <div style={{ flex: 1 }}>
            <div className="cardTop" style={{ justifyContent: "flex-start", gap: 10 }}>
              <span className="badge" data-status={op.status}>{op.status}</span>
              <span className="score">{bacs.score.toFixed(1)}</span>
              <span className="muted" style={{ fontSize: "0.8rem" }}>
                {BEHAVIORAL.scoreLabel} · {BEHAVIORAL.evidenceLabel} {bacs.evidenceDensity}%
              </span>
            </div>
            <h1>{op.name}</h1>
            <p className="trade">{op.trade} · {op.location}</p>
          </div>
        </div>

        <div className="statGrid">
          <div className="statTile"><div className="num">{op.seatHours.toLocaleString()}</div><div className="lbl">Seat hours</div></div>
          <div className="statTile"><div className="num">{op.machines.length}</div><div className="lbl">Machines</div></div>
          <div className="statTile"><div className="num">{op.terrains.length}</div><div className="lbl">Terrains</div></div>
          <div className="statTile"><div className="num">{op.certifications.length}</div><div className="lbl">Certifications</div></div>
        </div>

        <div className="callout">
          <strong>Employer vetting:</strong> employers are vetted before being connected to operators.
          Hire and competence-test requests are screened to prevent wasted investment.
        </div>

        {embed && (
          <div>
            <h2 className="sectionTitle">Video proof</h2>
            <div className="videoFrame">
              <iframe src={embed} title={`${op.name} proof of skill`} loading="lazy" allowFullScreen />
            </div>
            <CompetenceSummary id={op.id} />
          </div>
        )}

        <div>
          <h2 className="sectionTitle">Machines I can confidently operate</h2>
          <div className="chips">
            {op.machines.map((m) => <span key={m} className="chip">⚙ {m}</span>)}
            {op.machines.length === 0 && <span className="muted">No machines listed yet.</span>}
          </div>
        </div>

        <div>
          <h2 className="sectionTitle">Terrains I&apos;m good at / have worked on</h2>
          <div className="chips">
            {op.terrains.map((t) => <span key={t} className="chip">⛰ {t}</span>)}
            {op.terrains.length === 0 && <span className="muted">No terrains listed yet.</span>}
          </div>
        </div>

        <div>
          <h2 className="sectionTitle">Certifications & credentials</h2>
          <div className="chips">
            {op.certifications.map((c) => <span key={c} className="chip">✓ {c}</span>)}
            {op.certifications.length === 0 && <span className="muted">None listed.</span>}
          </div>
        </div>

        {op.bio && <p className="muted">{op.bio}</p>}

        <div>
          <h2 className="sectionTitle">How this score was calculated</h2>
          <ScoreBar label="Verified seat hours" value={bacs.parts.seatHours} />
          <ScoreBar label="Machine breadth" value={bacs.parts.breadth} />
          <ScoreBar label="Environment mastery" value={bacs.parts.environment} />
          <ScoreBar label="Evidence density" value={bacs.evidenceDensity} />
          <p className="muted" style={{ fontSize: "0.82rem", marginTop: 8 }}>
            The BACS score (7.0–9.9) weighs verified seat hours, machine breadth, environment
            mastery, and evidence density. The exact weights are proprietary — but these four
            components are exactly what feeds the score.
          </p>
        </div>

        <div className="ctaRow">
          <a className="btn btnPrimary" href={hireHref} target="_blank" rel="noopener noreferrer">
            {BEHAVIORAL.cta.hireLabel}
          </a>
          <a className="btn" href={testHref} target="_blank" rel="noopener noreferrer">
            {BEHAVIORAL.cta.testLabel}
          </a>
          <ShareProfile path={`/operators/${op.id}`} name={op.name} />
        </div>
        <p className="muted" style={{ fontSize: "0.82rem" }}>
          Requesting a competence test: the employer covers equipment rental and associated
          charges — you gain certainty before you hire.
        </p>
      </section>
    </main>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="breakdownRow">
      <div className="rowTop"><span>{label}</span><span>{Math.round(value)}%</span></div>
      <div className="bar"><div className="barFill" style={{ width: `${Math.round(value)}%` }} /></div>
    </div>
  );
}
