# Development Plan — Letters You Can’t Send (Valentine Edition)

## 1. Objectives
- Deliver a ritual-style Valentine web experience that generates a single, deeply personal letter using **GPT‑4.1** after a confirmed **$6.99** “payment-confirmed” gate.
- Ship the entire UX end-to-end with **mock/simulated payment confirmation** so emotional flow, delivery formats, and letter quality can be validated before connecting real payments.
- Keep the payment layer **isolated and swappable** so moving from mock → **real Dodo Payments** is a one-step change (no rewiring letter logic).
- Provide 3 delivery formats (Sealed Page, Timed Reveal, Unsent Letter), no accounts, and privacy-forward storage (encrypted at rest + expiry behavior).
- Maintain the intended atmosphere (burgundy/rose/parchment, paper texture, envelope opening ritual, handwritten/serif letter rendering) + optional ambient music toggle (off by default; no aggressive autoplay).

**Progress / What’s known and decided**
- ✅ Model choice locked: **GPT‑4.1** (quality-first).
- ✅ Price locked: **$6.99**.
- ✅ Music: ambient instrumental toggle implemented; off by default; user-initiated playback.
- ✅ Payments provider later: **Dodo Payments**, credentials + webhook config will be provided after UX validation.
- ✅ Integration playbooks captured for GPT‑4.1 + Dodo Payments.

**Current status (as of now)**
- ✅ **Phase 1 complete:** GPT‑4.1 letter generation POC passed (**4/4**) with excellent emotional quality.
- ✅ **Phase 2 complete:** Full app built and tested end-to-end:
  - Landing → Context → Inputs → Delivery → Payment (mock) → Generating → Complete → Letter View
  - All three delivery formats implemented: **sealed / timed / unsent**
  - Sealed envelope includes wax-seal open interaction + reveal
  - Timed reveal includes countdown lock/unlock
  - Unsent letter includes fade/closure ritual
- ✅ Testing agent results: **Backend 82%**, **Frontend 85%**, **Integration 90%**
- ✅ Minor UI stability issues fixed (payment button re-render instability)
- ✅ `data-testid` coverage in place for key flow elements

---

## 2. Implementation Steps

### Phase 1 — Core POC (Focus: GPT‑4.1 letter quality + generation contract)
**Goal:** Prove the *real core* (letter generation quality and constraints).

**Completed**
- ✅ Implemented GPT‑4.1 letter generation POC with the emotional writing system prompt.
- ✅ Validated output across the 4 primary contexts and tones (matrix sampling):
  - Output feels handwritten/intimate
  - No AI meta language
  - Strong emotional inference + restraint
  - Natural paragraphing
  - Typical length falls in the intended band (≈700–900 words)

**Phase 1 user stories (completed)**
1. ✅ As a user, I receive a letter that feels human—rhythm, inference, restraint.
2. ✅ As a user, the letter matches the tone I chose without sounding templated.
3. ✅ As a builder, I can reliably generate high-quality letters with deterministic constraints.

---

### Phase 2 — V1 App Development (React + FastAPI + Mongo) with **Mock Payments**
**Goal:** Build the full emotional UX end-to-end with payment gating via a simulated confirmation state, while keeping payments modular for later Dodo swap.

#### Payment architecture (critical)
**Implemented (mock now, Dodo later)**
- ✅ Letter generation is **server-gated** behind `payment_confirmed = true`.
- ✅ Mock payment confirmation endpoint exists and triggers generation only after confirmation.
- ✅ Dodo webhook endpoint path reserved (`/api/webhooks/dodo`) as a placeholder for Phase 3.
- ✅ No Dodo credentials hardcoded.

> **Note:** The codebase currently uses a backend “mock provider” flow rather than a dedicated `/lib/payments/dodo.ts` module; this is still swappable, but Phase 3 will formalize the provider interface + provider isolation where needed.

#### Frontend (React)
**Implemented**
- ✅ Landing page with:
  - Headline/subheadline/CTA
  - Valentine urgency banner
  - Privacy-forward messaging
- ✅ Guided wizard flow:
  - Step 1: context selection (4 options)
  - Step 2: emotional inputs (6 fields) + tone selector (4 options)
  - Step 3: delivery format selection (sealed / timed / unsent)
    - Timed reveal shows date/time inputs
  - Step 4: mocked premium checkout screen with $6.99 pricing
- ✅ Ritual generation screen:
  - Rotating ritual messages + progress
  - Polling order status until `letter_ready`
- ✅ Completion screen:
  - Displays private letter link
  - Copy link + Open letter actions
- ✅ Letter views:
  - Sealed: envelope + wax seal → open → letter surface
  - Timed: locked countdown → unlock → letter
  - Unsent: read → fade → closure message
- ✅ Ambient music toggle:
  - Off by default
  - User gesture required to play
  - Gentle fade-in/out

#### Backend (FastAPI)
**Implemented**
- ✅ Core endpoints:
  - `POST /api/orders` create order
  - `POST /api/orders/{id}/pay/mock-success` confirm payment (mock) and trigger generation
  - `GET /api/orders/{id}` status polling
  - `GET /api/letters/{token}` fetch letter (with delivery rules)
  - `POST /api/letters/{token}/open` mark open (enforces behaviors)
  - `POST /api/webhooks/dodo` placeholder endpoint for Phase 3
