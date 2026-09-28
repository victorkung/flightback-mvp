export type Airport = { iata: string; city: string; country: string };

// Provider-agnostic flight record for one trip under a flight number: a single leg, or a run
// of legs flown as one through flight. Everything outside lib/flights.ts uses this.
export type FlightArrival = {
  flightNumber: string;
  date: string;
  /** Origin and destination airports, as "MCI-ORD". Identifies this trip among others that day. */
  route: string;
  origin: Airport;
  destination: Airport;
  /** Stops in between, for a through flight. */
  via: Airport[];
  scheduledDepartureUtc: string | null;
  scheduledArrivalUtc: string | null;
  actualArrivalUtc: string | null;
  delayMinutes: number | null;
  status: string;
  airline: string;
};

export type RouteOption = Pick<FlightArrival, "route" | "origin" | "destination" | "via" | "scheduledDepartureUtc">;

export type CheckResult =
  | { eligible: true; flight: FlightArrival }
  | { eligible: false; reason: string; flight?: FlightArrival };

/** What POST /api/check-flight returns. chooseRoute means the flight number made more than one
 * trip that day; the traveler picks theirs and we check it again with that route. */
export type CheckResponse = CheckResult | { chooseRoute: true; options: RouteOption[] };

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
