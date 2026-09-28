export type Airport = { iata: string; city: string; country: string };

// Provider-agnostic flight record. Everything outside lib/flights.ts uses this.
export type FlightArrival = {
  flightNumber: string;
  date: string;
  origin: Airport;
  destination: Airport;
  scheduledArrivalUtc: string;
  actualArrivalUtc: string | null;
  delayMinutes: number | null;
  status: string;
  airline: string;
};

export type CheckResult =
  | { eligible: true; flight: FlightArrival }
  | { eligible: false; reason: string; flight?: FlightArrival };

export type FeeModel = "success" | "monthly";
export type Payout = "cash" | "credit";

export type ClaimDetails = {
  confirmationCode: string;
  names: string[];
  tickets: string[];
  payout: Payout | "";
  email: string;
};

export type StripeSetup = {
  clientSecret: string;
  customerId: string;
  claimId: string;
};

export type StripeResult = {
  customerId: string;
  paymentMethodId: string;
  setupIntentId: string;
};

// Body of POST /api/submit.
export type SubmitPayload = {
  claimId: string;
  flight: FlightArrival;
  passengers: number;
  details: ClaimDetails;
  feeModel: FeeModel;
  fairAmount: number;
  stripe: StripeResult;
  permission: boolean;
};
