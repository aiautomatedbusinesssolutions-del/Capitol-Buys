import type { Trade, OwnerType, ConvictionBadge, ConvictionTier } from "./types";
import { rawMockTrades } from "./mockData";

// --- Conviction Score Weights (from PLAN.md §1.3) ---

const AMOUNT_WEIGHT = 40;
const OWNERSHIP_WEIGHT = 30;
const LAG_WEIGHT = 30;

/**
 * Maps a dollar midpoint to a 0–1 weight.
 * Thresholds from PLAN.md Amount Weight table.
 */
function getAmountWeight(midpoint: number): number {
  if (midpoint >= 1_000_001) return 1.0;
  if (midpoint >= 500_001) return 0.9;
  if (midpoint >= 250_001) return 0.8;
  if (midpoint >= 100_001) return 0.65;
  if (midpoint >= 50_001) return 0.45;
  if (midpoint >= 15_001) return 0.25;
  return 0.1;
}

/**
 * Maps ownership type to a 0–1 weight.
 * Self = strongest signal, Spouse = weakest in this model.
 */
function getOwnershipWeight(owner: OwnerType): number {
  const weights: Record<OwnerType, number> = {
    Self: 1.0,
    Joint: 0.75,
    Spouse: 0.5,
  };
  return weights[owner];
}

/**
 * Maps reporting lag (days) to a 0–1 weight.
 * Faster disclosure = higher conviction.
 */
function getLagWeight(daysToDisclose: number): number {
  if (daysToDisclose <= 15) return 1.0;
  if (daysToDisclose <= 30) return 0.7;
  if (daysToDisclose <= 45) return 0.4;
  if (daysToDisclose <= 90) return 0.2;
  return 0.05;
}

/**
 * Computes the conviction score (0–100) for a trade.
 */
export function computeConvictionScore(
  amountMidpoint: number,
  ownerType: OwnerType,
  daysToDisclose: number,
): number {
  const score =
    getAmountWeight(amountMidpoint) * AMOUNT_WEIGHT +
    getOwnershipWeight(ownerType) * OWNERSHIP_WEIGHT +
    getLagWeight(daysToDisclose) * LAG_WEIGHT;

  return Math.round(score);
}

/**
 * Calculates the number of days between two ISO date strings.
 */
function daysBetween(dateA: string, dateB: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const a = new Date(dateA);
  const b = new Date(dateB);
  return Math.round(Math.abs(b.getTime() - a.getTime()) / msPerDay);
}

/**
 * Returns the conviction tier and display info for a given score.
 */
export function getConvictionBadge(score: number): ConvictionBadge {
  if (score >= 75)
    return { tier: "high", label: "Strong Signal", color: "emerald" };
  if (score >= 40)
    return { tier: "medium", label: "Moderate Signal", color: "amber" };
  return { tier: "low", label: "Weak Signal", color: "rose" };
}

/**
 * Returns the color tier for a reporting lag value.
 */
export function getLagColor(
  daysToDisclose: number,
): "emerald" | "amber" | "rose" {
  if (daysToDisclose <= 15) return "emerald";
  if (daysToDisclose <= 45) return "amber";
  return "rose";
}

// --- Main Data Function ---

/**
 * Fetches congressional trades. Currently returns mock data
 * with computed daysSinceTrade and convictionScore.
 *
 * When we integrate Quiver API, only the data source changes —
 * the computation logic stays the same.
 */
export function getCongressTrades(): Trade[] {
  const today = new Date().toISOString().split("T")[0];

  return rawMockTrades.map((raw) => ({
    ...raw,
    daysSinceTrade: daysBetween(raw.transactionDate, today),
    convictionScore: computeConvictionScore(
      raw.amountMidpoint,
      raw.ownerType,
      raw.daysToDisclose,
    ),
  }));
}
