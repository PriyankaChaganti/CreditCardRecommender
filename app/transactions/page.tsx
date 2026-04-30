"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Modal } from "@/components/Modal";
import { IssuerLogo } from "@/components/IssuerLogo";
import { createClient } from "@/lib/supabase/client";
import { KNOWN_CATEGORIES } from "@/lib/merchant";
import { recommendBestCards } from "@/lib/recommendation";
import { useCardsStore } from "@/store/useCardsStore";
import type { UserCard } from "@/types/card";
import type { Transaction, TransactionFormValues, TransactionWithRewards, RewardDetail } from "@/types/transaction";

/* ─── constants ────────────────────────────────────────── */

const CATEGORY_ICONS: Record<string, string> = {
  dining: "🍽️", travel: "✈️", groceries: "🛒", gas: "⛽",
  entertainment: "🎬", online: "💻", shopping: "🛍️", fitness: "🏋️", rent: "🏠", other: "💳",
};

/* ─── helpers ───────────────────────────────────────────── */

function formatMoney(n: number): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
}

function formatDate(d: string): string {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(d + "T00:00:00"));
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/* Compute reward for a single card + category + amount */
function getRewardForCard(card: UserCard, category: string, amount: number, pointValuation: number): RewardDetail | null {
  const cat = category.toLowerCase();
  const rules = card.reward_rules;
  let rule = rules.find((r) => r.category.toLowerCase() === cat);
  if (!rule) rule = rules.find((r) => ["other", "general", "everything"].includes(r.category.toLowerCase()));
  if (!rule) rule = rules.reduce<typeof rules[0] | undefined>((best, r) => (!best || r.multiplier > best.multiplier ? r : best), undefined);
  if (!rule) return null;

  const pv = card.point_value > 0 ? card.point_value : pointValuation;
  if (card.reward_type === "cashback") {
    const dv = amount * (rule.multiplier / 100);
    return { dollarValue: dv, rawReward: dv, unit: "cashback", multiplier: rule.multiplier, cardName: card.card_name };
  }
  const pts = amount * rule.multiplier;
  return { dollarValue: pts * pv, rawReward: pts, unit: card.reward_type as "points" | "miles", multiplier: rule.multiplier, cardName: card.card_name };
}

/* Annotate a raw transaction with reward analysis */
function annotate(tx: Transaction, cards: UserCard[], pointValuation: number): TransactionWithRewards {
  // Refunds: no reward analysis
  if (tx.amount <= 0) {
    return { ...tx, actualReward: null, bestReward: null, missedDollars: 0, isOptimal: true };
  }

  const usedCard = cards.find((c) => c.id === tx.card_id)
    ?? (tx.card_name ? cards.find((c) => c.card_name.toLowerCase() === tx.card_name!.toLowerCase()) : null)
    ?? null;
  const actualReward = usedCard ? getRewardForCard(usedCard, tx.category, tx.amount, pointValuation) : null;

  let bestReward: RewardDetail | null = null;
  if (cards.length > 0) {
    const result = recommendBestCards(cards, tx.category, tx.amount, pointValuation, null);
    if (result.candidates.length > 0) {
      const top = result.candidates[0];
      bestReward = {
        dollarValue: top.reward_value,
        rawReward: top.raw_reward,
        unit: top.raw_unit,
        multiplier: top.rule.multiplier,
        cardName: top.card.card_name,
      };
    }
  }

  const missedDollars = Math.max(0, (bestReward?.dollarValue ?? 0) - (actualReward?.dollarValue ?? 0));
  const isOptimal = !!actualReward && missedDollars < 0.005;

  return { ...tx, actualReward, bestReward, missedDollars, isOptimal };
}

/* ─── AddTransactionForm ────────────────────────────────── */

