"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, LineChart, Line,
  CartesianGrid, Legend,
} from "recharts";

import { createClient } from "@/lib/supabase/client";
import { useCardsStore } from "@/store/useCardsStore";
import type { Transaction } from "@/types/transaction";
import type { UserCard } from "@/types/card";

/* ─── constants ─────────────────────────────────────────── */

const CATEGORY_ICONS: Record<string, string> = {
  dining: "🍽️", travel: "✈️", groceries: "🛒", gas: "⛽",
  entertainment: "🎬", online: "💻", shopping: "🛍️", fitness: "🏋️", rent: "🏠", other: "💳",
};

const CHART_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6", "#f97316", "#84cc16"];

const PERIOD_OPTIONS = [
  { label: "This month",  value: "this_month"  },
  { label: "Last month",  value: "last_month"  },
  { label: "Last 3 months", value: "last_3_months" },
  { label: "Custom",      value: "custom"      },
] as const;

type PeriodValue = typeof PERIOD_OPTIONS[number]["value"];

/* ─── helpers ───────────────────────────────────────────── */

function fmt(n: number): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
}

function fmtShort(n: number): string {
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return fmt(n);
}

function periodDates(period: PeriodValue): { from: string; to: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (period === "this_month") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { from: iso(from), to: iso(to) };
  }
  if (period === "last_month") {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to   = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: iso(from), to: iso(to) };
  }
  if (period === "last_3_months") {
    const from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const to   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { from: iso(from), to: iso(to) };
  }
  return { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to: iso(now) };
}

function getRewardDollarValue(card: UserCard, category: string, amount: number, pointVal: number): number {
  const cat = category.toLowerCase();
  const rules = card.reward_rules;
  let rule = rules.find((r) => r.category.toLowerCase() === cat);
  if (!rule) rule = rules.find((r) => ["other", "general", "everything"].includes(r.category.toLowerCase()));
  if (!rule) return 0;
  const pv = card.point_value > 0 ? card.point_value : pointVal;
  return card.reward_type === "cashback"
    ? amount * (rule.multiplier / 100)
    : amount * rule.multiplier * pv;
}

/* ─── types ─────────────────────────────────────────────── */

interface CategoryStat {
  category: string;
  spend: number;
  earned: number;
  missed: number;
  count: number;
}

interface Opportunity {
  category: string;
  missedTotal: number;
  bestCard: string;
  mostUsedCard: string | null;
  transactionCount: number;
}

interface TrendPoint {
  label: string;
  earned: number;
  missed: number;
  potential: number;
}

interface Aggregated {
  totalSpend: number;
  rewardsEarned: number;
  rewardsMissed: number;
  potentialRewards: number;
  byCategory: CategoryStat[];
  opportunities: Opportunity[];
  trend: TrendPoint[];
  optimalCount: number;
  suboptimalCount: number;
  noCardCount: number;
}

/* ─── aggregation engine ────────────────────────────────── */

