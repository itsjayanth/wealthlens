# WealthLens — Product Requirements Document
**Repo:** wealthlens
**Version:** 1.0 (Draft)
**Date:** September 2026
---
## 1. Overview
WealthLens is a client-facing web/app platform built for an independent wealth management consultant who currently manages client portfolios through Sharekhan (Mirae Asset Sharekhan). Each client logs into WealthLens, securely links their own Sharekhan trading account, and the platform combines live market data with the advisor's proprietary investment strategy through an **intelligence layer** that generates Buy / Sell / Hold recommendations for the client's holdings and watchlist.
**Key design decision:** Recommendations are advisory by default — a client or the advisor must approve a recommendation before any trade executes. Full auto-execution is a later phase, gated on compliance review.
---
## 2. Problem Statement
The advisor currently manages multiple clients' portfolios manually — tracking market movement, applying his own strategy, and communicating buy/sell decisions individually (calls, messages, or manual trades on Sharekhan). This doesn't scale, is slow to react to market changes, and leaves no structured audit trail of *why* a recommendation was made.
WealthLens turns the advisor's strategy into a repeatable, semi-automated decision engine that clients can act on directly, while giving the advisor a single console to manage all clients at once.
---
## 3. Goals
- Give each client a live view of their Sharekhan portfolio inside one dashboard.
- Turn the advisor's strategy into structured, explainable buy/sell/hold signals.
- Reduce the advisor's manual per-client decision workload.
- Create an auditable record of every recommendation and every action taken on it.
- Build toward (but not start with) automated trade execution.
---
## 4. Users & Personas
| Role | Description | Key Needs |
|---|---|---|
| **Client (Investor)** | Advisor's end customer, holds a Sharekhan account | See portfolio, get clear recommendations, approve/reject trades easily |
| **Advisor (Consultant)** | Owns the strategy, manages all clients | Define/update strategy rules, monitor all clients, override signals |
| **Admin** *(optional, later phase)* | Manages onboarding & compliance | Client onboarding, audit log access, support |
---
## 5. Core User Flow
1. Client signs up on WealthLens → completes KYC-lite onboarding.
2. Client links their Sharekhan account (API Key + Secure Key / OAuth-style flow).
3. WealthLens pulls: holdings, live prices, historical data via Sharekhan API.
4. The intelligence layer scores each holding + watchlist stock against the advisor's active strategy rules.
5. Client sees a recommendation feed: **Buy / Sell / Hold** with a plain-language reason and confidence score.
6. Client approves or rejects → approved orders are routed to Sharekhan via API.
7. Every recommendation + client action is logged for audit/compliance.
---
## 6. Feature List
### 6.1 Client-Facing
- Secure sign-up / login (email + OTP or password + 2FA)
- Sharekhan account linking (per-client API key/secure key storage, encrypted)
- Portfolio dashboard: holdings, current value, P&L, allocation breakdown
- Live market data: prices, index movement, basic charts
- Recommendation feed: ticker, action (Buy/Sell/Hold), confidence, plain-language reason, timestamp
- One-tap approve/reject on each recommendation
- Trade confirmation + status (pending / executed / failed)
- Notifications (push/email/SMS) when a new recommendation appears
- Basic portfolio performance vs. benchmark view
### 6.2 Advisor-Facing (Console)
- Strategy rule builder (start rule-based: e.g. moving average crossovers, RSI thresholds, sector exposure limits)
- Multi-client dashboard — see all clients' portfolios and pending recommendations at a glance
- Manual override — advisor can edit/cancel a system-generated recommendation before it reaches the client
- Client management (add/remove/pause a client's linked account)
- Performance reporting across all managed clients
### 6.3 Platform / System
- Sharekhan API integration layer (data fetch + order placement)
- Intelligence/recommendation engine (rule-based v1)
- Audit log (immutable record: recommendation generated → client action → order outcome)
- Role-based access control (client vs. advisor vs. admin)
- Secure credential storage (Sharekhan API Key/Secure Key encrypted at rest)
---
## 7. Intelligence Layer (v1 — Rule-Based)
**Inputs:**
- Live price + historical data (via Sharekhan API)
- Client's current holdings and risk profile
- Advisor-defined strategy rules (e.g. technical indicator thresholds, sector caps, stop-loss/target rules)
**Logic:**
- A rules engine evaluates each holding/watchlist symbol against active rules
- Each rule contributes to a composite score → mapped to Buy / Sell / Hold
- Output includes a short, human-readable rationale (e.g. "RSI below 30, oversold signal + within advisor's target sector allocation")
**Output object (example):**
```
{
  "ticker": "TCS",
  "action": "BUY",
  "confidence": 0.78,
  "reason": "Price crossed above 50-day MA; sector allocation within target range",
  "timestamp": "2026-09-07T10:15:00Z"
}
```
**Future (Phase 4+):** layer in ML-based scoring once enough historical recommendation-outcome data is collected; keep rule-based logic as an explainable fallback/baseline.
---
## 8. Sharekhan API Integration Notes
- Sharekhan (Mirae Asset Sharekhan) provides a free Trading API with SDKs in Python, Java, JavaScript, Go, .NET, R, and PHP.
- Each **client** needs their own API Key + Secure Key — this is per-account, not a single shared key for all of the advisor's clients. WealthLens must store and refresh tokens per linked client account.
- Live price streaming is available across all segments.
- Historical data: EOD data since inception; intraday data for the last 7 days only.
- **Important limitation:** historical data via API is *not* adjusted for corporate actions (splits, bonuses, dividends) — WealthLens must handle this adjustment itself if doing longer-term technical analysis.
- Order types currently supported: Intraday and Delivery (others subject to segment/exchange/risk policy availability) — confirm F&O order support before committing to full-strategy coverage.
- Rate limits: up to 30 order requests/second, up to 1000 symbols per connection.
- No subscription fee for API access; must be an active Sharekhan customer.
---
## 9. Compliance Considerations (flag for advisor, not legal advice)
- Providing personalized buy/sell recommendations for a fee typically falls under SEBI's Investment Adviser (IA) or Research Analyst (RA) regulations in India — advisor should confirm his registration covers app-based delivery of recommendations.
- Auto-execution of trades on a client's behalf (Phase 4) may require additional authorization, closer to PMS-style registration — do not build this without legal sign-off.
- All recommendations and client actions must be logged (audit trail) in case of future disputes or regulatory review.
---
## 10. Non-Functional Requirements
- **Security:** encrypted storage of all Sharekhan credentials/tokens; encrypted data in transit (TLS); role-based access control.
- **Reliability:** graceful handling of Sharekhan API downtime/rate limits; queued retries for order placement.
- **Scalability:** architecture should support many clients per advisor without re-architecture (multi-tenant data model from day one).
- **Auditability:** every recommendation, override, and trade action is immutably logged with timestamps.
- **Performance:** portfolio dashboard should load holdings/prices within a few seconds of login.
---
## 11. Suggested Tech Stack
| Layer | Choice |
|---|---|
| Frontend (web) | React / Next.js |
| Mobile (later) | React Native |
| Backend | Node.js (or Python/FastAPI) |
| Database | PostgreSQL |
| Auth | JWT/session-based, 2FA for client login |
| Broker Integration | Sharekhan REST API (Python or Node SDK) |
| Hosting | Vercel / Railway / AWS |
| Notifications | Firebase Cloud Messaging / email (SendGrid) / SMS gateway |
---
## 12. Roadmap — Phased Delivery
### Phase 1 — MVP ("Skateboard")
**Goal:** prove the core loop works end-to-end, read-only + manual approval.
- Client login + Sharekhan account linking
- Read-only portfolio dashboard (holdings, live prices, P&L)
- Rule-based recommendation engine (v1, small rule set)
- Recommendation feed with approve/reject (approval triggers manual trade by client on Sharekhan directly, OR routed via API if ready)
- Basic audit log
### Phase 2 — Advisor Console
- Strategy rule builder for the advisor
- Multi-client dashboard for the advisor
- Manual override of system-generated recommendations
- Notifications (push/email) for new recommendations
### Phase 3 — Trade Execution via API
- Approved recommendations placed directly as orders via Sharekhan API
- Order status tracking (pending/executed/failed)
- Expanded rule set + sector/risk-based constraints
### Phase 4 — Auto-Execution & ML (compliance-gated)
- Optional full auto-execution for pre-approved rule sets (only after compliance/legal clearance)
- ML-based scoring layered on top of the rule-based baseline
- Performance analytics across all clients (recommendation accuracy tracking)
---
## 13. Success Metrics
- % of recommendations acted upon by clients
- Client engagement (daily/weekly active logins)
- Portfolio performance vs. benchmark, per client
- Time saved for the advisor per client per week
- Recommendation accuracy over time (once enough data exists)
---
## 14. Open Questions / Risks
- Confirm advisor's current SEBI registration covers app-delivered personalized recommendations.
- Confirm F&O and other order-type support on the Sharekhan API before committing strategy logic that depends on them.
- Decide Phase 1 execution model: fully manual (client trades on Sharekhan app themselves after seeing recommendation) vs. API-routed order placement from day one.
- Corporate-action adjustment for historical data needs a plan before any serious technical-analysis logic is built.
