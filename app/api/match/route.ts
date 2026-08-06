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

  const knownLocations = [...new Set(operators.map((o) => o.location.toLowerCase().trim()))].filter(Boolean);
  const textLower = jobDescription.toLowerCase();
  const requestedLocations = knownLocations.filter((l) => textLower.includes(l));
  const locationMiss =
    requestedLocations.length > 0 &&
    !operators.some((o) => requestedLocations.includes(o.location.toLowerCase()));

  const shortlist = operators
    .map((op) => {
      const bacs = computeBacs(op);
      const fit = scoreJobFit(op, jobDescription);
      const locationBonus = requestedLocations.includes(op.location.toLowerCase()) ? 12 : 0;
      return { op, bacs, fit, combined: bacs.score * 0.6 + fit.matchScore * 0.4 + locationBonus };
    })
    .sort((a, b) => b.combined - a.combined)
    .slice(0, 6);

  // Only operators sharing at least one real skill term (machine, terrain, or
  // trade word) with the job description are ever recommended.
  const pool = shortlist.filter((s) => s.fit.matchScore > 0);

  if (pool.length === 0) {
    return Response.json({
      matches: [],
      noExactMatch: true,
      matchedTerms: [],
      locationMiss,
      requestedLocations,
      message:
        "No operator with that skill — or anything closely related — is registered yet. Try different terms, or invite operators to join.",
    });
  }

  const rankedPool = pool.slice(0, 6);
  const maxMatches = Math.min(3, rankedPool.length);

  const matchedTerms = [
    ...new Set(rankedPool.flatMap((s) => [...s.fit.matchedMachines, ...s.fit.matchedTerrains])),
  ];

  const candidates = rankedPool.map(({ op, bacs, fit }) => ({
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

  let ranked: Array<{
    operator: (typeof rankedPool)[number]["op"];
    bacs: (typeof rankedPool)[number]["bacs"];
    fit: (typeof rankedPool)[number]["fit"];
    reason: string;
    aiFit: number;
  }> = [];

  try {
    const { data } = await completeJson<{
      matches: Array<{ id: string; fit: number; reason: string }>;
    }>({
      system:
        "You are a senior recruitment analyst for heavy-equipment operators. Given a job description and a shortlist of verified operators (with BACS scores and evidence), rank the best-fit operators and explain why in plain recruiter language. Never include an operator whose trade and machines share no terms with the job description. Respond with valid JSON only.",
      user: [
        `JOB DESCRIPTION:`,
        jobDescription,
        ``,
        requestedLocations.length > 0
          ? `REQUESTED LOCATION(S): ${requestedLocations.join(", ")}`
          : `REQUESTED LOCATION(S): none detected`,
        locationMiss
          ? "NOTE: No registered operator exists in the requested location. These are skill matches from other locations — present them as suggestions and say so."
          : "",
        ``,
        `SHORTLIST:`,
        JSON.stringify(candidates, null, 2),
        ``,
        `Return JSON: { "matches": [ { "id": "<operator id>", "fit": <0-100>, "reason": "<2 sentence why they fit>" } ] }. Pick up to ${maxMatches}, ordered best first.`,
      ]
        .filter((line) => line !== "")
        .join("\n"),
      maxTokens: 1200,
    });

    ranked = data.matches
      .map((m) => {
        const entry = rankedPool.find((s) => s.op.id === m.id);
        if (!entry) return null;
        return { operator: entry.op, bacs: entry.bacs, fit: entry.fit, reason: m.reason, aiFit: m.fit };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .slice(0, 3);
  } catch {
    ranked = rankedPool.slice(0, 3).map((s) => ({
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
    noExactMatch: false,
    matchedTerms,
    locationMiss,
    requestedLocations,
  });
}
