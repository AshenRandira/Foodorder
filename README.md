# Plate & Pantry

Plate & Pantry is a responsive restaurant ordering platform built for the DartCodes Software Engineer Intern technical assessment. It includes a warm customer storefront, persistent cart, guest checkout, PayHere Sandbox handoff, WhatsApp ordering, and a protected operations dashboard for products, categories, inventory, and order fulfilment.

The repository is a modular monolith with one React frontend, one Spring Boot backend, and one PostgreSQL database.

## What is included

### Customer storefront

- Responsive home page with restaurant identity, featured dishes, categories, and strong food imagery
- Searchable and filterable menu with live availability and stock indicators
- Product details with quantity selection and stock-aware cart additions
- React Context cart persisted in `localStorage`
- Quantity editing, removal, subtotal, LKR 350 delivery fee, and total summary
- Guest delivery form with validation and optional notes
- PayHere Sandbox redirect checkout using a backend-generated hash
- WhatsApp order enquiry using a backend-generated, URL-encoded message
- Private order status page protected by an unguessable access token
- Loading, empty, error, success, sold-out, and configuration-required states

### Admin console

- Session-based login and logout with no customer registration
- Dashboard for total/today orders, paid sales, kitchen queue, and low stock
- Create and edit categories, including visibility and sort order
- Create, edit, feature, restock, and deactivate products
- Search and filter orders by reference, customer, phone, or fulfilment status
- Order item, customer, delivery, payment method, and payment status views
- Server-validated fulfilment transitions

## Technology

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript 7, Vite 8, Tailwind CSS 4, React Router 7, Axios |
| Backend | Java 21 target, Spring Boot 4.1.1, Spring MVC, Spring Data JPA, Spring Security |
| Database | PostgreSQL 17, Flyway migrations |
| Authentication | Server-side session, HttpOnly cookie, BCrypt cost 12, CSRF cookie/header |
| Testing | JUnit 5, Mockito, MockMvc, Vitest, Testing Library |
| Delivery | Docker Compose, multi-stage Dockerfiles, Nginx SPA/proxy configuration |

## Quick start with Docker

Requirements: Docker Desktop with Docker Compose.

```powershell
cd "C:\My Projects\Foodorder"
Copy-Item .env.example .env
```

Edit `.env` and replace at least `POSTGRES_PASSWORD`, `ADMIN_PASSWORD`, and `WHATSAPP_BUSINESS_NUMBER`. The admin password must have at least 12 characters. `docker compose` reads this root file for interpolation; it maps the `POSTGRES_*` values into the backend container as `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD`.

```powershell
docker compose up --build
```

Open:

- Storefront: `http://localhost:5173`
- Admin: `http://localhost:5173/admin/login`
- Backend API: `http://localhost:8080/api`

Stop the stack without deleting database data:

```powershell
docker compose down
```

## Local development without full Docker

Start only PostgreSQL from the repository root:

```powershell
cd "C:\My Projects\Foodorder"
docker compose up -d db
```

Start Spring Boot in one PowerShell window:

```powershell
cd "C:\My Projects\Foodorder"
.\scripts\start-backend.ps1
```

The launcher imports only the local application variables it needs from the root `.env`, maps `POSTGRES_*` to the backend's `DB_*` variables, and does not import Neon or object-storage credentials. Running `mvn spring-boot:run` directly does **not** load the root `.env`; Spring Boot reads operating-system variables and `application.yml`.

In another PowerShell window:

```powershell
cd "C:\My Projects\Foodorder\frontend"
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm.cmd ci
npm.cmd run dev
```

Vite reads `frontend/.env`, not the root `.env`. Only `VITE_API_URL` is exposed to the browser bundle; never add passwords, merchant secrets, database URLs, or access keys with a `VITE_` prefix.

Flyway creates the schema and safely seeds five categories and twelve products on first startup. Seed images use Unsplash delivery URLs; their source URLs are recorded directly in `V2__seed_menu.sql`.

## Environment variables

Never commit a real `.env` file. Example files contain names and safe placeholders only.

### Loading behavior

