import { getOperators } from "@/lib/sheet";
import { computeBacs } from "@/lib/bacs";
import { scoreJobFit } from "@/lib/matching";
import { completeJson } from "@/lib/llm";

export const dynamic = "force-dynamic";

interface MatchInput {
  jobDescription?: string;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
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
  const requestedLocation = requestedLocations[0] ?? null;

  const inLocation = requestedLocation
    ? operators.filter((o) => o.location.toLowerCase() === requestedLocation)
    : [];
  const tradesInLocation = [...new Set(inLocation.map((o) => o.trade))];

  const shortlist = operators
    .map((op) => {
      const bacs = computeBacs(op);
      const fit = scoreJobFit(op, jobDescription);
      const locationBonus = requestedLocations.includes(op.location.toLowerCase()) ? 12 : 0;
      return { op, bacs, fit, combined: bacs.score * 0.6 + fit.matchScore * 0.4 + locationBonus };
    })
    .sort((a, b) => b.combined - a.combined)
    .slice(0, 6);

  const pool = shortlist.filter((s) => s.fit.matchScore > 0);
  const skillMatchedInLocation = inLocation.some((o) => {
    const f = scoreJobFit(o, jobDescription);
    return f.matchScore > 0;
  });
  const skillMatchedElsewhere = pool.some(
    (s) => !requestedLocation || s.op.location.toLowerCase() !== requestedLocation,
  );

  // Deterministic query diagnosis — works even when AI is unavailable
  let advice: string;
  if (!requestedLocation) {
    advice =
      "No location was specified — matches are ranked nationally. Add a city or state to narrow results.";
  } else if (inLocation.length === 0) {
    advice = `No registered operators in ${capitalize(requestedLocation)} at all. Matching skills exist elsewhere — consider relocation terms or the competence-test option.`;
  } else if (!skillMatchedInLocation && skillMatchedElsewhere) {
    advice = `Operators exist in ${capitalize(requestedLocation)} (${tradesInLocation.join(", ") || "various trades"}), but none match the requested skill there. The best skill match is located elsewhere.`;
  } else if (skillMatchedInLocation) {
    advice = `Matching operators found in ${capitalize(requestedLocation)}. Review the top matches below.`;
  } else {
    advice = "No operator matches the requested skill anywhere yet. Try different terms or invite operators to join.";
  }

  const diagnosis = {
    requestedLocation,
    operatorsInLocation: inLocation.length,
    tradesInLocation,
    skillMatchedInLocation,
    skillMatchedElsewhere,
    advice,
  };

  if (pool.length === 0) {
    return Response.json({
      matches: [],
      noExactMatch: true,
      matchedTerms: [],
      diagnosis,
      llmOk: false,
      message:
        "No operator with that skill — or anything closely related — is registered yet. Try different terms, or invite operators to join.",
    });
  }

  const rankedPool = pool.slice(0, 6);
  const maxMatches = Math.min(3, rankedPool.length);

  const matchedTerms = [...new Set(rankedPool.flatMap((s) => s.fit.matchedTerms))];

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
  let llmOk = false;

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
        requestedLocation ? `REQUESTED LOCATION: ${requestedLocation}` : "REQUESTED LOCATION: none detected",
        advice,
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
    llmOk = ranked.length > 0;
  } catch {
    llmOk = false;
  }

  if (!llmOk) {
    // Informative deterministic fallback — names the match and the trade-off
    ranked = rankedPool.slice(0, 3).map((s) => ({
      operator: s.op,
      bacs: s.bacs,
      fit: s.fit,
      reason:
        s.fit.matchedTerms.length > 0
          ? `Matched on: ${s.fit.matchedTerms.join(", ")}. BACS ${s.bacs.score.toFixed(1)} — ${requestedLocation && s.op.location.toLowerCase() !== requestedLocation ? `located in ${s.op.location} (not ${capitalize(requestedLocation)}).` : `located in ${s.op.location}.`}`
          : `Verified ${s.op.trade.toLowerCase()} with BACS ${s.bacs.score.toFixed(1)}.`,
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
    diagnosis,
    llmOk,
  });
}
