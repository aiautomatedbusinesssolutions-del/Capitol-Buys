"use client";

import { useMemo, useState } from "react";
import type { Trade } from "@/lib/types";
import TradeCard from "./TradeCard";
import {
  Search,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  SearchX,
  BookOpen,
  Clock,
} from "lucide-react";

interface TradeFeedProps {
  trades: Trade[];
}

function sortByDateDesc(a: Trade, b: Trade): number {
  return b.transactionDate.localeCompare(a.transactionDate);
}

export default function TradeFeed({ trades }: TradeFeedProps) {
  const [query, setQuery] = useState("");

  const isSearching = query.trim().length > 0;
  const displayQuery = query.trim();

  const { buys, sells, totalFiltered } = useMemo(() => {
    const filtered = trades.filter((t) => {
      if (!isSearching) return true;
      const q = query.toLowerCase();
      return (
        t.ticker.toLowerCase().includes(q) ||
        t.company.toLowerCase().includes(q) ||
        t.politicianName.toLowerCase().includes(q)
      );
    });

    return {
      buys: filtered.filter((t) => t.type === "buy").sort(sortByDateDesc),
      sells: filtered.filter((t) => t.type === "sell").sort(sortByDateDesc),
      totalFiltered: filtered.length,
    };
  }, [trades, query, isSearching]);

  return (
    <div className="space-y-5">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Search by Ticker [stock code], company, or politician…'
          aria-label="Search trades by ticker, company, or politician"
          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-11 pr-12 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/40 transition-colors"
        />
        {isSearching ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            aria-label="Clear search"
          >
            <SearchX className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
            aria-label="Filters (coming soon)"
            title="Filters (coming soon)"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results count */}
      <p className="text-xs text-slate-500">
        {isSearching ? (
          <>
            Results for &quot;<span className="text-slate-300">{displayQuery}</span>&quot;
            {" — "}
            {totalFiltered} Financial Disclosure{totalFiltered !== 1 ? "s" : ""}{" "}
            <span className="text-slate-600">[trade reports]</span>
            {totalFiltered > 0 && (
              <>
                {" — "}
                <span className="text-emerald-400/70">{buys.length} buys</span>
                {", "}
                <span className="text-rose-400/70">{sells.length} sells</span>
              </>
            )}
          </>
        ) : (
          <>
            Showing {totalFiltered} Financial Disclosures{" "}
            <span className="text-slate-600">[official trade reports]</span>
            {" — "}
            <span className="text-emerald-400/70">{buys.length} buys</span>
            {", "}
            <span className="text-rose-400/70">{sells.length} sells</span>
          </>
        )}
      </p>

      {/* Main content — dual columns or global empty state */}
      {totalFiltered === 0 && isSearching ? (
        <NoTradesFound query={displayQuery} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column — Purchases */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-400 sticky top-0 bg-slate-950 py-2 z-10">
              <TrendingUp className="w-4 h-4" />
              {isSearching ? (
                <>
                  Purchase History for{" "}
                  <span className="text-slate-100">{displayQuery}</span>{" "}
                  <span className="font-normal text-slate-500">
                    [every time Congress bought this]
                  </span>
                </>
              ) : (
                <>
                  Recent Purchases{" "}
                  <span className="font-normal text-slate-500">
                    [Congress is buying these]
                  </span>
                </>
              )}
              <span className="ml-auto text-xs font-normal text-slate-600">
                {buys.length}
              </span>
            </h3>

            <div className="max-h-[800px] overflow-y-auto space-y-4 pr-1">
              {buys.length > 0 ? (
                buys.map((trade) => <TradeCard key={trade.id} trade={trade} />)
              ) : (
                <EmptyColumn type="buy" query={displayQuery} isSearching={isSearching} />
              )}
            </div>
          </div>

          {/* Right Column — Sales */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-rose-400 sticky top-0 bg-slate-950 py-2 z-10">
              <TrendingDown className="w-4 h-4" />
              {isSearching ? (
                <>
                  Sales History for{" "}
                  <span className="text-slate-100">{displayQuery}</span>{" "}
                  <span className="font-normal text-slate-500">
                    [every time Congress sold this]
                  </span>
                </>
              ) : (
                <>
                  Recent Sales{" "}
                  <span className="font-normal text-slate-500">
                    [Congress is exiting these]
                  </span>
                </>
              )}
              <span className="ml-auto text-xs font-normal text-slate-600">
                {sells.length}
              </span>
            </h3>

            <div className="max-h-[800px] overflow-y-auto space-y-4 pr-1">
              {sells.length > 0 ? (
                sells.map((trade) => <TradeCard key={trade.id} trade={trade} />)
              ) : (
                <EmptyColumn type="sell" query={displayQuery} isSearching={isSearching} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Global "No Trades Found" — full-width, educational empty state     */
/* ------------------------------------------------------------------ */

function NoTradesFound({ query }: { query: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 sm:p-10 space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="bg-sky-500/10 p-3 rounded-lg shrink-0">
          <BookOpen className="w-6 h-6 text-sky-400" />
        </div>
        <div>
          <h3 className="text-slate-100 font-semibold text-base">
            No Trades Found for &quot;{query}&quot;{" "}
            <span className="text-slate-500 font-normal text-sm">
              [Ticker or name]
            </span>
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            This isn&apos;t an error — it just means we don&apos;t have matching
            data right now.
          </p>
        </div>
      </div>

      {/* Educational explanation */}
      <div className="bg-slate-800/50 rounded-lg p-5 space-y-3">
        <p className="text-sm text-slate-300 leading-relaxed">
          Congress may not have traded this Asset{" "}
          <span className="text-slate-500">[stock or investment]</span>{" "}
          recently, or the trade hasn&apos;t been disclosed yet.
        </p>
        <div className="flex items-start gap-2">
          <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-400 leading-relaxed">
            <strong className="text-amber-400">Remember:</strong> Lawmakers have
            up to <strong className="text-slate-200">45 days</strong> to file a
            Financial Disclosure{" "}
            <span className="text-slate-500">
              [the official report of their trade]
            </span>
            . Some trades may simply not be public yet.
          </p>
        </div>
      </div>

      {/* Suggestions */}
      <div className="text-sm text-slate-500 space-y-1">
        <p className="text-slate-400 font-medium">Try searching for:</p>
        <p>
          A Ticker{" "}
          <span className="text-slate-600">[stock code]</span>{" "}
          like <span className="text-slate-300">NVDA</span>,{" "}
          <span className="text-slate-300">MSFT</span>, or{" "}
          <span className="text-slate-300">AMZN</span> — or a
          politician&apos;s name like{" "}
          <span className="text-slate-300">Pelosi</span> or{" "}
          <span className="text-slate-300">Tuberville</span>.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Per-column empty state — when one side has results, the other not  */
/* ------------------------------------------------------------------ */

function EmptyColumn({
  type,
  query,
  isSearching,
}: {
  type: "buy" | "sell";
  query: string;
  isSearching: boolean;
}) {
  const action = type === "buy" ? "purchased" : "sold";
  const noun = type === "buy" ? "purchases" : "sales";

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-2">
      <p className="text-sm text-slate-400">
        {isSearching ? (
          <>
            No {noun} found for &quot;
            <span className="text-slate-300">{query}</span>&quot;.
          </>
        ) : (
          <>No recent {noun} to show.</>
        )}
      </p>
      {isSearching && (
        <p className="text-xs text-slate-500 leading-relaxed">
          Congress may not have {action} this Asset{" "}
          <span className="text-slate-600">[stock or investment]</span>{" "}
          recently — or the Financial Disclosure{" "}
          <span className="text-slate-600">[trade report]</span>{" "}
          hasn&apos;t been filed yet.
        </p>
      )}
    </div>
  );
}
