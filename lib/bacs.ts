import { BACS_CONFIG } from "@/config/bacs";
import type { Operator } from "@/lib/schema";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export interface BacsParts {
  seatHours: number;
  breadth: number;
  environment: number;
  evidence: number;
}

export interface BacsResult {
  score: number; // 7.0 – 9.9
  evidenceDensity: number; // 0 – 100
  parts: BacsParts;
}

export function evidenceDensity(op: Operator): number {
  let score = 0;
  if (op.videoUrl) score += 40;
  score += Math.min(op.certifications.length, 3) * 10; // up to 30
  if (op.whatsapp) score += 15;
  if (op.bio.trim().length > 40) score += 15;
  return clamp(score, 0, 100);
}

export function computeBacs(op: Operator): BacsResult {
  const { weights, curves, scoreBand } = BACS_CONFIG;

  const seatHours = clamp(op.seatHours / curves.seatHoursFull, 0, 1) * 100;
  const breadth = clamp(op.machines.length / curves.machinesFull, 0, 1) * 100;
  const environment = clamp(op.terrains.length / curves.terrainsFull, 0, 1) * 100;
  const evidence = evidenceDensity(op);

  const index =
    weights.seatHours * seatHours +
    weights.breadth * breadth +
    weights.environment * environment +
    weights.evidence * evidence;

  const score = Math.round(
    (scoreBand.min + (index / 100) * (scoreBand.max - scoreBand.min)) * 10,
  ) / 10;

  return {
    score,
    evidenceDensity: Math.round(evidence),
    parts: { seatHours, breadth, environment, evidence },
  };
}