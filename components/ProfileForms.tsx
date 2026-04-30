"use client";

import { useActionState } from "react";
import { useTheme } from "next-themes";

import { updateEmail, updateName, updatePassword } from "@/app/actions/profile";
import { useCardsStore } from "@/store/useCardsStore";

type RewardPref = "all" | "cashback" | "points";

const THEMES = [
  { value: "light",  label: "Light",  icon: "☀️" },
  { value: "dark",   label: "Dark",   icon: "🌙" },
  { value: "system", label: "System", icon: "💻" },
] as const;

const REWARD_OPTIONS: { value: RewardPref; label: string; icon: string; desc: string }[] = [
  { value: "all",      label: "Both",            icon: "💳", desc: "Compare all your cards" },
  { value: "cashback", label: "Cashback",         icon: "💵", desc: "Only cashback cards" },
  { value: "points",   label: "Points & Miles",   icon: "✨", desc: "Only points/miles cards" },
];

function StatusMessage({ state }: { state: { error: string } | { success: string } | undefined }) {
  if (!state) return null;
  if ("error" in state)
    return <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>;
  return <p className="text-sm text-indigo-600 dark:text-indigo-400">{state.success}</p>;
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{description}</p>}
      </div>
      {children}
    </div>
  );
}


export function ProfileForms({
  currentName,
  currentEmail,
}: {
  currentName: string;
  currentEmail: string;
}) {
  const [nameState, nameAction, namePending] = useActionState(updateName, undefined);
  const [emailState, emailAction, emailPending] = useActionState(updateEmail, undefined);
  const [passState, passAction, passPending] = useActionState(updatePassword, undefined);

  const { theme, setTheme } = useTheme();
  const rewardPref = useCardsStore((s) => s.rewardPref);
  const setRewardPrefInStore = useCardsStore((s) => s.setRewardPref);

  function handleRewardPref(pref: RewardPref) {
    void setRewardPrefInStore(pref);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Personalize */}
      <SectionCard title="Personalize" description="Choose which card types to compare in recommendations.">
        <div className="flex gap-3">
          {REWARD_OPTIONS.map((opt) => {
            const active = rewardPref === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleRewardPref(opt.value)}
                className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl border py-4 text-sm font-medium transition-all ${
                  active
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <span className="text-xl">{opt.icon}</span>
                <span>{opt.label}</span>
                <span className={`text-[11px] font-normal ${active ? "text-indigo-500 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"}`}>
                  {opt.desc}
                </span>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* Name */}
      <SectionCard title="Display name">
        <form action={nameAction} className="flex flex-col gap-3">
          <input
            name="name"
            defaultValue={currentName}
            placeholder="Your name"
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-50 outline-none ring-indigo-500/20 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-300 focus:ring-2"
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={namePending}
              className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {namePending ? "Saving…" : "Save"}
            </button>
            <StatusMessage state={nameState} />
          </div>
        </form>
      </SectionCard>

      {/* Email */}
      <SectionCard title="Email address">
        <form action={emailAction} className="flex flex-col gap-3">
          <input
            name="email"
            type="email"
            defaultValue={currentEmail}
            required
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-50 outline-none ring-indigo-500/20 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-300 focus:ring-2"
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={emailPending}
              className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {emailPending ? "Updating…" : "Update email"}
            </button>
            <StatusMessage state={emailState} />
          </div>
        </form>
      </SectionCard>

      {/* Appearance */}
      <SectionCard title="Appearance">
        <div className="flex gap-2">
          {THEMES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTheme(t.value)}
              className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl border py-3 text-sm font-medium transition ${
                theme === t.value
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <span className="text-lg">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </SectionCard>

      {/* Password */}
      <SectionCard title="Password">
        <form action={passAction} className="flex flex-col gap-3">
          <input
            name="currentPassword"
            type="password"
            required
            placeholder="Current password"
            autoComplete="current-password"
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-50 outline-none ring-indigo-500/20 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-300 focus:ring-2"
          />
          <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
          <input
            name="password"
            type="password"
            required
            placeholder="New password"
            autoComplete="new-password"
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-50 outline-none ring-indigo-500/20 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-300 focus:ring-2"
          />
          <input
            name="confirmPassword"
            type="password"
            required
            placeholder="Confirm new password"
            autoComplete="new-password"
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-50 outline-none ring-indigo-500/20 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-300 focus:ring-2"
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={passPending}
              className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {passPending ? "Updating…" : "Update password"}
            </button>
            <StatusMessage state={passState} />
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
