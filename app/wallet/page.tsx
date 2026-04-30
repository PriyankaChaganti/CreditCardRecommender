"use client";

import Link from "next/link";
import { useState } from "react";

import { CardForm, type CardFormValues } from "@/components/CardForm";
import { CardGrid } from "@/components/CardGrid";
import { CardList } from "@/components/CardList";
import { Modal } from "@/components/Modal";
import { getCatalog } from "@/lib/catalogLoader";
import { searchCards } from "@/lib/search";
import { useCardsStore } from "@/store/useCardsStore";
import type { UserCard } from "@/types/card";

export default function WalletPage() {
  const cards = useCardsStore((s) => s.cards);
  const addCard = useCardsStore((s) => s.addCard);
  const deleteCard = useCardsStore((s) => s.deleteCard);

  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const allCatalogCards = getCatalog();
  const [searchQuery, setSearchQuery] = useState("");
  const searchResults = searchCards(searchQuery, allCatalogCards);

  function openAdd() {
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSubmit(values: CardFormValues) {
    const res = await addCard(values);
    if (!res.ok) {
      setFormError(res.message);
      return;
    }
    setModalOpen(false);
    setFormError(null);
    setBanner("Card added to your wallet.");
    setTimeout(() => setBanner(null), 3000);
  }

  async function handleDelete(card: UserCard) {
    if (typeof window !== "undefined" && window.confirm(`Remove "${card.card_name}"?`)) {
      await deleteCard(card.id);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-8 sm:px-6">

      {/* ── My wallet ─────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
              My Wallet
            </h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Manage the cards in your wallet.
            </p>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="shrink-0 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
          >
            Add card
          </button>
        </div>

        {banner && (
          <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 px-4 py-3 text-sm text-indigo-800 dark:text-indigo-200">
            {banner}
          </div>
        )}

        <CardList cards={cards} onDelete={handleDelete} />

        {cards.length > 0 && (
          <Link
            href="/recommend"
            className="self-start inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
          >
            Find the best card to use
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        )}
      </section>

      {/* ── Catalog browse ────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
            Add a card
          </h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Search our catalog and add cards to your wallet.
          </p>
        </div>

        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search — e.g. Chase, Sapphire, groceries…"
          className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-50 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20 transition-all"
        />

        <CardGrid cards={searchResults} />
      </section>

      {/* ── Add-card modal ────────────────────────────────────── */}
      <Modal
        open={modalOpen}
        title="Add card"
        onClose={() => {
          setModalOpen(false);
          setFormError(null);
        }}
      >
        {formError && (
          <div className="mb-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-sm text-red-800 dark:text-red-300">
            {formError}
          </div>
        )}
        <CardForm
          submitLabel="Add card"
          onSubmit={handleSubmit}
          onCancel={() => {
            setModalOpen(false);
            setFormError(null);
          }}
        />
      </Modal>
    </div>
  );
}
