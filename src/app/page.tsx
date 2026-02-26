import {
  Activity,
  AlertTriangle,
  ArrowLeftRight,
  BarChart3,
  BookOpen,
  CalendarCheck,
  Clock,
  Gauge,
  Landmark,
  Scale,
  Heart,
  Timer,
  TrendingUp,
} from "lucide-react";
import { getCongressTrades } from "@/lib/tradeService";
import type { Trade, DataSource } from "@/lib/types";
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

function computeStats(trades: Trade[]) {
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

const SOURCE_LABELS: Record<DataSource, string> = {
  quiver: "Data from Quiver Quantitative (live API)",
  public: "Data from Public Record (House Stock Watcher)",
  mock: "Sample data (demo mode — no API key set)",
};

export default async function Dashboard() {
  const { trades, source } = await getCongressTrades();
  const stats = computeStats(trades);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* ================================================================ */}
      {/*  TOP HEADER                                                      */}
      {/* ================================================================ */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col items-center justify-center">
          <div className="flex items-center gap-3">
            <Landmark className="h-7 w-7 text-sky-400" />
            <h1 className="text-xl font-bold text-slate-100 leading-tight">
              Capitol Buys
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            See what Congress is buying.
          </p>
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

          {/* Data window info + source indicator */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <CalendarCheck className="w-3.5 h-3.5 text-slate-600" />
              Showing data from the last 90 days. Most recent Disclosure Date{" "}
              <span className="text-slate-600">[when we found out]</span>:{" "}
              <span className="text-slate-300 font-medium">
                {formatDate(stats.latestDisclosure)}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <span className={`w-1.5 h-1.5 rounded-full ${
                source === "quiver" ? "bg-emerald-400" :
                source === "public" ? "bg-sky-400" : "bg-amber-400"
              }`} />
              {SOURCE_LABELS[source]}
            </span>
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

            {/* Card 3: Types of Trades */}
            <EducationCard
              icon={<ArrowLeftRight className="h-5 w-5 text-emerald-400" />}
              iconBg="bg-emerald-500/10"
              title="Types of Trades"
              subtitle="The different ways they move money"
            >
              <p>
                Congressional disclosures use specific labels for each
                transaction. Here&apos;s what they mean:
              </p>
              <ul className="space-y-2">
                <li>
                  <strong className="text-emerald-400">Purchase</strong>{" "}
                  <span className="text-slate-400">
                    [buying a new asset or adding to one they already own]
                  </span>{" "}
                  — the most watched type, because it shows where they&apos;re
                  putting new money.
                </li>
                <li>
                  <strong className="text-rose-400">Sale (Full/Partial)</strong>{" "}
                  <span className="text-slate-400">
                    [selling all or some of a stock they hold]
                  </span>{" "}
                  — could mean they&apos;re taking profits, cutting losses, or
                  know something is coming.
                </li>
                <li>
                  <strong className="text-amber-400">Exchange</strong>{" "}
                  <span className="text-slate-400">
                    [swapping one asset for another without buying or selling on
                    the open market]
                  </span>{" "}
                  — common in retirement accounts and corporate stock plans.
                </li>
                <li>
                  <strong className="text-sky-400">Diversified Assets</strong>{" "}
                  <span className="text-slate-400">
                    [funds like Mutual Funds or ETFs that hold many stocks at
                    once]
                  </span>{" "}
                  — generally considered lower risk and less likely to signal
                  insider knowledge.
                </li>
              </ul>
            </EducationCard>

            {/* Card 4: The 45-Day Disclosure Gap */}
            <EducationCard
              icon={<Timer className="h-5 w-5 text-amber-400" />}
              iconBg="bg-amber-500/10"
              title="The 45-Day Disclosure Gap"
              subtitle="The &quot;Information Lag&quot;"
            >
              <p>
                By law{" "}
                <span className="text-slate-400">
                  [The STOCK Act]
                </span>
                , politicians have up to{" "}
                <strong className="text-amber-400">45 days</strong> to report a
                trade after it happens. This means a &quot;New&quot; alert today might
                actually show a move made{" "}
                <strong className="text-slate-100">over a month ago</strong>.
              </p>
              <p>
                We call this the{" "}
                <strong className="text-slate-100">Disclosure Lag</strong>{" "}
                <span className="text-slate-400">
                  [the gap between when they traded and when the public finds
                  out]
                </span>
                . On each trade card, our{" "}
                <strong className="text-slate-100">Freshness Bar</strong> shows
                this gap visually:
              </p>
              <ul className="space-y-1">
                <li>
                  <span className="text-emerald-400">Green</span> — filed within
                  15 days (fast and transparent)
                </li>
                <li>
                  <span className="text-amber-400">Amber</span> — filed within
                  15-45 days (within the legal window, but slower)
                </li>
                <li>
                  <span className="text-rose-400">Red</span> — filed after 45
                  days (late — they broke the deadline)
                </li>
              </ul>
              <p>
                Always check the{" "}
                <strong className="text-slate-100">Transaction Date</strong>{" "}
                <span className="text-slate-400">(when they traded)</span> vs.
                the{" "}
                <strong className="text-slate-100">Disclosure Date</strong>{" "}
                <span className="text-slate-400">(when we found out)</span> to
                understand the real timeline.
              </p>
            </EducationCard>

            {/* Card 5: Understanding the Conviction Score */}
            <EducationCard
              icon={<Gauge className="h-5 w-5 text-sky-400" />}
              title="Understanding the Conviction Score"
              subtitle="How we rate the trades"
            >
              <p>
                Every trade on Capitol Buys gets a{" "}
                <strong className="text-slate-100">Conviction Score</strong>{" "}
                <span className="text-slate-400">
                  [a number from 0 to 100 that estimates how &quot;serious&quot; a trade
                  looks]
                </span>
                . It&apos;s shown on the gauge next to each trade card. Our score
                combines three factors:
              </p>
              <ol className="space-y-2 list-decimal list-inside">
                <li>
                  <strong className="text-slate-100">Trade Size</strong>{" "}
                  <span className="text-slate-400">
                    [how much money they put on the line]
                  </span>{" "}
                  — a $1M+ trade carries far more weight than a $1K position.
                  Bigger bets suggest stronger conviction.
                </li>
                <li>
                  <strong className="text-slate-100">Ownership</strong>{" "}
                  <span className="text-slate-400">
                    [who placed the trade — Self, Spouse, or Joint]
                  </span>{" "}
                  — trades made by the politician themselves score highest.
                </li>
                <li>
                  <strong className="text-slate-100">Freshness</strong>{" "}
                  <span className="text-slate-400">
                    [how quickly they disclosed the trade]
                  </span>{" "}
                  — fast filers score higher, because quick disclosure suggests
                  they aren&apos;t trying to hide anything.
                </li>
              </ol>
              <p>
                The result maps to three tiers:{" "}
                <strong className="text-emerald-400">Strong Signal</strong>{" "}
                (75+),{" "}
                <strong className="text-amber-400">Moderate Signal</strong>{" "}
                (40-74), or{" "}
                <strong className="text-rose-400">Weak Signal</strong>{" "}
                (below 40).
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
