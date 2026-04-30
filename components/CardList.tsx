"use client";

import Image from "next/image";
import { useState } from "react";
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
  const [pendingDelete, setPendingDelete] = useState<UserCard | null>(null);

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
              onClick={() => setPendingDelete(card)}
              className="mt-3 w-full rounded-full border border-red-200 dark:border-red-800 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              Remove
            </button>
          </div>
        );
      })}

      {/* ── Remove confirmation modal ── */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setPendingDelete(null)}
          />
          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/40">
              <svg className="h-6 w-6 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </div>
            <h2 className="text-center text-base font-bold text-slate-900 dark:text-white">
              Remove card?
            </h2>
            <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
              <span className="font-medium text-slate-700 dark:text-slate-200">{pendingDelete.card_name}</span> will be removed from your wallet. You can add it back anytime.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => { onDelete(pendingDelete); setPendingDelete(null); }}
                className="w-full rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
              >
                Yes, remove
              </button>
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
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
