import type { Trade, OwnerType, ConvictionBadge, DataSource } from "./types";
import { rawMockTrades } from "./mockData";

// =====================================================================
//  CONVICTION SCORE ENGINE (from PLAN.md §1.3)
// =====================================================================

const AMOUNT_WEIGHT = 40;
const OWNERSHIP_WEIGHT = 30;
const LAG_WEIGHT = 30;

function getAmountWeight(midpoint: number): number {
  if (midpoint >= 1_000_001) return 1.0;
  if (midpoint >= 500_001) return 0.9;
  if (midpoint >= 250_001) return 0.8;
  if (midpoint >= 100_001) return 0.65;
  if (midpoint >= 50_001) return 0.45;
  if (midpoint >= 15_001) return 0.25;
  return 0.1;
}

function getOwnershipWeight(owner: OwnerType): number {
  const weights: Record<OwnerType, number> = {
    Self: 1.0,
    Joint: 0.75,
    Spouse: 0.5,
  };
  return weights[owner];
}

function getLagWeight(daysToDisclose: number): number {
  if (daysToDisclose <= 15) return 1.0;
  if (daysToDisclose <= 30) return 0.7;
  if (daysToDisclose <= 45) return 0.4;
  if (daysToDisclose <= 90) return 0.2;
  return 0.05;
}

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

// =====================================================================
//  DISPLAY HELPERS (used by components)
// =====================================================================

export function getConvictionBadge(score: number): ConvictionBadge {
  if (score >= 75)
    return { tier: "high", label: "Strong Signal", color: "emerald" };
  if (score >= 40)
    return { tier: "medium", label: "Moderate Signal", color: "amber" };
  return { tier: "low", label: "Weak Signal", color: "rose" };
}

export function getLagColor(
  daysToDisclose: number,
): "emerald" | "amber" | "rose" {
  if (daysToDisclose <= 15) return "emerald";
  if (daysToDisclose <= 45) return "amber";
  return "rose";
}

// =====================================================================
//  SHARED UTILITIES
// =====================================================================

function daysBetween(dateA: string, dateB: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const a = new Date(dateA);
  const b = new Date(dateB);
  return Math.round(Math.abs(b.getTime() - a.getTime()) / msPerDay);
}

/** Parse amount range string → estimated midpoint dollar value.
 *  Handles: "$500,001 - $1,000,000", "500K-1M", "1M-5M", "< 1K", "$1,000,001+" */
function parseAmountMidpoint(amount: string): number {
  const cleaned = amount.replace(/[$,]/g, "").trim();

  // "$1,000,001+" or "Over $1,000,000"
  if (cleaned.includes("+") || /over/i.test(cleaned)) return 5_000_000;

  // "< 1K" or "Under 1K"
  if (/^<|under/i.test(cleaned)) return 500;

  // Shorthand: "1M-5M", "500K-1M", "100K-250K", "50K-100K", "15K-50K"
  const shortMatch = cleaned.match(/([\d.]+)(K|M)\s*-\s*([\d.]+)(K|M)/i);
  if (shortMatch) {
    const mul = (u: string) => (u.toUpperCase() === "M" ? 1_000_000 : 1_000);
    const low = parseFloat(shortMatch[1]) * mul(shortMatch[2]);
    const high = parseFloat(shortMatch[3]) * mul(shortMatch[4]);
    return Math.round((low + high) / 2);
  }

  // Standard: "$500,001 - $1,000,000"
  const match = cleaned.match(/([\d]+)\s*-\s*([\d]+)/);
  if (match) {
    const low = parseInt(match[1], 10);
    const high = parseInt(match[2], 10);
    return Math.round((low + high) / 2);
  }

  return 8_000; // safe fallback — smallest bracket midpoint
}

// =====================================================================
//  SECTOR INSIGHT MAP (from PLAN.md §1.4)
// =====================================================================

const SECTOR_INSIGHTS: Record<string, string> = {
  technology: "Tech Expansion",
  energy: "Energy Shift",
  healthcare: "Healthcare Play",
  finance: "Banking Bet",
  financials: "Banking Bet",
  defense: "Defense & Security",
  "real estate": "Property Move",
  "consumer goods": "Consumer Bet",
  "consumer discretionary": "Consumer Bet",
  "consumer staples": "Consumer Bet",
  industrials: "Infrastructure Play",
  telecommunications: "Connectivity Bet",
  "communication services": "Connectivity Bet",
  utilities: "Utilities Play",
  materials: "Materials & Mining",
};

