# Capitol Buys — Product Requirements Document

> **See what Congress is buying.**

## Overview

Capitol Buys is a standalone web application that makes Congressional stock trading disclosures accessible, understandable, and transparent for everyday citizens. It transforms raw STOCK Act filing data into clear visual insights — highlighting conflicts of interest, reporting delays, and trade volumes — all without requiring financial expertise.

---

## 1. Technical Stack

| Layer        | Technology                                       |
| ------------ | ------------------------------------------------ |
| Framework    | Next.js 16 (App Router)                          |
| Language     | TypeScript                                       |
| Styling      | Tailwind CSS 4 (CSS-based config, no JS config)  |
| Icons        | Lucide React                                     |
| Charts       | Recharts                                         |
| Font         | Inter (via `next/font/google`)                   |
| Data Source  | Congressional trade API (TBD — FMP / CapitolTrades scraper / House/Senate XML feeds) |

---

## 2. Design System (Strict)

### 2.1 Color Palette

| Token          | Tailwind Class             | Usage                        |
| -------------- | -------------------------- | ---------------------------- |
| Background     | `bg-slate-950`             | Page background              |
| Card Surface   | `bg-slate-900`             | Card / panel background      |
| Card Border    | `border border-slate-800`  | Card outline                 |
| Heading Text   | `text-slate-100`           | H1–H3, primary labels        |
| Body Text      | `text-slate-300`           | Paragraph / default text     |
| Subtext        | `text-slate-400`           | Descriptions, secondary info |

### 2.2 Traffic Light Palette (Semantic Colors)

| Meaning                         | Text Class          | Background Class      |
| ------------------------------- | ------------------- | --------------------- |
| Success (Buy / Positive)        | `text-emerald-400`  | `bg-emerald-500/10`   |
| Warning (Wait / Stale)          | `text-amber-400`    | `bg-amber-500/10`     |
| Danger (Sell / High Conflict)   | `text-rose-400`     | `bg-rose-500/10`      |
| Neutral (Info / Party)          | `text-sky-400`      | `bg-sky-500/10`       |

### 2.3 Typography

- **Font Family:** Inter (sans-serif), loaded via `next/font/google` as `--font-inter`
- **Headings:** `text-slate-100`, font-semibold / font-bold
- **Body:** `text-slate-300`
- **Muted / Subtext:** `text-slate-400`

---

## 3. Tone & Language (Beginner-First)

### The "Friend" Test

Every label, tooltip, and summary should pass this test: *"Would my friend who knows nothing about stocks understand this?"* If not, rewrite it.

- No financial jargon without an inline explanation.
- Civic-minded — the goal is informed citizens, not partisan blame.
- Transparent about data sources and limitations.

### AI Transparency

Any AI-generated summary or analysis must include:

> Data sourced from public disclosures. Analysis powered by AI.

---

## 4. Core Features

### 4.1 Conflict Gauge — *The "Aha!" Moment*

A visual gauge displayed on each politician's trade card showing whether the traded stock overlaps with the sectors their Congressional committees oversee.

| Level           | Meaning                                          | Color   |
| --------------- | ------------------------------------------------ | ------- |
| Low Conflict    | Trade is in a sector unrelated to their committee | Emerald |
| Medium Conflict | Trade is in a loosely related sector              | Amber   |
| High Conflict   | Trade is directly in a sector they regulate       | Rose    |

The gauge should be immediately scannable — a single glance tells the story.

### 4.2 Reporting Lag Tracker

A clear, color-coded indicator showing the number of days between:
- **Trade Date** — the date the transaction occurred.
- **Disclosure Date** — the date it was publicly filed.

| Lag             | Meaning                                    | Color   |
| --------------- | ------------------------------------------ | ------- |
| 0–15 days       | Timely                                     | Emerald |
| 16–45 days      | Delayed                                    | Amber   |
| 46+ days        | Significantly late (potential violation)    | Rose    |

### 4.3 Trade Bracket Visualizer

Congressional disclosures report trade amounts in ranges (e.g., "$1,001–$15,000"). This feature:
- Converts each range into an **estimated mid-point value**.
- Renders horizontal bars or pill indicators for quick size comparison.
- Makes it easy to compare relative trade sizes across politicians.

### 4.4 Beginner-First Education

Contextual tooltips and info panels that explain:
- What the **STOCK Act** is and why it matters.
- Why **spousal trades** are tracked (spouses must also disclose).
- What "reporting lag" means and why it's significant.
- How to interpret the conflict gauge.

Tone: friendly, jargon-free. Assume the user has never read a financial disclosure before.

---

## 5. Data Architecture

### 5.1 Data Service Layer

Create a modular data service (`lib/services/trades.ts`) that:
- Fetches Congressional trade data from the configured API source.
- Normalizes response data into a typed `Trade` interface.
- Supports filtering by politician, party, date range, and ticker.

### 5.2 Core Types

```typescript
interface Trade {
  id: string;
  politician: string;
  party: "D" | "R" | "I";
  chamber: "Senate" | "House";
  state: string;
  ticker: string;
  company: string;
  sector: string;
  type: "buy" | "sell";
  amountRange: string;        // e.g., "$1,001 - $15,000"
  amountMidpoint: number;     // estimated mid-point
  tradeDate: string;          // ISO date
  disclosureDate: string;     // ISO date
  reportingLagDays: number;
  committees: string[];
  conflictScore: number;      // 0–100
  isSpouseTrade: boolean;
}
```

---

## 6. Page Structure

| Route                | Description                                          |
| -------------------- | ---------------------------------------------------- |
| `/`                  | Dashboard — latest trades, top movers, summary stats |
| `/trades`            | Full trade list with filters and search              |
| `/politician/[slug]` | Individual politician profile + trade history        |
| `/education`         | STOCK Act explainer, glossary, FAQ                   |

---

## 7. Disclaimer (Footer)

> Data sourced from public disclosures. Analysis powered by AI. Capitol Buys is for informational purposes only and does not constitute financial or legal advice.

---

## 8. Future Considerations

- Real-time trade alerts / notifications.
- Watchlist for specific politicians or tickers.
- Historical trend analysis (are trades getting more conflicted over time?).
- Comparison view: politician vs. S&P 500 performance.
- Mobile-first PWA support.

---

## 9. Implementation Status

| Phase | Scope                                    | Status      |
| ----- | ---------------------------------------- | ----------- |
| 0     | PRD + project init (Next.js 16 scaffold) | Done        |
| 1     | Dashboard (`/`) with mock data           | Done        |
| 2     | Trade list, politician pages, education  | Not started |
| 3     | Live data integration                    | Not started |
| 4     | AI summaries + conflict scoring          | Not started |