function AddTransactionForm({
  cards,
  onSubmit,
  onCancel,
  error,
  initialValues,
  submitLabel = "Add Transaction",
}: {
  cards: UserCard[];
  onSubmit: (v: TransactionFormValues) => void;
  onCancel: () => void;
  error: string | null;
  initialValues?: TransactionFormValues;
  submitLabel?: string;
}) {
  const [form, setForm] = useState<TransactionFormValues>(
    initialValues ?? {
      merchant: "", amount: 0, date: today(), category: "dining",
      card_id: cards[0]?.id ?? null, card_name: cards[0]?.card_name ?? null,
      mcc_code: null, notes: null,
    }
  );

  function set<K extends keyof TransactionFormValues>(key: K, value: TransactionFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleCardChange(cardId: string) {
    if (cardId === "") { set("card_id", null); set("card_name", null); return; }
    const c = cards.find((c) => c.id === cardId);
    set("card_id", cardId);
    set("card_name", c?.card_name ?? null);
  }

  function handleClear() {
    setForm({
      merchant: "", amount: 0, date: today(), category: "dining",
      card_id: null, card_name: null, mcc_code: null, notes: null,
    });
  }

  const inputCls = "w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-50 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all";
  const labelCls = "block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5";

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="flex flex-col gap-4">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Merchant */}
      <div>
        <label className={labelCls}>Merchant</label>
        <input required type="text" value={form.merchant} onChange={(e) => set("merchant", e.target.value)}
          placeholder="e.g. Starbucks, Amazon…" className={inputCls} />
      </div>

      {/* Amount + Date */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Amount ($)</label>
          <input required type="number" step="0.01" value={form.amount || ""}
            onChange={(e) => set("amount", parseFloat(e.target.value) || 0)}
            placeholder="0.00" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Date</label>
          <input required type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className={inputCls} />
        </div>
      </div>

      {/* Category */}
      <div>
        <label className={labelCls}>Category</label>
        <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inputCls}>
          {KNOWN_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{CATEGORY_ICONS[cat] ?? "💳"} {cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Card used */}
      <div>
        <label className={labelCls}>Card used</label>
        <select value={form.card_id ?? ""} onChange={(e) => handleCardChange(e.target.value)} className={inputCls}>
          <option value="">💵 None / Cash</option>
          {cards.map((c) => <option key={c.id} value={c.id}>{c.card_name}</option>)}
        </select>
      </div>

      {/* MCC + Notes */}
      <div>
        <label className={labelCls}>MCC Code <span className="text-slate-400 font-normal">(optional)</span></label>
        <input type="text" value={form.mcc_code ?? ""} onChange={(e) => set("mcc_code", e.target.value || null)}
          placeholder="e.g. 5812" className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Notes <span className="text-slate-400 font-normal">(optional)</span></label>
        <textarea rows={2} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value || null)}
          placeholder="Any notes…" className={`${inputCls} resize-none`} />
      </div>

      <div className="flex gap-2 pt-1">
        <button type="submit"
          className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
          {submitLabel}
        </button>
        <button type="button" onClick={onCancel}
          className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ─── TransactionRow ────────────────────────────────────── */

