// US airlines that sell domestic flights under their own flight numbers. Regional partners
// (American Eagle, Delta Connection, United Express) fly under these same codes, so a ticket
// always shows one of them.
export const AIRLINES = [
  { code: "AS", name: "Alaska Airlines" },
  { code: "G4", name: "Allegiant Air" },
  { code: "AA", name: "American Airlines" },
  { code: "XP", name: "Avelo Airlines" },
  { code: "MX", name: "Breeze Airways" },
  { code: "DL", name: "Delta Air Lines" },
  { code: "F9", name: "Frontier Airlines" },
  { code: "HA", name: "Hawaiian Airlines" },
  { code: "B6", name: "JetBlue" },
  { code: "WN", name: "Southwest Airlines" },
  { code: "NK", name: "Spirit Airlines" },
  { code: "SY", name: "Sun Country Airlines" },
  { code: "UA", name: "United Airlines" },
] as const;

export const airlineByCode = (code: string) => AIRLINES.find((a) => a.code === code);