| Runtime | Is the root `.env` loaded? | Configuration path |
| --- | --- | --- |
| Spring Boot started directly | No | Use process environment variables, or use `scripts/start-backend.ps1` for the local Compose database. |
| Root Docker Compose | Yes | Compose reads it for `${...}` interpolation, initializes PostgreSQL with `POSTGRES_*`, and passes mapped `DB_*` variables to Spring Boot. |
| Frontend Vite development server | No | Vite reads `frontend/.env`; only `VITE_*` values enter the browser build. |
| Railway backend container | No | Configure variables in the Railway service. The ignored local `.env` is not in Git and is not uploaded by a GitHub deployment. |
| Neon CLI and Neon tooling | Yes, when invoked locally | Neon manages `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `NEON_BRANCH`, and object-storage variables in the root `.env`. |

### Variable ownership

| Variable | Consumer and purpose |
| --- | --- |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | Docker Compose and the local PostgreSQL image. Compose maps them to the backend's `DB_*` variables. Spring Boot does not read `POSTGRES_*` directly. |
| `DB_URL` | Spring Boot JDBC URL. It must begin with `jdbc:postgresql://`; a Neon `postgresql://` URL cannot be copied unchanged. |
| `DB_USERNAME`, `DB_PASSWORD` | Spring Boot runtime database credentials. |
| `DB_POOL_MAX_SIZE` | Maximum Hikari application connections; defaults to `5`. |
| `FLYWAY_URL`, `FLYWAY_USERNAME`, `FLYWAY_PASSWORD` | Optional direct JDBC connection for schema migration. Each defaults to its corresponding `DB_*` value. |
| `DATABASE_URL` | Neon CLI-generated pooled PostgreSQL URI. It is supporting-tool configuration and is not consumed directly by this Java application. |
| `DATABASE_URL_UNPOOLED` | Neon CLI-generated direct PostgreSQL URI. Convert it to JDBC form when configuring `FLYWAY_URL`; do not expose it to the browser. |
| `NEON_BRANCH` | Neon CLI branch metadata; not consumed by the application. |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ENDPOINT_URL_S3`, `AWS_REGION` | Neon Object Storage tooling variables. The current application has no upload/storage consumer, but the variables are retained for the configured private bucket. |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Creates the first administrator if it does not exist. The password must contain at least 12 characters. |
| `FRONTEND_ORIGINS` | Comma-separated exact origins allowed to make credentialed CORS requests. Do not use `*`. |
| `SESSION_COOKIE_SECURE` | Use `false` for local HTTP and `true` behind Railway HTTPS. |
| `SESSION_COOKIE_SAME_SITE` | Defaults to `lax`; use `none` together with secure cookies only when the frontend and API are genuinely cross-site. |
| `DELIVERY_FEE_LKR` | Backend-owned non-negative decimal delivery fee, default `350.00`. |
| `WHATSAPP_BUSINESS_NUMBER` | International digits only, without `+`, spaces, or punctuation, such as `94770000000`. |
| `PAYHERE_ENABLED` | Explicit payment feature switch. Keep `false` until the registered domain, secret, and public HTTPS callback are valid. |
| `PAYHERE_MERCHANT_ID` | PayHere merchant ID, backend only. |
| `PAYHERE_MERCHANT_SECRET` | Domain-specific PayHere secret, backend only. |
| `PAYHERE_CHECKOUT_URL` | PayHere checkout endpoint; defaults to the Sandbox Checkout URL. |
| `PAYHERE_NOTIFY_URL` | Public HTTPS callback ending in `/api/payments/payhere/notify`. |
| `PAYHERE_RETURN_URL` | Browser route ending in `/order/return`. |
| `PAYHERE_CANCEL_URL` | Browser route ending in `/checkout`. |
| `PORT` | Backend listener port. Railway supplies this automatically. |
| `VITE_API_URL` | Public frontend API base; `/api` in the Docker/Nginx build. This must never contain a secret. |

The bootstrap process creates an administrator only when the configured username is absent. Changing the environment password later does not silently rotate an existing database password.

## Architecture

```text
Browser
  |
  |  React routes, cart state, forms
  v
Nginx frontend :5173
  |
  |  /api proxy
  v
Spring Boot API :8080
  |-- public menu and token-protected order views
  |-- transactional checkout and inventory service
  |-- PayHere signature verification callback
  |-- session/CSRF protected admin APIs
  v
