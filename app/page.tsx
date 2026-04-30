"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { findCardByName } from "@/lib/catalogLoader";
import { resolveMerchantToCategory, suggestMerchants } from "@/lib/merchant";
import { useCardsStore } from "@/store/useCardsStore";
import { IssuerLogo } from "@/components/IssuerLogo";

const CATEGORY_ICONS: Record<string, string> = {
  dining: "🍽️",
  travel: "✈️",
  groceries: "🛒",
  gas: "⛽",
  entertainment: "🎬",
  online: "💻",
  shopping: "🛍️",
  rent: "🏠",
  other: "💳",
};

const QUICK_CATEGORIES = [
  { value: "dining",        label: "Dining",        icon: "🍽️", hint: "Up to 4× points" },
  { value: "travel",        label: "Travel",         icon: "✈️", hint: "Up to 5× points" },
  { value: "groceries",     label: "Groceries",      icon: "🛒", hint: "Up to 6% back" },
  { value: "gas",           label: "Gas",            icon: "⛽", hint: "Up to 5% back" },
  { value: "entertainment", label: "Entertainment",  icon: "🎬", hint: "Up to 3× points" },
  { value: "online",        label: "Online",         icon: "💻", hint: "Up to 5% back" },
];

const POPULAR_MERCHANTS = [
  { key: "starbucks", label: "Starbucks",  emoji: "☕" },
  { key: "amazon",    label: "Amazon",     emoji: "📦" },
  { key: "costco",    label: "Costco",     emoji: "🏪" },
  { key: "uber",      label: "Uber",       emoji: "🚗" },
  { key: "delta",     label: "Flights",    emoji: "✈️" },
  { key: "marriott",  label: "Hotels",     emoji: "🏨" },
];

