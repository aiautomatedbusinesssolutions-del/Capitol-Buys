"use client";

import { getLagColor } from "@/lib/tradeService";
import { Clock, CalendarCheck, AlertTriangle } from "lucide-react";

interface FreshnessBarProps {
  transactionDate: string;
  disclosureDate: string;
  daysToDisclose: number;
}

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function FreshnessBar({
  transactionDate,
  disclosureDate,
  daysToDisclose,
}: FreshnessBarProps) {
  const color = getLagColor(daysToDisclose);

  const barColorMap = {
    emerald: "bg-emerald-400",
    amber: "bg-amber-400",
    rose: "bg-rose-400",
  };

  const textColorMap = {
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    rose: "text-rose-400",
  };

  const bgMap = {
    emerald: "bg-emerald-500/10",
    amber: "bg-amber-500/10",
    rose: "bg-rose-500/10",
  };

  const labelMap = {
    emerald: "Timely",
    amber: "Delayed",
    rose: "Late Filing",
  };

  // Bar fill: normalize to a 0–100% scale where 45 days = 100%
  const fillPct = Math.min((daysToDisclose / 90) * 100, 100);

  return (
    <div className="space-y-2">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
          Reporting Gap
        </span>
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${textColorMap[color]} ${bgMap[color]}`}>
          {color === "rose" && <AlertTriangle className="w-3 h-3" />}
          {daysToDisclose} Day{daysToDisclose !== 1 ? "s" : ""} — {labelMap[color]}
        </span>
      </div>

      {/* Bar track */}
      <div className="relative h-2 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${barColorMap[color]}`}
          style={{ width: `${fillPct}%` }}
        />
      </div>

      {/* Date labels */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="inline-flex items-center gap-1" title="Transaction Date — when the trade actually happened">
          <Clock className="w-3 h-3" />
          <span>
            {formatDate(transactionDate)}
            <span className="hidden sm:inline text-slate-500"> (Traded)</span>
          </span>
        </span>
        <span className="inline-flex items-center gap-1" title="Disclosure Date — when the public found out">
          <CalendarCheck className="w-3 h-3" />
          <span>
            {formatDate(disclosureDate)}
            <span className="hidden sm:inline text-slate-500"> (Disclosed)</span>
          </span>
        </span>
      </div>
    </div>
  );
}
