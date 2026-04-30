"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";


/* ─────────────────────────────────────────────────────── */
/* Icons                                                   */
/* ─────────────────────────────────────────────────────── */
const Icon = {
  Logo: () => (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-sm">
      <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <rect x={2} y={5} width={20} height={14} rx={2} /><path strokeLinecap="round" d="M2 10h20" />
      </svg>
    </div>
  ),
  Recommend: () => (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
    </svg>
  ),
  Cards: () => (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <rect x={2} y={5} width={20} height={14} rx={2} /><path strokeLinecap="round" d="M2 10h20" />
    </svg>
  ),
  Insights: () => (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  ),
  Transactions: () => (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
    </svg>
  ),
  Compare: () => (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </svg>
  ),
  Alerts: () => (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
  ),
  Settings: () => (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  ),
  Home: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 22V12h6v10" />
    </svg>
  ),
  Search: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <circle cx={11} cy={11} r={8} />
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35" />
    </svg>
  ),
  Profile: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <circle cx={12} cy={8} r={4} />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20c0-4 3.58-7 8-7s8 3 8 7" />
    </svg>
  ),
};

/* ─────────────────────────────────────────────────────── */
/* Nav data                                               */
/* ─────────────────────────────────────────────────────── */
const primaryNav = [
  { href: "/recommend", label: "Recommend", icon: <Icon.Recommend /> },
  { href: "/wallet",    label: "My Cards",  icon: <Icon.Cards />     },
];

const secondaryNav = [
  { href: "/insights",     label: "Insights",     icon: <Icon.Insights />,     soon: true  },
  { href: "/transactions", label: "Transactions", icon: <Icon.Transactions />, soon: true  },
  { href: "/compare",      label: "Compare",      icon: <Icon.Compare />,      soon: false },
  { href: "/alerts",       label: "Alerts",       icon: <Icon.Alerts />,       soon: true  },
];

const mobileBottomNav = [
  { href: "/",         label: "Home",      icon: <Icon.Home />      },
  { href: "/recommend",label: "Recommend", icon: <Icon.Recommend /> },
  { href: "/wallet",   label: "Wallet",    icon: <Icon.Cards />     },
  { href: "/profile",  label: "Settings",  icon: <Icon.Settings />  },
];

