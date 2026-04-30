/**
 * seed-supabase.ts
 *
 * One-time script to seed Supabase with cards_catalog and merchant_categories
 * data from the local JSON files.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key> npx tsx scripts/seed-supabase.ts
 *
 * The NEXT_PUBLIC_SUPABASE_URL is read from .env.local automatically.
 * You must supply SUPABASE_SERVICE_ROLE_KEY as an environment variable
 * (do NOT commit the service role key — it bypasses Row Level Security).
 *
 * Find your service role key at:
 *   https://supabase.com/dashboard → your project → Settings → API → service_role key
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// Load env vars from .env.local (simple parser — no dotenv dependency needed)
// ---------------------------------------------------------------------------
function loadEnvLocal(): Record<string, string> {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return {};
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  const env: Record<string, string> = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    env[key] = value;
  }
  return env;
}

const envLocal = loadEnvLocal();

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  envLocal["NEXT_PUBLIC_SUPABASE_URL"];

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error(
    "ERROR: NEXT_PUBLIC_SUPABASE_URL not found in environment or .env.local"
  );
  process.exit(1);
}

if (!SERVICE_ROLE_KEY) {
  console.error(
    "ERROR: SUPABASE_SERVICE_ROLE_KEY env var is required.\n" +
      "  Run: SUPABASE_SERVICE_ROLE_KEY=<key> npx tsx scripts/seed-supabase.ts"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const BATCH_SIZE = 50;

async function batchUpsert<T extends object>(
  table: string,
  rows: T[]
): Promise<void> {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from(table).upsert(batch);
    if (error) {
      throw new Error(`Upsert error on table "${table}" (batch ${i / BATCH_SIZE + 1}): ${error.message}`);
    }
    console.log(
      `  [${table}] upserted rows ${i + 1}–${Math.min(i + BATCH_SIZE, rows.length)} of ${rows.length}`
    );
  }
}

async function seedCardsCatalog(): Promise<void> {
  console.log("\nSeeding cards_catalog…");
  const filePath = path.resolve(process.cwd(), "data/cardsCatalog.json");
  if (!fs.existsSync(filePath)) {
    console.error(`  ERROR: File not found: ${filePath}`);
    process.exit(1);
  }
  const cards = JSON.parse(fs.readFileSync(filePath, "utf-8")) as unknown[];
  console.log(`  Loaded ${cards.length} cards from ${filePath}`);
  await batchUpsert("cards_catalog", cards as object[]);
  console.log(`  Done — ${cards.length} cards seeded.`);
}

async function seedMerchantCategories(): Promise<void> {
  console.log("\nSeeding merchant_categories…");
  const filePath = path.resolve(process.cwd(), "data/merchant-map.json");
  if (!fs.existsSync(filePath)) {
    console.error(`  ERROR: File not found: ${filePath}`);
    process.exit(1);
  }
  const map = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Record<string, string>;
  const rows = Object.entries(map).map(([merchant_key, category]) => ({
    merchant_key,
    category,
  }));
  console.log(`  Loaded ${rows.length} merchant entries from ${filePath}`);
  await batchUpsert("merchant_categories", rows);
  console.log(`  Done — ${rows.length} merchant entries seeded.`);
}

async function main(): Promise<void> {
  console.log(`Connecting to Supabase: ${SUPABASE_URL}`);
  await seedCardsCatalog();
  await seedMerchantCategories();
  console.log("\nAll done!");
}

main().catch((err) => {
  console.error("\nUnhandled error:", err);
  process.exit(1);
});
