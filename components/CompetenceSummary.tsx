"use client";

import { useEffect, useState } from "react";

interface SummaryData {
  summary: string;
  watchFor: string[];
  provider: string;
}

export function CompetenceSummary({ id }: { id: string }) {
  const [state, setState] = useState<{
    loading: boolean;
    data: SummaryData | null;
    error: string | null;
  }>({ loading: true, data: null, error: null });

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/summary?id=${encodeURIComponent(id)}`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setState({ loading: false, data: json as SummaryData, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ loading: false, data: null, error: String(err) });
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (state.loading) return <p className="muted">Summarizing competence…</p>;
  if (state.error || !state.data?.summary) {
    return <p className="muted">Summary unavailable right now.</p>;
  }

  return (
    <div style={{ marginTop: 12 }}>
      <p>{state.data.summary}</p>
      <p className="muted" style={{ marginTop: 8 }}>What to watch for in the video:</p>
      <ul>
        {state.data.watchFor.map((item, i) => (
          <li key={i} className="muted">{item}</li>
        ))}
      </ul>
    </div>
  );
}
