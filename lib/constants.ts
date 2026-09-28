export const AMOUNT_PER_PASSENGER = 250;
export const OFFER_PCT = 10;
export const MIN_DELAY_MINUTES = 180;
export const MAX_PASSENGERS = 9;
export const MAX_FAIR_AMOUNT = 50;

export const owedFor = (passengers: number) => passengers * AMOUNT_PER_PASSENGER;
export const feeFor = (passengers: number) => (owedFor(passengers) * OFFER_PCT) / 100;
