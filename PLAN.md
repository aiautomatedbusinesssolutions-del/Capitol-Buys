# Capitol Buys — Implementation Plan

---

## Phase 1: Data Strategy & Architecture

### 1.1 Primary Data Source

**Quiver Quantitative API** — `https://api.quiverquant.com`

Quiver provides structured, machine-readable Congressional trading data sourced from House and Senate financial disclosures. It returns JSON with normalized fields for politician name, ticker, transaction type, amounts, and dates.

| Detail         | Value                                            |
| -------------- | ------------------------------------------------ |
| Provider       | Quiver Quantitative                              |
| Endpoint       | `/beta/live/congresstrading`                     |
| Auth           | API key via `Authorization` header               |
| Format         | JSON                                             |
| Rate Limits    | TBD — check plan tier                            |
| Fallback       | Capitol Trades scraper (manual, not preferred)   |

**Why Quiver over alternatives:**
- Structured JSON (no scraping needed).
- Covers both House and Senate.
- Includes transaction dates *and* disclosure dates (critical for lag calculation).
- Active maintenance and reasonable free tier for prototyping.

---

### 1.2 Data Model (Revised)

The previous `Trade` interface is updated to reflect new fields and the **Conflict → Conviction** rename.

```typescript
interface Trade {
  // Identity
  id: string;
  politician: string;
  party: "D" | "R" | "I";
  chamber: "Senate" | "House";
  state: string;

  // Asset
  ticker: string;
  company: string;
  sector: string;

  // Transaction
  type: "buy" | "sell";
  amountRange: string;          // Raw range, e.g. "$1,001 - $15,000"
  amountMidpoint: number;       // Estimated mid-point for comparisons
  ownership: "Self" | "Spouse" | "Child" | "Joint";

  // Timing
  tradeDate: string;            // ISO date — when the trade happened
  disclosureDate: string;       // ISO date — when it was publicly filed
  daysSinceTrade: number;       // Days from tradeDate to TODAY (freshness)
  daysToDisclose: number;       // Days from tradeDate to disclosureDate (lag)

  // Insight
  committees: string[];
  convictionScore: number;      // 0–100 (replaces conflictScore)
  sectorInsight: string;        // Beginner-friendly reason, e.g. "Tech Expansion"
}
```

**New fields explained:**

| Field             | What it captures                                          |
| ----------------- | --------------------------------------------------------- |
| `ownership`       | Who owns the asset — Self, Spouse, Child, or Joint        |
| `daysSinceTrade`  | How "fresh" the trade is (days from trade date to today)  |
| `daysToDisclose`  | How long the politician waited to report (the lag)        |
| `convictionScore` | Composite score replacing the old "conflict" metric       |
| `sectorInsight`   | Plain-English label for *why* this sector matters now     |

---

### 1.3 The Conviction Score

**Replaces all "Conflict" language across the app.**

The Conviction Score answers: *"How confident does this politician appear to be in this trade?"* It is **not** about wrongdoing — it's about signal strength.

#### Formula (Weighted Composite, 0–100)

```
convictionScore =
    (amountWeight × 40)      // Larger trades = higher conviction
  + (ownershipWeight × 30)   // "Self" = highest conviction
  + (lagWeight × 30)         // Faster disclosure = higher conviction
```

#### Breakdown

**A. Amount Weight (40% of score)**

| Range                  | Midpoint     | Weight |
| ---------------------- | ------------ | ------ |
| $1,001 – $15,000       | $8,000       | 0.10   |
| $15,001 – $50,000      | $32,500      | 0.25   |
| $50,001 – $100,000     | $75,000      | 0.45   |
| $100,001 – $250,000    | $175,000     | 0.65   |
| $250,001 – $500,000    | $375,000     | 0.80   |
| $500,001 – $1,000,000  | $750,000     | 0.90   |
| $1,000,001+            | $5,000,000   | 1.00   |

**B. Ownership Weight (30% of score)**

| Owner   | Weight | Rationale                                         |
| ------- | ------ | ------------------------------------------------- |
| Self    | 1.00   | Politician traded directly — strongest signal     |
| Joint   | 0.75   | Shared account — still high personal involvement  |
| Spouse  | 0.50   | May reflect shared household strategy             |
| Child   | 0.25   | Weakest direct link to politician's own conviction|

**C. Reporting Lag Weight (30% of score)**

Faster disclosure = higher conviction. A politician who reports quickly is signaling transparency (or at least not hiding it).

| Days to Disclose | Weight | Color   |
| ---------------- | ------ | ------- |
| 0–15 days        | 1.00   | Emerald |
| 16–30 days       | 0.70   | Emerald |
| 31–45 days       | 0.40   | Amber   |
| 46–90 days       | 0.20   | Rose    |
| 90+ days         | 0.05   | Rose    |

#### Conviction Tiers (Display)

