"use client";

import Image from "next/image";
import { useState, useMemo } from "react";

import { getCatalog, findCardByName } from "@/lib/catalogLoader";
import { KNOWN_CATEGORIES } from "@/lib/merchant";
import { useCardsStore } from "@/store/useCardsStore";
import { IssuerLogo } from "@/components/IssuerLogo";
import type { UserCard, RewardRule } from "@/types/card";

const MAX_CARDS = 3;
const REF_SPEND = 100;

const CATEGORY_ICONS: Record<string, string> = {
  dining: "🍽️", travel: "✈️", groceries: "🛒", gas: "⛽",
  entertainment: "🎬", online: "💻", shopping: "🛍️", rent: "🏠", other: "💳",
};

/* ─── reward helpers ─────────────────────────────────────── */

function bestRule(card: UserCard, category: string): RewardRule | null {
  const cat = category.toLowerCase();
  const direct = card.reward_rules.filter((r) => r.category.toLowerCase() === cat);
  if (direct.length) return direct.reduce((a, b) => (a.multiplier >= b.multiplier ? a : b));
  const fallback = card.reward_rules.filter((r) =>
    ["other", "general", "everything"].includes(r.category.toLowerCase())
  );
  if (fallback.length) return fallback.reduce((a, b) => (a.multiplier >= b.multiplier ? a : b));
  return null;
}

function dollarEquiv(card: UserCard, rule: RewardRule): number {
  if (card.reward_type === "cashback") return REF_SPEND * (rule.multiplier / 100);
  return REF_SPEND * rule.multiplier * (card.point_value > 0 ? card.point_value : 0.01);
}

function rateLabel(card: UserCard, rule: RewardRule | null): string {
  if (!rule) return "—";
  return card.reward_type === "cashback" ? `${rule.multiplier}%` : `${rule.multiplier}×`;
}

/* ─── grid class lookup (complete strings for Tailwind scanner) */
const GRID: Record<number, string> = {
  1: "grid-cols-[120px_repeat(1,minmax(140px,1fr))]",
  2: "grid-cols-[120px_repeat(2,minmax(140px,1fr))]",
  3: "grid-cols-[120px_repeat(3,minmax(140px,1fr))]",
};

/* ─── CardPicker ─────────────────────────────────────────── */