- ✅ Storage approach:
  - MongoDB collections: `orders`, `payments`, `letters`
  - Letter content encrypted at rest (Fernet)
  - Expiry behavior applied (logical expiry checks + expiry timestamps)

**Delivery rules (enforced server-side)**
- ✅ Sealed:
  - Can be opened; “opened” is recorded.
  - Content remains accessible in current implementation (keepsake link behavior).
- ✅ Timed:
  - Content locked until `reveal_at`.
  - Expires 24h after opening (expiry set on open).
- ✅ Unsent:
  - Read once behavior.
  - On open, expiry shortened (30-minute grace) and subsequent reads return closure message.

**Phase 2 user stories (completed)**
1. ✅ Calm flow that doesn’t feel like a form.
2. ✅ “Unlock” step feels premium even while mocked.
3. ✅ Timed reveal experience works (date/time gate + countdown).
4. ✅ Sealed envelope experience feels like a ritual.
5. ✅ Link behaviors match delivery format.

**Conclude Phase 2 (completed)**
- ✅ End-to-end testing executed (manual + testing agent).
- ✅ Minor UI stability fixes applied.

---

### Phase 3 — Swap Mock Payments → Real Dodo Payments (ready when credentials provided)
**Goal:** Replace mock provider with Dodo Payments with minimal code changes due to the isolated gate (`payment_confirmed`).

#### What will change
- Add environment variables (no hardcoding):
  - `DODO_PAYMENTS_API_KEY`
  - `DODO_PAYMENTS_WEBHOOK_KEY`
  - `DODO_PAYMENTS_PRODUCT_ID`
  - `DODO_PAYMENTS_ENVIRONMENT` (test/live)
  - `APP_BASE_URL`
- Implement Dodo payment flow:
  - Checkout session creation for the $6.99 product
  - Redirect to Dodo hosted checkout (preferred) and return URL handling
  - Webhook verification + processing at `{APP_BASE_URL}/api/webhooks/dodo`
  - On `payment.succeeded`: set `payment_confirmed=true` and trigger generation pipeline
- Idempotency + safety:
  - Dedupe webhook events by event id
  - Prevent double-generation and token duplication

#### Phase 3 user stories
1. As a user, I can pay via Dodo and reliably receive my letter link.
2. As a builder, letters are generated **only** after verified `payment.succeeded`.
3. As a builder, swapping mock → Dodo requires changes only in the payment modules/handlers.

---

### Phase 4 — Hardening + UX polish (production-friendly MVP)
**Goal:** Improve reliability, privacy correctness, and emotional polish before a real paid launch.

- Reliability:
  - Add strict order state machine transitions
  - Add retries / fallback for GPT errors
  - Consider a background job queue if generation timeouts become an issue
- Content quality:
  - Add post-processing + guardrails for length and formatting consistency
  - Add a small safety pass to avoid therapy/advice framing
- Privacy + expiry correctness:
  - Formalize TTL indexing / scheduled cleanup jobs (Mongo TTL index requires actual Date types)
  - Align UI privacy copy precisely with storage + expiry behavior
- UX polish:
  - Reduced-motion fallbacks for envelope and fade
  - Improve “sealed” semantics if true single-open is desired (currently keepsake)
  - Add more refined ritual loading copy and microinteractions
- Observability:
  - Structured logs for order/payment/generation
  - Admin-only debug endpoint gated by env secret

**Phase 4 user stories**
1. As a user, I never get charged without receiving my letter.
2. As a user, if generation fails, I can retry without losing the ritual.
3. As a user, letters never read as generic or “assistant-like.”
4. As a user, sealed/timed/unsent rules behave consistently across devices.
5. As a builder, I can trace any order from payment → confirmation → generation in logs.

---

## 3. Next Actions
1. Collect user feedback on:
   - Letter quality across contexts/tones
   - Sealed envelope feel + animation pacing
   - Timed reveal copy + clarity around timezone
   - Unsent fade: timing, closure message, and whether “Let go” is the right moment
2. Decide the exact semantics for “Sealed open once” (true single-use vs keepsake link) and align backend + copy.
3. When you provide Dodo credentials + mode + webhook URL, execute Phase 3:
   - Implement checkout session creation + webhook verification
   - Remove/disable mock success endpoint outside dev
4. Production readiness pass (Phase 4): tighten expiry, state machine, observability.

## 4. Success Criteria
- ✅ Core (met): GPT‑4.1 consistently produces emotionally nuanced letters with restraint and tone adherence.
- ✅ Gating (met in mock): No letter generation unless `payment_confirmed=true` (server-side enforced).
- ✅ UX (met): Flow feels like a ritual; landing and letter views match atmosphere; music toggle is off by default.
- ✅ Delivery formats (met): sealed / timed / unsent experiences implemented.
- ⏳ Privacy hardening (next): expiry + cleanup must be formally enforced (TTL index or scheduled deletion) and copy must match behavior.
- ⏳ Payments (next): Dodo swap requires changes only within the payment integration surface; 10/10 successful sandbox runs once credentials are added.
