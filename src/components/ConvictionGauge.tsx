"use client";

import { getConvictionBadge } from "@/lib/tradeService";

interface ConvictionGaugeProps {
  convictionScore: number;
}

export default function ConvictionGauge({ convictionScore }: ConvictionGaugeProps) {
  const badge = getConvictionBadge(convictionScore);
  const clampedScore = Math.max(0, Math.min(100, convictionScore));

  // SVG arc geometry — semi-circle from 180° (left) to 0° (right)
  const cx = 60;
  const cy = 58;
  const r = 44;
  const strokeWidth = 7;

  // Convert score (0–100) to angle (180° → 0°, left to right)
  const needleAngle = 180 - (clampedScore / 100) * 180;
  const needleRad = (needleAngle * Math.PI) / 180;
  const needleLen = r - 10;
  const needleX = cx + needleLen * Math.cos(needleRad);
  const needleY = cy - needleLen * Math.sin(needleRad);

  // Arc helper: creates an SVG arc path for a given angle range
  function arcPath(startDeg: number, endDeg: number): string {
    const startRad = (startDeg * Math.PI) / 180;
    const endRad = (endDeg * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy - r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy - r * Math.sin(endRad);
    const largeArc = startDeg - endDeg > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  }

  // Three segments: Rose (0–39), Amber (40–74), Emerald (75–100)
  // Map score ranges to angle ranges (180° → 0°)
  const segments = [
    { d: arcPath(180, 180 - (39 / 100) * 180), color: "#fb7185" },  // rose-400
    { d: arcPath(180 - (39 / 100) * 180, 180 - (74 / 100) * 180), color: "#fbbf24" }, // amber-400
    { d: arcPath(180 - (74 / 100) * 180, 0), color: "#34d399" },    // emerald-400
  ];

  const colorMap = {
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    rose: "text-rose-400",
  };

  const bgMap = {
    emerald: "bg-emerald-500/10",
    amber: "bg-amber-500/10",
    rose: "bg-rose-500/10",
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 120 68" className="w-full max-w-[140px]" aria-label={`Conviction score: ${clampedScore}`}>
        {/* Background track */}
        <path
          d={arcPath(180, 0)}
          fill="none"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Colored segments */}
        {segments.map((seg, i) => (
          <path
            key={i}
            d={seg.d}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity={0.3}
          />
        ))}
        {/* Active arc — fills from left up to the score */}
        <path
          d={arcPath(180, 180 - (clampedScore / 100) * 180)}
          fill="none"
          stroke={
            badge.color === "emerald"
              ? "#34d399"
              : badge.color === "amber"
                ? "#fbbf24"
                : "#fb7185"
          }
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke="#e2e8f0"
          strokeWidth={2}
          strokeLinecap="round"
        />
        {/* Needle center dot */}
        <circle cx={cx} cy={cy} r={3} fill="#e2e8f0" />
      </svg>

      {/* Score number */}
      <span className={`text-2xl font-bold leading-none ${colorMap[badge.color]}`}>
        {clampedScore}
      </span>

      {/* Tier badge */}
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colorMap[badge.color]} ${bgMap[badge.color]}`}>
        {badge.label}
      </span>
    </div>
  );
}