function TransactionRow({
  tx,
  onDelete,
  onEdit,
}: {
  tx: TransactionWithRewards;
  onDelete: (id: string) => void;
  onEdit: (tx: Transaction) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isRefund = tx.amount < 0;

  const statusBadge = isRefund ? null : tx.actualReward === null ? null : tx.isOptimal ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
      ✓ Optimal
    </span>
  ) : tx.missedDollars > 0.005 ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/40 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
      Missed {formatMoney(tx.missedDollars)}
    </span>
  ) : null;

  return (
    <div className={`rounded-2xl border bg-white dark:bg-slate-900 overflow-hidden transition-all ${
      !isRefund && !tx.isOptimal && tx.missedDollars > 0.005
        ? "border-amber-200 dark:border-amber-800"
        : "border-slate-100 dark:border-slate-800"
    }`}>
      {/* Main row — clickable */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left"
      >
        {/* ── Mobile layout ── */}
        <div className="sm:hidden flex items-start gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-xl">
            {CATEGORY_ICONS[tx.category] ?? "💳"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{tx.merchant}</p>
              <p className={`shrink-0 text-sm font-bold ${isRefund ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"}`}>
                {isRefund ? "+" : "-"}{formatMoney(Math.abs(tx.amount))}
              </p>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {formatDate(tx.date)} · <span className="capitalize">{tx.category}</span>
            </p>
            {tx.card_name && (
              <div className="mt-1 flex items-center gap-1">
                <IssuerLogo issuer={tx.card_name.split(" ")[0]} size={11} />
                <span className="text-xs text-slate-400 dark:text-slate-500 truncate">{tx.card_name}</span>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between gap-2">
              <div>
                {tx.actualReward && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Earned: <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {tx.actualReward.unit === "cashback"
                        ? formatMoney(tx.actualReward.rawReward)
                        : `${Math.round(tx.actualReward.rawReward)} pts`}
                    </span>
                  </span>
                )}
                {!tx.card_name && !isRefund && (
                  <span className="text-xs text-slate-400 dark:text-slate-500">No card tracked</span>
                )}
              </div>
              {statusBadge}
            </div>
          </div>
        </div>

        {/* ── Desktop layout ── */}
        <div className="hidden sm:grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr_auto] items-center gap-4 px-5 py-4">
          {/* Merchant */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-lg">
              {CATEGORY_ICONS[tx.category] ?? "💳"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{tx.merchant}</p>
              <p className="text-xs capitalize text-slate-400 dark:text-slate-500">{tx.category}</p>
            </div>
          </div>
          {/* Date */}
          <p className="text-sm text-slate-500 dark:text-slate-400">{formatDate(tx.date)}</p>
          {/* Card */}
          <div className="flex items-center gap-1.5 min-w-0">
            {tx.card_name ? (
              <>
                <IssuerLogo issuer={tx.card_name.split(" ")[0]} size={13} />
                <span className="text-sm text-slate-600 dark:text-slate-300 truncate">{tx.card_name}</span>
              </>
            ) : (
              <span className="text-sm text-slate-400 dark:text-slate-500">Cash</span>
            )}
          </div>
          {/* Amount */}
          <p className={`text-sm font-bold ${isRefund ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"}`}>
            {isRefund ? "+" : "-"}{formatMoney(Math.abs(tx.amount))}
          </p>
          {/* Rewards earned */}
          <div>
            {tx.actualReward ? (
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {tx.actualReward.unit === "cashback"
                  ? formatMoney(tx.actualReward.rawReward)
                  : `${Math.round(tx.actualReward.rawReward)} pts`}
              </p>
            ) : (
              <p className="text-sm text-slate-300 dark:text-slate-600">—</p>
            )}
          </div>
          {/* Status */}
          <div className="flex items-center gap-2">
            {statusBadge}
            <svg className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-800 px-4 sm:px-5 py-4 flex flex-col gap-4">

          {/* Reward breakdown */}
          {tx.actualReward && (
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1">Rewards earned</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {tx.actualReward.unit === "cashback"
                  ? `${tx.actualReward.multiplier}% back = ${formatMoney(tx.actualReward.rawReward)}`
                  : `${tx.actualReward.multiplier}× pts × ${formatMoney(tx.actualReward.dollarValue / tx.actualReward.rawReward)}/pt = ${Math.round(tx.actualReward.rawReward)} pts (~${formatMoney(tx.actualReward.dollarValue)})`}
              </p>
            </div>
          )}

          {/* Missed rewards + best card explanation */}
          {!isRefund && !tx.isOptimal && tx.bestReward && tx.missedDollars > 0.005 && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400 mb-1">
                Why {tx.bestReward.cardName} is better
              </p>
              <p className="text-sm text-amber-900 dark:text-amber-200">
                {tx.bestReward.unit === "cashback"
                  ? `${tx.bestReward.cardName} earns ${tx.bestReward.multiplier}% back here vs your card's rate — that's ${formatMoney(tx.bestReward.dollarValue)} instead of ${formatMoney(tx.actualReward?.dollarValue ?? 0)}.`
                  : `${tx.bestReward.cardName} earns ${tx.bestReward.multiplier}× points here — worth ~${formatMoney(tx.bestReward.dollarValue)} vs ${formatMoney(tx.actualReward?.dollarValue ?? 0)}.`}
              </p>
              <p className="mt-1 text-sm font-semibold text-amber-800 dark:text-amber-300">
                Missed: {formatMoney(tx.missedDollars)}
              </p>
            </div>
          )}

          {/* No card tracked — show best available */}
          {!isRefund && !tx.card_id && tx.bestReward && (
            <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-400 mb-1">Best card for this purchase</p>
              <p className="text-sm text-indigo-900 dark:text-indigo-200">
                <span className="font-semibold">{tx.bestReward.cardName}</span> would have earned{" "}
                {tx.bestReward.unit === "cashback"
                  ? formatMoney(tx.bestReward.rawReward)
                  : `${Math.round(tx.bestReward.rawReward)} pts (~${formatMoney(tx.bestReward.dollarValue)})`}
              </p>
            </div>
          )}

          {/* Meta */}
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-400 dark:text-slate-500">
            {tx.mcc_code && <span>MCC: <span className="font-mono font-medium text-slate-600 dark:text-slate-300">{tx.mcc_code}</span></span>}
            {tx.notes && <span>Note: <span className="text-slate-600 dark:text-slate-300">{tx.notes}</span></span>}
            <span>Added: {new Date(tx.created_at).toLocaleDateString()}</span>
          </div>

          {/* Edit + Delete */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(tx)}
              className="rounded-full border border-slate-200 dark:border-slate-700 px-4 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-full border border-red-200 dark:border-red-800 px-4 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* ── Delete confirmation modal ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/40">
              <svg className="h-6 w-6 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </div>
            <h2 className="text-center text-base font-bold text-slate-900 dark:text-white">Delete transaction?</h2>
            <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
              <span className="font-medium text-slate-700 dark:text-slate-200">{tx.merchant}</span> — {formatMoney(Math.abs(tx.amount))} on {formatDate(tx.date)} will be permanently deleted.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => { onDelete(tx.id); setShowDeleteConfirm(false); }}
                className="w-full rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
              >
                Yes, delete
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────── */

type Tab = "all" | "optimal" | "missed";

export default function TransactionsPage() {
  const cards = useCardsStore((s) => s.cards);
  const pointValuationPerPoint = useCardsStore((s) => s.pointValuationPerPoint);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  // Filters
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [committedSearch, setCommittedSearch] = useState("");
  const [filterCard, setFilterCard] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  /* ── Fetch ── */
  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("user_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
    setTransactions((data ?? []) as Transaction[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Annotate ── */
  const annotated = useMemo<TransactionWithRewards[]>(
    () => transactions.map((tx) => annotate(tx, cards, pointValuationPerPoint)),
    [transactions, cards, pointValuationPerPoint]
  );

  /* ── Filter ── */
  const filtered = useMemo(() => {
    let list = annotated;
    if (tab === "optimal") list = list.filter((t) => t.isOptimal && t.amount > 0);
    if (tab === "missed") list = list.filter((t) => t.missedDollars > 0.005);
    if (committedSearch) {
      const q = committedSearch.toLowerCase();
      list = list.filter((t) => t.merchant.toLowerCase().includes(q) || String(t.amount).includes(q));
    }
    if (filterCard) list = list.filter((t) => t.card_name === filterCard);
    if (filterCategory) list = list.filter((t) => t.category === filterCategory);
    if (dateFrom) list = list.filter((t) => t.date >= dateFrom);
    if (dateTo) list = list.filter((t) => t.date <= dateTo);
    return list;
  }, [annotated, tab, committedSearch, filterCard, filterCategory, dateFrom, dateTo]);

  /* ── Add ── */
  async function handleAdd(values: TransactionFormValues) {
    setFormError(null);
    if (!values.merchant.trim()) { setFormError("Merchant name is required."); return; }
    if (!values.amount || values.amount === 0) { setFormError("Amount cannot be zero."); return; }
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setFormError("You must be signed in."); return; }
    const { data, error } = await supabase
      .from("user_transactions")
      .insert({ ...values, user_id: user.id })
      .select()
      .single();
    if (error) { setFormError(error.message); return; }
    setTransactions((prev) => [data as Transaction, ...prev]);
    setModalOpen(false);
    setBanner("Transaction added.");
    setTimeout(() => setBanner(null), 3000);
  }

  /* ── Delete ── */
  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("user_transactions").delete().eq("id", id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  /* ── Edit / Update ── */
  async function handleUpdate(values: TransactionFormValues) {
    if (!editingTx) return;
    setFormError(null);
    if (!values.merchant.trim()) { setFormError("Merchant name is required."); return; }
    if (!values.amount || values.amount === 0) { setFormError("Amount cannot be zero."); return; }
    const supabase = createClient();
    const { error } = await supabase
      .from("user_transactions")
      .update(values)
      .eq("id", editingTx.id);
    if (error) { setFormError(error.message); return; }
    setTransactions((prev) =>
      prev.map((t) => t.id === editingTx.id ? { ...t, ...values } : t)
    );
    setEditingTx(null);
    setBanner("Transaction updated.");
    setTimeout(() => setBanner(null), 3000);
  }

  const uniqueCardNames = [...new Set(transactions.map((t) => t.card_name).filter(Boolean) as string[])];

  /* ── Auth guard ── */
  if (!loading && transactions.length === 0 && cards.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-16 flex flex-col items-center gap-4 text-center">
        <span className="text-5xl">💸</span>
        <p className="text-lg font-semibold text-slate-900 dark:text-white">No transactions yet</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
          Add your credit cards first, then log transactions to see reward analysis.
        </p>
        <Link href="/wallet" className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
          Add your cards →
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-8 flex flex-col gap-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Transactions</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Track spending and see reward analysis per purchase.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setFormError(null); setModalOpen(true); }}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add
        </button>
      </div>

      {/* ── Banner ── */}
      {banner && (
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 px-4 py-3 text-sm text-indigo-800 dark:text-indigo-200">
          {banner}
        </div>
      )}

      {/* ── Filters ── */}
      <div className="flex flex-col gap-3">
        {/* Tabs + Search row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Tab pills */}
          <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-1 gap-1">
            {(["all", "optimal", "missed"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                  tab === t
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                {t === "missed" ? "Missed rewards" : t}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[180px] flex gap-2">
            <div className="relative flex-1">
              <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx={11} cy={11} r={8} /><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="search"
                value={search}
                onChange={(e) => { setSearch(e.target.value); if (!e.target.value) setCommittedSearch(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") setCommittedSearch(search); }}
                placeholder="Search merchant…"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 pl-9 pr-3 text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
            <button
              type="button"
              onClick={() => setCommittedSearch(search)}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              Search
            </button>
          </div>
        </div>

        {/* Secondary filters */}
        <div className="flex flex-wrap gap-2">
          <select value={filterCard} onChange={(e) => setFilterCard(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 outline-none focus:border-indigo-400 transition-all">
            <option value="">All cards</option>
            {uniqueCardNames.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 outline-none focus:border-indigo-400 transition-all">
            <option value="">All categories</option>
            {KNOWN_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>)}
          </select>
          <div className="flex items-center gap-1.5">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 outline-none focus:border-indigo-400 transition-all" />
            <span className="text-xs text-slate-400">to</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 outline-none focus:border-indigo-400 transition-all" />
            {(filterCard || filterCategory || dateFrom || dateTo || committedSearch) && (
              <button
                type="button"
                onClick={() => { setFilterCard(""); setFilterCategory(""); setDateFrom(""); setDateTo(""); setSearch(""); setCommittedSearch(""); }}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Desktop column headers ── */}
      {filtered.length > 0 && (
        <div className="hidden sm:grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr_auto] gap-4 px-5 pb-1">
          {["Merchant", "Date", "Card", "Amount", "Earned", "Status"].map((h) => (
            <span key={h} className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{h}</span>
          ))}
        </div>
      )}

      {/* ── Transaction list ── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 py-16 text-center">
          <span className="text-4xl">💸</span>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {transactions.length === 0 ? "No transactions yet." : "No transactions match your filters."}
          </p>
          {transactions.length === 0 && (
            <button
              type="button"
              onClick={() => { setFormError(null); setModalOpen(true); }}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add your first transaction
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((tx) => (
            <TransactionRow
              key={tx.id}
              tx={tx}
              onDelete={handleDelete}
              onEdit={(t) => { setFormError(null); setEditingTx(t); }}
            />
          ))}
          {/* Add button below the list */}
          <button
            type="button"
            onClick={() => { setFormError(null); setModalOpen(true); }}
            className="mt-2 inline-flex items-center justify-center gap-1.5 self-center rounded-full border border-slate-200 dark:border-slate-700 px-5 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add transaction
          </button>
        </div>
      )}

      {/* ── Add transaction modal ── */}
      <Modal open={modalOpen} title="Add Transaction" onClose={() => setModalOpen(false)}>
        <AddTransactionForm
          cards={cards}
          onSubmit={handleAdd}
          onCancel={() => setModalOpen(false)}
          error={formError}
        />
      </Modal>

      {/* ── Edit transaction modal ── */}
      <Modal open={!!editingTx} title="Edit Transaction" onClose={() => setEditingTx(null)}>
        {editingTx && (
          <AddTransactionForm
            cards={cards}
            onSubmit={handleUpdate}
            onCancel={() => setEditingTx(null)}
            error={formError}
            submitLabel="Save changes"
            initialValues={{
              merchant: editingTx.merchant,
              amount: editingTx.amount,
              date: editingTx.date,
              category: editingTx.category,
              card_id: editingTx.card_id,
              card_name: editingTx.card_name,
              mcc_code: editingTx.mcc_code,
              notes: editingTx.notes,
            }}
          />
        )}
      </Modal>
    </div>
  );
}