/* ─────────────────────────────────────────────────────── */
/* Sidebar tooltip (shown in icon-only/collapsed mode)    */
/* ─────────────────────────────────────────────────────── */
function Tooltip({ label }: { label: string }) {
  return (
    <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 lg:hidden">
      {label}
      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */
/* Main component                                         */
/* ─────────────────────────────────────────────────────── */
export function Nav({ userEmail, userName }: { userEmail?: string; userName?: string }) {
  const pathname   = usePathname();
const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (pathname === "/login" || pathname === "/signup") return null;

  const initials = userName
    ? userName.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : userEmail?.[0]?.toUpperCase() ?? "?";

  function active(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <>
      {/* ════════════════════════════════════════════════════════
          SIDEBAR — hidden on mobile, icon-only on md, full on lg
      ════════════════════════════════════════════════════════ */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-40 w-16 lg:w-60 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 shadow-[1px_0_0_0_rgb(0,0,0,0.04)]">

        {/* ── Branding ──────────────────────────────────────── */}
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-100 dark:border-slate-800 px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Icon.Logo />
            <span className="hidden lg:block text-[15px] font-bold tracking-tight text-slate-900 dark:text-white">
              CardWise
            </span>
          </Link>
        </div>

        {/* ── Scrollable nav body ───────────────────────────── */}
        <div className="flex flex-1 flex-col overflow-y-auto px-2 py-3 gap-0.5">

          {/* Primary nav */}
          {primaryNav.map((item) => {
            const isActive = active(item.href);
            return (
              <div key={item.href} className="group relative">
                <Link
                  href={item.href}
                  className={`relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {/* Left accent bar */}
                  <span
                    className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full bg-indigo-600 transition-opacity duration-150 ${
                      isActive ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  <span className={`shrink-0 transition-colors ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"}`}>
                    {item.icon}
                  </span>
                  <span className="hidden lg:block truncate">{item.label}</span>
                </Link>
                <Tooltip label={item.label} />
              </div>
            );
          })}

          {/* Divider */}
          <div className="my-2 mx-1 border-t border-slate-100 dark:border-slate-800" />

          {/* Secondary nav — clickable coming-soon pages */}
          {secondaryNav.map((item) => {
            const isActive = active(item.href);
            return (
              <div key={item.href} className="group relative">
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full bg-indigo-600" />
                  )}
                  <span className={`shrink-0 transition-colors ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"}`}>
                    {item.icon}
                  </span>
                  <span className="hidden lg:block truncate">{item.label}</span>
                  {item.soon && (
                    <span className="ml-auto hidden lg:inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                      Soon
                    </span>
                  )}
                </Link>
                <Tooltip label={item.label} />
              </div>
            );
          })}

          {/* Settings — directly after Alerts */}
          <div className="group relative">
            <Link
              href="/profile"
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                active("/profile")
                  ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {active("/profile") && (
                <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full bg-indigo-600" />
              )}
              <span className={`shrink-0 transition-colors ${active("/profile") ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"}`}>
                <Icon.Settings />
              </span>
              <span className="hidden lg:block truncate">Settings</span>
            </Link>
            <Tooltip label="Settings" />
          </div>

          <div className="flex-1" />
        </div>

        {/* ── User panel ────────────────────────────────────── */}
        <div className="shrink-0 border-t border-slate-100 dark:border-slate-800 p-2">
          {userEmail ? (
            /* Logged-in — flat layout, no dropdown */
            <div className="flex flex-col gap-0.5">
              {/* Avatar + name row */}
              <div className="flex items-center gap-3 rounded-xl px-2 py-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-bold text-white">
                  {initials}
                </div>
                <div className="hidden lg:block min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{userName || userEmail}</p>
                </div>
              </div>
              {/* Sign out */}
              <a
                href="/api/signout"
                className="hidden lg:flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                </svg>
                Sign out
              </a>
            </div>
          ) : (
            /* Guest */
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
              {/* Full sidebar (lg) */}
              <div className="hidden lg:block">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700">
                    <Icon.Profile />
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Guest Mode</p>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
                  Add cards to unlock personalized recommendations and insights.
                </p>
                <div className="mt-3 flex flex-col gap-1.5">
                  <Link
                    href="/login"
                    className="flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    className="flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity shadow-sm"
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
              {/* Icon-only (md, not lg) */}
              <div className="lg:hidden flex justify-center">
                <Link
                  href="/login"
                  className="group relative flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <Icon.Profile />
                  <Tooltip label="Log In / Sign Up" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ════════════════════════════════════════════════════════
          MOBILE top bar (< md)
      ════════════════════════════════════════════════════════ */}
      <header className="md:hidden sticky top-0 z-40 flex h-14 items-center border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-4 backdrop-blur-md">
        {/* Hamburger — left */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Open menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>

        {/* Logo — center */}
        <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <Icon.Logo />
          <span className="text-sm font-bold text-slate-900 dark:text-white">CardWise</span>
        </Link>

        {/* Login/Signup — right (guests only) */}
        {!userEmail && (
          <div className="ml-auto flex items-center gap-1.5">
            <Link href="/login" className="rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Login</Link>
            <Link href="/signup" className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1 text-xs font-semibold text-white">Sign up</Link>
          </div>
        )}
      </header>

      {/* ════════════════════════════════════════════════════════
          MOBILE drawer (slides in from left)
      ════════════════════════════════════════════════════════ */}
      {open && (
        <div className="md:hidden fixed inset-0 z-[60] flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div ref={menuRef} className="relative flex w-72 flex-col bg-white dark:bg-slate-900 shadow-2xl">
            {/* Header */}
            <div className="flex h-14 items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4">
              <div className="flex items-center gap-2">
                <Icon.Logo />
                <span className="text-sm font-bold text-slate-900 dark:text-white">CardWise</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Nav items */}
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
              {/* Primary */}
              {primaryNav.map((item) => {
                const isActive = active(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className={isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"}>
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                );
              })}

              <div className="my-2 border-t border-slate-100 dark:border-slate-800" />

              {/* Secondary */}
              {secondaryNav.map((item) => {
                const isActive = active(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className={isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"}>
                      {item.icon}
                    </span>
                    {item.label}
                    {item.soon && (
                      <span className="ml-auto rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                        Soon
                      </span>
                    )}
                  </Link>
                );
              })}

              <div className="my-2 border-t border-slate-100 dark:border-slate-800" />

              {/* Settings */}
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  active("/profile")
                    ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <span className={active("/profile") ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"}>
                  <Icon.Settings />
                </span>
                Settings
              </Link>
            </nav>

            {/* User panel at bottom */}
            {userEmail && (
              <div className="border-t border-slate-100 dark:border-slate-800 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-bold text-white">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{userName || userEmail}</p>
                    <p className="truncate text-xs text-slate-400 dark:text-slate-500">{userEmail}</p>
                  </div>
                </div>
                <a
                  href="/api/signout"
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                  </svg>
                  Sign out
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          MOBILE bottom nav (< md)
      ════════════════════════════════════════════════════════ */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 rounded-t-2xl border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-md">
        <div className="flex items-center justify-around px-2 py-1.5">
          {mobileBottomNav.map((item) => {
            const isActive = active(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-4 py-1.5 transition-all duration-150 ${
                  isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                <span className={`transition-transform duration-150 ${isActive ? "scale-110" : ""}`}>
                  {item.icon}
                </span>
                <span className={`text-[11px] font-medium ${isActive ? "text-indigo-600 dark:text-indigo-400" : ""}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
