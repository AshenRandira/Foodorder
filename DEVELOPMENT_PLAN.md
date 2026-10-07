# Plate & Pantry — Remaining Development Plan

Last updated: 2026-10-08

Active development branch: `dev`

Stable branch: `main`

Repository: <https://github.com/AshenRandira/Foodorder>

## 1. Purpose

This document records what is already complete, what still must be developed, what requires an external account or owner decision, and the recommended order of work. It is intended to be the working checklist for taking the current assessment build from a locally verified application to a publicly accessible, submission-ready demonstration.

## 2. Current verified baseline

The core restaurant ordering system is implemented. The current baseline on `dev` includes:

- [x] React 19 and TypeScript storefront
- [x] Responsive home, menu, product, cart, checkout, and private order-status routes
- [x] Persistent cart using browser `localStorage`
- [x] Spring Boot 4.1.1 REST API targeting Java 21
- [x] PostgreSQL 17 schema managed by Flyway
- [x] Five seeded categories and twelve seeded products
- [x] Backend-calculated prices, delivery fee, totals, and line totals
- [x] Transactional inventory reservation and release
- [x] Idempotent checkout behavior
- [x] WhatsApp order handoff with a backend-generated message
- [x] PayHere Sandbox request generation and callback signature verification
- [x] Session-based administrator authentication
- [x] CSRF protection for administrator mutations
- [x] Administrator dashboard, catalogue management, stock management, and order workflow
- [x] Maven project import configuration for Antigravity/VS Code
- [x] Public GitHub repository with `main` and `dev` branches
- [x] Backend automated tests: 11 passed, 0 failures, 0 errors
- [x] Frontend automated tests: 2 passed
- [x] Frontend production build: passed
- [x] Backend Docker image build: passed
- [x] Live Docker/PostgreSQL verification: passed
- [x] Both Flyway migrations applied successfully to PostgreSQL 17.11
- [x] Live menu endpoint returned all 12 seeded products

The application is therefore functionally implemented. The remaining work is primarily deployment packaging, external service configuration, browser QA, CI, and submission preparation.

## 3. Target zero-cost demonstration architecture

The recommended free-tier architecture is:

```text
GitHub repository
       |
       | automatic deployment from main
       v
Render Free Web Service
  |-- Spring Boot API
  |-- bundled React production files
  |-- one HTTPS origin for UI, API, sessions, and CSRF
       |
       v
Neon Free PostgreSQL

External test integrations:
  |-- PayHere Sandbox
  `-- WhatsApp wa.me handoff