function getSectorInsight(sector: string): string {
  return SECTOR_INSIGHTS[sector.toLowerCase()] ?? "Diversified Trade";
}

// =====================================================================
//  UNIFIED TRANSFORMER — normalize any source into Trade[]
// =====================================================================

/**
 * Enriches a partially-built trade with computed fields.
 * Called after each source-specific transformer produces a base trade.
 */
function enrichTrade(
  base: Omit<Trade, "daysSinceTrade" | "convictionScore">,
): Trade {
  const today = new Date().toISOString().split("T")[0];
  return {
    ...base,
    daysSinceTrade: daysBetween(base.transactionDate, today),
    convictionScore: computeConvictionScore(
      base.amountMidpoint,
      base.ownerType,
      base.daysToDisclose,
    ),
  };
}

// =====================================================================
//  LEVEL 1: Quiver Quantitative API
// =====================================================================

// Expected shape from Quiver's /beta/live/congresstrading endpoint
interface QuiverTrade {
  Representative: string;
  BioGuideID?: string;
  District?: string;
  Party?: string;
  Chamber?: string;
  Ticker?: string;
  Transaction?: string;
  Amount?: string;
  Date?: string;          // transaction date, e.g. "2025-02-10"
  DateRecieved?: string;  // disclosure date (sic — Quiver's typo matches the source)
  Owner?: string;
  AssetDescription?: string;
}

function transformQuiver(raw: QuiverTrade, index: number): Omit<Trade, "daysSinceTrade" | "convictionScore"> | null {
  const ticker = raw.Ticker?.trim();
  if (!ticker || ticker === "--" || ticker === "N/A") return null;

  const transactionDate = raw.Date ?? "";
  const disclosureDate = raw.DateRecieved ?? transactionDate;
  if (!transactionDate) return null;

  const ownerRaw = (raw.Owner ?? "self").toLowerCase();
  const ownerType: OwnerType =
    ownerRaw.includes("spouse") ? "Spouse" :
    ownerRaw.includes("joint") ? "Joint" : "Self";

  const txType = (raw.Transaction ?? "").toLowerCase();
  const type = txType.includes("sale") ? "sell" as const : "buy" as const;

  const amountRange = raw.Amount ?? "$1,001 - $15,000";
  const amountMidpoint = parseAmountMidpoint(amountRange);
  const daysToDisclose = daysBetween(transactionDate, disclosureDate);

  // Parse district → state abbreviation (e.g., "CA05" → "CA")
  const district = raw.District ?? "";
  const state = district.replace(/\d+/g, "") || "--";

  const chamber: "Senate" | "House" =
    (raw.Chamber ?? "").toLowerCase() === "senate" ? "Senate" : "House";

  const party = (raw.Party ?? "").toUpperCase();
  const partyNorm: "D" | "R" | "I" =
    party.startsWith("D") ? "D" :
    party.startsWith("R") ? "R" : "I";

  return {
    id: `q-${index}`,
    politicianName: raw.Representative ?? "Unknown",
    party: partyNorm,
    chamber,
    state,
    ticker,
    company: raw.AssetDescription ?? ticker,
    sector: "Unknown", // Quiver doesn't provide sector
    type,
    amountRange,
    amountMidpoint,
    ownerType,
    transactionDate,
    disclosureDate,
    daysToDisclose,
    committees: [],
    sectorInsight: getSectorInsight("Unknown"),
    source: "quiver",
  };
}

async function fetchFromQuiver(): Promise<Trade[] | null> {
  const apiKey = process.env.QUIVER_API_KEY;
  if (!apiKey || apiKey === "replace_me") return null;

  try {
    const res = await fetch(
      "https://api.quiverquant.com/beta/live/congresstrading",
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        next: { revalidate: 3600 }, // cache for 1 hour
      },
    );

    if (!res.ok) {
      console.warn(`[Quiver] API returned ${res.status} — falling through.`);
      return null;
    }

    const data: QuiverTrade[] = await res.json();

    const trades = data
      .map((item, i) => transformQuiver(item, i))
      .filter((t): t is Omit<Trade, "daysSinceTrade" | "convictionScore"> => t !== null)
      .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate))
      .slice(0, 50)
      .map(enrichTrade);

    console.log(`[Quiver] Loaded ${trades.length} trades.`);
    return trades.length > 0 ? trades : null;
  } catch (err) {
    console.warn("[Quiver] Fetch failed:", err);
    return null;
  }
}

// =====================================================================
//  LEVEL 1: Politician Trade Tracker (RapidAPI — free tier)
// =====================================================================