function CardPicker({
  selected,
  onToggle,
}: {
  selected: UserCard[];
  onToggle: (card: UserCard) => void;
}) {
  const walletCards = useCardsStore((s) => s.cards);
  const [search, setSearch] = useState("");

  const selectedIds = new Set(selected.map((c) => c.id));
  const full = selected.length >= MAX_CARDS;

  const walletNames = useMemo(
    () => new Set(walletCards.map((c) => c.card_name.toLowerCase())),
    [walletCards]
  );

  const catalogResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return getCatalog()
      .filter((c) => !walletNames.has(c.card_name.toLowerCase()))
      .filter(
        (c) =>
          c.card_name.toLowerCase().includes(q) ||
          c.issuer.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [search, walletNames]);

  function ChipButton({ card, image }: { card: UserCard; image?: string }) {
    const isSelected = selectedIds.has(card.id);
    return (
      <button
        type="button"
        onClick={() => onToggle(card)}
        disabled={!isSelected && full}
        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all disabled:opacity-40 ${
          isSelected
            ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
            : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-700"
        }`}
      >
        {image ? (
          <Image src={image} alt={card.card_name} width={28} height={18} className="rounded object-contain" />
        ) : (
          <IssuerLogo issuer={card.issuer} size={16} />
        )}
        <span className="max-w-[160px] truncate">{card.card_name}</span>
        {isSelected && <span className="shrink-0 text-indigo-500 dark:text-indigo-400">✓</span>}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {walletCards.length > 0 && (
        <div>
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Your wallet
          </p>
          <div className="flex flex-wrap gap-2">
            {walletCards.map((card) => (
              <ChipButton
                key={card.id}
                card={card}
                image={findCardByName(card.card_name)?.image}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Search all cards
        </p>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by card name or issuer…"
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
        />
        {catalogResults.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-2">
            {catalogResults.map((cat) => {
              const card: UserCard = {
                id: cat.id,
                card_name: cat.card_name,
                issuer: cat.issuer,
                network: cat.network,
                reward_type: cat.reward_type,
                annual_fee: cat.annual_fee,
                point_value: cat.point_value,
                reward_rules: cat.reward_rules,
              };
              return <ChipButton key={cat.id} card={card} image={cat.image} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── CompareRow ─────────────────────────────────────────── */

function CompareRow({
  label,
  cards,
  gridClass,
  render,
  highlight,
  isLast = false,
}: {
  label: string;
  cards: UserCard[];
  gridClass: string;
  render: (card: UserCard, idx: number) => React.ReactNode;
  highlight?: (card: UserCard, idx: number) => boolean;
  isLast?: boolean;
}) {
  return (
    <div className={`grid ${gridClass} ${!isLast ? "border-b border-slate-100 dark:border-slate-800" : ""}`}>
      <div className="flex items-center px-4 py-3.5 text-xs font-medium text-slate-500 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800">
        {label}
      </div>
      {cards.map((card, i) => {
        const isWinner = highlight?.(card, i) ?? false;
        return (
          <div
            key={card.id}
            className={`flex items-center justify-center px-3 py-3.5 text-center ${
              i < cards.length - 1 ? "border-r border-slate-100 dark:border-slate-800" : ""
            } ${isWinner ? "bg-indigo-50/60 dark:bg-indigo-950/20" : ""}`}
          >
            {render(card, i)}
          </div>
        );
      })}
    </div>
  );
}

/* ─── ComparisonTable ────────────────────────────────────── */

function ComparisonTable({ cards }: { cards: UserCard[] }) {
  const gridClass = GRID[cards.length] ?? GRID[2];
  const categories = KNOWN_CATEGORIES.filter((c) => c !== "other");
  const hasPoints = cards.some((c) => c.reward_type !== "cashback");
  const lowestFee = Math.min(...cards.map((c) => c.annual_fee));

  function catWinnerIdx(cat: string): number {
    let best = -1;
    let bestIdx = -1;
    let tieCount = 0;
    cards.forEach((card, i) => {
      const rule = bestRule(card, cat);
      if (rule) {
        const val = dollarEquiv(card, rule);
        if (val > best) { best = val; bestIdx = i; tieCount = 1; }
        else if (val === best) { tieCount++; }
      }
    });
    return tieCount > 1 ? -1 : bestIdx;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">

      {/* Card header row */}
      <div className={`grid ${gridClass} border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50`}>
        <div className="p-4 border-r border-slate-200 dark:border-slate-700" />
        {cards.map((card, i) => {
          const image = findCardByName(card.card_name)?.image;
          return (
            <div
              key={card.id}
              className={`flex flex-col items-center gap-2 p-4 text-center ${
                i < cards.length - 1 ? "border-r border-slate-200 dark:border-slate-700" : ""
              }`}
            >
              <div className="relative mx-auto h-12 w-full max-w-[80px]">
                {image ? (
                  <Image src={image} alt={card.card_name} fill className="object-contain drop-shadow" sizes="80px" />
                ) : (
                  <div className="h-full w-full rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg">
                    {card.issuer[0]}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 mb-0.5 w-full overflow-hidden">
                  <IssuerLogo issuer={card.issuer} size={11} />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{card.issuer}</span>
                </div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white leading-snug">{card.card_name}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Annual fee */}
      <CompareRow
        label="Annual fee"
        cards={cards}
        gridClass={gridClass}
        highlight={(card) => card.annual_fee === lowestFee}
        render={(card) => (
          <span className={`text-sm font-bold ${card.annual_fee === lowestFee ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-slate-200"}`}>
            {card.annual_fee === 0 ? "Free" : `$${card.annual_fee}/yr`}
          </span>
        )}
      />

      {/* Reward type */}
      <CompareRow
        label="Reward type"
        cards={cards}
        gridClass={gridClass}
        render={(card) => (
          <span className="capitalize rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:text-indigo-300">
            {card.reward_type}
          </span>
        )}
      />

      {/* Category rows */}
      {categories.map((cat) => {
        const winIdx = catWinnerIdx(cat);
        return (
          <CompareRow
            key={cat}
            label={`${CATEGORY_ICONS[cat] ?? "💳"} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`}
            cards={cards}
            gridClass={gridClass}
            highlight={(_, i) => i === winIdx}
            render={(card, i) => {
              const rule = bestRule(card, cat);
              const isWinner = i === winIdx && rule !== null;
              return (
                <div className="flex flex-col items-center gap-0.5">
                  <span className={`text-sm font-bold ${
                    isWinner
                      ? "text-indigo-600 dark:text-indigo-400"
                      : rule
                      ? "text-slate-800 dark:text-slate-200"
                      : "text-slate-300 dark:text-slate-600"
                  }`}>
                    {rateLabel(card, rule)}
                  </span>
                  {isWinner && rule && (
                    <span className="text-[9px] font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-400">
                      best
                    </span>
                  )}
                </div>
              );
            }}
          />
        );
      })}

      {/* Point value */}
      {hasPoints && (
        <CompareRow
          label="Point value"
          cards={cards}
          gridClass={gridClass}
          render={(card) =>
            card.reward_type === "cashback" ? (
              <span className="text-sm text-slate-300 dark:text-slate-600">—</span>
            ) : (
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {(card.point_value * 100).toFixed(2)}¢
              </span>
            )
          }
        />
      )}

      {/* Network */}
      <CompareRow
        label="Network"
        cards={cards}
        gridClass={gridClass}
        isLast
        render={(card) => (
          <span className="text-sm text-slate-600 dark:text-slate-300">{card.network}</span>
        )}
      />
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────── */

export default function ComparePage() {
  const [selected, setSelected] = useState<UserCard[]>([]);

  function toggleCard(card: UserCard) {
    setSelected((prev) => {
      const exists = prev.findIndex((c) => c.id === card.id);
      if (exists >= 0) return prev.filter((_, i) => i !== exists);
      if (prev.length >= MAX_CARDS) return prev;
      return [...prev, card];
    });
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-8 flex flex-col gap-6">

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Compare Cards</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Select up to {MAX_CARDS} cards to see a side-by-side breakdown.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <CardPicker selected={selected} onToggle={toggleCard} />
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Comparing:</span>
          {selected.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => toggleCard(card)}
              className="group inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              {card.card_name}
              <span className="group-hover:text-red-500 dark:group-hover:text-red-400">×</span>
            </button>
          ))}
        </div>
      )}

      {selected.length >= 2 ? (
        <ComparisonTable cards={selected} />
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 py-20 text-center">
          <span className="text-5xl">⚖️</span>
          <p className="text-base font-semibold text-slate-700 dark:text-slate-200">
            Pick at least 2 cards to compare
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs">
            Choose from your wallet or search the full catalog above.
          </p>
        </div>
      )}
    </div>
  );
}
