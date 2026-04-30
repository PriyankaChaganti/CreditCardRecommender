import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Nav } from "@/components/Nav";
import { Providers } from "@/app/providers";
import { createClient } from "@/lib/supabase/server";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smart Card Recommender",
  description:
    "Choose the best credit card for each purchase using local, guest-only data.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col font-sans">
        <Nav userEmail={user?.email} userName={user?.user_metadata?.full_name} />
        <Providers>
          <main className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950 pb-16 md:pb-0 md:pl-16 lg:pl-60">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