/** Parse dates in multiple formats to ISO "YYYY-MM-DD".
 *  Handles: "YYYY-MM-DD", "MM/DD/YYYY", ISO-8601, "January 16, 2026" */
function normalizeDate(raw: string): string {
  if (!raw || raw === "--") return "";

  // Already ISO date
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  // ISO-8601 with time component → strip time
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) return raw.split("T")[0];

  // MM/DD/YYYY → YYYY-MM-DD
  const slashParts = raw.split("/");
  if (slashParts.length === 3) {
    const [mm, dd, yyyy] = slashParts;
    if (parseInt(yyyy) < 2000) return "";
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }

  // "January 16, 2026" or "March 04, 2024" → YYYY-MM-DD
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 2000) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  return "";
}

// Shape returned by /get_politicians (object keyed by politician name)
interface PoliticianIndex {
  [name: string]: {
    State: string;
    Party: string;
    TradeVolume: string;
    Trades: number;
    Issuers: number;
    LastTraded: string; // "YYYY-MM-DD"
  };
}

// Shape of each trade inside /get_profile → "Trade Data" array
interface RapidApiTrade {
  name: string;
  party: string;               // "Democrat" | "Republican"
  chamber: string;             // "House" | "Senate"
  state_abbreviation: string;  // "CA"
  state_name: string;
  company: string;
  ticker: string;              // "NVDA:US" — includes exchange suffix
  trade_date: string;          // "January 16, 2026"
  days_until_disclosure: number;
  trade_type: string;          // "buy" | "sell" | "exchange"
  trade_amount: string;        // "1M-5M", "500K-1M", "100K-250K", "< 1K"
  value_at_purchase: string;   // "$40.17" or "N/A"
}

const RAPID_API_BASE = "https://politician-trade-tracker1.p.rapidapi.com";
const RAPID_API_HOST = "politician-trade-tracker1.p.rapidapi.com";

/** Normalize display amount like "1M-5M" to a user-friendly label. */
function formatAmountRange(raw: string): string {
  const map: Record<string, string> = {
    "< 1K":       "$1 - $1,000",
    "1K-15K":     "$1,001 - $15,000",
    "15K-50K":    "$15,001 - $50,000",
    "50K-100K":   "$50,001 - $100,000",
    "100K-250K":  "$100,001 - $250,000",
    "250K-500K":  "$250,001 - $500,000",
    "500K-1M":    "$500,001 - $1,000,000",
    "1M-5M":      "$1,000,001 - $5,000,000",
    "5M-25M":     "$5,000,001 - $25,000,000",
    "25M-50M":    "$25,000,001 - $50,000,000",
    "50M+":       "$50,000,001+",
  };
  return map[raw] ?? raw;
}

function transformRapidApiTrade(
  raw: RapidApiTrade,
  index: number,
): Omit<Trade, "daysSinceTrade" | "convictionScore"> | null {
  // --- Ticker (required, strip ":US" suffix) ---
  const rawTicker = (raw.ticker ?? "").trim();
  if (!rawTicker || rawTicker === "N/A" || rawTicker === "--") return null;
  const ticker = rawTicker.replace(/:US$/i, "");

  // --- Transaction type (skip "exchange" — not a buy or sell) ---
  const txRaw = (raw.trade_type ?? "").toLowerCase();
  if (txRaw === "exchange") return null;
  const type = txRaw.includes("sell") || txRaw.includes("sale")
    ? "sell" as const
    : "buy" as const;

  // --- Date ---
  const transactionDate = normalizeDate(raw.trade_date ?? "");
  if (!transactionDate) return null;

  // --- Disclosure date (computed from trade_date + days_until_disclosure) ---
  const daysToDisclose = raw.days_until_disclosure ?? 0;
  const txMs = new Date(transactionDate).getTime();
  const disclosureMs = txMs + daysToDisclose * 86_400_000;
  const disclosureDate = new Date(disclosureMs).toISOString().split("T")[0];

  // --- Party ---
  const partyRaw = (raw.party ?? "").toUpperCase();
  const party: "D" | "R" | "I" =
    partyRaw.includes("DEMOCRAT") ? "D" :
    partyRaw.includes("REPUBLICAN") ? "R" : "I";

  // --- Chamber ---
  const chamber: "Senate" | "House" =
    (raw.chamber ?? "").toLowerCase().includes("senate") ? "Senate" : "House";

  // --- Amount ---
  const amountRange = formatAmountRange(raw.trade_amount ?? "1K-15K");
  const amountMidpoint = parseAmountMidpoint(raw.trade_amount ?? "1K-15K");

  return {
    id: `rapid-${index}`,
    politicianName: raw.name ?? "Unknown",
    party,
    chamber,
    state: raw.state_abbreviation ?? "--",
    ticker,
    company: raw.company ?? ticker,
    sector: "Unknown",
    type,
    amountRange,
    amountMidpoint,
    ownerType: "Self", // API doesn't provide ownership info
    transactionDate,
    disclosureDate,
    daysToDisclose,
    committees: [],
    sectorInsight: getSectorInsight("Unknown"),
    source: "public",
  };
}

