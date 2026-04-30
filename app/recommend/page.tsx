"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { RecommendationResult } from "@/components/RecommendationResult";
import { findCardByName, getCatalog } from "@/lib/catalogLoader";
import type { UserCard } from "@/types/card";
import { KNOWN_CATEGORIES, resolveMerchantToCategory, suggestMerchants } from "@/lib/merchant";
import { recommendBestCards } from "@/lib/recommendation";
import { useCardsStore } from "@/store/useCardsStore";


function capitalize(s: string): string {
  return s
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const CATEGORY_ICONS: Record<string, string> = {
  dining: "🍽️", travel: "✈️", groceries: "🛒", gas: "⛽",
  entertainment: "🎬", online: "💻", shopping: "🛍️", rent: "🏠", other: "💳",
};

const CATEGORY_FALLBACKS: Record<string, string[]> = {
  shopping: ["online", "other", "general", "everything"],
};

function getBestRateForCategory(category: string, walletCards?: UserCard[]): string {
  const cat = category.toLowerCase();
  const fallbacks = CATEGORY_FALLBACKS[cat] ?? ["other", "general", "everything"];
  const lookup = [cat, ...fallbacks];

  // Use wallet cards when available, fall back to catalog
  const fromWallet = walletCards && walletCards.length > 0;
  const source = fromWallet ? walletCards! : getCatalog();

  let bestDollarEquiv = 0;
  let bestLabel = "";

  for (const card of source) {
    for (const rule of card.reward_rules) {
      const rCat = rule.category.trim().toLowerCase();
      if (lookup.includes(rCat)) {
        const pv = ("point_value" in card && (card as UserCard).point_value > 0)
          ? (card as UserCard).point_value
          : 0.01;
        const dollarEquiv = card.reward_type === "cashback"
          ? rule.multiplier
          : rule.multiplier * pv * 100;
        if (dollarEquiv > bestDollarEquiv) {
          bestDollarEquiv = dollarEquiv;
          bestLabel = card.reward_type === "cashback"
            ? fromWallet ? `${rule.multiplier}% back` : `Up to ${rule.multiplier}% back`
            : fromWallet ? `${rule.multiplier}× points` : `Up to ${rule.multiplier}× points`;
        }
      }
    }
  }
  return bestLabel;
}

function YourCards({ cards }: { cards: UserCard[] }) {
  const [expanded, setExpanded] = useState(false);
  const displayed = expanded ? cards : cards.slice(0, 4);

  function CardTileUser({ card }: { card: UserCard }) {
    const catalogCard = findCardByName(card.card_name);
    const image = catalogCard?.image;
    const catalogId = catalogCard?.id;
    const topRules = card.reward_rules
      .filter((r) => !["other","general","everything"].includes(r.category.toLowerCase()))
      .sort((a, b) => b.multiplier - a.multiplier)
      .slice(0, 2);

    const inner = (
      <>
        <div className="relative bg-slate-50 dark:bg-slate-800 flex items-center justify-center p-4 h-28">
          {image ? (
            <Image src={image} alt={card.card_name} fill className="object-contain drop-shadow-md" sizes="160px" />
          ) : (
            <div className="h-16 w-full rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg">
              {card.issuer[0]}
            </div>
          )}
        </div>
        <div className="p-3 flex flex-col gap-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug line-clamp-2">{card.card_name}</p>
          <div className="flex flex-col gap-1">
            {topRules.map((r) => (
              <span key={r.category} className="inline-flex items-center rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:text-indigo-300 capitalize self-start">
                {card.reward_type === "cashback" ? `${r.multiplier}% back` : `${r.multiplier}×`} {r.category}
              </span>
            ))}
          </div>
        </div>
      </>
    );

    const tileClass = "flex flex-col rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all";

    return catalogId ? (
      <Link href={`/cards/${catalogId}`} className={tileClass}>{inner}</Link>
    ) : (
      <div className={tileClass}>{inner}</div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Your Cards</h2>
        {cards.length > 4 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
          >
            {expanded ? "Show less ↑" : "View all ↓"}
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {displayed.map((card) => <CardTileUser key={card.id} card={card} />)}
        {/* Add more cards tile — always last */}
        <Link
          href="/wallet"
          className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 h-full min-h-[160px] hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-950/40 transition-colors">
            <svg className="h-5 w-5 text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-center">Add more cards</span>
        </Link>
      </div>
    </div>
  );
}

function ExploreByCategory({ onSelect, walletCards }: { onSelect: (cat: string) => void; walletCards: UserCard[] }) {
  const [expanded, setExpanded] = useState(false);
  const allCats = [...KNOWN_CATEGORIES];
  const firstRow = allCats.slice(0, 4);
  const secondRow = allCats.slice(4);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Explore by Category</h2>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          {expanded ? "Show less ↑" : "View all ↓"}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {/* First row — always visible */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {firstRow.map((cat) => <CategoryTile key={cat} cat={cat} onSelect={onSelect} walletCards={walletCards} />)}
        </div>

        {/* Second row — shown when expanded */}
        {expanded && secondRow.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {secondRow.map((cat) => <CategoryTile key={cat} cat={cat} onSelect={onSelect} walletCards={walletCards} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryTile({ cat, onSelect, walletCards }: { cat: string; onSelect: (cat: string) => void; walletCards: UserCard[] }) {
  const rate = getBestRateForCategory(cat, walletCards);
  return (
    <button
      type="button"
      onClick={() => onSelect(cat)}
      className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:-translate-y-0.5 transition-all text-center"
    >
      <span className="text-3xl">{CATEGORY_ICONS[cat] ?? "💳"}</span>
      <span className="text-sm font-semibold capitalize text-slate-900 dark:text-white">{cat}</span>
      {rate && (
        <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
          {rate}
        </span>
      )}
    </button>
  );
}

export default function RecommendPage() {
  const cards = useCardsStore((s) => s.cards);
  const hydrated = useCardsStore((s) => s.hydrated);
  const pointValuationPerPoint = useCardsStore((s) => s.pointValuationPerPoint);
  const rewardPref = useCardsStore((s) => s.rewardPref);
  const searchParams = useSearchParams();

  const [merchant, setMerchant] = useState("");
  const [searchedMerchant, setSearchedMerchant] = useState(""); // committed on explicit search
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showNoCardsModal, setShowNoCardsModal] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [manualCategory, setManualCategory] = useState("");
  const [spend, setSpend] = useState(100);

  // `hydrated` is subscribed so the component re-renders once the catalog
  // and merchant map are loaded (getCatalog() returns [] until then).
  void hydrated;

  // Pre-fill from homepage navigation (e.g. ?merchant=starbucks&category=dining)
  useEffect(() => {
    const m = searchParams.get("merchant");
    const c = searchParams.get("category");
    if (m) { setMerchant(m); setSearchedMerchant(m); }
    if (c && !m) setManualCategory(c);
  }, [searchParams]);

const eligibleCards = useMemo(
    () =>
      cards.filter((card) => {
        if (rewardPref === "cashback") return card.reward_type === "cashback";
        if (rewardPref === "points")
          return card.reward_type === "points" || card.reward_type === "miles";
        return true;
      }),
    [cards, rewardPref]
  );

  const suggestions = useMemo(() => suggestMerchants(merchant), [merchant]);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  function commitSearch(key: string) {
    setMerchant(key);
    setSearchedMerchant(key);
    setShowSuggestions(false);
    const { category } = resolveMerchantToCategory(key);
    if (category) setManualCategory(category);
  }

  const selectSuggestion = commitSearch;

  const resolvedFromMerchant = useMemo(
    () => resolveMerchantToCategory(searchedMerchant),
    [searchedMerchant]
  );

  // When wallet is empty, fall back to the full catalog so we can still show
  // the best available card (with a prompt to add personal cards).
  const catalogAsUserCards = useMemo(() =>
    cards.length === 0
      ? getCatalog().map((c) => ({
          id: c.id,
          card_name: c.card_name,
          issuer: c.issuer,
          network: c.network,
          reward_type: c.reward_type,
          annual_fee: c.annual_fee,
          point_value: c.point_value,
          reward_rules: c.reward_rules,
        }))
      : [],
    [cards.length]
  );

  const result = useMemo(() => {
    const category = (manualCategory || resolvedFromMerchant.category || "").trim() || null;
    if (!category) return null;
    const cardsToUse = eligibleCards.length > 0 ? eligibleCards : catalogAsUserCards;
    if (cardsToUse.length === 0) return null;
    const amount = Number.isFinite(spend) && spend > 0 ? spend : 100;
    return recommendBestCards(
      cardsToUse,
      category,
      amount,
      pointValuationPerPoint,
      resolvedFromMerchant.matchedKey
    );
  }, [resolvedFromMerchant, manualCategory, spend, eligibleCards, catalogAsUserCards, pointValuationPerPoint]);

  const activeCategory = manualCategory || resolvedFromMerchant.category || "";

  return (
    <div className="flex flex-col flex-1">
      {/* ── Compact toolbar ───────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-5">
        <div className="mx-auto max-w-3xl flex flex-col gap-3">

          {/* Heading */}
          <div className="mb-2 text-center">
            <h1 className="text-2xl font-bold leading-tight text-slate-900 dark:text-white md:text-4xl">
              Find the best credit card for
              <br />
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                every purchase
              </span>
            </h1>
            <p className="mt-3 text-base text-slate-500 dark:text-slate-400">
              Instant recommendations based on where you spend.
            </p>
          </div>

          {/* Search input */}
          <div className="relative" ref={suggestionsRef}>
            <svg
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <circle cx={11} cy={11} r={8} />
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35" />
            </svg>
            <input
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-3 pl-12 pr-28 text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              value={merchant}
              onChange={(e) => {
                setMerchant(e.target.value);
                setSearchedMerchant(""); // clear committed search while typing
                setShowSuggestions(true);
                if (!e.target.value) setManualCategory("");
              }}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
              onKeyDown={(e) => { if (e.key === "Enter") commitSearch(merchant); }}
              placeholder="Where are you spending? e.g. Starbucks, Amazon, Shell…"
            />
            <button
              type="button"
              onClick={() => commitSearch(merchant)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              Search
            </button>
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute left-0 top-full z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl">
                {suggestions.map((key) => {
                  const { category: sugCat } = resolveMerchantToCategory(key);
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        onMouseDown={() => selectSuggestion(key)}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <span>{sugCat ? (CATEGORY_ICONS[sugCat] ?? "💳") : "💳"}</span>
                        <span className="font-medium text-slate-800 dark:text-slate-100">{capitalize(key)}</span>
                        {sugCat && <span className="ml-auto text-xs capitalize text-slate-400 dark:text-slate-500">{sugCat}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Popular searches */}
          {!merchant && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Popular Searches</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Starbucks",   key: "starbucks",   icon: "☕" },
                  { label: "Amazon",      key: "amazon",      icon: "📦" },
                  { label: "Uber",        key: "uber",        icon: "🚗" },
                  { label: "Delta",       key: "delta",       icon: "✈️" },
                  { label: "Whole Foods", key: "whole foods", icon: "🛒" },
                  { label: "Shell",       key: "shell",       icon: "⛽" },
                ].map(({ label, key, icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => selectSuggestion(key)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all"
                  >
                    <span>{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Spend amount */}
          <div className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-4 py-2.5">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <span className="text-base">🧾</span>
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-100">Purchase amount</span>
                <span className="ml-1.5 text-slate-400 dark:text-slate-500">— rewards are calculated on this spend</span>
              </div>
            </div>
            <div className="ml-4 flex shrink-0 items-center gap-1.5">
              <div className="relative">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">$</span>
                <input
                  type="number"
                  min={1}
                  max={100000}
                  value={spend}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (Number.isFinite(v) && v > 0) setSpend(v);
                  }}
                  className="w-20 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-1 pl-6 pr-2 text-xs font-semibold text-slate-900 dark:text-slate-50 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Personalization indicator */}
          <div className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-4 py-2.5">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <span className="text-base">
                {rewardPref === "cashback" ? "💵" : rewardPref === "points" ? "✨" : "💳"}
              </span>
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {rewardPref === "cashback"
                    ? "Cashback cards only"
                    : rewardPref === "points"
                    ? "Points & Miles cards only"
                    : "All cards"}
                </span>
                <span className="ml-1.5 text-slate-400 dark:text-slate-500">
                  {rewardPref === "cashback"
                    ? "— recommending cards that pay cash back"
                    : rewardPref === "points"
                    ? "— recommending cards that earn points or miles"
                    : "— comparing cashback, points & miles cards in your wallet"}
                </span>
              </div>
            </div>
            <Link
              href="/profile"
              className="ml-4 shrink-0 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline transition-colors"
            >
              Change preference →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Content section ───────────────────────────────────── */}
      <div className="mx-auto max-w-5xl w-full px-6 sm:px-8 py-8">
        {result ? (
          <div className="flex flex-col gap-4">
            {/* Back button + context */}
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => { setMerchant(""); setSearchedMerchant(""); setManualCategory(""); setSpend(100); }}
                className="self-start inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
                Back to explore
              </button>
              <div className="flex flex-wrap items-center gap-2">
                {merchant && (
                  <span className="text-base font-semibold text-slate-900 dark:text-white capitalize">{merchant}</span>
                )}
                {activeCategory && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 text-sm font-medium text-indigo-700 dark:text-indigo-300 capitalize">
                    {CATEGORY_ICONS[activeCategory] ?? "💳"} {activeCategory}
                  </span>
                )}
              </div>
            </div>
            {/* Banner when showing catalog cards instead of wallet cards */}
            {cards.length === 0 && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3">
                <span className="text-lg shrink-0">💡</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                    Showing the best cards from our catalog
                  </p>
                  <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300">
                    Add your own cards to get personalized recommendations based on what you actually carry.
                  </p>
                  <Link
                    href="/wallet"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-800 dark:text-amber-200 hover:underline"
                  >
                    Add your cards →
                  </Link>
                </div>
              </div>
            )}
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Rewards estimated on a <span className="font-semibold text-slate-600 dark:text-slate-300">${spend}</span> purchase.
            </p>
            <RecommendationResult result={result} />
          </div>
        ) : searchedMerchant && !resolvedFromMerchant.category && !manualCategory ? (
          /* ── Unknown merchant — ask user to pick a category ── */
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-5 py-4">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                We don&apos;t recognise &ldquo;<span className="capitalize">{searchedMerchant}</span>&rdquo; yet.
              </p>
              <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-300">
                Pick the category that best describes this purchase and we&apos;ll find the best card for you.
              </p>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">What type of purchase is this?</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {KNOWN_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setManualCategory(cat)}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:-translate-y-0.5 transition-all text-center"
                  >
                    <span className="text-2xl">{CATEGORY_ICONS[cat] ?? "💳"}</span>
                    <span className="text-sm font-semibold capitalize text-slate-900 dark:text-white">{cat}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => { setMerchant(""); setSearchedMerchant(""); setManualCategory(""); setSpend(100); }}
              className="self-start inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              Back to explore
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Explore by category — always shown */}
            <ExploreByCategory onSelect={setManualCategory} walletCards={cards} />

            {/* Your Cards — shown when wallet has cards */}
            {cards.length > 0 ? (
              <YourCards cards={cards} />
            ) : (
              /* No cards CTA */
              <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/40">
                  <svg className="h-7 w-7 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <rect x={2} y={5} width={20} height={14} rx={2} />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2 10h20" />
                  </svg>
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900 dark:text-white">No cards in your wallet</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Add the cards you carry to get personalized recommendations.</p>
                </div>
                <Link
                  href="/wallet"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
                >
                  Add your cards
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── No-cards modal ──────────────────────────────────── */}
      {showNoCardsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowNoCardsModal(false)}
          />
          {/* Card */}
          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-2xl text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/40">
              <svg className="h-7 w-7 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <rect x={2} y={5} width={20} height={14} rx={2} />
                <path strokeLinecap="round" d="M2 10h20" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">No cards in your wallet</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Add at least one credit card to get personalised recommendations for your purchases.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Link
                href="/wallet"
                className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
              >
                Go to My Cards
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                </svg>
              </Link>
              <button
                type="button"
                onClick={() => setShowNoCardsModal(false)}
                className="rounded-full border border-slate-200 dark:border-slate-700 px-6 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