```

One Render service should serve both React and Spring Boot. This keeps the browser on one origin and avoids cross-site session-cookie and CSRF problems. It also consumes only one free Render web-service allocation.

Expected free-tier constraints:

- Render Free web services sleep after an idle period, so the first request after inactivity can take about one minute. The free workspace receives a limited monthly service-hour allowance. See [Render Free service documentation](https://render.com/docs/free).
- Neon Free PostgreSQL is suitable for an assessment/demo database but has storage and compute limits. See [Neon pricing](https://neon.com/pricing).
- GitHub public repositories are available on GitHub Free. See [GitHub repository documentation](https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories).
- PayHere Sandbox uses simulated payments; it does not charge test cards. See [PayHere Sandbox documentation](https://support.payhere.lk/sandbox-and-testing).
- A live PayHere merchant account can have payment-processing fees even if the Lite plan has no monthly charge. A real commercial payment deployment therefore cannot be guaranteed to have zero transaction cost. See [PayHere fees](https://www.payhere.lk/fees/).
- The existing WhatsApp flow uses a normal `wa.me` deep link and does not require the paid WhatsApp Business Platform API.

## 4. Required development phases

### Phase 1 — Build one production full-stack container

Priority: **P0 — required for the recommended free deployment**

- [ ] Add a repository-root production Dockerfile with three stages:
  1. Build the React frontend with Node.
  2. Copy the generated frontend files into Spring Boot static resources and build the backend JAR with Maven.
  3. Run the final JAR on a small Java 21 runtime image as a non-root user.
- [ ] Add a root `.dockerignore` so `.git`, `node_modules`, `target`, local `.env` files, and editor caches do not enter the build context.
- [ ] Add Spring MVC fallback routing for client-side routes such as `/menu`, `/menu/{id}`, `/cart`, `/checkout`, `/order/*`, and `/admin/*`.
- [ ] Ensure `/api/**` is never handled by the SPA fallback.
- [ ] Update Spring Security so static frontend files and SPA routes are publicly readable while `/api/admin/**` remains protected.
- [ ] Add a dedicated public health endpoint such as `GET /api/health` that does not expose secrets or internal diagnostics.
- [ ] Configure forwarded-header handling for HTTPS behind Render's reverse proxy.
- [ ] Verify that direct browser refreshes work on all React routes.
- [ ] Verify that session cookies and CSRF requests work through the same public origin.

Acceptance criteria:

- [ ] A single local Docker container serves both the React application and `/api`.
- [ ] `GET /` returns the React document.
- [ ] `GET /menu` and `GET /admin/login` return the SPA on direct navigation.
- [ ] `GET /api/menu/products` returns JSON.
- [ ] `GET /api/health` returns HTTP 200.
- [ ] Anonymous access to `/api/admin/dashboard` returns HTTP 401.
- [ ] Administrator login and an authenticated dashboard request succeed.

### Phase 2 — Add deployment configuration

Priority: **P0 — required for public hosting**

- [ ] Add `render.yaml` for one Docker-based free web service.
- [ ] Set the Dockerfile path and health-check path in `render.yaml`.
- [ ] Configure the service to deploy from `main`, not directly from unfinished `dev` work.
- [ ] Define non-secret environment defaults in deployment configuration.
- [ ] Mark passwords, database credentials, and PayHere credentials as dashboard-managed secrets.
- [ ] Document every Render environment variable in `README.md`.
- [ ] Confirm that the application listens on Render's supplied `PORT` value.
- [ ] Add a deployment smoke-test checklist.

Acceptance criteria:

- [ ] Render can build the project directly from GitHub.
- [ ] No secret value exists in `render.yaml`, source code, Git history, Docker layers, or build logs.
- [ ] A push to `main` can trigger a deployment.

### Phase 3 — Provision and connect free PostgreSQL

Priority: **P0 — required for public hosting**

- [ ] Create a Neon Free project for Plate & Pantry.
- [ ] Choose a database region close to the Render service region.
- [ ] Obtain the pooled PostgreSQL connection details.
- [ ] Convert the supplied connection information into the JDBC values expected by the backend.
- [ ] Store `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` only in Render's environment-secret configuration.
- [ ] Require encrypted database transport.
- [ ] Keep the Hikari connection pool small enough for the free database connection limit.
- [ ] Deploy and verify that Flyway applies `V1` and `V2` exactly once.
- [ ] Confirm the five categories and twelve products are visible after deployment.
- [ ] Record a safe reset/reseed procedure for demonstration data.

Acceptance criteria:

- [ ] The Render backend connects to Neon successfully.
- [ ] Flyway reports schema version `2`.
- [ ] Redeploying does not duplicate categories, products, administrators, or migration records.
- [ ] Data survives Render service sleep and redeployment.

### Phase 4 — Configure production/demo environment variables

Priority: **P0 — required before public testing**

The following values must be configured outside GitHub:

| Variable | Required for demo? | Required action |
| --- | --- | --- |
| `DB_URL` | Yes | Use the Neon JDBC connection URL with encrypted transport. |
| `DB_USERNAME` | Yes | Use the Neon database role. |
| `DB_PASSWORD` | Yes | Store as a Render secret. |
| `ADMIN_USERNAME` | Yes | Choose the demonstration administrator username. |
| `ADMIN_PASSWORD` | Yes | Generate a strong password of at least 12 characters and share it privately with the evaluator if necessary. |
| `SESSION_COOKIE_SECURE` | Yes | Set to `true` for public HTTPS. |
| `FRONTEND_ORIGINS` | Yes | Set to the final Render HTTPS origin. |
| `DELIVERY_FEE_LKR` | Yes | Confirm the intended fee; current default is `350.00`. |
| `WHATSAPP_BUSINESS_NUMBER` | Yes for WhatsApp demo | Replace the placeholder with the intended test/business number. |
| `PAYHERE_MERCHANT_ID` | Only for PayHere demo | Obtain from PayHere Sandbox. |
| `PAYHERE_MERCHANT_SECRET` | Only for PayHere demo | Store as a Render secret; never expose it to React. |
| `PAYHERE_NOTIFY_URL` | Only for PayHere demo | Use the public HTTPS backend callback URL. |
| `PAYHERE_RETURN_URL` | Only for PayHere demo | Use the public order-return URL. |
| `PAYHERE_CANCEL_URL` | Only for PayHere demo | Use the public checkout URL. |

Secrets policy:

- [ ] Never commit a real `.env` file.
- [ ] Never place secrets in variables whose names begin with `VITE_`.
- [ ] Never paste secrets into issues, pull requests, screenshots, or submission documents.
- [ ] Rotate any value immediately if it is accidentally exposed.

### Phase 5 — Complete PayHere Sandbox verification

Priority: **P1 — required if the assessment expects a demonstrated online payment**

- [ ] Create or access a PayHere Sandbox account.
- [ ] Register the deployed Render domain/app.
- [ ] Obtain the domain-specific Sandbox merchant secret.
- [ ] Configure the public HTTPS `notify_url`.
- [ ] Execute a simulated successful card payment.
- [ ] Confirm the callback signature, merchant ID, order reference, amount, and currency are validated.
- [ ] Confirm a successful callback changes payment status to `PAID` and fulfilment to `CONFIRMED`.
- [ ] Test a simulated cancellation.
- [ ] Test a simulated failed payment.
- [ ] Replay the same callback and confirm it is handled idempotently.
- [ ] Confirm the browser return URL alone cannot mark an order as paid.
- [ ] Capture non-sensitive screenshots or logs as submission evidence.

Acceptance criteria:

- [ ] One full Sandbox payment succeeds from checkout through the server callback.
- [ ] Failure and cancellation paths do not leave an order falsely marked as paid.
- [ ] No merchant secret is present in browser code or network responses.

If Sandbox credentials cannot be obtained before submission, the application must continue showing the explicit “PayHere is not configured” state. It must not simulate success locally.

### Phase 6 — Complete WhatsApp flow verification

Priority: **P1 — required for a polished demonstration**

- [ ] Replace the example WhatsApp number.
- [ ] Place a test WhatsApp order from the deployed application.
- [ ] Confirm that the correct chat opens.
- [ ] Confirm the generated message contains reference, items, quantities, totals, customer contact, address, and notes.
- [ ] Confirm that the user must press Send.
- [ ] Confirm that the saved order remains `AWAITING_CONFIRMATION` until an administrator acts.
- [ ] Confirm cancellation restores reserved inventory exactly once.

### Phase 7 — Manual browser and responsive QA

Priority: **P0 — required before submission**

Test at minimum:

- [ ] Mobile: 360–390 px wide
- [ ] Tablet: approximately 768 px wide
- [ ] Laptop: approximately 1366 px wide
- [ ] Desktop: 1440 px or wider

Customer routes:

- [ ] Home page
- [ ] Menu search and category filters
- [ ] Product details and stock limits
- [ ] Cart persistence after refresh
- [ ] Quantity changes and item removal
- [ ] Empty-cart state
- [ ] Checkout validation
- [ ] WhatsApp checkout
- [ ] PayHere configured/unconfigured states
- [ ] Private order-status route
- [ ] Loading, empty, error, success, and sold-out states

Administrator routes:

- [ ] Login success and failure
- [ ] Login throttling after repeated failures
- [ ] Dashboard values
- [ ] Create and edit categories
- [ ] Create, edit, feature, restock, and deactivate products
- [ ] Search and filter orders
- [ ] Valid fulfilment transitions
- [ ] Invalid transition rejection
- [ ] Logout
- [ ] Session behavior after a Render sleep/restart

Quality checks:

- [ ] Keyboard-only navigation
- [ ] Visible focus states
- [ ] Form labels and error messages
- [ ] Color contrast
- [ ] Image fallback behavior
- [ ] No horizontal overflow on mobile
- [ ] No sensitive data in browser console messages
- [ ] No unexpected browser console errors
- [ ] Acceptable behavior during a Render cold start

### Phase 8 — Continuous integration

Priority: **P1 — strongly recommended before merging to `main`**

- [ ] Add a GitHub Actions workflow for every push and pull request.
- [ ] Run `mvn test` from the repository root.
- [ ] Run `npm ci`, `npm test`, and `npm run build` in `frontend`.
- [ ] Add a Docker build job for the production full-stack image.
- [ ] Cache Maven and npm dependencies where safe.
- [ ] Add dependency update monitoring, such as Dependabot.
- [ ] Require passing checks before merging `dev` into `main` if branch protection is available/configured.

Acceptance criteria:

- [ ] A clean GitHub Actions run passes on `dev`.
- [ ] A deliberately broken test causes the workflow to fail.
- [ ] No workflow prints secrets.

### Phase 9 — Documentation and assessment submission

Priority: **P0 — required for handoff**

- [ ] Update `README.md` with the final live URL.
- [ ] Add exact deployment architecture and environment-variable instructions.
- [ ] Add screenshots of important customer and administrator pages.
- [ ] Add a concise feature list mapped to assessment requirements.
- [ ] Document the administrator demo username and provide the password privately, not in GitHub.
- [ ] Document PayHere Sandbox test steps without publishing merchant secrets.
- [ ] Document free-tier cold-start behavior so an evaluator knows to wait for the first request.
- [ ] Add final test/build results.
- [ ] Check all GitHub links and live routes in a private/incognito browser window.
- [ ] Open a pull request from `dev` to `main`.
- [ ] Review the diff and CI results.
- [ ] Merge only after all P0 items pass.
- [ ] Tag the submitted commit, for example `v1.0.0-assessment`.

Final submission should contain:

- [ ] Public GitHub repository URL
- [ ] Public live application URL
- [ ] Short setup instructions
- [ ] Architecture summary
- [ ] Technology list
- [ ] Test results
- [ ] Known limitations
- [ ] Non-secret administrator access instructions
- [ ] Screenshots or demonstration video if requested

## 5. Recommended execution order

Work should proceed in this order:

1. Build the single full-stack production container.
2. Add the health endpoint, SPA fallback, and same-origin security rules.
3. Add automated tests for the new production routing behavior.
4. Add `render.yaml` and deployment documentation.
5. Add GitHub Actions CI.
6. Provision Neon and Render free-tier resources.
7. Configure production secrets.
8. Run live deployment smoke tests.
9. Complete WhatsApp verification.
10. Complete PayHere Sandbox verification.
11. Perform responsive, accessibility, and browser QA.
12. Update the submission documentation.
13. Open a `dev` → `main` pull request, review, and merge.

## 6. Work that requires the project owner

The following cannot be completed safely using source code alone:

- [ ] Choose or create the Neon account/project.
- [ ] Choose or create the Render account/service.
- [ ] Approve GitHub access for the deployment platform.
- [ ] Choose the real/test WhatsApp number.
- [ ] Create or access a PayHere Sandbox merchant account.
- [ ] Provide PayHere Sandbox merchant ID and domain-specific secret through secure environment configuration.
- [ ] Decide the final administrator username and privately managed password.
- [ ] Decide whether the assessment requires a live deployment, screenshots, video, or only source code.
- [ ] Confirm restaurant branding, menu data, prices, stock, and delivery fee.

The owner should never send real passwords or merchant secrets through GitHub issues or commit them into the repository.

## 7. Optional production backlog

These items are useful for a real commercial system but are not necessary to complete the current assessment demonstration:

- [ ] Scheduled expiration of abandoned PayHere reservations
- [ ] Scheduled expiration of stale WhatsApp enquiries
- [ ] PayHere refund API integration
- [ ] Automatic reconciliation for late or conflicting payment callbacks
- [ ] Customer accounts and saved addresses
- [ ] Promotions and coupon codes
- [ ] Tax calculation
- [ ] Delivery zones and distance-based fees
- [ ] Delivery-driver workflow and tracking
- [ ] Email or SMS notifications
- [ ] Product image upload and managed object storage
- [ ] Audit log for administrator actions
- [ ] Shared session storage for multiple backend instances
- [ ] Rate limiting backed by shared storage
- [ ] Database backups and point-in-time recovery
- [ ] Centralized monitoring, alerting, and structured log collection
- [ ] Accessibility audit against WCAG 2.2 AA
- [ ] Load, concurrency, and penetration testing

## 8. Definition of done

The assessment build is complete when all of the following are true:

- [ ] All P0 tasks are checked.
- [ ] Backend, frontend, and Docker CI jobs pass on GitHub.
- [ ] The live application is reachable over HTTPS.
- [ ] The first cold-start request eventually succeeds without data loss.
- [ ] PostgreSQL data persists across application redeployments.
- [ ] The storefront and administrator console pass responsive browser QA.
- [ ] The WhatsApp flow is verified with the intended number.
- [ ] PayHere Sandbox is either verified end-to-end or clearly documented as unavailable due to missing external credentials.
- [ ] No secrets are committed or exposed to browser JavaScript.
- [ ] `README.md` contains current setup, architecture, testing, deployment, limitations, repository, and live links.
- [ ] A reviewed pull request merges `dev` into `main`.
- [ ] The submitted Git tag points to the exact reviewed commit.

## 9. Branch workflow

Use the following workflow for all remaining development:

```text
dev -> test/build/QA -> pull request -> main -> deployment
```

Normal development commands:

```powershell
cd "C:\My Projects\Foodorder"
git switch dev
git pull

# Make and verify changes

git add .
git commit -m "Describe the completed work"
git push
```

Do not develop directly on `main`. Merge into `main` only through a reviewed pull request after the required checks pass.
