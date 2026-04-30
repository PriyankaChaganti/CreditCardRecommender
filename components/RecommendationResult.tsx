"use client";

import Image from "next/image";
import { IssuerLogo } from "@/components/IssuerLogo";
import { findCardByName } from "@/lib/catalogLoader";
import type { RecommendationCandidate, RecommendationResult as Reco } from "@/lib/recommendation";

function formatMoney(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

function formatCount(n: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);
}

function formatRaw(candidate: RecommendationCandidate): string {
  const { raw_reward, raw_unit, reward_value } = candidate;
  if (raw_reward == null || !Number.isFinite(raw_reward) || !raw_unit) return formatMoney(reward_value);
  if (raw_unit === "cashback") return formatMoney(raw_reward);
  return `${formatCount(raw_reward)} ${raw_unit}`;
}

function friendlyExplanation(result: Reco): string {
  const { best_cards, candidates, resolvedCategory, merchantMatchKey, top_raw_reward, top_raw_unit, reward_value } = result;
  if (!best_cards.length) return result.explanation;

  const top = candidates[0];
  const cat = resolvedCategory ?? "this category";
  const rewardStr =
    top_raw_unit === "cashback"
      ? formatMoney(top_raw_reward)
      : top_raw_unit
        ? `${formatCount(top_raw_reward)} ${top_raw_unit} (~${formatMoney(reward_value)} est.)`
        : formatMoney(reward_value);

  const merchantNote = merchantMatchKey ? `We matched "${merchantMatchKey}" to ${cat}. ` : "";

  if (best_cards.length > 1) {
    return `${merchantNote}${best_cards.length} cards tie at ${rewardStr} — pick whichever you prefer.`;
  }
  if (top.matchKind === "fallback_other" || top.matchKind === "fallback_best_any") {
    return `${merchantNote}${best_cards[0].card_name} has no specific ${cat} rule, so we used its general rate to earn ${rewardStr}.`;
  }
  return `${merchantNote}${best_cards[0].card_name} has the best ${cat} rate in your wallet, earning ${rewardStr}.`;
}

/* ─── Best card hero ─────────────────────────────────────── */

function BestCardHero({ candidate }: { candidate: RecommendationCandidate }) {
  const { card, rule, matchedCategory } = candidate;
  const image = findCardByName(card.card_name)?.image;
  const isCashback = candidate.raw_unit === "cashback";
  const rewardStr = formatRaw(candidate);
  const estStr = !isCashback && candidate.raw_unit ? `~${formatMoney(candidate.reward_value)}` : null;
  const ruleDesc = isCashback
    ? `${rule.multiplier}% back on ${matchedCategory}`
    : `${rule.multiplier}× points on ${matchedCategory}`;

  return (
    <div className="rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/20 p-5">
      {/* Badge */}
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
          ⭐ Best Card for This Purchase
        </span>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
          isCashback
            ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
            : "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
        }`}>
          {isCashback ? "Cashback" : "Points"}
        </span>
      </div>

      {/* Card info */}
      <div className="flex items-center gap-4">
        <div className="shrink-0">
          {image ? (
            <Image
              src={image}
              alt={card.card_name}
              width={110}
              height={68}
              className="rounded-xl object-contain drop-shadow-md"
            />
          ) : (
            <div className="flex h-16 w-24 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xl font-bold text-white shadow">
              {card.issuer[0]}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <IssuerLogo issuer={card.issuer} size={13} />
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{card.issuer}</span>
          </div>
          <p className="text-base font-bold leading-snug text-slate-900 dark:text-white">{card.card_name}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{ruleDesc}</p>
          <div className="mt-2 flex flex-wrap items-baseline gap-2">
            <span className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-300">{rewardStr}</span>
            {estStr && <span className="text-xs text-slate-400 dark:text-slate-500">{estStr}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Other card row ─────────────────────────────────────── */

function CardRow({ candidate }: { candidate: RecommendationCandidate }) {
  const { card, rule, matchedCategory } = candidate;
  const image = findCardByName(card.card_name)?.image;
  const isCashback = candidate.raw_unit === "cashback";
  const rewardStr = formatRaw(candidate);
  const estStr = !isCashback && candidate.raw_unit ? `~${formatMoney(candidate.reward_value)}` : null;
  const ruleDesc = isCashback
    ? `${rule.multiplier}% back on ${matchedCategory}`
    : `${rule.multiplier}× points on ${matchedCategory}`;

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
      <div className="shrink-0">
        {image ? (
          <Image src={image} alt={card.card_name} width={72} height={44} className="rounded-lg object-contain" />
        ) : (
          <IssuerLogo issuer={card.issuer} size={36} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 mb-0.5">
          <IssuerLogo issuer={card.issuer} size={11} />
          <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{card.issuer}</span>
        </div>
        <p className="text-sm font-semibold leading-snug text-slate-800 dark:text-slate-100">{card.card_name}</p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{ruleDesc}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{rewardStr}</p>
        {estStr && <p className="text-[11px] text-slate-400 dark:text-slate-500">{estStr}</p>}
        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
          isCashback
            ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300"
            : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
        }`}>
          {isCashback ? "Cashback" : "Points"}
        </span>
      </div>
    </div>
  );
}

/* ─── Main export ────────────────────────────────────────── */

export function RecommendationResult({ result }: { result: Reco | null }) {
  if (!result) return null;

  if (!result.best_cards.length) {
    return (
      <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/30 px-4 py-6 text-sm text-amber-950 dark:text-amber-100">
        <p className="font-medium">No recommendation</p>
        <p className="mt-2 text-amber-900/90">{result.explanation}</p>
      </div>
    );
  }

  const bestIds = new Set(result.best_cards.map((c) => c.id));
  const bestCandidates = result.candidates.filter((c) => bestIds.has(c.card.id));
  const otherCandidates = result.candidates.filter((c) => !bestIds.has(c.card.id));

  return (
    <div className="flex flex-col gap-4">

      {/* ── Best card(s) hero ─────────────────────────────── */}
      <div className="flex flex-col gap-3">
        {bestCandidates.map((candidate, i) => (
          <BestCardHero key={`best-${candidate.card.id}-${i}`} candidate={candidate} />
        ))}
      </div>

      {/* ── Why this card ─────────────────────────────────── */}
      <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1">
          Why this card?
        </p>
        <p className="text-sm text-slate-700 dark:text-slate-300">
          {friendlyExplanation(result)}
        </p>
        {result.usedFallbackPointValue && (
          <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
            * Estimated using default point value. Set a custom value in your profile.
          </p>
        )}
      </div>

      {/* ── Other cards ───────────────────────────────────── */}
      {otherCandidates.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Other cards in your wallet
          </p>
          {otherCandidates.map((candidate, i) => (
            <CardRow key={`other-${candidate.card.id}-${i}`} candidate={candidate} />
          ))}
        </div>
      )}
    </div>
  );
}
