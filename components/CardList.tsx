"use client";

import Image from "next/image";
import type { UserCard } from "@/types/card";
import { IssuerLogo } from "@/components/IssuerLogo";
import { findCardByName } from "@/lib/catalogLoader";

export function CardList({
  cards,
  onDelete,
}: {
  cards: UserCard[];
  onDelete: (card: UserCard) => void;
}) {
  if (!cards.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/80 px-6 py-12 text-center">
        <p className="text-base font-medium text-slate-800 dark:text-slate-100">No cards yet</p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Add the cards you actually carry. They&apos;re synced to your account across devices.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const image = findCardByName(card.card_name)?.image;
        const feeLabel =
          card.annual_fee === 0
            ? "No annual fee"
            : `$${card.annual_fee.toFixed(0)}/yr`;

        return (
          <div
            key={card.id}
            className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col"
          >
            {/* Card image */}
            {image && (
              <Image
                src={image}
                alt={card.card_name}
                width={80}
                height={48}
                className="object-contain mb-3"
              />
            )}

            {/* Issuer row */}
            <div className="flex items-center gap-1.5">
              <IssuerLogo issuer={card.issuer} size={16} />
              <span className="text-xs text-slate-500 dark:text-slate-400">{card.issuer}</span>
            </div>

            {/* Card name */}
            <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5 leading-snug">
              {card.card_name}
            </p>

            {/* Badges row */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 text-xs font-medium capitalize text-indigo-700 dark:text-indigo-300">
                {card.reward_type}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">{feeLabel}</span>
            </div>

            {/* Top reward rules (up to 2) */}
            {card.reward_rules.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {card.reward_rules.slice(0, 2).map((r, idx) => (
                  <span
                    key={`${card.id}-rule-${idx}`}
                    className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs text-slate-600 dark:text-slate-300"
                  >
                    {r.category}:{" "}
                    <span className="font-semibold">
                      {card.reward_type === "cashback"
                        ? `${r.multiplier}%`
                        : `${r.multiplier}×`}
                    </span>
                  </span>
                ))}
              </div>
            )}

            {/* Remove button */}
            <button
              type="button"
              onClick={() => onDelete(card)}
              className="mt-3 w-full rounded-full border border-red-200 dark:border-red-800 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              Remove
            </button>
          </div>
        );
      })}
    </div>
  );
}
