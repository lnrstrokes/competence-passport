import Link from "next/link";
import type { Operator } from "@/lib/schema";
import type { BacsResult } from "@/lib/bacs";
import { BEHAVIORAL } from "@/lib/behavioral";
import { initials } from "@/lib/format";

export function OperatorCard({ op, bacs }: { op: Operator; bacs: BacsResult }) {
  return (
    <article className="card">
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
  );
}