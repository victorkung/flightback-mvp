# Flightback MVP

Flightback helps travelers whose US domestic flight reached its final destination 3 or more hours late claim the $250 per passenger the airline owes them (a fictional rule for this case study). This beta checks a flight, shows what the traveler is likely owed, collects claim details, asks what fee feels fair, and saves a card for a 10% success fee. Nothing is filed automatically and no card is charged. The one thing it tests: will delayed travelers pay us to file? A saved card is the signal.

**Live:** https://flightback-mvp.vercel.app

The site runs in Stripe test mode only. Use card 4242 4242 4242 4242, any future date, any CVC.

## How it works

| Path | Step |
|---|---|
| `/` | Landing |
| `/flight` | Add your flight |
| `/result` | Eligible or not, passenger count |
| `/details` | Confirmation code, names, tickets, payout, email |
| `/fee` | Fee model |
| `/fair` | Fair amount |
| `/offer` | Our offer, 10% success fee |
| `/card` | Save a card (Stripe SetupIntent, never charged) |
| `/done` | Confirmation with claim ID |

Flow state lives in React context mirrored to `sessionStorage`, so a refresh keeps progress.

API routes:

- `POST /api/check-flight` looks up the flight through `lib/flights.ts` and applies the rules in `lib/eligibility.ts`. Results are cached in memory per flight number and date.
- `POST /api/setup-intent` creates a Stripe Customer (with `claimId` and email in metadata) and a SetupIntent.
- `POST /api/submit` validates everything again, confirms with Stripe that the SetupIntent succeeded for this claim, then appends one row to Google Sheets. No card data is ever sent to our server or the sheet.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev
```

### 1. AeroDataBox (flight data)

1. Create a RapidAPI account and subscribe to [AeroDataBox](https://rapidapi.com/aedbx-aedbx/api/aerodatabox). The Basic plan is free (about 300 lookups a month).
2. Copy your RapidAPI key into `AERODATABOX_API_KEY`. Leave `AERODATABOX_HOST` as `aerodatabox.p.rapidapi.com`.

Set `LOG_FLIGHT_RAW=1` to log raw provider responses while debugging.

### 2. Stripe (test mode)

1. In the Stripe dashboard, switch to test mode and open Developers > API keys.
2. Set `STRIPE_SECRET_KEY` (`sk_test_...`) and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (`pk_test_...`).

The server refuses to run the Stripe routes unless the secret key starts with `sk_test_`, and the card page ignores any publishable key that is not `pk_test_`.

### 3. Google Sheets

1. Create a Google Sheet with a tab named `Claims`.
2. Paste this header row into row 1:

   ```
   submitted_at_utc	claim_id	email	flight_number	flight_date	route	scheduled_arrival_utc	actual_arrival_utc	delay_minutes	passenger_count	amount_owed_usd	passenger_names	ticket_numbers	confirmation_code	payout_preference	fee_model_chosen	fair_amount	offer_accepted_pct	stripe_customer_id	stripe_payment_method_id	stripe_setup_intent_id	permission_confirmed
   ```

   Tip: format the `ticket_numbers` column as plain text so leading zeros stay.
3. Open Extensions > Apps Script, replace the code with the script below, and set `SECRET` to a random string.
4. Deploy > New deployment > type Web app. Execute as: Me. Who has access: Anyone. Authorize it.
5. Copy the web app URL into `SHEETS_WEBHOOK_URL`, and the same secret into `SHEETS_WEBHOOK_SECRET`.

```js
const SECRET = 'PASTE_THE_SAME_SECRET_HERE';
function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  if (body.secret !== SECRET) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false }));
  }
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Claims');
  sheet.appendRow(body.row);
  return ContentService.createTextOutput(JSON.stringify({ ok: true }));
}
```

If you edit the script later, deploy a new version (Deploy > Manage deployments > Edit > New version) or the URL keeps running the old code.

If a sheet write fails, the traveler still sees the confirmation and the full row is written to the server log for manual entry.

### 4. Vercel

Import the GitHub repo in Vercel and add these environment variables for Production (and Preview if you use it):

`AERODATABOX_API_KEY`, `AERODATABOX_HOST`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `SHEETS_WEBHOOK_URL`, `SHEETS_WEBHOOK_SECRET`

Redeploy after changing `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, since it is built into the client bundle.

## Production notes

- Flight data would move to FlightAware AeroAPI. Only `lib/flights.ts` changes: it exposes one function, `getFlightArrival(flightNumber, date)`, that returns a provider-neutral object, and nothing else in the app knows which provider is used.
- The in-memory flight cache is per server instance. A shared cache would save lookups at scale.
