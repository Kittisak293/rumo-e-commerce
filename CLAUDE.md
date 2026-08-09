# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Multi-vendor e-commerce web app, individual project. Two independent apps, no root package.json / monorepo tooling — always `cd` into the app you're touching.

- `backend/` — NestJS (TypeScript), REST API, TypeORM + Postgres
- `frontend/` — Vue 3 + Quasar Framework (Vite), TypeScript

## Commands

### Backend (`cd backend`)

- `npm run start:dev` — dev server, watch mode
- `npm run build` — `nest build`
- `npm run lint` — eslint --fix over src/apps/libs/test
- `npm run format` — prettier --write
- `npm test` — jest unit tests (spec files colocated under `src/`)
- `npm run test:watch` / `npm run test:cov`
- `npm run test:e2e` — jest with `test/jest-e2e.json` config
- Single test file: `npx jest path/to/file.spec.ts` (jest rootDir is `src`, so paths are relative to `backend/src`)

The dev server needs a running Postgres (see Database below) and a reachable `REDIS_URL` (see Auth below) to boot. Keep `MAIL_TRANSPORT=log` locally — OTP codes are then printed to the terminal instead of emailed.

### Frontend (`cd frontend`)

- `npm run dev` — `quasar dev`
- `npm run build` — `quasar build`
- `npm run lint` — eslint over `src*/**/*.{ts,js,cjs,mjs,vue}`
- `npm run format` — prettier --write
- `npm test` is a no-op placeholder — no frontend test suite exists yet

## Backend architecture

**Module-per-resource pattern.** Every domain lives under `backend/src/<name>/` with the same shape, matching Nest CLI's generated resource layout: `<name>.module.ts`, `<name>.controller.ts`, `<name>.service.ts`, `dto/`, `entities/`. New resources should follow this exact structure. All feature modules and their TypeORM entities are registered by hand in `backend/src/app.module.ts` (`TypeOrmModule.forRoot` takes an explicit `entities` array — new entities must be added there or they won't sync).

**Database**: Postgres, TypeORM `synchronize: true` — schema is derived straight from entity decorators, there are no migrations. Editing an `@Entity` class alters the schema on next boot.

Local dev runs Postgres via `backend/docker-compose.yml` (`docker compose up -d` from `backend/`; credentials in `.env` under `POSTGRES_*`, defaulting to `rumo`/`rumo123`/`rumo` on `localhost:5432`). `POSTGRES_DB_HOST`/`POSTGRES_DB_PORT` point `app.module.ts` at a managed provider instead (Neon, Supabase, Railway) — set `POSTGRES_DB_SSL=true` for those, since they require TLS and the local container doesn't support it.

`synchronize: true` is still a live hazard, not a convenience — it was true under the old SQLite setup too, and the risk carries over unchanged: it can silently touch tables you didn't edit (adding one column to `User` also rebuilt `cart_item`, `shipment`, `product` and `carrier` and re-created their foreign keys). Diff row counts before and after any entity change; on Postgres, `synchronize` issues real `ALTER TABLE`, so it's less prone to silent data loss than SQLite's rebuild-the-table approach was, but it is not immune.

**Declare `@Column` types explicitly.** A bare `@Column() foo: number` lets TypeORM guess the native column type from the driver, and the guess is driver-specific: SQLite mapped an untyped `number` to a real/float column, Postgres maps the same declaration to `integer`. That divergence is invisible until a real decimal value hits the Postgres integer column and the insert fails — this is exactly what broke `Product.ratingAvg` during the SQLite→Postgres migration. Always set `type: 'int'`, `'decimal'`, etc. explicitly. Decimal/numeric columns then come back from `pg` as **strings**, not numbers (precision safety) — if the frontend does arithmetic on the value, add a TypeORM `transformer` to parse it back to a number on read (see `Product.ratingAvg` for the pattern) rather than pushing the coercion onto every call site.

**Catalog data model** (drives most of the complexity): `Product` → `ProductSku` → `ProductSkuOptionValue` → `ProductOptionValue` → `ProductOption`, plus `ProductImage` and `Category`. Orders: `Order` → `OrderItem`, `Address`. Shipping: `Shipment` → `ShipmentEvent`, `Carrier`. Cart: `CartItem`. `Product.storeType` (`mall` | `seller`) distinguishes first-party vs marketplace listings and is filtered on throughout search/home/mall endpoints.