| Score   | Label             | Color   | Badge Text         |
| ------- | ----------------- | ------- | ------------------ |
| 75–100  | High Conviction   | Emerald | "Strong Signal"    |
| 40–74   | Medium Conviction | Amber   | "Moderate Signal"  |
| 0–39    | Low Conviction    | Rose    | "Weak Signal"      |

#### Beginner-Friendly Explanation (Tooltip)

> **What is the Conviction Score?**
> It estimates how confident a politician seems in their trade, based on three things: how much money they put in, whether they traded personally (vs. a family member), and how quickly they reported it. A higher score means a stronger signal — not that the trade is good or bad.

---

### 1.4 Sector Insight Map (Beginner-First)

Instead of showing raw sector names or committee overlaps, we translate trades into plain-English "insight labels" that explain *why* a sector might be interesting right now.

#### Mapping Table

| Sector               | Insight Label           | Tooltip (Friend Test)                                                                 |
| -------------------- | ----------------------- | ------------------------------------------------------------------------------------- |
| Technology           | "Tech Expansion"        | "This politician is investing in tech companies — think AI, cloud, or social media."  |
| Energy               | "Energy Shift"          | "A bet on energy — could be oil & gas, renewables, or both."                          |
| Healthcare           | "Healthcare Play"       | "Investing in healthcare — could be pharma, biotech, or hospital companies."          |
| Finance              | "Banking Bet"           | "Money moving into banks, insurance, or financial services."                          |
| Defense              | "Defense & Security"    | "Investing in defense contractors or cybersecurity firms."                             |
| Real Estate          | "Property Move"         | "A play on real estate — REITs, housing, or commercial property."                     |
| Consumer Goods       | "Consumer Bet"          | "Investing in everyday brands — retail, food, clothing."                              |
| Industrials          | "Infrastructure Play"   | "Betting on manufacturing, construction, or transportation."                          |
| Telecommunications   | "Connectivity Bet"      | "Investing in telecom — wireless carriers, broadband, or media."                      |
| Utilities            | "Utilities Play"        | "A steady-income bet — electric, water, or gas companies."                            |
| Materials            | "Materials & Mining"    | "Investing in raw materials — metals, chemicals, or mining."                          |
| *Unknown / Other*    | "Diversified Trade"     | "This trade doesn't fit a single sector — it may be an ETF or index fund."            |

#### How Insights Appear in the UI

Each trade card shows the insight label as a subtle tag:

```
┌─────────────────────────────────────────┐
│  Rep. Jane Smith (D-CA)                 │
│  Bought $AAPL · $50,001–$100,000        │
│                                         │
│  ⚡ Tech Expansion    🟢 High Conviction │
│  📅 Filed 12 days after trade           │
└─────────────────────────────────────────┘
```

The insight label links to the `/education` page for deeper context.

---

### 1.5 Terminology Migration Checklist

All references to "Conflict" must be replaced with "Conviction" across the project:

| Old Term          | New Term            | Location                    |
| ----------------- | ------------------- | --------------------------- |
| Conflict Gauge    | Conviction Score    | PROJECT_GUIDE.md §4.1       |
| conflictScore     | convictionScore     | Trade interface, mock data  |
| Low/Med/High Conflict | Low/Med/High Conviction | UI badges, tooltips   |
| "Conflict" in PRD | "Conviction" in PRD | PROJECT_GUIDE.md throughout |

> **Note:** `PROJECT_GUIDE.md` still references the old "Conflict" language. It should be updated to match this plan once approved.

---

### 1.6 API Integration Strategy (When We Build It)

```
Quiver API ──→ lib/services/quiver.ts     (raw fetch + auth)
                  │
                  ▼
              lib/services/trades.ts       (normalize → Trade interface)
                  │
                  ├──→ computeConviction() (score calculation)
                  ├──→ computeLag()        (daysSinceTrade, daysToDisclose)
                  └──→ mapSectorInsight()  (sector → insight label)
                  │
                  ▼
              App pages consume typed Trade[]
```

| Module                        | Responsibility                              |
| ----------------------------- | ------------------------------------------- |
| `lib/services/quiver.ts`     | API key auth, raw fetch, error handling     |
| `lib/services/trades.ts`     | Normalize raw data → `Trade[]`              |
| `lib/utils/conviction.ts`    | Conviction score formula                    |
| `lib/utils/lag.ts`           | Lag calculation + color tier                |
| `lib/utils/sector-insights.ts` | Sector → insight label mapping            |

---

### 1.7 Phase 1 Deliverables (Planning Only)

| #  | Deliverable                       | Status      |
| -- | --------------------------------- | ----------- |
| 1  | Finalize Quiver API access + key  | Not started |
| 2  | Define `Trade` interface (final)  | Defined above |
| 3  | Conviction Score formula          | Defined above |
| 4  | Sector Insight mapping            | Defined above |
| 5  | Update PROJECT_GUIDE.md terminology | Pending approval |
| 6  | Build data service layer          | Not started |
| 7  | Replace mock data on dashboard    | Not started |

---

*No code has been written. This document defines the architecture for review before implementation begins.*