PostgreSQL :5432
```

The backend is separated by domain entities, repositories, services, controllers, DTOs, configuration, and consistent error handling. Browser-supplied prices and totals are never accepted.

### Database relationships

```text
Category 1 ----- * Product
CustomerOrder 1 ----- * OrderItem
CustomerOrder 1 ----- * PaymentAttempt
AdminUser              independent administrator identity
```

- `OrderItem` stores product ID, purchased name, unit-price snapshot, quantity, and line total.
- `CustomerOrder` stores customer delivery data, backend-calculated subtotal, delivery fee, total, payment method, payment status, and fulfilment status.
- `PaymentAttempt` stores an idempotent provider callback fingerprint and provider outcome.
- Product and order monetary columns use `NUMERIC(12,2)` and Java `BigDecimal`.

## Order and inventory policy

1. The browser sends only product IDs and quantities. The backend locks products in sorted ID order with `PESSIMISTIC_WRITE`, validates active state and stock, and calculates every amount.
2. Stock is reserved when either a PayHere order or WhatsApp enquiry is persisted. This prevents a customer from reaching a payment page for stock that was already sold.
3. A PostgreSQL transaction-scoped advisory lock serializes requests with the same `Idempotency-Key`. A unique database constraint is the second line of defence. Sequential or simultaneous retries return the existing order without deducting stock twice.
4. PayHere pending status keeps the reservation. Verified success retains it and moves the order from `AWAITING_PAYMENT` to `CONFIRMED`.
5. Verified PayHere failure or cancellation releases stock exactly once and cancels fulfilment.
6. A WhatsApp enquiry stays `AWAITING_CONFIRMATION`. Opening WhatsApp does not confirm it. An administrator either confirms it or cancels it; cancellation releases stock once.
7. An admin cancellation before completion restores stock. A chargeback is recorded separately and does not automatically restock an already sold meal.
8. A late success callback received after stock was already released is recorded but does not silently mark the order paid; it requires manual reconciliation to avoid overselling.

Automatic reservation expiry is intentionally not included in this assessment build. In a production system, a scheduled job would expire abandoned PayHere reservations and stale WhatsApp enquiries using business-approved time windows.

## Fulfilment lifecycle

Only these transitions are accepted:

```text
PayHere: AWAITING_PAYMENT --verified payment--> CONFIRMED
WhatsApp: AWAITING_CONFIRMATION --> CONFIRMED
CONFIRMED --> PREPARING --> READY --> OUT_FOR_DELIVERY --> COMPLETED
```

Cancellation is permitted from awaiting, confirmed, preparing, and ready states. Completed and cancelled orders are terminal. `OUT_FOR_DELIVERY` can only become `COMPLETED`. Payment status remains a separate field throughout.

## PayHere Sandbox flow

The integration follows the official [PayHere Checkout API documentation](https://support.payhere.lk/api-%26-mobile-sdk/checkout-api):

1. Customer checkout creates and reserves an order on the backend.
2. The backend formats the LKR amount to two decimals and generates the required uppercase MD5 hash using merchant ID, order ID, amount, currency, and the hashed merchant secret.
3. The frontend submits the returned fields directly to `https://sandbox.payhere.lk/pay/checkout` as an HTML form.
4. PayHere sends an `application/x-www-form-urlencoded` server callback to `PAYHERE_NOTIFY_URL`.
5. The backend independently verifies `md5sig`, merchant ID, order reference, exact amount, and currency before applying a status.
6. Callback fingerprints prevent duplicate processing.
7. Status `2` is success, `0` pending, `-1` cancelled, `-2` failed, and `-3` charged back.
8. The browser return URL only opens the private order page. It never marks an order paid.

The notification URL must be publicly reachable over HTTPS; localhost cannot receive PayHere callbacks. If credentials or a public HTTPS callback are absent, the UI reports that PayHere is not configured and does not fake a payment.

### Local PayHere test with a Cloudflare Quick Tunnel

The React application is served by the frontend Nginx container on `http://localhost:5173`; Spring Boot does not serve React. Nginx proxies `/api` to the backend container. Expose this combined frontend origin through the Quick Tunnel so checkout starts from the same hostname registered with PayHere and the notification, return, and cancellation routes all work through one public origin.

Install the official `cloudflared` client on Windows if necessary:

```powershell
winget install --id Cloudflare.cloudflared --exact
```

Start the application without deleting its database volume:

```powershell
cd "C:\My Projects\Foodorder"
docker compose up -d --build
```

