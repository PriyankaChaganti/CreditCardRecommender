"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";

import type { CatalogCard, RewardRule } from "@/types/card";
import { IssuerLogo } from "@/components/IssuerLogo";
import { useCardsStore } from "@/store/useCardsStore";


function topRules(rules: RewardRule[]): RewardRule[] {
  return rules
    .filter((r) => r.category.toLowerCase() !== "other")
    .sort((a, b) => b.multiplier - a.multiplier)
    .slice(0, 2);
}

function CardTile({ card }: { card: CatalogCard }) {
  const addCard = useCardsStore((s) => s.addCard);
  const deleteCard = useCardsStore((s) => s.deleteCard);
  const walletCards = useCardsStore((s) => s.cards);

  const walletCard = walletCards.find(
    (c) => c.card_name.trim().toLowerCase() === card.card_name.trim().toLowerCase()
  );
  const isAdded = !!walletCard;

  const highlights = topRules(card.reward_rules);
  const unit = card.reward_type === "cashback" ? "%" : "×";

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isAdded && walletCard) {
      await deleteCard(walletCard.id);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, image: _image, ...cardData } = card;
      await addCard(cardData);
    }
  }

  return (
    <li>
      <Link
        href={`/cards/${card.id}`}
        className="group relative flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
      >
        {/* Add / Remove button — top-right overlay */}
        <button
          type="button"
          onClick={handleToggle}
          className={`absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm transition-all ${
            isAdded
              ? "bg-emerald-500 text-white hover:bg-red-500"
              : "bg-white/90 dark:bg-zinc-900/90 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white border border-indigo-200 dark:border-indigo-800"
          }`}
        >
          {isAdded ? (
            <>
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              Added
            </>
          ) : (
            <>
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add
            </>
          )}
        </button>

        <div className="p-3">
          <CardArt card={card} />
        </div>

        <div className="flex flex-1 flex-col gap-2 px-4 pb-4">
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{card.issuer}</p>
            <h3 className="mt-0.5 text-sm font-semibold text-zinc-900 group-hover:text-emerald-700 dark:text-zinc-50 dark:group-hover:text-emerald-400">
              {card.card_name}
            </h3>
          </div>

          <div className="flex flex-wrap gap-1">
            {highlights.length > 0 ? (
              highlights.map((r) => (
                <span key={r.category} className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {r.category} <span className="font-semibold">{r.multiplier}{unit}</span>
                </span>
              ))
            ) : (
              <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {card.reward_rules[0].multiplier}{unit} on everything
              </span>
            )}
          </div>

          <p className="mt-auto text-xs text-zinc-500 dark:text-zinc-400">
            {card.annual_fee === 0 ? "No annual fee" : `$${card.annual_fee}/yr`}
          </p>
        </div>
      </Link>
    </li>
  );
}

const CARD_GRADIENTS: Record<string, [string, string]> = {
  Chase: ["#1a3c6e", "#3a6fa8"],
  "American Express": ["#00356e", "#1565c0"],
  Citi: ["#003b70", "#0058a3"],
  "Capital One": ["#1c1c3c", "#2d2d5e"],
  "Wells Fargo": ["#c41230", "#e53935"],
  "Bank of America": ["#a51c30", "#c62828"],
  "US Bank": ["#2c2c80", "#4040c0"],
  "Bilt Rewards": ["#0a0f2c", "#1e2d50"],
  Discover: ["#f76a1c", "#cc5500"],
  "Goldman Sachs": ["#1d1d1f", "#3c3c3e"],
  Barclays: ["#00aeef", "#005ba1"],
  "Bread Financial": ["#e63329", "#b52020"],
  Synchrony: ["#00539b", "#0077cc"],
  "TD Bank": ["#2d8c3e", "#1a6b2a"],
  "PNC Bank": ["#e57200", "#ff9420"],
  "Navy Federal": ["#003087", "#1a4fa8"],
  PenFed: ["#1a2f6e", "#2d4ca8"],
  FNBO: ["#1d4f8c", "#2d6fcc"],
  "Elan Financial": ["#1f4f8f", "#2d6fc4"],
  SoFi: ["#4b38ef", "#6b5af0"],
};

function CardArt({ card }: { card: CatalogCard }) {
  const [from, to] = CARD_GRADIENTS[card.issuer] ?? ["#3f3f46", "#71717a"];
  return (
    <div
      className="relative aspect-[16/10] w-full overflow-hidden rounded-xl"
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      <Image
        src={card.image}
        alt={card.card_name}
        fill
        className="object-cover"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    </div>
  );
}

function groupByIssuer(cards: CatalogCard[]): [string, CatalogCard[]][] {
  const map = new Map<string, CatalogCard[]>();
  for (const card of cards) {
    const group = map.get(card.issuer) ?? [];
    group.push(card);
    map.set(card.issuer, group);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}

export function CardGrid({ cards }: { cards: CatalogCard[] }) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  function toggle(issuer: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(issuer)) {
        next.delete(issuer);
      } else {
        next.add(issuer);
      }
      return next;
    });
  }

  if (!cards.length) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
        No cards match your search.
      </p>
    );
  }

  const groups = groupByIssuer(cards);

  return (
    <div className="flex flex-col gap-3">
      {groups.map(([issuer, issuerCards]) => {
        const isOpen = !collapsed.has(issuer);

        return (
          <div
            key={issuer}
            className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <button
              type="button"
              onClick={() => toggle(issuer)}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
            >
              <div className="flex items-center gap-3">
                <IssuerLogo issuer={issuer} size={24} />
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">{issuer}</span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {issuerCards.length} {issuerCards.length === 1 ? "card" : "cards"}
                </span>
              </div>
              <svg
                className={`h-5 w-5 shrink-0 text-zinc-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isOpen && (
              <div className="border-t border-zinc-100 px-5 pb-5 pt-4 dark:border-zinc-800">
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {issuerCards.map((card) => (
                    <CardTile key={card.id} card={card} />
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
