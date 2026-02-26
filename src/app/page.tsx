import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  CalendarCheck,
  Clock,
  Landmark,
  Scale,
  Heart,
  TrendingUp,
} from "lucide-react";
import { getCongressTrades } from "@/lib/tradeService";
import TradeFeed from "@/components/TradeFeed";
import EducationCard from "@/components/EducationCard";

/* ------------------------------------------------------------------ */
/*  Summary helpers                                                    */
/* ------------------------------------------------------------------ */

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function computeStats(trades: ReturnType<typeof getCongressTrades>) {
  const total = trades.length;
  const buys = trades.filter((t) => t.type === "buy").length;
  const sells = total - buys;
  const avgLag = Math.round(
    trades.reduce((sum, t) => sum + t.daysToDisclose, 0) / total,
  );
  const highConviction = trades.filter((t) => t.convictionScore >= 75).length;

  // Find the most recent disclosure date across all trades
  const latestDisclosure = trades.reduce(
    (latest, t) => (t.disclosureDate > latest ? t.disclosureDate : latest),
    trades[0]?.disclosureDate ?? "",
  );

  return { total, buys, sells, avgLag, highConviction, latestDisclosure };
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function Dashboard() {
  const trades = getCongressTrades();
  const stats = computeStats(trades);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* ================================================================ */}
      {/*  TOP HEADER                                                      */}
      {/* ================================================================ */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Landmark className="h-7 w-7 text-sky-400" />
            <div>
              <h1 className="text-xl font-bold text-slate-100 leading-tight">
                Capitol Buys
              </h1>
              <p className="text-xs text-slate-400">
                See what Congress is buying.
              </p>
            </div>
          </div>

          <nav className="hidden sm:flex items-center gap-6 text-sm text-slate-400">
            <a href="/" className="text-slate-100 font-medium">
              Dashboard
            </a>
            <a
              href="/trades"
              className="hover:text-slate-200 transition-colors"
            >
              Trades
            </a>
            <a
              href="/education"
              className="hover:text-slate-200 transition-colors"
            >
              Learn
            </a>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* ================================================================ */}
        {/*  SUMMARY STATS                                                   */}
        {/* ================================================================ */}
        <section className="space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              icon={<BarChart3 className="h-5 w-5 text-sky-400" />}
              label="Total Disclosures [Last 90 Days]"
              value={String(stats.total)}
              sub="Reports filed (past quarter)"
              accent="sky"
            />
            <StatCard
              icon={<Clock className="h-5 w-5 text-amber-400" />}
              label="Avg. Reporting Lag [days to file]"
              value={`${stats.avgLag}d`}
              sub="Transaction Date → Disclosure Date"
              accent="amber"
            />
            <StatCard
              icon={<TrendingUp className="h-5 w-5 text-emerald-400" />}
              label="Strong Signals [high conviction trades]"
              value={String(stats.highConviction)}
              sub="Conviction Score 75+"
              accent="emerald"
            />
            <StatCard
              icon={<Activity className="h-5 w-5 text-sky-400" />}
              label="Buys vs. Sells"
              value={`${stats.buys}B / ${stats.sells}S`}
              sub="Purchase-to-sale ratio"
              accent="sky"
            />
          </div>

          {/* Data window info */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CalendarCheck className="w-3.5 h-3.5 text-slate-600" />
            <p>
              Showing data from the last 90 days. Most recent Disclosure Date{" "}
              <span className="text-slate-600">[when we found out]</span>:{" "}
              <span className="text-slate-300 font-medium">
                {formatDate(stats.latestDisclosure)}
              </span>
            </p>
          </div>
        </section>

        {/* ================================================================ */}
        {/*  MAIN CONTENT — Trade Feed with Search                           */}
        {/* ================================================================ */}
        <section className="space-y-5">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-100">
              Latest Financial Disclosures{" "}
              <span className="text-sm font-normal text-slate-500">
                [official trade reports from Congress]
              </span>
            </h2>
          </div>

          {/* 45-Day Rule Notice */}
          <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-400 leading-relaxed">
              <strong className="text-amber-400">Note for Beginners:</strong>{" "}
              Lawmakers have up to 45 days to disclose trades. A &quot;Recent&quot; report
              may show a trade that actually happened several weeks ago. Always check the{" "}
              <strong className="text-slate-300">Transaction Date</strong>{" "}
              <span className="text-slate-500">(when they traded)</span>{" "}
              vs. the{" "}
              <strong className="text-slate-300">Disclosure Date</strong>{" "}
              <span className="text-slate-500">(when we found out)</span>.
            </p>
          </div>

          <TradeFeed trades={trades} />
        </section>

        {/* ================================================================ */}
        {/*  EDUCATION STATION — "The Knowledge Base"                        */}
        {/* ================================================================ */}
        <section className="pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 mb-5">
            <BookOpen className="h-5 w-5 text-sky-400" />
            <h2 className="text-lg font-semibold text-slate-100">
              The Knowledge Base
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: The STOCK Act */}
            <EducationCard
              icon={<Scale className="h-5 w-5 text-sky-400" />}
              title="The STOCK Act"
              subtitle="The law that forces Congress to show their trades"
            >
              <p>
                In 2012, Congress passed the{" "}
                <strong className="text-slate-100">
                  Stop Trading on Congressional Knowledge Act
                </strong>{" "}
                (the STOCK Act). It says that members of Congress cannot use
                private, non-public information they learn on the job to make
                stock trades.
              </p>
              <p>
                More importantly, it requires them to file a{" "}
                <strong className="text-slate-100">
                  Financial Disclosure
                </strong>{" "}
                <span className="text-slate-400">
                  [an official report listing every trade they make]
                </span>{" "}
                within <strong className="text-emerald-400">45 days</strong> of
                each Transaction Date{" "}
                <span className="text-slate-400">
                  [the day the trade actually happened]
                </span>
                . If they file late, Capitol Buys flags it with an{" "}
                <span className="text-amber-400">amber</span> or{" "}
                <span className="text-rose-400">red</span> warning so you can
                see the delay.
              </p>
              <p>
                The goal? Transparency. If a senator buys stock in a defense
                company right before voting on a military spending bill, the
                public deserves to know.
              </p>
            </EducationCard>

            {/* Card 2: Spousal Trades */}
            <EducationCard
              icon={<Heart className="h-5 w-5 text-rose-400" />}
              title="Spousal Trades"
              subtitle="Why we track what their husbands and wives are buying"
            >
              <p>
                The STOCK Act doesn&apos;t just cover politicians — it also covers
                their <strong className="text-slate-100">spouses</strong> and{" "}
                <strong className="text-slate-100">dependent children</strong>.
                Why? Because if a congressperson learns something valuable and
                tells their partner, the trade still happened because of insider
                knowledge.
              </p>
              <p>
                Each trade has an{" "}
                <strong className="text-slate-100">Ownership Type</strong>{" "}
                <span className="text-slate-400">
                  [who actually made the trade — the politician themselves, their
                  spouse, or a joint account]
                </span>
                . On Capitol Buys, we show this clearly on every card so you
                know exactly who pulled the trigger.
              </p>
              <p>
                Trades marked <strong className="text-slate-100">Self</strong>{" "}
                carry the strongest conviction signal. Spouse and Joint trades
                are still tracked, but they carry a lower weight in our
                Conviction Score.
              </p>
            </EducationCard>
          </div>
        </section>

        {/* ================================================================ */}
        {/*  DISCLAIMER FOOTER                                               */}
        {/* ================================================================ */}
        <footer className="text-center text-xs text-slate-500 py-8 border-t border-slate-800 space-y-1">
          <p>
            Data sourced from public Financial Disclosures{" "}
            <span className="text-slate-600">[official government filings]</span>.
            Analysis powered by AI.
          </p>
          <p>
            Capitol Buys is for informational purposes only and does not
            constitute financial or legal advice.
          </p>
        </footer>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat Card (local component — only used on this page)               */
/* ------------------------------------------------------------------ */

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent: "sky" | "amber" | "rose" | "emerald";
}) {
  const bgMap = {
    sky: "bg-sky-500/10",
    amber: "bg-amber-500/10",
    rose: "bg-rose-500/10",
    emerald: "bg-emerald-500/10",
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
      <div className={`${bgMap[accent]} p-2 rounded-lg shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400 leading-snug">{label}</p>
        <p className="text-lg font-bold text-slate-100 mt-0.5">{value}</p>
        {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