If another PostgreSQL installation already uses host port `5432`, set `POSTGRES_PORT=5433` in the ignored root `.env`. Spring still reaches the Compose database on its internal port `5432`.

Start a public Quick Tunnel in a separate terminal:

```powershell
cloudflared tunnel --url http://localhost:5173
```

Do not use `--allowed-mail` or another interactive authentication layer for this callback tunnel. Copy the generated hostname without `https://` or a path, such as `random-words.trycloudflare.com`, into **PayHere Sandbox → Integrations → Add Domain/App → Domain**. Copy the domain-specific Merchant Secret into the ignored root `.env`; never place it in source, documentation, chat, or a `VITE_*` variable. Open the public tunnel URL, rather than localhost, when initiating the PayHere test because PayHere validates the checkout origin against the registered domain.

Configure the ignored root `.env` using these exact names and URL shapes:

```dotenv
PAYHERE_ENABLED=true
PAYHERE_MERCHANT_ID=your-sandbox-merchant-id
PAYHERE_MERCHANT_SECRET=your-domain-specific-sandbox-secret
PAYHERE_CHECKOUT_URL=https://sandbox.payhere.lk/pay/checkout
PAYHERE_NOTIFY_URL=https://random-words.trycloudflare.com/api/payments/payhere/notify
PAYHERE_RETURN_URL=https://random-words.trycloudflare.com/order/return
PAYHERE_CANCEL_URL=https://random-words.trycloudflare.com/checkout
FRONTEND_ORIGINS=http://localhost:5173,https://random-words.trycloudflare.com
SESSION_COOKIE_SECURE=false
SESSION_COOKIE_SAME_SITE=lax
```

Restart only the backend after changing those values:

```powershell
docker compose up -d --no-deps --force-recreate backend
```

Every new Quick Tunnel normally gets a different hostname. When it changes, register the new hostname with PayHere, obtain/use the secret for that domain, update `PAYHERE_NOTIFY_URL`, `PAYHERE_RETURN_URL`, `PAYHERE_CANCEL_URL`, and `FRONTEND_ORIGINS`, then restart the backend again.

To test a successful simulated Sandbox payment:

1. Open the generated `https://random-words.trycloudflare.com` URL, add an in-stock product, and continue to checkout.
2. Enter valid delivery details and an email address, select PayHere, and continue.
3. Confirm the browser is redirected to `https://sandbox.payhere.lk/pay/checkout`.
4. Use PayHere's published successful Visa test card `4916217501611292`; use any valid future expiry, valid CVV, and cardholder name. Never use a real card.
5. After PayHere returns to `/order/return`, refresh the order status. It must show paid only after the signed server callback has updated the database.
6. Confirm the same order in the admin dashboard. A browser return without the signed callback must remain `AWAITING_PAYMENT`.

