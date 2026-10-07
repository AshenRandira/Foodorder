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

Edit `.env` and replace at least `POSTGRES_PASSWORD`, `ADMIN_PASSWORD`, and `WHATSAPP_BUSINESS_NUMBER`. The admin password must have at least 12 characters.

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

Start only PostgreSQL:

```powershell
docker compose up -d db
```

In one PowerShell window:

```powershell
cd "C:\My Projects\Foodorder\backend"
$env:DB_URL = "jdbc:postgresql://localhost:5432/plate_pantry"
$env:DB_USERNAME = "plate_pantry"
$env:DB_PASSWORD = "plate_pantry"
$env:ADMIN_USERNAME = "admin"
$env:ADMIN_PASSWORD = "replace-with-at-least-12-characters"
mvn spring-boot:run
```

In another PowerShell window:

```powershell
cd "C:\My Projects\Foodorder\frontend"
Copy-Item .env.example .env
npm.cmd install
npm.cmd run dev
```

Flyway creates the schema and safely seeds five categories and twelve products on first startup. Seed images use Unsplash delivery URLs; their source URLs are recorded directly in `V2__seed_menu.sql`.

## Environment variables

Never commit a real `.env` file. Example files contain names and safe placeholders only.

| Variable | Purpose |
| --- | --- |
| `DB_URL` | JDBC PostgreSQL URL |
| `DB_USERNAME`, `DB_PASSWORD` | Database credentials |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Creates the first administrator if it does not exist |
| `FRONTEND_ORIGINS` | Comma-separated credentialed CORS allowlist |
| `SESSION_COOKIE_SECURE` | Use `true` behind production HTTPS |
| `DELIVERY_FEE_LKR` | Backend-owned delivery fee, default `350.00` |
| `WHATSAPP_BUSINESS_NUMBER` | International digits only, such as `94770000000` |
| `PAYHERE_MERCHANT_ID` | PayHere merchant ID |
| `PAYHERE_MERCHANT_SECRET` | Domain-specific PayHere secret, backend only |
| `PAYHERE_CHECKOUT_URL` | Defaults to the Sandbox Checkout URL |
| `PAYHERE_NOTIFY_URL` | Public HTTPS backend callback URL |
| `PAYHERE_RETURN_URL` | Customer browser return page |
| `PAYHERE_CANCEL_URL` | Customer browser cancellation page |
| `VITE_API_URL` | Frontend API base; `/api` in the Docker/Nginx build |

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

The notification URL must be publicly reachable over HTTPS; localhost cannot receive PayHere callbacks. In the PayHere Merchant Portal, register the deployed frontend domain/app, obtain its domain-specific secret, and configure the public backend notification URL. If credentials or a public HTTPS callback are absent, the UI reports that PayHere is not configured and does not fake a payment.

Sandbox payment was not executed in this workspace because no merchant ID, merchant secret, or public callback domain was supplied.

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

Verified locally on 2026-10-07:

- Backend: 11 tests passed, 0 failures, 0 errors.
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

Visual browser QA remains unverified because the available browser-control connector and Windows automation pipe were unavailable in this session. The responsive code was production-built, but the final submission should still be manually checked at common mobile, tablet, and desktop widths.

## Deployment

1. Provision PostgreSQL and set `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD`.
2. Deploy the backend container on a public HTTPS service. Keep it to one instance unless sessions are stored in a shared session store or traffic is sticky.
3. Set strong admin credentials, production CORS origin, `SESSION_COOKIE_SECURE=true`, WhatsApp number, and PayHere variables.
4. Set `PAYHERE_NOTIFY_URL` to the public backend callback and return/cancel URLs to the public frontend.
5. Build the frontend with `VITE_API_URL` pointing to the public API, or route `/api` through the same-origin reverse proxy as the provided Nginx configuration does.
6. Keep SPA fallback routing enabled so `/menu/:id`, `/order/:reference`, and `/admin/*` load correctly on refresh.
7. Verify a real PayHere Sandbox callback in provider logs and the database before presenting the payment flow as tested.

The source is published at `https://github.com/AshenRandira/Foodorder`. No cloud deployment resources or paid services have been created yet.

## Assumptions and limitations

- Delivery is a flat LKR 350 for the assessment; zones and distance pricing are out of scope.
- Customer accounts, promotions, taxes, refunds, delivery-driver tracking, and reservation expiry jobs are out of scope.
- Admin cancellation of a paid order records fulfilment cancellation but does not call a PayHere refund API; refund reconciliation is manual.
- Seed images are remotely hosted by Unsplash and require internet access. The product card includes a sensible fallback image.
- Horizontal scaling requires a shared Spring Session store or sticky sessions because authentication is server-session based.
- Live URLs and the GitHub repository URL must be supplied after the owner explicitly chooses hosting and publishing targets.
