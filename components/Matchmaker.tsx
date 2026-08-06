"use client";

import { useState } from "react";
import Link from "next/link";
import { BEHAVIORAL } from "@/lib/behavioral";

interface MatchResult {
  operator: {
    id: string;
    name: string;
    trade: string;
    location: string;
    machines: string[];
    terrains: string[];
    whatsapp: string;
    seatHours: number;
  };
  bacs: { score: number; evidenceDensity: number };
  reason: string;
  fitScore: number;
}

export function Matchmaker() {
  const [job, setJob] = useState("");
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<MatchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runMatch() {
    if (job.trim().length < 10) return;
    setLoading(true);
    setError(null);
    setMatches(null);
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: job }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Match failed.");
      setMatches(json.matches);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="matchmaker">
      <h2 className="sectionTitle">Recruiter matchmaker</h2>
      <p className="muted">
        Paste a job description. AI ranks the top 3 verified operators and explains why they fit.
      </p>
      <textarea
        value={job}
        onChange={(e) => setJob(e.target.value)}
        placeholder="e.g. Need an excavator operator with mining pit experience for a 6-month site in Kogi. Must have 4000+ seat hours and safety certification. Wheel loader experience a plus."
        rows={4}
      />
      <button
        className="btn btnPrimary"
        onClick={runMatch}
        disabled={loading || job.trim().length < 10}
      >
        {loading ? "Matching…" : "Find top 3 operators"}
      </button>

      {error && <p className="error">{error}</p>}

      {matches && (
        <div className="matchList">
          {matches.map((m, i) => (
            <div key={m.operator.id} className="matchCard">
              <div className="matchRank">{i + 1}</div>
              <div className="matchBody">
                <div className="matchTop">
                  <Link href={`/operators/${m.operator.id}`} className="cardName">
                    {m.operator.name}
                  </Link>
                  <span className="score">{m.bacs.score.toFixed(1)}</span>
                </div>
                <p className="trade">
                  {m.operator.trade} · {m.operator.location} · {m.operator.seatHours.toLocaleString()} hrs
                </p>
                <p className="muted reason">{m.reason}</p>
                <div className="cardActions">
                  <a
                    className="btn btnPrimary"
                    href={BEHAVIORAL.cta.href(
                      m.operator.whatsapp,
                      BEHAVIORAL.cta.hireMessage(m.operator.name, m.operator.trade),
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {BEHAVIORAL.cta.hireLabel}
                  </a>
                  <Link href={`/operators/${m.operator.id}`} className="btn btnGhost">
                    Profile →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
