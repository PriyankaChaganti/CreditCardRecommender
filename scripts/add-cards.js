#!/usr/bin/env node
/**
 * add-cards.js
 * 1. Write SVG placeholder images for all new cards
 * 2. Attempt to download real card art from official CDNs
 * 3. Append new card entries to cardsCatalog.json
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const ROOT = path.join(__dirname, "..");
const CARDS_REAL = path.join(ROOT, "public", "cards-real");
const LOGOS_DIR = path.join(ROOT, "public", "logos");
const CATALOG_PATH = path.join(ROOT, "data", "cardsCatalog.json");

// ─── Brand colours per issuer ─────────────────────────────────────────────────
const ISSUER_COLORS = {
  "American Express": ["#00356e", "#1565c0"],
  "Bank of America": ["#a51c30", "#c62828"],
  Barclays: ["#00aeef", "#005ba1"],
  "Bread Financial": ["#e63329", "#b52020"],
  "Capital One": ["#1c1c3c", "#2d2d5e"],
  Chase: ["#1a3c6e", "#3a6fa8"],
  Citi: ["#003b70", "#0058a3"],
  Discover: ["#f76a1c", "#cc5500"],
  "Wells Fargo": ["#c41230", "#e53935"],
  "US Bank": ["#2c2c80", "#4040c0"],
  Synchrony: ["#00539b", "#0077cc"],
  "TD Bank": ["#2d8c3e", "#1a6b2a"],
  "PNC Bank": ["#e57200", "#ff9420"],
  "Navy Federal": ["#003087", "#1a4fa8"],
  PenFed: ["#1a2f6e", "#2d4ca8"],
  FNBO: ["#1d4f8c", "#2d6fcc"],
  "Elan Financial": ["#1f4f8f", "#2d6fc4"],
  SoFi: ["#4b38ef", "#6b5af0"],
  "Goldman Sachs": ["#1d1d1f", "#3c3c3e"],
};

function makeSvg(issuer, cardName, network) {
  const [c1, c2] = ISSUER_COLORS[issuer] ?? ["#3f3f46", "#71717a"];
  // Shorten long card names for display
  const displayName = cardName.length > 32 ? cardName.slice(0, 30) + "…" : cardName;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" width="400" height="250">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="400" height="250" rx="20" fill="url(#g)"/>
  <rect x="30" y="82" width="50" height="38" rx="6" fill="#d4af37" opacity="0.9"/>
  <line x1="30" y1="101" x2="80" y2="101" stroke="#b89020" stroke-width="1.5"/>
  <line x1="55" y1="82" x2="55" y2="120" stroke="#b89020" stroke-width="1.5"/>
  <text x="30" y="168" font-family="monospace" font-size="15" fill="white" opacity="0.6" letter-spacing="3">•••• •••• •••• ••••</text>
  <text x="30" y="30" font-family="system-ui,sans-serif" font-size="14" fill="white" font-weight="700" opacity="0.85">${issuer}</text>
  <text x="30" y="215" font-family="system-ui,sans-serif" font-size="13" fill="white" font-weight="500" opacity="0.9">${displayName}</text>
  <text x="370" y="225" font-family="serif" font-size="20" fill="white" font-style="italic" text-anchor="end" font-weight="700" opacity="0.85">${network}</text>
</svg>`;
}

// ─── Issuer logo SVGs for new issuers ─────────────────────────────────────────
function makeLogoSvg(issuer, color, initials) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" rx="12" fill="${color}"/>
  <text x="50" y="68" font-family="system-ui,sans-serif" font-size="38" fill="white" font-weight="700" text-anchor="middle">${initials}</text>
</svg>`;
}

const NEW_ISSUER_LOGOS = {
  Barclays: { color: "#00aeef", initials: "BC", file: "barclays.svg" },
  "Bread Financial": { color: "#e63329", initials: "BF", file: "bread-financial.svg" },
  Synchrony: { color: "#00539b", initials: "SY", file: "synchrony.svg" },
  "TD Bank": { color: "#2d8c3e", initials: "TD", file: "td-bank.svg" },
  "PNC Bank": { color: "#e57200", initials: "PN", file: "pnc-bank.svg" },
  "Navy Federal": { color: "#003087", initials: "NF", file: "navy-federal.svg" },
  PenFed: { color: "#1a2f6e", initials: "PF", file: "penfed.svg" },
  FNBO: { color: "#1d4f8c", initials: "FN", file: "fnbo.svg" },
  "Elan Financial": { color: "#1f4f8f", initials: "EL", file: "elan.svg" },
  SoFi: { color: "#4b38ef", initials: "SF", file: "sofi.svg" },
};

// ─── New card definitions ──────────────────────────────────────────────────────
const NEW_CARDS = [
  // ── American Express ──────────────────────────────────────────────────────
  {
    id: "amex-green",
    card_name: "Amex Green Card",
    issuer: "American Express",
    network: "Amex",
    annual_fee: 150,
    reward_type: "points",
    point_value: 0.02,
    reward_rules: [
      { category: "transit", multiplier: 3 },
      { category: "travel", multiplier: 3 },
      { category: "dining", multiplier: 3 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    id: "amex-everyday",
    card_name: "Amex EveryDay",
    issuer: "American Express",
    network: "Amex",
    annual_fee: 0,
    reward_type: "points",
    point_value: 0.02,
    reward_rules: [
      { category: "groceries", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    id: "amex-everyday-preferred",
    card_name: "Amex EveryDay Preferred",
    issuer: "American Express",
    network: "Amex",
    annual_fee: 95,
    reward_type: "points",
    point_value: 0.02,
    reward_rules: [
      { category: "groceries", multiplier: 3 },
      { category: "gas", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    id: "hilton-surpass",
    card_name: "Hilton Honors Surpass",
    issuer: "American Express",
    network: "Amex",
    annual_fee: 150,
    reward_type: "points",
    point_value: 0.005,
    reward_rules: [
      { category: "hotels", multiplier: 12 },
      { category: "dining", multiplier: 6 },
      { category: "groceries", multiplier: 6 },
      { category: "gas", multiplier: 6 },
      { category: "other", multiplier: 3 },
    ],
  },
  {
    id: "hilton-aspire",
    card_name: "Hilton Honors Aspire",
    issuer: "American Express",
    network: "Amex",
    annual_fee: 550,
    reward_type: "points",
    point_value: 0.005,
    reward_rules: [
      { category: "hotels", multiplier: 14 },
      { category: "dining", multiplier: 7 },
      { category: "flights", multiplier: 7 },
      { category: "other", multiplier: 3 },
    ],
  },
  {
    id: "delta-platinum-amex",
    card_name: "Delta SkyMiles Platinum",
    issuer: "American Express",
    network: "Amex",
    annual_fee: 350,
    reward_type: "miles",
    point_value: 0.012,
    reward_rules: [
      { category: "travel", multiplier: 3 },
      { category: "dining", multiplier: 2 },
      { category: "groceries", multiplier: 2 },
      { category: "hotels", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    id: "delta-reserve-amex",
    card_name: "Delta SkyMiles Reserve",
    issuer: "American Express",
    network: "Amex",
    annual_fee: 650,
    reward_type: "miles",
    point_value: 0.012,
    reward_rules: [
      { category: "travel", multiplier: 3 },
      { category: "other", multiplier: 1.5 },
    ],
  },
  {
    id: "marriott-bonvoy-brilliant",
    card_name: "Marriott Bonvoy Brilliant",
    issuer: "American Express",
    network: "Amex",
    annual_fee: 650,
    reward_type: "points",
    point_value: 0.008,
    reward_rules: [
      { category: "hotels", multiplier: 6 },
      { category: "dining", multiplier: 3 },
      { category: "other", multiplier: 2 },
    ],
  },
  {
    id: "marriott-bonvoy-bevy",
    card_name: "Marriott Bonvoy Bevy",
    issuer: "American Express",
    network: "Amex",
    annual_fee: 250,
    reward_type: "points",
    point_value: 0.008,
    reward_rules: [
      { category: "hotels", multiplier: 6 },
      { category: "dining", multiplier: 4 },
      { category: "groceries", multiplier: 4 },
      { category: "other", multiplier: 2 },
    ],
  },
  {
    id: "amex-business-gold",
    card_name: "Business Gold Card",
    issuer: "American Express",
    network: "Amex",
    annual_fee: 375,
    reward_type: "points",
    point_value: 0.02,
    reward_rules: [
      { category: "dining", multiplier: 4 },
      { category: "travel", multiplier: 4 },
      { category: "gas", multiplier: 4 },
      { category: "other", multiplier: 1 },
    ],
  },

  // ── Bank of America ───────────────────────────────────────────────────────
  {
    id: "bofa-unlimited-cash",
    card_name: "Unlimited Cash Rewards",
    issuer: "Bank of America",
    network: "Visa",
    annual_fee: 0,
    reward_type: "cashback",
    point_value: 0.01,
    reward_rules: [{ category: "other", multiplier: 1.5 }],
  },
  {
    id: "bofa-premium-rewards-elite",
    card_name: "Premium Rewards Elite",
    issuer: "Bank of America",
    network: "Visa",
    annual_fee: 550,
    reward_type: "points",
    point_value: 0.01,
    reward_rules: [
      { category: "travel", multiplier: 2 },
      { category: "dining", multiplier: 2 },
      { category: "other", multiplier: 1.5 },
    ],
  },
  {
    id: "bofa-travel-rewards",
    card_name: "Travel Rewards",
    issuer: "Bank of America",
    network: "Visa",
    annual_fee: 0,
    reward_type: "points",
    point_value: 0.01,
    reward_rules: [{ category: "other", multiplier: 1.5 }],
  },
  {
    id: "alaska-airlines-visa",
    card_name: "Alaska Airlines Visa",
    issuer: "Bank of America",
    network: "Visa",
    annual_fee: 95,
    reward_type: "miles",
    point_value: 0.018,
    reward_rules: [
      { category: "flights", multiplier: 3 },
      { category: "other", multiplier: 1 },
    ],
  },

  // ── Barclays ──────────────────────────────────────────────────────────────
  {
    id: "jetblue-plus",
    card_name: "JetBlue Plus Card",
    issuer: "Barclays",
    network: "Mastercard",
    annual_fee: 99,
    reward_type: "points",
    point_value: 0.013,
    reward_rules: [
      { category: "flights", multiplier: 6 },
      { category: "dining", multiplier: 2 },
      { category: "groceries", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    id: "jetblue-card",
    card_name: "JetBlue Card",
    issuer: "Barclays",
    network: "Mastercard",
    annual_fee: 0,
    reward_type: "points",
    point_value: 0.013,
    reward_rules: [
      { category: "flights", multiplier: 3 },
      { category: "dining", multiplier: 2 },
      { category: "groceries", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    id: "hawaiian-airlines-mastercard",
    card_name: "Hawaiian Airlines Mastercard",
    issuer: "Barclays",
    network: "Mastercard",
    annual_fee: 99,
    reward_type: "miles",
    point_value: 0.011,
    reward_rules: [
      { category: "flights", multiplier: 3 },
      { category: "dining", multiplier: 2 },
      { category: "gas", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    id: "wyndham-rewards-earner",
    card_name: "Wyndham Rewards Earner",
    issuer: "Barclays",
    network: "Visa",
    annual_fee: 0,
    reward_type: "points",
    point_value: 0.009,
    reward_rules: [
      { category: "hotels", multiplier: 5 },
      { category: "gas", multiplier: 5 },
      { category: "dining", multiplier: 2 },
      { category: "groceries", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    id: "wyndham-rewards-earner-plus",
    card_name: "Wyndham Rewards Earner Plus",
    issuer: "Barclays",
    network: "Visa",
    annual_fee: 75,
    reward_type: "points",
    point_value: 0.009,
    reward_rules: [
      { category: "hotels", multiplier: 6 },
      { category: "gas", multiplier: 6 },
      { category: "dining", multiplier: 4 },
      { category: "groceries", multiplier: 4 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    id: "aadvantage-aviator-red",
    card_name: "AAdvantage Aviator Red",
    issuer: "Barclays",
    network: "Mastercard",
    annual_fee: 99,
    reward_type: "miles",
    point_value: 0.017,
    reward_rules: [
      { category: "flights", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    id: "aadvantage-aviator-silver",
    card_name: "AAdvantage Aviator Silver",
    issuer: "Barclays",
    network: "Mastercard",
    annual_fee: 199,
    reward_type: "miles",
    point_value: 0.017,
    reward_rules: [
      { category: "flights", multiplier: 3 },
      { category: "hotels", multiplier: 3 },
      { category: "car-rentals", multiplier: 3 },
      { category: "dining", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },

  // ── Bread Financial ───────────────────────────────────────────────────────
  {
    id: "aaa-daily-advantage",
    card_name: "AAA Daily Advantage",
    issuer: "Bread Financial",
    network: "Visa",
    annual_fee: 0,
    reward_type: "cashback",
    point_value: 0.01,
    reward_rules: [
      { category: "groceries", multiplier: 5 },
      { category: "gas", multiplier: 3 },
      { category: "pharmacy", multiplier: 3 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    id: "aaa-travel-advantage",
    card_name: "AAA Travel Advantage",
    issuer: "Bread Financial",
    network: "Visa",
    annual_fee: 0,
    reward_type: "cashback",
    point_value: 0.01,
    reward_rules: [
      { category: "gas", multiplier: 5 },
      { category: "travel", multiplier: 3 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    id: "bjs-perks-elite",
    card_name: "BJ's Perks Elite Mastercard",
    issuer: "Bread Financial",
    network: "Mastercard",
    annual_fee: 0,
    reward_type: "cashback",
    point_value: 0.01,
    reward_rules: [
      { category: "wholesale", multiplier: 5 },
      { category: "gas", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    id: "sephora-visa",
    card_name: "Sephora Visa Card",
    issuer: "Bread Financial",
    network: "Visa",
    annual_fee: 0,
    reward_type: "cashback",
    point_value: 0.01,
    reward_rules: [
      { category: "beauty", multiplier: 4 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    id: "ulta-beauty-rewards",
    card_name: "Ulta Beauty Rewards",
    issuer: "Bread Financial",
    network: "Mastercard",
    annual_fee: 0,
    reward_type: "points",
    point_value: 0.01,
    reward_rules: [
      { category: "beauty", multiplier: 5 },
      { category: "other", multiplier: 1 },
    ],
  },

  // ── Capital One ───────────────────────────────────────────────────────────
  {
    id: "capital-one-venture",
    card_name: "Capital One Venture",
    issuer: "Capital One",
    network: "Visa",
    annual_fee: 95,
    reward_type: "miles",
    point_value: 0.01,
    reward_rules: [
      { category: "hotels", multiplier: 5 },
      { category: "car-rentals", multiplier: 5 },
      { category: "other", multiplier: 2 },
    ],
  },
  {
    id: "capital-one-ventureone",
    card_name: "Capital One VentureOne",
    issuer: "Capital One",
    network: "Visa",
    annual_fee: 0,
    reward_type: "miles",
    point_value: 0.01,
    reward_rules: [
      { category: "hotels", multiplier: 5 },
      { category: "car-rentals", multiplier: 5 },
      { category: "other", multiplier: 1.25 },
    ],
  },
  {
    id: "capital-one-savorone",
    card_name: "Capital One SavorOne",
    issuer: "Capital One",
    network: "Mastercard",
    annual_fee: 0,
    reward_type: "cashback",
    point_value: 0.01,
    reward_rules: [
      { category: "dining", multiplier: 3 },
      { category: "entertainment", multiplier: 3 },
      { category: "groceries", multiplier: 3 },
      { category: "streaming", multiplier: 3 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    id: "capital-one-quicksilverone",
    card_name: "Capital One QuicksilverOne",
    issuer: "Capital One",
    network: "Mastercard",
    annual_fee: 39,
    reward_type: "cashback",
    point_value: 0.01,
    reward_rules: [{ category: "other", multiplier: 1.5 }],
  },

  // ── Chase ─────────────────────────────────────────────────────────────────
  {
    id: "freedom-rise",
    card_name: "Freedom Rise",
    issuer: "Chase",
    network: "Visa",
    annual_fee: 0,
    reward_type: "cashback",
    point_value: 0.01,
    reward_rules: [{ category: "other", multiplier: 1.5 }],
  },
  {
    id: "amazon-visa",
    card_name: "Amazon Visa",
    issuer: "Chase",
    network: "Visa",
    annual_fee: 0,
    reward_type: "cashback",
    point_value: 0.01,
    reward_rules: [
      { category: "online", multiplier: 3 },
      { category: "dining", multiplier: 2 },
      { category: "gas", multiplier: 2 },
      { category: "pharmacy", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    id: "southwest-premier",
    card_name: "Southwest Rapid Rewards Premier",
    issuer: "Chase",
    network: "Visa",
    annual_fee: 99,
    reward_type: "points",
    point_value: 0.015,
    reward_rules: [
      { category: "flights", multiplier: 3 },
      { category: "dining", multiplier: 2 },
      { category: "hotels", multiplier: 2 },
      { category: "transit", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    id: "southwest-priority",
    card_name: "Southwest Rapid Rewards Priority",
    issuer: "Chase",
    network: "Visa",
    annual_fee: 149,
    reward_type: "points",
    point_value: 0.015,
    reward_rules: [
      { category: "flights", multiplier: 3 },
      { category: "dining", multiplier: 2 },
      { category: "hotels", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    id: "united-quest",
    card_name: "United Quest Card",
    issuer: "Chase",
    network: "Visa",
    annual_fee: 250,
    reward_type: "miles",
    point_value: 0.012,
    reward_rules: [
      { category: "flights", multiplier: 3 },
      { category: "dining", multiplier: 2 },
      { category: "hotels", multiplier: 2 },
      { category: "streaming", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    id: "united-club-infinite",
    card_name: "United Club Infinite",
    issuer: "Chase",
    network: "Visa",
    annual_fee: 525,
    reward_type: "miles",
    point_value: 0.012,
    reward_rules: [
      { category: "flights", multiplier: 4 },
      { category: "dining", multiplier: 2 },
      { category: "hotels", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    id: "world-of-hyatt",
    card_name: "World of Hyatt Card",
    issuer: "Chase",
    network: "Visa",
    annual_fee: 95,
    reward_type: "points",
    point_value: 0.017,
    reward_rules: [
      { category: "hotels", multiplier: 4 },
      { category: "dining", multiplier: 2 },
      { category: "transit", multiplier: 2 },
      { category: "fitness", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    id: "marriott-bonvoy-boundless",
    card_name: "Marriott Bonvoy Boundless",
    issuer: "Chase",
    network: "Visa",
    annual_fee: 95,
    reward_type: "points",
    point_value: 0.008,
    reward_rules: [
      { category: "hotels", multiplier: 6 },
      { category: "dining", multiplier: 3 },
      { category: "groceries", multiplier: 3 },
      { category: "gas", multiplier: 3 },
      { category: "other", multiplier: 2 },
    ],
  },
  {
    id: "marriott-bonvoy-bold",
    card_name: "Marriott Bonvoy Bold",
    issuer: "Chase",
    network: "Visa",
    annual_fee: 0,
    reward_type: "points",
    point_value: 0.008,
    reward_rules: [
      { category: "hotels", multiplier: 3 },
      { category: "travel", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    id: "ink-business-preferred",
    card_name: "Ink Business Preferred",
    issuer: "Chase",
    network: "Visa",
    annual_fee: 95,
    reward_type: "points",
    point_value: 0.02,
    reward_rules: [
      { category: "travel", multiplier: 3 },
      { category: "shipping", multiplier: 3 },
      { category: "internet", multiplier: 3 },
      { category: "phone", multiplier: 3 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    id: "ink-business-cash",
    card_name: "Ink Business Cash",
    issuer: "Chase",
    network: "Visa",
    annual_fee: 0,
    reward_type: "cashback",
    point_value: 0.01,
    reward_rules: [
      { category: "office", multiplier: 5 },
      { category: "internet", multiplier: 5 },
      { category: "phone", multiplier: 5 },
      { category: "dining", multiplier: 2 },
      { category: "gas", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    id: "ink-business-unlimited",
    card_name: "Ink Business Unlimited",
    issuer: "Chase",
    network: "Visa",
    annual_fee: 0,
    reward_type: "cashback",
    point_value: 0.01,
    reward_rules: [{ category: "other", multiplier: 1.5 }],
  },

  // ── Citi ──────────────────────────────────────────────────────────────────
  {
    id: "citi-rewards-plus",
    card_name: "Citi Rewards+",
    issuer: "Citi",
    network: "Mastercard",
    annual_fee: 0,
    reward_type: "points",
    point_value: 0.01,
    reward_rules: [
      { category: "groceries", multiplier: 2 },
      { category: "gas", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    id: "citi-custom-cash",
    card_name: "Citi Custom Cash",
    issuer: "Citi",
    network: "Mastercard",
    annual_fee: 0,
    reward_type: "cashback",
    point_value: 0.01,
    reward_rules: [
      { category: "top-category", multiplier: 5 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    id: "citi-aadvantage-platinum",
    card_name: "Citi AAdvantage Platinum Select",
    issuer: "Citi",
    network: "Mastercard",
    annual_fee: 99,
    reward_type: "miles",
    point_value: 0.017,
    reward_rules: [
      { category: "flights", multiplier: 2 },
      { category: "dining", multiplier: 2 },
      { category: "gas", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    id: "citi-aadvantage-executive",
    card_name: "Citi AAdvantage Executive",
    issuer: "Citi",
    network: "Mastercard",
    annual_fee: 595,
    reward_type: "miles",
    point_value: 0.017,
    reward_rules: [
      { category: "flights", multiplier: 4 },
      { category: "other", multiplier: 1 },
    ],
  },

  // ── Discover ──────────────────────────────────────────────────────────────
  {
    id: "discover-it-chrome",
    card_name: "Discover it Chrome",
    issuer: "Discover",
    network: "Discover",
    annual_fee: 0,
    reward_type: "cashback",
    point_value: 0.01,
    reward_rules: [
      { category: "dining", multiplier: 2 },
      { category: "gas", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    id: "discover-it-miles",
    card_name: "Discover it Miles",
    issuer: "Discover",
    network: "Discover",
    annual_fee: 0,
    reward_type: "miles",
    point_value: 0.01,
    reward_rules: [{ category: "other", multiplier: 1.5 }],
  },
  {
    id: "discover-it-student",
    card_name: "Discover it Student Cash Back",
    issuer: "Discover",
    network: "Discover",
    annual_fee: 0,
    reward_type: "cashback",
    point_value: 0.01,
    reward_rules: [
      { category: "rotating", multiplier: 5 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    id: "discover-it-secured",
    card_name: "Discover it Secured",
    issuer: "Discover",
    network: "Discover",
    annual_fee: 0,
    reward_type: "cashback",
    point_value: 0.01,
    reward_rules: [
      { category: "dining", multiplier: 2 },
      { category: "gas", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },

  // ── Wells Fargo ───────────────────────────────────────────────────────────
  {
    id: "wells-fargo-autograph",
    card_name: "Wells Fargo Autograph",
    issuer: "Wells Fargo",
    network: "Visa",
    annual_fee: 0,
    reward_type: "points",
    point_value: 0.01,
    reward_rules: [
      { category: "dining", multiplier: 3 },
      { category: "travel", multiplier: 3 },
      { category: "gas", multiplier: 3 },
      { category: "transit", multiplier: 3 },
      { category: "streaming", multiplier: 3 },
      { category: "phone", multiplier: 3 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    id: "wells-fargo-autograph-journey",
    card_name: "Wells Fargo Autograph Journey",
    issuer: "Wells Fargo",
    network: "Visa",
    annual_fee: 95,
    reward_type: "points",
    point_value: 0.01,
    reward_rules: [
      { category: "hotels", multiplier: 5 },
      { category: "flights", multiplier: 4 },
      { category: "dining", multiplier: 3 },
      { category: "other", multiplier: 1 },
    ],
  },

  // ── US Bank ───────────────────────────────────────────────────────────────
  {
    id: "us-bank-altitude-reserve",
    card_name: "US Bank Altitude Reserve",
    issuer: "US Bank",
    network: "Visa",
    annual_fee: 400,
    reward_type: "points",
    point_value: 0.015,
    reward_rules: [
      { category: "mobile-pay", multiplier: 3 },
      { category: "travel", multiplier: 3 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    id: "us-bank-altitude-connect",
    card_name: "US Bank Altitude Connect",
    issuer: "US Bank",
    network: "Visa",
    annual_fee: 95,
    reward_type: "points",
    point_value: 0.01,
    reward_rules: [
      { category: "travel", multiplier: 4 },
      { category: "gas", multiplier: 4 },
      { category: "dining", multiplier: 2 },
      { category: "groceries", multiplier: 2 },
      { category: "streaming", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    id: "us-bank-cash-plus",
    card_name: "US Bank Cash+ Visa",
    issuer: "US Bank",
    network: "Visa",
    annual_fee: 0,
    reward_type: "cashback",
    point_value: 0.01,
    reward_rules: [
      { category: "utilities", multiplier: 5 },
      { category: "dining", multiplier: 5 },
      { category: "groceries", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    id: "us-bank-shopper-cash",
    card_name: "US Bank Shopper Cash Rewards",
    issuer: "US Bank",
    network: "Visa",
    annual_fee: 0,
    reward_type: "cashback",
    point_value: 0.01,
    reward_rules: [
      { category: "online", multiplier: 6 },
      { category: "wholesale", multiplier: 3 },
      { category: "other", multiplier: 1.5 },
    ],
  },

  // ── Synchrony ─────────────────────────────────────────────────────────────
  {
    id: "amazon-store-card",
    card_name: "Amazon Store Card",
    issuer: "Synchrony",
    network: "Visa",
    annual_fee: 0,
    reward_type: "cashback",
    point_value: 0.01,
    reward_rules: [
      { category: "online", multiplier: 5 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    id: "lowes-advantage",
    card_name: "Lowe's Advantage Card",
    issuer: "Synchrony",
    network: "Mastercard",
    annual_fee: 0,
    reward_type: "cashback",
    point_value: 0.01,
    reward_rules: [
      { category: "home-improvement", multiplier: 5 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    id: "paypal-cashback",
    card_name: "PayPal Cashback Mastercard",
    issuer: "Synchrony",
    network: "Mastercard",
    annual_fee: 0,
    reward_type: "cashback",
    point_value: 0.01,
    reward_rules: [
      { category: "online", multiplier: 3 },
      { category: "other", multiplier: 2 },
    ],
  },
  {
    id: "sams-club-mastercard",
    card_name: "Sam's Club Mastercard",
    issuer: "Synchrony",
    network: "Mastercard",
    annual_fee: 0,
    reward_type: "cashback",
    point_value: 0.01,
    reward_rules: [
      { category: "gas", multiplier: 5 },
      { category: "dining", multiplier: 3 },
      { category: "travel", multiplier: 3 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    id: "verizon-visa",
    card_name: "Verizon Visa Card",
    issuer: "Synchrony",
    network: "Visa",
    annual_fee: 0,
    reward_type: "cashback",
    point_value: 0.01,
    reward_rules: [
      { category: "phone", multiplier: 4 },
      { category: "groceries", multiplier: 3 },
      { category: "dining", multiplier: 2 },
      { category: "gas", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },

  // ── TD Bank ───────────────────────────────────────────────────────────────
  {
    id: "td-double-up",
    card_name: "TD Double Up",
    issuer: "TD Bank",
    network: "Visa",
    annual_fee: 0,
    reward_type: "cashback",
    point_value: 0.01,
    reward_rules: [{ category: "other", multiplier: 2 }],
  },
  {
    id: "td-cash",
    card_name: "TD Cash Credit Card",
    issuer: "TD Bank",
    network: "Visa",
    annual_fee: 0,
    reward_type: "cashback",
    point_value: 0.01,
    reward_rules: [
      { category: "dining", multiplier: 3 },
      { category: "groceries", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    id: "td-aeroplan-visa",
    card_name: "TD Aeroplan Visa",
    issuer: "TD Bank",
    network: "Visa",
    annual_fee: 95,
    reward_type: "points",
    point_value: 0.015,
    reward_rules: [
      { category: "flights", multiplier: 3 },
      { category: "dining", multiplier: 1.5 },
      { category: "groceries", multiplier: 1.5 },
      { category: "gas", multiplier: 1.5 },
      { category: "other", multiplier: 1 },
    ],
  },

  // ── PNC Bank ──────────────────────────────────────────────────────────────
  {
    id: "pnc-cash-rewards",
    card_name: "PNC Cash Rewards",
    issuer: "PNC Bank",
    network: "Visa",
    annual_fee: 0,
    reward_type: "cashback",
    point_value: 0.01,
    reward_rules: [
      { category: "gas", multiplier: 4 },
      { category: "dining", multiplier: 3 },
      { category: "groceries", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    id: "pnc-points-visa",
    card_name: "PNC Points Visa",
    issuer: "PNC Bank",
    network: "Visa",
    annual_fee: 0,
    reward_type: "points",
    point_value: 0.01,
    reward_rules: [
      { category: "travel", multiplier: 4 },
      { category: "dining", multiplier: 2 },
      { category: "groceries", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },

  // ── Navy Federal ──────────────────────────────────────────────────────────
  {
    id: "navy-federal-more-rewards",
    card_name: "More Rewards Card",
    issuer: "Navy Federal",
    network: "Amex",
    annual_fee: 0,
    reward_type: "points",
    point_value: 0.01,
    reward_rules: [
      { category: "dining", multiplier: 3 },
      { category: "groceries", multiplier: 3 },
      { category: "gas", multiplier: 3 },
      { category: "transit", multiplier: 3 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    id: "navy-federal-cash-rewards",
    card_name: "Cash Rewards Card",
    issuer: "Navy Federal",
    network: "Visa",
    annual_fee: 0,
    reward_type: "cashback",
    point_value: 0.01,
    reward_rules: [{ category: "other", multiplier: 1.75 }],
  },
  {
    id: "navy-federal-flagship",
    card_name: "Flagship Rewards Card",
    issuer: "Navy Federal",
    network: "Visa",
    annual_fee: 49,
    reward_type: "points",
    point_value: 0.01,
    reward_rules: [
      { category: "travel", multiplier: 3 },
      { category: "other", multiplier: 2 },
    ],
  },

  // ── PenFed ────────────────────────────────────────────────────────────────
  {
    id: "penfed-power-cash",
    card_name: "Power Cash Rewards Visa",
    issuer: "PenFed",
    network: "Visa",
    annual_fee: 0,
    reward_type: "cashback",
    point_value: 0.01,
    reward_rules: [{ category: "other", multiplier: 2 }],
  },
  {
    id: "penfed-pathfinder",
    card_name: "Pathfinder Rewards Card",
    issuer: "PenFed",
    network: "Visa",
    annual_fee: 95,
    reward_type: "points",
    point_value: 0.01,
    reward_rules: [
      { category: "travel", multiplier: 4 },
      { category: "other", multiplier: 1.5 },
    ],
  },
  {
    id: "penfed-gold-visa",
    card_name: "PenFed Gold Visa",
    issuer: "PenFed",
    network: "Visa",
    annual_fee: 0,
    reward_type: "cashback",
    point_value: 0.01,
    reward_rules: [{ category: "other", multiplier: 1 }],
  },

  // ── FNBO ──────────────────────────────────────────────────────────────────
  {
    id: "fnbo-evergreen",
    card_name: "Evergreen Rewards Visa",
    issuer: "FNBO",
    network: "Visa",
    annual_fee: 0,
    reward_type: "cashback",
    point_value: 0.01,
    reward_rules: [{ category: "other", multiplier: 2 }],
  },
  {
    id: "fnbo-getaway",
    card_name: "Getaway Credit Card",
    issuer: "FNBO",
    network: "Visa",
    annual_fee: 0,
    reward_type: "points",
    point_value: 0.01,
    reward_rules: [
      { category: "travel", multiplier: 3 },
      { category: "hotels", multiplier: 3 },
      { category: "gas", multiplier: 3 },
      { category: "dining", multiplier: 2 },
      { category: "groceries", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },

  // ── Elan Financial ────────────────────────────────────────────────────────
  {
    id: "elan-max-cash",
    card_name: "Max Cash Preferred Card",
    issuer: "Elan Financial",
    network: "Visa",
    annual_fee: 0,
    reward_type: "cashback",
    point_value: 0.01,
    reward_rules: [
      { category: "top-category", multiplier: 5 },
      { category: "everyday", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },
  {
    id: "elan-everyday-rewards",
    card_name: "Everyday Rewards+",
    issuer: "Elan Financial",
    network: "Visa",
    annual_fee: 0,
    reward_type: "points",
    point_value: 0.01,
    reward_rules: [
      { category: "dining", multiplier: 3 },
      { category: "travel", multiplier: 3 },
      { category: "groceries", multiplier: 2 },
      { category: "other", multiplier: 1 },
    ],
  },

  // ── SoFi ──────────────────────────────────────────────────────────────────
  {
    id: "sofi-credit-card",
    card_name: "SoFi Credit Card",
    issuer: "SoFi",
    network: "Mastercard",
    annual_fee: 0,
    reward_type: "cashback",
    point_value: 0.01,
    reward_rules: [
      { category: "sofi-products", multiplier: 3 },
      { category: "other", multiplier: 2 },
    ],
  },
];

// ─── Helper: download a URL to a file path ────────────────────────────────────
function download(url, dest) {
  return new Promise((resolve) => {
    const proto = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(dest);
    proto
      .get(url, { timeout: 8000 }, (res) => {
        if (res.statusCode !== 200) {
          file.close();
          fs.unlink(dest, () => {});
          resolve(false);
          return;
        }
        res.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve(true);
        });
      })
      .on("error", () => {
        file.close();
        fs.unlink(dest, () => {});
        resolve(false);
      });
  });
}

// ─── Real image download attempts ────────────────────────────────────────────
const REAL_IMAGE_ATTEMPTS = [
  // Amex CDN
  { id: "amex-green",           url: "https://icm.aexp-static.com/Internet/Acquisition/US_en/AppContent/OneSite/category/cardarts/green-card.png",                          ext: "png" },
  { id: "amex-everyday",        url: "https://icm.aexp-static.com/Internet/Acquisition/US_en/AppContent/OneSite/category/cardarts/everyday-card.png",                       ext: "png" },
  { id: "amex-everyday-preferred", url: "https://icm.aexp-static.com/Internet/Acquisition/US_en/AppContent/OneSite/category/cardarts/everyday-preferred-card.png",          ext: "png" },
  { id: "hilton-surpass",       url: "https://icm.aexp-static.com/Internet/Acquisition/US_en/AppContent/OneSite/category/cardarts/hilton-surpass-amex-card.png",            ext: "png" },
  { id: "hilton-aspire",        url: "https://icm.aexp-static.com/Internet/Acquisition/US_en/AppContent/OneSite/category/cardarts/hilton-aspire-card.png",                  ext: "png" },
  { id: "delta-platinum-amex",  url: "https://icm.aexp-static.com/Internet/Acquisition/US_en/AppContent/OneSite/category/cardarts/delta-skymiles-platinum-amex-card.png",  ext: "png" },
  { id: "delta-reserve-amex",   url: "https://icm.aexp-static.com/Internet/Acquisition/US_en/AppContent/OneSite/category/cardarts/delta-skymiles-reserve-amex-card.png",   ext: "png" },
  { id: "amex-business-gold",   url: "https://icm.aexp-static.com/Internet/Acquisition/US_en/AppContent/OneSite/category/cardarts/business-gold-card.png",                  ext: "png" },
  // Chase CDN
  { id: "southwest-premier",    url: "https://creditcards.chase.com/content/dam/jpmc-marketplace/card-art/swa_premier_card_New.png",      ext: "png" },
  { id: "southwest-priority",   url: "https://creditcards.chase.com/content/dam/jpmc-marketplace/card-art/swa_priority_card_New.png",     ext: "png" },
  { id: "united-quest",         url: "https://creditcards.chase.com/content/dam/jpmc-marketplace/card-art/united_quest_card.png",         ext: "png" },
  { id: "united-club-infinite", url: "https://creditcards.chase.com/content/dam/jpmc-marketplace/card-art/united_club_infinite_card.png", ext: "png" },
  { id: "world-of-hyatt",       url: "https://creditcards.chase.com/content/dam/jpmc-marketplace/card-art/world_of_hyatt_card.png",       ext: "png" },
  { id: "marriott-bonvoy-boundless", url: "https://creditcards.chase.com/content/dam/jpmc-marketplace/card-art/marriott_bonvoy_boundless_card.png", ext: "png" },
  { id: "marriott-bonvoy-bold", url: "https://creditcards.chase.com/content/dam/jpmc-marketplace/card-art/marriott_bonvoy_bold_card.png", ext: "png" },
  { id: "ink-business-preferred", url: "https://creditcards.chase.com/content/dam/jpmc-marketplace/card-art/ink_business_preferred_card.png", ext: "png" },
  { id: "ink-business-cash",    url: "https://creditcards.chase.com/content/dam/jpmc-marketplace/card-art/ink_business_cash_card.png",    ext: "png" },
  { id: "ink-business-unlimited", url: "https://creditcards.chase.com/content/dam/jpmc-marketplace/card-art/ink_business_unlimited_card.png", ext: "png" },
  { id: "freedom-rise",         url: "https://creditcards.chase.com/content/dam/jpmc-marketplace/card-art/freedom_rise_card.png",         ext: "png" },
  // Capital One CDN
  { id: "capital-one-venture",    url: "https://ecm.capitalone.com/WCM/card/products/venture_cardart_prim_323x203-1.png",    ext: "png" },
  { id: "capital-one-ventureone", url: "https://ecm.capitalone.com/WCM/card/products/ventureone_cardart_prim_323x203.png",  ext: "png" },
  { id: "capital-one-savorone",   url: "https://ecm.capitalone.com/WCM/card/products/savorone-2025-cardart.png",            ext: "png" },
  { id: "capital-one-quicksilverone", url: "https://ecm.capitalone.com/WCM/card/products/quicksilver_one_cardart.png",      ext: "png" },
  // Citi CDN (webp)
  { id: "citi-custom-cash",     url: "https://aemapi.citi.com/content/dam/cfs/uspb/usmkt/cards/en/static/images/citi-custom-cash-credit-card/citi-custom-cash-credit-card_306x192.webp",                                                                                        ext: "webp" },
  { id: "citi-rewards-plus",    url: "https://aemapi.citi.com/content/dam/cfs/uspb/usmkt/cards/en/static/images/citi-rewards-plus-credit-card/citi-rewards-plus-credit-card_306x192.webp",                                                                                      ext: "webp" },
  { id: "citi-aadvantage-platinum", url: "https://aemapi.citi.com/content/dam/cfs/uspb/usmkt/cards/en/static/images/citi-aadvantage-platinum-select-world-elite-mastercard/citi-aadvantage-platinum-select-world-elite-mastercard_306x192.webp",                                ext: "webp" },
  { id: "citi-aadvantage-executive", url: "https://aemapi.citi.com/content/dam/cfs/uspb/usmkt/cards/en/static/images/citi-aadvantage-executive-world-elite-mastercard/citi-aadvantage-executive-world-elite-mastercard_306x192.webp",                                          ext: "webp" },
  // US Bank CDN
  { id: "us-bank-altitude-reserve", url: "https://www.usbank.com/content/dam/usbank/en/images/illustrations/card-art/credit-cards/altitude-reserve-visa-signature-credit-card.png", ext: "png" },
  { id: "us-bank-altitude-connect", url: "https://www.usbank.com/content/dam/usbank/en/images/illustrations/card-art/credit-cards/altitude-connect-visa-signature-credit-card.png", ext: "png" },
  { id: "us-bank-cash-plus",    url: "https://www.usbank.com/content/dam/usbank/en/images/illustrations/card-art/credit-cards/cash-plus-visa-signature-credit-card.png",           ext: "png" },
  { id: "us-bank-shopper-cash", url: "https://www.usbank.com/content/dam/usbank/en/images/illustrations/card-art/credit-cards/shopper-cash-rewards-visa-signature-credit-card.png", ext: "png" },
];

async function main() {
  // ── Step 1: Write SVG placeholders ────────────────────────────────────────
  console.log("\n=== Step 1: Writing SVG placeholders ===");
  for (const card of NEW_CARDS) {
    const svgPath = path.join(CARDS_REAL, `${card.id}.svg`);
    if (!fs.existsSync(svgPath)) {
      fs.writeFileSync(svgPath, makeSvg(card.issuer, card.card_name, card.network));
      console.log(`  SVG written: ${card.id}.svg`);
    } else {
      console.log(`  SVG exists, skip: ${card.id}.svg`);
    }
  }

  // ── Step 2: Write new issuer logos ────────────────────────────────────────
  console.log("\n=== Step 2: Writing new issuer logos ===");
  for (const [issuer, { color, initials, file }] of Object.entries(NEW_ISSUER_LOGOS)) {
    const logoPath = path.join(LOGOS_DIR, file);
    if (!fs.existsSync(logoPath)) {
      fs.writeFileSync(logoPath, makeLogoSvg(issuer, color, initials));
      console.log(`  Logo written: ${file}`);
    } else {
      console.log(`  Logo exists, skip: ${file}`);
    }
  }

  // ── Step 3: Attempt to download real images ───────────────────────────────
  console.log("\n=== Step 3: Downloading real card images ===");
  const successfulDownloads = {};
  for (const attempt of REAL_IMAGE_ATTEMPTS) {
    const destPath = path.join(CARDS_REAL, `${attempt.id}.${attempt.ext}`);
    process.stdout.write(`  Trying ${attempt.id}... `);
    const ok = await download(attempt.url, destPath);
    if (ok) {
      console.log(`downloaded (${attempt.ext})`);
      successfulDownloads[attempt.id] = `.${attempt.ext}`;
    } else {
      console.log("failed – SVG placeholder remains");
    }
  }

  // ── Step 4: Update cardsCatalog.json ─────────────────────────────────────
  console.log("\n=== Step 4: Updating cardsCatalog.json ===");
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  const existingIds = new Set(catalog.map((c) => c.id));

  let added = 0;
  for (const card of NEW_CARDS) {
    if (existingIds.has(card.id)) {
      console.log(`  Skip (exists): ${card.id}`);
      continue;
    }
    // Determine image path: real download wins, else svg placeholder
    let imagePath;
    if (successfulDownloads[card.id]) {
      imagePath = `/cards-real/${card.id}${successfulDownloads[card.id]}`;
    } else {
      imagePath = `/cards-real/${card.id}.svg`;
    }
    catalog.push({ id: card.id, issuer: card.issuer, card_name: card.card_name, network: card.network, annual_fee: card.annual_fee, reward_type: card.reward_type, point_value: card.point_value, image: imagePath, reward_rules: card.reward_rules });
    added++;
    console.log(`  Added: ${card.id}`);
  }
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2));
  console.log(`\nCatalog updated: ${added} new cards added, total ${catalog.length} cards.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
