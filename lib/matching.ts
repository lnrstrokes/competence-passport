import type { Operator } from "@/lib/schema";

export interface JobFit {
  matchScore: number; // 0-100
  matchedMachines: string[];
  matchedTerrains: string[];
  matchedTerms: string[];
}

const TRADE_STOPWORDS = new Set([
  "operator",
  "driver",
  "worker",
  "specialist",
  "handler",
  "engineer",
]);

export function scoreJobFit(op: Operator, jobText: string): JobFit {
  const text = jobText.toLowerCase();

  const matchedMachines = op.machines.filter((m) => text.includes(m.toLowerCase()));
  const matchedTerrains = op.terrains.filter((t) => text.includes(t.toLowerCase()));

  const tradeWords = op.trade.toLowerCase().split(/\s+/);
  const matchedTradeWords = tradeWords.filter(
    (w) => !TRADE_STOPWORDS.has(w) && text.includes(w),
  );
  const tradeHit = matchedTradeWords.length > 0 ? 1 : 0;

  const machineScore = op.machines.length === 0 ? 0 : (matchedMachines.length / op.machines.length) * 60;
  const terrainScore = op.terrains.length === 0 ? 0 : (matchedTerrains.length / op.terrains.length) * 25;
  const tradeScore = tradeHit * 15;

  const matchedTerms = [
    ...new Set([...matchedMachines, ...matchedTerrains, ...matchedTradeWords]),
  ];

  return {
    matchScore: Math.round(machineScore + terrainScore + tradeScore),
    matchedMachines,
    matchedTerrains,
    matchedTerms,
  };
}
