import { getOperators } from "@/lib/sheet";
import { computeBacs } from "@/lib/bacs";
import { scoreJobFit } from "@/lib/matching";
import { completeJson } from "@/lib/llm";

export const dynamic = "force-dynamic";

interface MatchInput {
  jobDescription?: string;
}

export async function POST(request: Request) {
  let body: MatchInput;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const jobDescription = (body.jobDescription ?? "").trim();
  if (jobDescription.length < 10) {
    return Response.json({ error: "Describe the role in at least a few words." }, { status: 400 });
  }

  const operators = await getOperators();
  if (operators.length === 0) {
    return Response.json({ error: "No operators available yet." }, { status: 404 });
  }

  const shortlist = operators
    .map((op) => {
      const bacs = computeBacs(op);
      const fit = scoreJobFit(op, jobDescription);
      return { op, bacs, fit, combined: bacs.score * 0.6 + fit.matchScore * 0.4 };
    })
    .sort((a, b) => b.combined - a.combined)
    .slice(0, 6);

  const candidates = shortlist.map(({ op, bacs, fit }) => ({
    id: op.id,
    name: op.name,
    trade: op.trade,
    location: op.location,
    seatHours: op.seatHours,
    machines: op.machines,
    terrains: op.terrains,
    certifications: op.certifications,
    bacsScore: bacs.score,
    evidenceDensity: bacs.evidenceDensity,
    fitScore: fit.matchScore,
    matchedMachines: fit.matchedMachines,
    matchedTerrains: fit.matchedTerrains,
  }));

  let ranked: Array<{ operator: (typeof shortlist)[number]["op"]; bacs: (typeof shortlist)[number]["bacs"]; fit: (typeof shortlist)[number]["fit"]; reason: string; aiFit: number }> = [];

  try {
    const { data } = await completeJson<{
      matches: Array<{ id: string; fit: number; reason: string }>;
    }>({
      system:
        "You are a senior recruitment analyst for heavy-equipment operators. Given a job description and a shortlist of verified operators (with BACS scores and evidence), pick the top 3 best-fit operators and explain why in plain recruiter language. Respond with valid JSON only.",
      user: [
        `JOB DESCRIPTION:`,
        jobDescription,
        ``,
        `SHORTLIST:`,
        JSON.stringify(candidates, null, 2),
        ``,
        `Return JSON: { "matches": [ { "id": "<operator id>", "fit": <0-100>, "reason": "<2 sentence why they fit>" } ] }. Pick exactly 3, ordered best first.`,
      ].join("\n"),
      maxTokens: 1200,
    });

    ranked = data.matches
      .map((m) => {
        const entry = shortlist.find((s) => s.op.id === m.id);
        if (!entry) return null;
        return {
          operator: entry.op,
          bacs: entry.bacs,
          fit: entry.fit,
          reason: m.reason,
          aiFit: m.fit,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .slice(0, 3);
  } catch {
    // AI unavailable → deterministic fallback so the demo never breaks
    ranked = shortlist.slice(0, 3).map((s) => ({
      operator: s.op,
      bacs: s.bacs,
      fit: s.fit,
      reason: "Top-ranked by verified BACS score and skill-fit match.",
      aiFit: s.fit.matchScore,
    }));
  }

  return Response.json({
    matches: ranked.map((r) => ({
      operator: {
        id: r.operator.id,
        name: r.operator.name,
        trade: r.operator.trade,
        location: r.operator.location,
        machines: r.operator.machines,
        terrains: r.operator.terrains,
        whatsapp: r.operator.whatsapp,
        seatHours: r.operator.seatHours,
      },
      bacs: { score: r.bacs.score, evidenceDensity: r.bacs.evidenceDensity },
      reason: r.reason,
      fitScore: r.aiFit,
    })),
  });
}