const FEATURES = [
  {
    icon: (
      <svg className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33" />
      </svg>
    ),
    title: "Maximize Rewards",
    desc: "Find the best card for every purchase. Never leave points on the table.",
  },
  {
    icon: (
      <svg className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: "Real-Time Recommendations",
    desc: "Get instant suggestions based on where you spend — no sign-up required.",
  },
  {
    icon: (
      <svg className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
    title: "Your Wallet, Smarter",
    desc: "Use your existing cards more effectively with personalized insights.",
  },
];

function capitalize(s: string) {
  return s.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export default function HomePage() {
  const router = useRouter();
  const cards = useCardsStore((s) => s.cards);

  const [merchant, setMerchant] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

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

  function navigateWithMerchant(key: string) {
    const { category } = resolveMerchantToCategory(key);
    const params = new URLSearchParams();
    params.set("merchant", key);
    if (category) params.set("category", category);
    router.push(`/recommend?${params.toString()}`);
  }

  function navigateWithCategory(cat: string) {
    router.push(`/recommend?category=${encodeURIComponent(cat)}`);
  }

  function handleSearch() {
    if (!merchant.trim()) return;
    navigateWithMerchant(merchant.trim().toLowerCase());
  }

  return (
    <div className="flex flex-col">

      {/* ── SECTION 1: Hero Search ─────────────────────────────── */}
      <section className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-5">
        <div className="mx-auto max-w-3xl flex flex-col gap-3">

          {/* Heading — matches recommend page */}
          <div className="mb-2 text-center">
            <h1 className="text-2xl font-bold leading-tight text-slate-900 dark:text-white md:text-4xl">
              Find the best credit card for
              <br />
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                every purchase
              </span>
            </h1>
            <p className="mt-3 text-base text-slate-500 dark:text-slate-400">
              Instant recommendations. Zero guesswork.
            </p>
          </div>

          {/* Search bar — same size/style as recommend page */}
          <div className="relative" ref={suggestionsRef}>
            <svg
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <circle cx={11} cy={11} r={8} />
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35" />
            </svg>
            <input
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-3 pl-12 pr-24 text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              value={merchant}
              onChange={(e) => { setMerchant(e.target.value); setShowSuggestions(true); }}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
              placeholder="Where are you spending? e.g., Starbucks, Amazon, Flights"
            />
            <button
              type="button"
              onClick={handleSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              Search
            </button>

            {/* Autocomplete dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute left-0 top-full z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-left shadow-xl">
                {suggestions.map((key) => {
                  const { category } = resolveMerchantToCategory(key);
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        onMouseDown={() => navigateWithMerchant(key)}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <span>{category ? (CATEGORY_ICONS[category] ?? "💳") : "💳"}</span>
                        <span className="font-medium text-slate-800 dark:text-slate-100">{capitalize(key)}</span>
                        {category && (
                          <span className="ml-auto text-xs capitalize text-slate-400 dark:text-slate-500">{category}</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Popular merchant chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">Try:</span>
            {["Starbucks", "Amazon", "Uber", "Delta", "Walmart"].map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => navigateWithMerchant(name.toLowerCase())}
                className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 2: Quick Categories ───────────────────────── */}
      <section className="px-6 py-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Popular Categories</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:grid-cols-6">
            {QUICK_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => navigateWithCategory(cat.value)}
                className="snap-start min-w-[120px] md:min-w-0 flex flex-col items-center gap-2 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <span className="text-3xl">{cat.icon}</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{cat.label}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500">{cat.hint}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: Popular Merchants ──────────────────────── */}
      <section className="px-6 py-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-4 text-base font-bold text-slate-900 dark:text-white">Popular Merchants</h2>
          <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
            {POPULAR_MERCHANTS.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => navigateWithMerchant(m.key)}
                className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <span className="text-3xl">{m.emoji}</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{m.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: Your Top Cards (only if wallet has cards) ─ */}
      {cards.length > 0 && (
        <section className="bg-slate-50/60 dark:bg-slate-900/60 px-4 py-6">
          <div className="mx-auto max-w-5xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Your Top Cards</h2>
              <Link href="/wallet" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                Manage →
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory px-4 md:px-0 scroll-px-4 md:scroll-px-0">
              {cards.slice(0, 6).map((card) => {
                const catalogCard = findCardByName(card.card_name);
                const image = catalogCard?.image;
                const catalogId = catalogCard?.id;
                const topRule = card.reward_rules
                  .filter((r) => r.category.toLowerCase() !== "other")
                  .sort((a, b) => b.multiplier - a.multiplier)[0];
                const ruleLabel = topRule
                  ? `${topRule.multiplier}${card.reward_type === "cashback" ? "%" : "×"} ${topRule.category}`
                  : card.reward_type;
                return (
                  <Link
                    key={card.id}
                    href={catalogId ? `/cards/${catalogId}` : "/wallet"}
                    className="snap-start min-w-[200px] flex flex-col rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    <div className="relative bg-slate-50 dark:bg-slate-800 flex items-center justify-center p-5 h-36">
                      {image ? (
                        <Image src={image} alt={card.card_name} fill className="object-contain drop-shadow-md" sizes="200px" />
                      ) : (
                        <div className="h-20 w-full rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xl">
                          {card.issuer[0]}
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col gap-2">
                      <div className="flex items-center gap-1">
                        <IssuerLogo issuer={card.issuer} size={13} />
                        <span className="text-xs text-slate-400 dark:text-slate-500 truncate">{card.issuer}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug line-clamp-2">{card.card_name}</p>
                      <span className="self-start rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 capitalize">
                        {ruleLabel}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── SECTION 5: Value Proposition ──────────────────────── */}
      <section className="bg-slate-50/60 dark:bg-slate-900/60 px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Why CardWise?</h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">Everything you need to spend smarter.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 6: Insights / CTA ─────────────────────────── */}
      <section className="px-4 py-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 px-8 py-10 shadow-xl">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-indigo-200 uppercase tracking-wide">
                  {cards.length > 0 ? "Your wallet" : "Get started"}
                </p>
                <h2 className="mt-1 text-2xl font-bold text-white">
                  {cards.length > 0
                    ? "Maximize what you're already earning"
                    : "Start earning more on every purchase"}
                </h2>
                <p className="mt-2 text-indigo-200 max-w-md">
                  {cards.length > 0
                    ? "Use the right card for every purchase and never leave rewards behind."
                    : "Add your cards once and get personalized recommendations instantly."}
                </p>

                {/* Missed earnings preview (static, illustrative) */}
                {cards.length === 0 && (
                  <div className="mt-5 flex gap-4">
                    {[
                      { cat: "Dining",    missed: "$40" },
                      { cat: "Groceries", missed: "$30" },
                      { cat: "Travel",    missed: "$50" },
                    ].map((item) => (
                      <div key={item.cat} className="rounded-xl bg-white/10 px-4 py-2 text-center backdrop-blur-sm">
                        <p className="text-base font-bold text-white">{item.missed}</p>
                        <p className="text-xs text-indigo-200">{item.cat}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 md:items-end">
                <Link
                  href="/recommend"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-indigo-700 shadow-md hover:bg-indigo-50 dark:hover:bg-indigo-50 transition-colors"
                >
                  See recommendations
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                  </svg>
                </Link>
                {cards.length === 0 && (
                  <Link href="/wallet" className="text-sm font-medium text-indigo-200 hover:text-white transition-colors">
                    Add your cards →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