async function rapidApiFetch(path: string, apiKey: string): Promise<Response> {
  return fetch(`${RAPID_API_BASE}${path}`, {
    headers: {
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": RAPID_API_HOST,
    },
    cache: "no-store",
  });
}

async function fetchFromRapidApi(): Promise<Trade[] | null> {
  const apiKey = process.env.RAPID_API_KEY;
  if (!apiKey || apiKey === "your_free_key_here") return null;

  try {
    // Step 1: Fetch politician index
    const indexRes = await rapidApiFetch("/get_politicians", apiKey);
    if (!indexRes.ok) {
      const errBody = await indexRes.text().catch(() => "(unreadable)");
      console.warn(
        `[RapidAPI] /get_politicians returned ${indexRes.status} — ${errBody}\n` +
        `  X-RapidAPI-Key: ${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`,
      );
      return null;
    }

    const index: PoliticianIndex = await indexRes.json();

    // Step 2: Sort by LastTraded desc, pick top 10 most recently active
    const topPoliticians = Object.entries(index)
      .filter(([, info]) => info.LastTraded)
      .sort(([, a], [, b]) => b.LastTraded.localeCompare(a.LastTraded))
      .slice(0, 10)
      .map(([name]) => name);

    if (topPoliticians.length === 0) {
      console.warn("[RapidAPI] No politicians found in index.");
      return null;
    }

    // Step 3: Fetch profiles in parallel
    const profilePromises = topPoliticians.map(async (name) => {
      try {
        const res = await rapidApiFetch(
          `/get_profile?name=${encodeURIComponent(name)}`,
          apiKey,
        );
        if (!res.ok) return [];
        const profile = await res.json();
        const tradeData: RapidApiTrade[] = profile["Trade Data"] ?? [];
        return tradeData;
      } catch {
        return [];
      }
    });

    const allProfiles = await Promise.all(profilePromises);
    const allRawTrades = allProfiles.flat();

    if (allRawTrades.length === 0) {
      console.warn("[RapidAPI] No trade records found across profiles.");
      return null;
    }

    // Step 4: Transform, sort by date desc, take top 50
    const trades = allRawTrades
      .map((item, i) => transformRapidApiTrade(item, i))
      .filter((t): t is Omit<Trade, "daysSinceTrade" | "convictionScore"> => t !== null)
      .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate))
      .slice(0, 50)
      .map(enrichTrade);

    console.log(
      `[RapidAPI] Loaded ${trades.length} trades from ${allRawTrades.length} records ` +
      `(${topPoliticians.length} politicians).`,
    );
    return trades.length > 0 ? trades : null;
  } catch (err) {
    console.warn("[RapidAPI] Fetch failed:", err);
    return null;
  }
}

// =====================================================================
//  LEVEL 3: Mock Data Safety Net
// =====================================================================

function getFromMockData(): Trade[] {
  console.log("[Mock] Using built-in mock data (safety net).");
  return rawMockTrades.map(enrichTrade);
}

// =====================================================================
//  WATERFALL: getCongressTrades()
// =====================================================================

/**
 * Fetches congressional trades using a 3-level waterfall:
 *   Level 1 → Politician Trade Tracker (RapidAPI — free tier)
 *   Level 2 → Quiver API (paid, if key is set)
 *   Level 3 → Built-in mock data (always works)
 *
 * Returns { trades, source } so the UI can display provenance.
 */
export async function getCongressTrades(): Promise<{
  trades: Trade[];
  source: DataSource;
}> {
  // Level 1: RapidAPI (primary — free tier available)
  const rapidTrades = await fetchFromRapidApi();
  if (rapidTrades) return { trades: rapidTrades, source: "public" };

  // Level 2: Quiver (secondary — requires paid API key)
  const quiverTrades = await fetchFromQuiver();
  if (quiverTrades) return { trades: quiverTrades, source: "quiver" };

  // Level 3: Mock (always succeeds)
  return { trades: getFromMockData(), source: "mock" };
}
