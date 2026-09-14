# SatyaBid — Frontend

AI Integrated Bid Compliance Verification Platform for GeM Procurement.
Smart India Hackathon 2026 · Problem Statement **26100**.

This package is **frontend only**. It expects your existing Flask backend to
be running at `http://127.0.0.1:8000` with the `X-API-KEY: SIH2026` header.
No backend code, database, or fake API responses are included.

## 1. Setup

```bash
cd satyabid-frontend
npm install
cp .env.example .env      # adjust if your backend runs elsewhere
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

Start your Flask backend separately (`python app.py` or however your
project runs it) so it's listening on `http://127.0.0.1:8000` before you
open the app — the sidebar/topbar health indicator and `System Health`
page will tell you whether the frontend can see it.

## 2. What's included

- **Landing page** (`/`) — public marketing page, original SatyaBid brand
  mark (an independent wheel-and-arc motif, not a copy of any government
  emblem or the GeM logo), workflow explainer, verification-source list.
- **App shell** (`/app/*`) — sidebar navigation, backend-health topbar
  indicator, multilingual toggle (English / Hindi), demo-mode banner.
- **Dashboard** — vendor/tender counts pulled live from the backend;
  anything the backend doesn't yet expose (e.g. average compliance score
  across all bids) is shown as "—", never invented.
- **Bid Verification** — the core workflow: pick one of the six sample
  bids or upload a PDF → review/edit extracted fields → call
  `POST /verify-compliance` → render the real response (score, risk,
  checks table, AI explanation) exactly as the backend returns it.
- **Vendors** / **Tenders** — list + detail views over
  `GET /vendors` and `GET /tender-requirements`.
- **Documents** — the six sample bid PDFs named for the demo.
- **Human Review**, **Reports**, **Audit Trail**, **Auditor** — built from
  a small client-side session store that only ever holds real
  `/verify-compliance` responses from this browser session (see
  `src/services/sessionStore.ts`). These are clearly marked as
  prototype/session-scoped views, not a shared backend-backed history.
- **Vendor Portal** — a simplified, clearly-labelled prototype-only
  bidder view (stage tracker + upload placeholders).
- **System Health** — calls `GET /health` and shows the raw response.
- **Offline easter egg** — when `navigator.onLine` goes false (real
  internet loss, not backend downtime), a full-screen "Connection lost"
  overlay appears with an original lane-dodging car game
  (`src/components/offline/CarGame.tsx`), drawn entirely on `<canvas>`
  with no external assets, sound, or copied game code.
- **Multilingual** — English and Hindi strings in `src/i18n/`, toggled
  from the topbar and persisted to `localStorage`.

## 3. API endpoints used

| Endpoint | Used by |
|---|---|
| `GET /health` | Topbar indicator, System Health page |
| `GET /vendors` | Dashboard, Vendors page |
| `GET /tender-requirements` | Dashboard, Tenders page |
| `POST /verify-compliance` | Bid Verification page (the core call) |

The client (`src/services/api/apiClient.ts`) also exposes typed wrappers
for every other documented endpoint (`/vendor/:id`, `/lookup/:id`,
`/pre-verify/:gstin`, `/verify-bid`, `/verify-tender`, `/gst/:gstin`,
`/pan/:pan`, `/cin/:cin`, `/udyam/:id`, `/startup/:id`, `/nsic/:id`,
`/epfo/:id`, `/esic/:id`, `/digilocker/:id`, `/make-in-india/:id`,
`/certifications/:id`, `/debarment/:id`, `/oem/:gstin`,
`/openapi.json`) so wiring up further pages is a matter of calling an
existing client method, not writing new fetch logic.

## 4. Backend changes required (not built into this frontend)

The prompt was explicit that no backend code should be created or
modified here. These are the gaps found while building the UI — flagged
rather than worked around with fake data:

1. **Document extraction endpoint.** There's no documented route that
   runs `services/ai/extractor.py` against an uploaded or sample PDF and
   returns extracted fields. The Bid Verification page currently lets the
   officer enter/edit fields by hand before calling `/verify-compliance`.
2. **Sample-bid file serving.** No endpoint lists or streams the PDFs in
   `dummy_dataset/sample_bids/`, so the Documents page can only name them.
3. **Dashboard aggregate stats.** No endpoint returns bid-level
   aggregates (verified-bid count, pending-review count, average
   compliance score, risk distribution over time).
4. **Persisted audit trail.** No endpoint exposes `audit/audit_logger.py`
   records, so Audit Trail is currently session-scoped in the browser
   rather than shared across users.
5. **Human Review actions.** No endpoint to persist approve / reject /
   request-clarification decisions.
6. **Vendor document upload.** No endpoint to receive bidder-uploaded
   documents from the Vendor Portal view.

## 5. Project structure

```
src/
  components/
    common/       shared UI primitives (Card, StatusBadge, Button, ...)
    layout/       Sidebar, Topbar, AppShell
    offline/      OfflineScreen + CarGame
  hooks/          useApi, useBackendHealth, useOnlineStatus
  i18n/           translations + I18nProvider
  pages/          one file per route
  services/
    api/          apiClient.ts (all backend calls go through here)
    sessionStore.ts
  types/          shared TypeScript types for API responses
```

## 6. Testing the app

1. Start the Flask backend on port 8000.
2. `npm run dev` and open the frontend.
3. Confirm the topbar shows **Backend Connected**.
4. Go to **Bid Verification**, pick a sample bid, adjust fields if you
   like, and run the verification — you should see the real backend
   response rendered in the result screen.
5. Check **Human Review**, **Reports**, and **Audit Trail** — the case
   you just ran should now appear there.
6. Turn off Wi-Fi/network to see the offline screen and the car game;
   turn it back on to return automatically to the app.
7. Toggle EN/हिं in the topbar to see the multilingual strings.
