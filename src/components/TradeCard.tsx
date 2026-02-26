"use client";

import type { Trade } from "@/lib/types";
import ConvictionGauge from "./ConvictionGauge";
import FreshnessBar from "./FreshnessBar";
import { TrendingUp, TrendingDown, User, Users, Heart } from "lucide-react";

interface TradeCardProps {
  trade: Trade;
}

export default function TradeCard({ trade }: TradeCardProps) {
  const isBuy = trade.type === "buy";

  const partyColor = {
    D: "text-sky-400",
    R: "text-rose-400",
    I: "text-amber-400",
  };

  const partyLabel = {
    D: "Democrat",
    R: "Republican",
    I: "Independent",
  };

  const ownerIcon = {
    Self: <User className="w-3.5 h-3.5" />,
    Joint: <Users className="w-3.5 h-3.5" />,
    Spouse: <Heart className="w-3.5 h-3.5" />,
  };

  return (
    <article className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
      {/* Row 1: Politician + Transaction Type */}
      <div className="flex items-start justify-between gap-3">
        {/* Left: identity */}
        <div className="min-w-0">
          <h3 className="text-slate-100 font-semibold text-base truncate">
            {trade.politicianName}
          </h3>
          <p className="text-sm text-slate-400">
            <span className={partyColor[trade.party]}>{partyLabel[trade.party]}</span>
            {" · "}
            {trade.chamber}
            {" · "}
            {trade.state}
          </p>
        </div>

        {/* Right: buy/sell badge */}
        <span
          className={`shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
            isBuy
              ? "text-emerald-400 bg-emerald-500/10"
              : "text-rose-400 bg-rose-500/10"
          }`}
        >
          {isBuy ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {isBuy ? "Buy" : "Sell"}
        </span>
      </div>

      {/* Row 2: Ticker + Amount + Ownership */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {/* Ticker pill */}
        <span className="text-slate-100 font-bold text-lg">
          ${trade.ticker}
        </span>

        {/* Company */}
        <span className="text-sm text-slate-400 truncate">
          {trade.company}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        {/* Amount */}
        <span className="text-slate-300 font-medium">
          {trade.amountRange}
        </span>

        {/* Ownership */}
        <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
          {ownerIcon[trade.ownerType]}
          {trade.ownerType}
        </span>

        {/* Sector insight */}
        <span className="text-xs text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full">
          {trade.sectorInsight}
        </span>
      </div>

      {/* Row 3: Gauge + Freshness — side by side on wider screens */}
      <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 items-center pt-2 border-t border-slate-800">
        {/* Conviction Gauge */}
        <div className="flex justify-center sm:justify-start">
          <ConvictionGauge convictionScore={trade.convictionScore} />
        </div>

        {/* Freshness Bar */}
        <div className="min-w-0">
          <FreshnessBar
            transactionDate={trade.transactionDate}
            disclosureDate={trade.disclosureDate}
            daysToDisclose={trade.daysToDisclose}
          />
        </div>
      </div>
    </article>
  );
}
