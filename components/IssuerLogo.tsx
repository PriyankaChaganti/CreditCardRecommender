const ISSUER_LOGOS: Record<string, string> = {
  "Chase": "/logos/chase.svg",
  "American Express": "/logos/amex.svg",
  "Citi": "/logos/citi.png",
  "Capital One": "/logos/capital-one.png",
  "Wells Fargo": "/logos/wells-fargo.svg",
  "Bank of America": "/logos/bofa.svg",
  "Bilt Rewards": "/logos/bilt.png",
  "Discover": "/logos/discover.svg",
  "Goldman Sachs": "/logos/goldman-sachs.svg",
  "Barclays": "/logos/barclays.svg",
  "Bread Financial": "/logos/bread-financial.svg",
  "Synchrony": "/logos/synchrony.svg",
  "TD Bank": "/logos/td-bank.svg",
  "PNC Bank": "/logos/pnc-bank.svg",
  "Navy Federal": "/logos/navy-federal.svg",
  "PenFed": "/logos/penfed.svg",
  "FNBO": "/logos/fnbo.svg",
  "Elan Financial": "/logos/elan.svg",
  "SoFi": "/logos/sofi.svg",
};

const ISSUER_COLORS: Record<string, string> = {
  "Chase": "#117ACA",
  "American Express": "#2E77BC",
  "Citi": "#003b70",
  "Capital One": "#004977",
  "Wells Fargo": "#D71E28",
  "Bank of America": "#012169",
  "US Bank": "#2c2c80",
  "Bilt Rewards": "#0a0f2c",
  "Discover": "#FF6000",
  "Goldman Sachs": "#7399C6",
  "Barclays": "#00aeef",
  "Bread Financial": "#e63329",
  "Synchrony": "#00539b",
  "TD Bank": "#2d8c3e",
  "PNC Bank": "#e57200",
  "Navy Federal": "#003087",
  "PenFed": "#1a2f6e",
  "FNBO": "#1d4f8c",
  "Elan Financial": "#1f4f8f",
  "SoFi": "#4b38ef",
};

export function IssuerLogo({ issuer, size = 28 }: { issuer: string; size?: number }) {
  const logoSrc = ISSUER_LOGOS[issuer];
  const color = ISSUER_COLORS[issuer] ?? "#3f3f46";
  const initials = issuer
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (logoSrc) {
    return (
      <img
        src={logoSrc}
        alt={`${issuer} logo`}
        width={size}
        height={size}
        className="shrink-0 object-contain"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{
        width: size,
        height: size,
        background: color,
        fontSize: Math.round(size * 0.38),
      }}
    >
      {initials}
    </span>
  );
}
