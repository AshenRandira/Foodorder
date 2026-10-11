# Technologies Used

## Short version

Plate & Pantry was developed as a full-stack web application using React, TypeScript, Vite, and Tailwind CSS for the responsive customer and administration interfaces. The backend was built with Java 21 and Spring Boot, using Spring MVC for REST APIs, Spring Data JPA and Hibernate for persistence, Spring Security for session authentication and CSRF protection, and Jakarta Validation for request validation. PostgreSQL is the primary database, with Flyway managing versioned schema migrations. Axios and React Router support client-side API communication and navigation, while the React Context API and browser local storage manage the shopping cart. The project integrates PayHere Sandbox for online payment processing and WhatsApp for order enquiries. JUnit, Mockito, MockMvc, Vitest, and Testing Library are used for testing. Docker, Docker Compose, Maven, npm, Railway, and Neon support local development, builds, database hosting, and deployment.

## Portfolio version

Plate & Pantry uses a modern full-stack architecture designed around clear separation of responsibilities. The customer storefront and administration dashboard are implemented with React and TypeScript. Vite provides a fast development environment and optimized production builds, while Tailwind CSS, responsive CSS, Lucide icons, and custom typography provide the design system. React Router handles client-side navigation, Axios provides typed communication with the REST API, and React Context with `localStorage` keeps the customer's cart available between page refreshes.

The backend is implemented with Java 21 and Spring Boot. Spring MVC exposes the REST endpoints, Spring Data JPA and Hibernate manage relational persistence, and HikariCP manages the database connection pool. Spring Security provides administrator sessions, role-based authorization, secure cookies, CORS rules, BCrypt password hashing, and CSRF protection. Jakarta Bean Validation protects API boundaries, and Flyway applies version-controlled database migrations and initial menu data.

PostgreSQL stores categories, products, inventory, customer orders, order items, administrator identities, and payment attempts. Monetary calculations use Java `BigDecimal` and PostgreSQL `NUMERIC` columns to avoid floating-point errors. Database transactions, pessimistic row locking, idempotency keys, and unique constraints protect checkout and inventory consistency.

The ordering workflow supports WhatsApp enquiries and PayHere Sandbox. PayHere hashes are generated only by the backend, and payment status is updated only after validating the provider's server callback signature, merchant ID, order reference, amount, and currency. Browser return URLs cannot mark an order as paid. Duplicate callbacks are handled idempotently.

Quality assurance uses JUnit 5, Mockito, MockMvc, Spring Security Test, and H2 for backend tests, together with Vitest, Testing Library, and jsdom for frontend tests. Maven and npm manage builds and dependencies. Docker Compose runs the local frontend, backend, and PostgreSQL services, while a multi-stage Dockerfile creates the production image. Railway hosts the application and Neon provides managed PostgreSQL connectivity.

## Detailed stack

### Frontend

| Technology | Purpose |
| --- | --- |
| React 19 | Component-based customer and administration interfaces |
| TypeScript 7 | Static typing for components, API responses, and business models |
| Vite 8 | Development server, API proxy, TypeScript workflow, and production bundling |
| Tailwind CSS 4 | Utility-driven styling and responsive layouts |
| React Router 7 | Client-side navigation and nested route handling |
| Axios | HTTP client for REST API communication and session credentials |
| React Context API | Shared shopping-cart state |
| Browser `localStorage` | Cart persistence between browser sessions |
| Lucide React | Consistent interface iconography |
| DM Sans and Fraunces | Body and display typography |

### Backend

| Technology | Purpose |
| --- | --- |
| Java 21 | Backend programming language and runtime target |
| Spring Boot 4.1 | Application configuration, dependency management, and runtime |
| Spring MVC | REST controllers, JSON requests, and HTTP responses |
| Spring Data JPA | Repository abstraction and transactional persistence |
| Hibernate ORM | Java entity mapping and database interaction |
| Spring Security | Sessions, authentication, authorization, CORS, and CSRF |
| Jakarta Validation | Validation of checkout, admin, and catalogue requests |
| HikariCP | JDBC connection pooling |
| Maven | Backend dependency management, testing, and packaging |

### Database and consistency

| Technology | Purpose |
| --- | --- |
| PostgreSQL 17 | Primary relational data store |
| Neon PostgreSQL | Managed production database platform |
| Flyway | Versioned schema migrations and seed data |
| PostgreSQL transactions and locks | Inventory consistency during simultaneous checkout requests |
| Idempotency keys | Duplicate checkout prevention |
| `BigDecimal` and `NUMERIC(12,2)` | Accurate currency calculations and storage |

### Integrations

| Technology | Purpose |
| --- | --- |
| PayHere Sandbox Checkout API | Test-mode online card-payment workflow |
| PayHere callback verification | Server-side payment authenticity and value checks |
| WhatsApp `wa.me` links | Customer order enquiries with generated order summaries |
| Cloudflare Quick Tunnel | Temporary public HTTPS endpoint for local callback testing |

### Testing

| Technology | Purpose |
| --- | --- |
| JUnit 5 | Backend unit and integration tests |
| Mockito | Service dependency mocking |
| MockMvc | Spring controller and security testing |
| Spring Security Test | Authentication and CSRF test helpers |
| H2 | Isolated relational database for automated tests |
| Vitest | Frontend unit tests |
| Testing Library | User-focused React component testing |
| jsdom | Browser-like test environment |

### DevOps and deployment

| Technology | Purpose |
| --- | --- |
| Git and GitHub | Version control and remote source hosting |
| Docker | Reproducible frontend and backend images |
| Docker Compose | Local PostgreSQL, backend, and frontend orchestration |
| Nginx | Local container SPA hosting and `/api` reverse proxy |
| Multi-stage Docker build | Combined, minimal production application image |
| Railway | Public application hosting and runtime configuration |
| Neon | Managed PostgreSQL and supporting development tooling |

## One-line stack

**React 19 + TypeScript + Vite + Tailwind CSS | Java 21 + Spring Boot + Spring Security + Spring Data JPA | PostgreSQL + Flyway | PayHere Sandbox + WhatsApp | JUnit + Vitest | Docker + Railway + Neon**