For a simulated failure check, use a decline card from the official [PayHere Sandbox testing page](https://support.payhere.lk/sandbox-and-testing), then verify that the order is failed/cancelled and inventory is released exactly once. Automated tests also cover rejected signatures, amount mismatch, currency mismatch, duplicate callbacks, verified cancellation, verified failure, and inventory release.

A Quick Tunnel temporarily exposes the local frontend and its proxied backend routes to the public Internet, has no uptime guarantee, and stops when `cloudflared` stops. Use it only for local testing and do not use the public URL for admin work.

## WhatsApp flow

The backend builds the WhatsApp message only after recalculating and persisting the order. It includes reference, item quantities, unit-derived line totals, subtotal, delivery fee, total, customer phone, address, and notes. The frontend opens the configured `wa.me` URL and tells the customer to press Send. The order stays awaiting business confirmation until an administrator explicitly advances it.

## Security decisions

- Every `/api/admin/**` route except login/session bootstrap is role protected on the backend.
- Passwords use BCrypt with cost 12; plaintext credentials are never stored.
- Authentication uses a server-side session with an HttpOnly, `SameSite=Lax` cookie. Set `SESSION_COOKIE_SECURE=true` in production.
- Admin mutations require CSRF validation through the `XSRF-TOKEN` cookie and `X-XSRF-TOKEN` header.
- Public order creation and token-protected lookup do not rely on cookie authentication. The PayHere notification route is the only payment CSRF exemption and is protected with provider signature verification.
- CORS allows credentials only from `FRONTEND_ORIGINS`; it is not wildcard based.
- Login attempts are blocked for 15 minutes after five failures for the username/IP key.
- Jakarta validation rejects malformed customer, catalogue, quantity, and status data.
- Public order lookup requires a 256-bit random access token, preventing enumerable references from exposing customer data.
- Error responses are consistent and contain no stack traces. Unexpected errors are logged server-side.
- Merchant secrets remain backend environment variables and are never sent to the frontend; only the per-order hash is returned.

Deploy behind HTTPS and a trusted reverse proxy. Terminate TLS at the platform/load balancer, forward the original protocol, set secure cookies, restrict CORS to the exact frontend origin, use a managed PostgreSQL TLS connection, and inject all secrets from the deployment platform's secret manager.

## API outline

| Method | Path | Access |
| --- | --- | --- |
| `GET` | `/api/menu/categories` | Public |
| `GET` | `/api/menu/products`, `/api/menu/products/{id}` | Public |
| `POST` | `/api/orders` | Public, requires `Idempotency-Key` |
| `GET` | `/api/orders/{reference}?token=...` | Private token |
| `POST` | `/api/payments/payhere/notify` | Public provider callback with signature verification |
| `GET` | `/api/csrf` | Public token bootstrap |
| `POST` | `/api/admin/auth/login`, `/logout` | Login public; logout authenticated + CSRF |
| `GET/POST/PUT/PATCH` | `/api/admin/categories`, `/products` | Admin session + CSRF for mutations |
| `GET/PATCH` | `/api/admin/orders` | Admin session + CSRF for mutation |
| `GET` | `/api/admin/dashboard` | Admin session |

## Tests and builds

Run backend tests:

```powershell
cd backend
mvn test
```

Coverage focuses on backend-owned totals, combined quantity limits, insufficient inventory, row-lock usage, duplicate checkout reuse, invalid status transitions, PayHere signature/amount/currency verification, duplicate callback handling, anonymous admin rejection, authenticated dashboard access, and CSRF enforcement.

Run frontend tests and the production build:

```powershell
cd frontend
npm.cmd test
npm.cmd run build
```

Verified locally on 2026-10-10:

- Backend: 15 tests passed, 0 failures, 0 errors.
- Frontend: 2 tests passed in 1 test file.
- Frontend production build: successful; 1,977 modules transformed.
- Docker Compose configuration: valid.
- Clean Docker images: backend and frontend built successfully.
- PostgreSQL 17 container: healthy; both Flyway migrations applied successfully.
- Backend and frontend containers: healthy/running.
- Live Nginx URL returned HTTP 200 and the Plate & Pantry document title.
- Live menu returned 12 seeded products.
- Live WhatsApp checkout persisted a backend-calculated LKR 3,250.00 order.
- Repeating the same checkout key returned the same reference and did not deduct stock again.
- Token-protected order lookup returned the same order.
- Live admin login established a server session and the dashboard returned the persisted order count.
- Malformed live checkout JSON returned a safe HTTP 400 response rather than a stack trace.
- With no merchant credentials, live PayHere checkout reported `configured: false`, omitted the hash, and left the order awaiting payment.
- Anonymous access to the live admin dashboard returned HTTP 401.
- Railway single-container image built successfully from the repository root.
- The production image returned HTTP 200 for `/`, `/menu/1`, `/order/return`, `/admin/login`, `/api/config`, and `/api/menu/categories`.
- The production image returned HTTP 401 for an anonymous `/api/admin/dashboard` request.
- With `PAYHERE_ENABLED=false`, a PayHere order request returned HTTP 503 and the database order count remained unchanged.

Visual browser QA remains unverified because the available browser-control connector and Windows automation pipe were unavailable in this session. The responsive code was production-built, but the final submission should still be manually checked at common mobile, tablet, and desktop widths.

## Deployment

### Railway single-container application

The root `Dockerfile` builds React with `VITE_API_URL=/api`, copies the production assets into Spring Boot, and serves the UI and API from one Railway HTTPS origin. Keep the Railway service root directory empty (repository root). Railway detects the root `Dockerfile`; no separate frontend service is needed.

Railway does not load the ignored local `.env` during a GitHub deployment. Add these service variables explicitly:

| Variable | Railway value |
| --- | --- |
| `DB_URL` | Neon pooled JDBC URL: `jdbc:postgresql://<pooled-host>/<database>?sslmode=require` |
| `DB_USERNAME`, `DB_PASSWORD` | Neon role and password, stored as Railway secrets |
| `DB_POOL_MAX_SIZE` | `5` for the current small deployment |
| `FLYWAY_URL` | Neon direct JDBC URL: `jdbc:postgresql://<direct-host>/<database>?sslmode=require` |
| `FLYWAY_USERNAME`, `FLYWAY_PASSWORD` | The Neon migration role and password; they may match the runtime role for this assessment |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Demonstration administrator; use a password of at least 12 characters |
| `FRONTEND_ORIGINS` | Exact deployed frontend HTTPS origin, or a comma-separated list of exact origins |
| `SESSION_COOKIE_SECURE` | `true` |
| `SESSION_COOKIE_SAME_SITE` | `lax` for same-site deployment; `none` only for a genuinely cross-site frontend/API pair |
| `DELIVERY_FEE_LKR` | Confirmed decimal delivery fee, currently `350.00` |
| `WHATSAPP_BUSINESS_NUMBER` | Confirmed international digits-only number |
| `PAYHERE_ENABLED` | `false` for the public Railway demo until an approved domain is available |
| `PAYHERE_MERCHANT_ID`, `PAYHERE_MERCHANT_SECRET` | Sandbox credentials, only when `PAYHERE_ENABLED=true` |
| `PAYHERE_CHECKOUT_URL` | `https://sandbox.payhere.lk/pay/checkout` |
| `PAYHERE_NOTIFY_URL` | `https://<api-domain>/api/payments/payhere/notify` |
| `PAYHERE_RETURN_URL` | `https://<frontend-domain>/order/return` |
| `PAYHERE_CANCEL_URL` | `https://<frontend-domain>/checkout` |

Do not copy `DATABASE_URL` directly into `DB_URL`: Neon emits a `postgresql://` URI containing credentials, while the PostgreSQL JDBC driver requires `jdbc:postgresql://` and this application supplies username and password separately. Use the pooled Neon host for `DB_URL` and the direct host for `FLYWAY_URL`. Keep `sslmode=require`. Do not configure `POSTGRES_*`, `DATABASE_URL*`, `NEON_BRANCH`, or `AWS_*` in Railway unless a separate runtime feature actually consumes them.

After the first successful deployment, generate a Railway public domain. Set `FRONTEND_ORIGINS` to that exact `https://...` origin, keep `SESSION_COOKIE_SECURE=true` and `SESSION_COOKIE_SAME_SITE=lax`, then redeploy. Configure the health-check path as `/api/menu/categories`. Keep the service to one instance unless sessions are stored in a shared session store or Railway traffic is made sticky.

PayHere Sandbox is implemented and its signature, amount, currency, failure, cancellation, and duplicate-callback behavior is covered by automated tests. PayHere Sandbox rejected the temporary `trycloudflare.com` hostname because subdomains are not accepted for domain registration. The public demo therefore exposes the tested integration as unavailable and keeps WhatsApp ordering functional; it does not fake payment success. When an approved apex domain is available, set `PAYHERE_ENABLED=true`, register that hostname in PayHere Sandbox, use its domain-specific Merchant Secret, update the three PayHere URLs to the same public origin, and redeploy.

Before presenting the deployment:

1. Confirm `GET /api/menu/categories` through the public HTTPS API.
2. Confirm the browser sends the admin session and CSRF cookies in the selected same-site or cross-site topology.
3. Confirm direct requests to `/menu/1`, `/order/return`, and `/admin/login` return the React application.
4. Verify a real PayHere Sandbox callback in provider logs and the database before presenting payment as tested.

The source repository is `https://github.com/AshenRandira/Foodorder`. The live Railway URL must be added here after the service is online and its smoke tests pass.

## Assumptions and limitations

- Delivery is a flat LKR 350 for the assessment; zones and distance pricing are out of scope.
- Customer accounts, promotions, taxes, refunds, delivery-driver tracking, and reservation expiry jobs are out of scope.
- Admin cancellation of a paid order records fulfilment cancellation but does not call a PayHere refund API; refund reconciliation is manual.
- Seed images are remotely hosted by Unsplash and require internet access. The product card includes a sensible fallback image.
- Horizontal scaling requires a shared Spring Session store or sticky sessions because authentication is server-session based.
- Live URLs and the GitHub repository URL must be supplied after the owner explicitly chooses hosting and publishing targets.