**File uploads**: product/category images go through Multer `FileInterceptor` in the relevant controllers and are written under `backend/uploads/`. `ServeStaticModule` exposes `uploads/products` at `/static-images` and `uploads/categories` at `/category-images` (configured in `app.module.ts`).

## Auth

Every email code in the app — login second factor, address verification, password reset — is one mechanism: a **server-side OTP challenge** in Redis, addressed by a short-lived pointer token. Do not add a second OTP implementation; add a purpose.

**Three moving parts.** `RedisModule` (`src/redis/`) provides a single process-wide `ioredis` client under the `REDIS_CLIENT` token — inject that token, never `new Redis()`. `MailService` (`src/mail/`) wraps nodemailer with two transports, `smtp` and `log`. `OtpService` (`src/auth/otp.service.ts`) owns all challenge logic and is the only thing that talks to Redis.

**The challenge.** `createChallenge` generates a code with `crypto.randomInt`, stores its HMAC-SHA256 (peppered with `OTP_HASH_SECRET`, which never enters Redis) plus a `purpose` and an attempt counter, and claims a per-address resend cooldown with `SET NX EX`. `verifyChallenge` compares digests with `timingSafeEqual`, counts attempts with `HINCRBY`, and consumes the challenge by checking that `DEL` returned `1`. Redis keys: `otp:chal:{jti}`, `otp:cooldown:{sha256(email)}`, `otp:fail:{sha256(email)}`.

Two things there are load-bearing and easy to break: the **cooldown is deliberately shared across purposes** (the cap that matters is total mail per address per minute), and there are **two independent counters** — per-challenge `attempts` plus a per-address `otp:fail` that survives across challenges, because per-challenge alone is bypassable by just requesting a new one.

**Token types.** Access tokens are signed with `JWT_SECRET` and carry `typ: 'access'`; `AuthGuard` rejects anything else, so tokens minted before this claim existed are invalid. Challenge tokens are signed with a **different** secret, `OTP_JWT_SECRET`, and carry `typ` = one of `otp_challenge` | `email_verify` | `password_reset` (`src/auth/otp.constants.ts`). Since all three share one secret, the purpose is bound twice: the JWT claim on the way in, and the copy stored in the Redis challenge. `main.ts` refuses to boot if the two secrets match.

**Flows.** `POST /auth/register` creates an unverified account and issues an `email_verify` challenge; `POST /auth/verify-email` flips `User.emailVerified` and deliberately issues no access token. `POST /auth/login` checks the password, then refuses unverified accounts with a 403 carrying `emailVerificationRequired` plus a fresh verification token, then issues an `otp_challenge`; `POST /auth/verify-otp` is the only path that mints an access token. `POST /auth/forgot-password` → `POST /auth/reset-password` uses `password_reset`. Each has a `resend-*` sibling that rotates the challenge.

**Enumeration rules to preserve.** Unknown email and wrong password must stay indistinguishable — same status, same message, and the same cost, which is why `startLogin` runs `bcrypt.compare` against a dummy hash when no user exists. Account state is only revealed *after* the password checks out. `forgot-password` always answers 200 and creates a real (unmailed) challenge for unknown addresses so the cooldown and the wrong-code error match a real account. Use `UsersService.findOneByEmailForAuth` (returns `null`), never `findOneByEmail` (throws → 500, which is itself an oracle).

**Rate limiting** is `@nestjs/throttler`, configured in `app.module.ts` with two named throttlers: `ip`, and `email` whose `getTracker` hashes `req.body.email`. Guards run before `ValidationPipe`, so that body is unvalidated — hence the `typeof` check and length cap. It is applied **per route** via `@UseGuards(ThrottlerGuard)`, not globally, and its in-memory store is defence in depth only; the durable limits are the Redis keys.

`AuthGuard` is likewise **not** global — add `@UseGuards(AuthGuard)` per route/controller (currently `auth` and `users`).

Env vars for all of the above are documented in `backend/.env.example`.

## Testing notes (backend)