function aggregate(txs: Transaction[], cards: UserCard[], pointVal: number): Aggregated {
  const purchases = txs.filter((t) => t.amount > 0);

  let totalSpend = 0, rewardsEarned = 0, rewardsMissed = 0, potentialRewards = 0;
  let optimalCount = 0, suboptimalCount = 0, noCardCount = 0;

  const catMap: Record<string, CategoryStat> = {};
  const weekMap: Record<string, TrendPoint> = {};

  for (const tx of purchases) {
    totalSpend += tx.amount;

    // Best card for this transaction
    let bestDollar = 0;
    let bestCardName = "";
    for (const card of cards) {
      const dv = getRewardDollarValue(card, tx.category, tx.amount, pointVal);
      if (dv > bestDollar) { bestDollar = dv; bestCardName = card.card_name; }
    }

    // Actual reward
    // Match by id first, fall back to card_name in case card was re-added with a new UUID
    const usedCard = cards.find((c) => c.id === tx.card_id)
      ?? (tx.card_name ? cards.find((c) => c.card_name.toLowerCase() === tx.card_name!.toLowerCase()) : null)
      ?? null;
    const actualDollar = usedCard ? getRewardDollarValue(usedCard, tx.category, tx.amount, pointVal) : 0;
    const missed = Math.max(0, bestDollar - actualDollar);

    rewardsEarned    += actualDollar;
    rewardsMissed    += missed;
    potentialRewards += bestDollar;

    if (!usedCard)         noCardCount++;
    else if (missed < 0.005) optimalCount++;
    else                   suboptimalCount++;

    // Category map
    if (!catMap[tx.category]) catMap[tx.category] = { category: tx.category, spend: 0, earned: 0, missed: 0, count: 0 };
    catMap[tx.category].spend  += tx.amount;
    catMap[tx.category].earned += actualDollar;
    catMap[tx.category].missed += missed;
    catMap[tx.category].count  += 1;

    // Daily trend — group by date so each day is its own data point
    const d   = new Date(tx.date + "T00:00:00");
    const lbl = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    if (!weekMap[tx.date]) weekMap[tx.date] = { label: lbl, earned: 0, missed: 0, potential: 0 };
    weekMap[tx.date].earned    += actualDollar;
    weekMap[tx.date].missed    += missed;
    weekMap[wk].potential += bestDollar;
  }

  // Opportunities: categories with >0 missed, sorted by missed desc
  const opportunities: Opportunity[] = Object.values(catMap)
    .filter((c) => c.missed > 0.005)
    .sort((a, b) => b.missed - a.missed)
    .slice(0, 5)
    .map((c) => {
      // Find best card for this category
      let bestDollar = 0, bestCardName = "";
      for (const card of cards) {
        const dv = getRewardDollarValue(card, c.category, 100, pointVal);
        if (dv > bestDollar) { bestDollar = dv; bestCardName = card.card_name; }
      }
      // Most-used card in this category
      const catTxs = purchases.filter((t) => t.category === c.category && t.card_name);
      const cardFreq: Record<string, number> = {};
      catTxs.forEach((t) => { if (t.card_name) cardFreq[t.card_name] = (cardFreq[t.card_name] ?? 0) + 1; });
      const mostUsed = Object.entries(cardFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

      return { category: c.category, missedTotal: c.missed, bestCard: bestCardName, mostUsedCard: mostUsed, transactionCount: c.count };
    });

  const trend = Object.entries(weekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => ({ ...v, earned: +v.earned.toFixed(2), missed: +v.missed.toFixed(2), potential: +v.potential.toFixed(2) }));

  return {
    totalSpend, rewardsEarned, rewardsMissed, potentialRewards,
    byCategory: Object.values(catMap).sort((a, b) => b.spend - a.spend),
    opportunities, trend, optimalCount, suboptimalCount, noCardCount,
  };
}

/* ─── stat card ─────────────────────────────────────────── */

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold ${color ?? "text-slate-900 dark:text-white"}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{sub}</p>}
    </div>
  );
}

/* ─── section wrapper ───────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
      <p className="mb-4 text-sm font-bold text-slate-800 dark:text-slate-100">{title}</p>
      {children}
    </div>
  );
}

/* ─── page ───────────────────────────────────────────────── */

