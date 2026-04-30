"use client";

import { ThemeProvider } from "next-themes";

import { CardsProvider } from "@/components/CardsProvider";
import { DataLoader } from "@/components/DataLoader";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <CardsProvider>
        <DataLoader />
        {children}
      </CardsProvider>
    </ThemeProvider>
  );
}
