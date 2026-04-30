"use client";

import { useState } from "react";

import { findCardByName, getCardsByIssuer, getIssuers, type CatalogEntry } from "@/lib/catalogLoader";

export type CardFormValues = CatalogEntry;

export function CardForm({
  submitLabel,
  onSubmit,
  onCancel,
}: {
  submitLabel: string;
  onSubmit: (values: CardFormValues) => void;
  onCancel: () => void;
}) {
  const issuers = getIssuers();
  const [selectedIssuer, setSelectedIssuer] = useState("");
  const [selectedCardName, setSelectedCardName] = useState("");

  const cardsForIssuer = selectedIssuer ? getCardsByIssuer(selectedIssuer) : [];
  const selectedCard = selectedCardName ? findCardByName(selectedCardName) : null;

  function handleIssuerChange(issuer: string) {
    setSelectedIssuer(issuer);
    setSelectedCardName("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCard) return;
    // Strip catalog-only fields (id, image) before passing to addCard
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, image: _image, ...cardData } = selectedCard;
    onSubmit(cardData);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-800 dark:text-zinc-200">Issuer *</span>
        <select
          required
          value={selectedIssuer}
          onChange={(e) => handleIssuerChange(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none ring-emerald-500/40 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        >
          <option value="">Select an issuer…</option>
          {issuers.map((issuer) => (
            <option key={issuer} value={issuer}>
              {issuer}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-800 dark:text-zinc-200">Card *</span>
        <select
          required
          value={selectedCardName}
          onChange={(e) => setSelectedCardName(e.target.value)}
          disabled={!selectedIssuer}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none ring-emerald-500/40 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        >
          <option value="">
            {selectedIssuer ? "Select a card…" : "Select an issuer first"}
          </option>
          {cardsForIssuer.map((card) => (
            <option key={card.card_name} value={card.card_name}>
              {card.card_name}
            </option>
          ))}
        </select>
      </label>

      {selectedCard && (
        <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900/50">
          <p className="font-medium text-zinc-800 dark:text-zinc-200">{selectedCard.card_name}</p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {selectedCard.network} · {selectedCard.reward_type} · ${selectedCard.annual_fee}/yr
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {selectedCard.reward_rules.map((r, i) => (
              <span
                key={i}
                className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {r.category}:{" "}
                <span className="font-semibold">
                  {selectedCard.reward_type === "cashback"
                    ? `${r.multiplier}%`
                    : `${r.multiplier}×`}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!selectedCard}
          className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