export default function InsightsPage() {
  const cards            = useCardsStore((s) => s.cards);
  const pointValuation   = useCardsStore((s) => s.pointValuationPerPoint);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading]           = useState(true);
  const [mounted, setMounted]           = useState(false);
  const [period, setPeriod]             = useState<PeriodValue>("this_month");
  const [customFrom, setCustomFrom]     = useState("");
  const [customTo, setCustomTo]         = useState("");

  /* ── fetch all transactions once ── */
  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase.from("user_transactions").select("*").eq("user_id", user.id).order("date", { ascending: true });
    setTransactions((data ?? []) as Transaction[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setMounted(true); }, []);

  /* ── filter by period ── */
  const { from, to } = useMemo(() => {
    if (period === "custom") return { from: customFrom, to: customTo };
    return periodDates(period);
  }, [period, customFrom, customTo]);

  const filtered = useMemo(() =>
    transactions.filter((t) => (!from || t.date >= from) && (!to || t.date <= to)),
    [transactions, from, to]
  );

  /* ── aggregate ── */
  const agg = useMemo(() => aggregate(filtered, cards, pointValuation), [filtered, cards, pointValuation]);

  /* ── empty / loading states ── */
  if (loading) return (
    <div className="flex flex-1 items-center justify-center py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
    </div>
  );

  if (transactions.length === 0) return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-16 flex flex-col items-center gap-4 text-center">
      <span className="text-5xl">📊</span>
      <p className="text-lg font-semibold text-slate-900 dark:text-white">No data yet</p>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
        Add transactions to start seeing spending insights and reward opportunities.
      </p>
      <Link href="/transactions"
        className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
        Add transactions →
      </Link>
    </div>
  );

  const totalTx     = agg.optimalCount + agg.suboptimalCount + agg.noCardCount;
  const optimalPct  = totalTx > 0 ? Math.round((agg.optimalCount / totalTx) * 100) : 0;
  const missedPct   = totalTx > 0 ? Math.round((agg.suboptimalCount / totalTx) * 100) : 0;
  const noCardPct   = totalTx > 0 ? Math.round((agg.noCardCount / totalTx) * 100) : 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-8 flex flex-col gap-6">

      {/* ── Header + period filter ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Insights</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Aggregated analytics from your transactions.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-1 gap-1">
            {PERIOD_OPTIONS.map((opt) => (
              <button key={opt.value} type="button" onClick={() => setPeriod(opt.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  period === opt.value
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
          {period === "custom" && (
            <div className="flex items-center gap-1.5">
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 outline-none focus:border-indigo-400" />
              <span className="text-xs text-slate-400">to</span>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 outline-none focus:border-indigo-400" />
            </div>
          )}
        </div>
      </div>

      {/* ── Summary metrics ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total spend"      value={fmtShort(agg.totalSpend)}      sub={`${filtered.filter(t=>t.amount>0).length} transactions`} />
        <StatCard label="Rewards earned"   value={fmt(agg.rewardsEarned)}        color="text-emerald-600 dark:text-emerald-400" />
        <StatCard label="Rewards missed"   value={fmt(agg.rewardsMissed)}        color="text-red-500 dark:text-red-400" />
        <StatCard label="Potential rewards" value={fmt(agg.potentialRewards)}    color="text-indigo-600 dark:text-indigo-400" />
      </div>

      {filtered.filter(t => t.amount > 0).length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 py-16 text-center">
          <p className="text-sm text-slate-400 dark:text-slate-500">No transactions in this period.</p>
        </div>
      ) : (
        <>
          {/* ── Opportunities (most important) ── */}
          {agg.opportunities.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">💡 Opportunities to earn more</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {agg.opportunities.map((opp) => (
                  <div key={opp.category}
                    className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{CATEGORY_ICONS[opp.category] ?? "💳"}</span>
                      <span className="text-sm font-semibold capitalize text-amber-900 dark:text-amber-100">{opp.category}</span>
                    </div>
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                      {opp.mostUsedCard && opp.bestCard && opp.mostUsedCard !== opp.bestCard
                        ? `Switch from ${opp.mostUsedCard} to ${opp.bestCard} for ${opp.category} spending.`
                        : `Use ${opp.bestCard || "a better card"} for ${opp.category} purchases.`}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-base font-extrabold text-amber-700 dark:text-amber-300">
                        +{fmt(opp.missedTotal)}
                      </span>
                      <span className="text-[11px] text-amber-600 dark:text-amber-400">
                        {opp.transactionCount} transaction{opp.transactionCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <Link href={`/transactions`}
                      className="mt-1 rounded-lg border border-amber-300 dark:border-amber-700 py-1.5 text-center text-xs font-semibold text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors">
                      View transactions →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Charts grid ── */}
          <div className="grid gap-4 lg:grid-cols-2">

            {/* Spend by category — donut */}
            <Section title="Spend by category">
              {agg.byCategory.length === 0 ? (
                <p className="text-xs text-slate-400">No data.</p>
              ) : (
                <>
                {mounted && (
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={agg.byCategory.map(c => ({ name: `${CATEGORY_ICONS[c.category] ?? ""} ${c.category}`, value: +c.spend.toFixed(2) }))}
                          cx="50%" cy="50%" innerRadius="55%" outerRadius="80%"
                          dataKey="value" paddingAngle={2}>
                          {agg.byCategory.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v) => fmt(Number(v ?? 0))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {agg.byCategory.slice(0, 6).map((c, i) => (
                    <span key={c.category} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <span className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="capitalize">{c.category}</span>
                      <span className="text-slate-400">{fmt(c.spend)}</span>
                    </span>
                  ))}
                </div>
                </>
              )}
            </Section>

            {/* Earned vs Missed by category — bar */}
            <Section title="Earned vs missed by category">
              {agg.byCategory.length === 0 ? (
                <p className="text-xs text-slate-400">No data.</p>
              ) : mounted ? (
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={agg.byCategory.slice(0, 6).map(c => ({
                      name: c.category.charAt(0).toUpperCase() + c.category.slice(1),
                      Earned: +c.earned.toFixed(2),
                      Missed: +c.missed.toFixed(2),
                    }))} margin={{ top: 0, right: 0, left: -20, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v) => fmt(Number(v ?? 0))} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="Earned" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Missed" fill="#f87171" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : null}
            </Section>

            {/* Rewards trend — line */}
            {agg.trend.length > 0 && (
              <Section title="Rewards trend">
                {agg.trend.length === 1 && (
                  <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">
                    Add transactions across multiple dates to see a full trend.
                  </p>
                )}
                {mounted && <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={agg.trend} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v) => fmt(Number(v ?? 0))} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="earned"    stroke="#10b981" strokeWidth={2} dot={false} name="Earned" />
                      <Line type="monotone" dataKey="missed"    stroke="#f87171" strokeWidth={2} dot={false} name="Missed" />
                      <Line type="monotone" dataKey="potential" stroke="#6366f1" strokeWidth={2} dot={false} strokeDasharray="4 2" name="Potential" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>}
              </Section>
            )}

            {/* Card usage breakdown */}
            <Section title="Card usage breakdown">
              <div className="flex flex-col gap-3">
                {[
                  { label: "Optimal — best card used",     pct: optimalPct, count: agg.optimalCount,    color: "bg-emerald-500" },
                  { label: "Suboptimal — better card exists", pct: missedPct,  count: agg.suboptimalCount, color: "bg-amber-400"   },
                  { label: "No card tracked",              pct: noCardPct,  count: agg.noCardCount,     color: "bg-slate-300 dark:bg-slate-600" },
                ].map(({ label, pct, count, color }) => (
                  <div key={label} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-300">{label}</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{pct}% <span className="font-normal text-slate-400">({count})</span></span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Where you earn the most */}
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-3">Where you earn the most</p>
                <div className="flex flex-col gap-2">
                  {agg.byCategory.filter(c => c.earned > 0).slice(0, 5).map((c) => (
                    <div key={c.category} className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-sm capitalize text-slate-700 dark:text-slate-200">
                        {CATEGORY_ICONS[c.category] ?? "💳"} {c.category}
                      </span>
                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{fmt(c.earned)}</span>
                    </div>
                  ))}
                  {agg.byCategory.filter(c => c.earned > 0).length === 0 && (
                    <p className="text-xs text-slate-400 dark:text-slate-500">No rewards tracked yet — add card info to transactions.</p>
                  )}
                </div>
              </div>
            </Section>
          </div>
        </>
      )}
    </div>
  );
}
