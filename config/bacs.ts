/**
 * ⚠️ PROPRIETARY — BACS Methodology.
 * These weights and curves are the intellectual property of the BACS
 * framework. Do not distribute or reproduce. Tune values here without
 * touching lib/bacs.ts logic.
 */
export const BACS_CONFIG = {
  scoreBand: { min: 7.0, max: 9.9 },
  weights: {
    seatHours: 0.4,
    breadth: 0.2,
    environment: 0.2,
    evidence: 0.2,
  },
  curves: {
    seatHoursFull: 5000,
    machinesFull: 5,
    terrainsFull: 4,
  },
} as const;