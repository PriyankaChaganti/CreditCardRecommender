"use client";

import { use, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { findCardById } from "@/lib/catalogLoader";
import { useCardsStore } from "@/store/useCardsStore";
import type { CatalogCard } from "@/types/card";

const ISSUER_COLORS: Record<string, [string, string]> = {
  Chase: ["#1a3c6e", "#3a6fa8"],
  "American Express": ["#00356e", "#1565c0"],
  Citi: ["#003b70", "#0058a3"],
  "Capital One": ["#1c1c3c", "#2d2d5e"],
  "Wells Fargo": ["#c41230", "#e53935"],
  "Bank of America": ["#a51c30", "#c62828"],
  "US Bank": ["#2c2c80", "#4040c0"],
  "Bilt Rewards": ["#0a0f2c", "#1e2d50"],
  Discover: ["#1a1a1a", "#2d2d2d"],
  "Goldman Sachs": ["#1d1d1f", "#3c3c3e"],
};

function issuerColors(issuer: string): [string, string] {
  return ISSUER_COLORS[issuer] ?? ["#3f3f46", "#71717a"];
}

function CardHero({ card }: { card: CatalogCard }) {
  const [from, to] = issuerColors(card.issuer);
  return (
    <div
      className="relative mx-auto aspect-[16/10] w-full max-w-sm overflow-hidden rounded-2xl shadow-lg"
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

function AddToWalletButton({ card }: { card: CatalogCard }) {
  const addCard = useCardsStore((s) => s.addCard);
  const deleteCard = useCardsStore((s) => s.deleteCard);
  const walletCards = useCardsStore((s) => s.cards);
  const [status, setStatus] = useState<"idle" | "added">("idle");

  const walletCard = walletCards.find(
    (c) => c.card_name.trim().toLowerCase() === card.card_name.trim().toLowerCase()
  );
  const isInWallet = !!walletCard || status === "added";

  async function handleAdd() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, image: _image, ...cardData } = card;
    const res = await addCard(cardData);
    if (res.ok) setStatus("added");
  }

  async function handleRemove() {
    const target = walletCard ?? walletCards.find(
      (c) => c.card_name.trim().toLowerCase() === card.card_name.trim().toLowerCase()
    );
    if (!target) return;
    await deleteCard(target.id);
    setStatus("idle");
  }

  if (isInWallet) {
    return (
      <div className="flex flex-col gap-2">
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
          ✓ Already in your wallet
        </p>
        <button
          type="button"
          onClick={handleRemove}
          className="rounded-full border border-red-200 dark:border-red-800 px-6 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
        >
          Remove from wallet
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
    >
      Add to my cards
    </button>
  );
}

export default function CardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const card = findCardById(id);

  if (!card) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-6 px-4 py-16 text-center sm:px-6">
        <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Card not found</p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          This card doesn&apos;t exist in our catalog.
        </p>
        <Link
          href="/wallet"
          className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Browse all cards
        </Link>
      </div>
    );
  }

  const unit = card.reward_type === "cashback" ? "%" : "×";

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      {/* Back link */}
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
      >
        <span aria-hidden>←</span> Back
      </button>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Left — card art */}
        <div className="flex flex-col gap-6">
          <CardHero card={card} />

          {/* Quick stats */}
          <dl className="grid grid-cols-2 gap-3">
            {[
              { label: "Issuer", value: card.issuer },
              { label: "Network", value: card.network },
              {
                label: "Annual fee",
                value: card.annual_fee === 0 ? "None" : `$${card.annual_fee}`,
              },
              {
                label: "Reward type",
                value: card.reward_type.charAt(0).toUpperCase() + card.reward_type.slice(1),
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</dt>
                <dd className="mt-0.5 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Right — details + add button */}
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{card.issuer}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {card.card_name}
            </h1>
          </div>

          {/* Reward rules */}
          <div>
            <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Reward rates
            </h2>
            <ul className="mt-2 space-y-2">
              {card.reward_rules.map((rule) => (
                <li
                  key={rule.category}
                  className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <span className="text-sm capitalize text-zinc-700 dark:text-zinc-300">
                    {rule.category}
                  </span>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {rule.multiplier}
                    {unit}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Point value */}
          {card.reward_type !== "cashback" && (
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Est. point value
              </p>
              <p className="mt-0.5 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {(card.point_value * 100).toFixed(2)}¢ per point
              </p>
            </div>
          )}

          <AddToWalletButton card={card} />
        </div>
      </div>
    </div>
  );
}