- **Most existing `.spec.ts` files are failing Nest CLI scaffolds** that never mocked their dependencies (~29 suites). They were already red before any recent work — do not treat them as a regression you caused. Real coverage currently exists for `auth/*`, `mail/*` and `users.service`; follow those as the pattern when filling in others.
- Jest needs `modulePaths: ["<rootDir>/../"]` (already in `package.json`) to resolve the `src/...` absolute imports the source uses, because `rootDir` is `src` while tsconfig's `baseUrl` is `backend/`.
- `bcrypt` is a native addon with non-configurable exports, so `jest.spyOn(bcrypt, 'compare')` throws `Cannot redefine property`. Use `jest.mock('bcrypt', () => ({ compare: jest.fn(), hash: jest.fn() }))`.
- Nest instantiates `@UseGuards` enhancers at module compile time, so a controller spec must `.overrideGuard(ThrottlerGuard)` / `.overrideGuard(AuthGuard)` or DI will fail before any test runs.
- `OtpService` and `MailService` are unit-testable precisely because Redis arrives via the `REDIS_CLIENT` token and nodemailer via `createTransport` — override the token, `jest.mock('nodemailer')`. Keep it that way.
- To exercise the flows over real HTTP without Upstash: build, then boot a testing module with `REDIS_CLIENT` overridden by an in-memory fake and `MailService` by a recorder that captures codes. Point it at the real `docker compose` Postgres (or a disposable database on the same instance) — `app.module.ts` reads connection details from env, so no path hard-coding to work around.

## Frontend architecture

Quasar app-vite structure. Routes are declared in `frontend/src/router/routes.ts`, all under a single `MainLayout` shell; pages live in `src/pages/`. Domain state is split into Pinia stores under `src/stores/` (`productStore`, `categoryStore`, `productImageStore`) rather than fetched ad hoc from components. `frontend/src/models.ts` hand-mirrors the backend entity shapes (camelCase) — there is no shared types package, so backend entity changes must be manually reflected there.

API access goes through the singleton `$api` axios instance created in `boot/axios.ts` (`baseURL` from `VITE_API` env var, defaults to `http://localhost:3000`) — use `api` (named export) or `this.$api`, not a fresh axios instance per call.

i18n is wired via `boot/i18n.ts` + `src/i18n/`, currently `en-US` only.

Quasar's `Notify` and `Loading` plugins are registered in `quasar.config.ts`. They must stay registered — the Pinia stores call `Notify.create` / `Loading.show` imperatively, and those are silent no-ops if the plugin list is empty.

## Auth UI

Five screens under `pages/auth/`, all sharing `layouts/AuthLayout.vue` (grey page, RUMO wordmark, white card): `LoginPage`, `RegisterPage`, `OtpPage`, `ForgotPasswordPage`, `ResetPasswordPage`, routed as `/login`, `/register`, `/verify`, `/forgot-password`, `/reset-password`.

`OtpPage` serves **two** flows — the login second factor and signup email verification — switching its title, back link and submit target on `authStore.otpPurpose`, exactly as the source mockup's single `isOtpView` did.

**Styling is transcribed, not improvised.** Every colour, radius, padding and margin comes from `Everything/RUMO Authentication Design/Authentication.dc.html`, collected as classes in `src/css/auth.scss` (`.auth-page`, `.auth-card`, `.auth-field`, `.auth-submit`, `.auth-otp`, …). Screens compose those classes and add no ad-hoc styles; keep it that way so the five stay consistent. The pages deliberately use plain `<input>`/`<button>` rather than `QInput`/`QBtn` — Quasar's own field chrome would have to be fought at every step to hit these values.

`authStore` (`stores/authStore.ts`) is the only place that talks to the auth endpoints. It holds two separate things: the **session** (`accessToken` + `user`, in `localStorage`) and the **in-flight challenge** (`otpToken`, its purpose, the masked address, in `sessionStorage` so it dies with the tab). Screens never see an `otpToken`; they call `login` / `register` / `verifyOtp` / `verifyEmail` / `forgotPassword` / `resetPassword` / `resend` and read `otpPurpose`.

`resend` fans out by purpose: `resend-otp` for login, `resend-verification` for signup, and for password reset it re-runs `forgot-password` with the address the user typed, because the backend has no reset-specific resend endpoint. That is why the store keeps the plaintext address alongside the server-masked one.

The router guard (`router/index.ts`) enforces three things: `meta.requiresAuth` (opt-in, nothing uses it yet), `meta.guestOnly` on the auth screens, and `meta.requiresChallenge` on `/verify` and `/reset-password` — deep-linking or reloading those without a live challenge sends you back to `/login`.

`boot/axios.ts` attaches `Authorization: Bearer` from `localStorage` on every request and clears the session on a 401 — but **skips that for `/auth/*`**, where 401 is the ordinary answer to a wrong code and must not bounce the user out of the form.
