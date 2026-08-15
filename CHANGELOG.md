# Changelog

All notable changes to this project. Format loosely follows [Keep a Changelog](https://keepachangelog.com/). No versioned releases yet — everything below is grouped under Unreleased.

## [Unreleased]

### Payments: Stripe checkout (added)

- `POST /payments/create-intent` and `POST /payments/webhook` (`payments`/`stripe` modules). Amount is always server-derived from `OrdersService.calculateTotalInSatang`, never taken from the client; an open PaymentIntent is reused rather than duplicated, and creation is idempotent per order
- Webhook verifies the Stripe signature (`STRIPE_WEBHOOK_SECRET`) and dedupes on a `ProcessedEvent` row keyed by `event.id` (Stripe retries at-least-once), written in the same transaction as the order status change so a failure leaves the event retryable. `payment_intent.succeeded/processing/payment_failed` drive `Order.status`; the confirmation email fires after commit, best-effort
- Frontend: `CheckoutConfirmPage` places the order, creates the intent, and mounts Stripe's Payment Element (card + PromptPay, since `automatic_payment_methods` is enabled server-side), confirming with `redirect: 'if_required'`; supports retrying an already-created order via a `retryOrderId` query param. `PaymentSuccessPage` polls `GET /orders/:id` rather than trusting the client-side confirm result, since webhook delivery races the redirect
- Cart clearing is deferred until payment actually settles (`markPaid`), not at checkout time, so an abandoned or failed payment doesn't silently empty the cart

### Shipping & order tracking (added)

- `shipments` / `shipment_events` modules: creating a `Shipment` moves its order to `shipped`; each `ShipmentEvent` optionally advances it further via a `ShipmentStatus → OrderStatus` map (`picked_up|in_transit|out_for_delivery → shipping`, `delivered → delivered`) gated by `OrdersService.transitionStatus`'s `ALLOWED_TRANSITIONS`, so an out-of-order carrier scan can't walk a delivered order backward
- `carriers` module: admin-only CRUD (`@Roles('admin')`) plus one public `GET /carriers` for shipping-option pickers, filtered to active carriers. `tracking-url.util.ts` builds the customer tracking link from `Carrier.trackingUrlTemplate`'s `{trackingNumber}` placeholder, shared by the dispatch email and the tracking endpoint so they can't drift apart
- Shipment-dispatch email sent from `ShipmentsService.create`, best-effort, via the same `MailService` used for OTP and order confirmation
- Frontend: `OrdersPage` (5 grouped status tabs over the 9 raw `OrderStatus` values, search, sort, skeletons), `OrderDetailPage` (progress stepper for on-track orders, explanatory card for cancelled/refunded/failed), `OrderTrackingPage` (shipment timeline, falls back to already-fetched shipment data on error)
- `backend/src/seed/shipping.seed.ts` (`npm run seed:shipping`) — upserts 3 real carriers with working tracking URL templates, and with `-- --order=<id>` creates a full shipment + timeline for a given order; `backend/src/seed/products.seed.ts` (`npm run seed:products`) seeds catalog products with placeholder images

### RBAC (added)

- `User.role` (`admin` | `customer`) plus `RolesGuard` + `@Roles(...)` decorator, stacked after `AuthGuard` (`@UseGuards(AuthGuard, RolesGuard) @Roles('admin')`). Role is re-read from the database rather than trusted from the JWT, since tokens minted before roles existed carry none. Applied to carrier write routes and admin order routes

### Notifications module (added, not yet wired up)

- `notifications` module: `Notification` entity + `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`, and a `createNotification` service method intended for other services to call. Nothing calls it yet — the in-app notification table stays empty for now. Actual customer emails (order confirmation, shipment dispatch) go through `MailService` directly, not through this module

### Fixed

- `Order` timestamps (`createdAt`/`updatedAt`/`deletedAt`) were an untyped Postgres `timestamp` with no zone, so UTC-written values read back shifted by the server's offset — now explicit `type: 'timestamptz'`
- `CartItemService.update` returned a bare row with no `product`/`user` relations after a quantity change
- Scrollbar now always reserves its gutter (`scrollbar-gutter: stable`) so switching between short and tall pages doesn't shift centered/flex layouts horizontally

### Migration notes

- **Database switched from SQLite to Postgres.** `backend/mydb.sqlite` is no longer read by the app; `TypeOrmModule` now connects to Postgres via `POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB`/`POSTGRES_DB_HOST`/`POSTGRES_DB_PORT`/`POSTGRES_DB_SSL`. Local dev runs it via `docker compose up -d` in `backend/` (`backend/docker-compose.yml`, credentials default to `rumo`/`rumo123`/`rumo`). All 15 tables' worth of existing data (4 users, 55 products, 19 categories, etc.) were copied over in FK dependency order and audited: row counts, ids, emails and password hashes all match the SQLite source exactly; serial sequences were reset past the migrated max ids
- **Several `@Column()` declarations gained an explicit `type`.** `Product.price/stock/ratingCount/soldCount`, `CartItem.quantity`, `Order.totalQuantity` and `ProductImage.index` were bare `number` columns — SQLite guessed float, Postgres guesses integer for the identical decorator, and the mismatch only surfaces when real decimal data (`Product.ratingAvg`, e.g. `4.9`) hits the now-integer column. `ratingAvg` is `decimal(2,1)` with a transformer so it still round-trips as a JS number rather than the string `pg` normally returns for decimal columns — the frontend's `ratingAvg: number` and its rating filter depend on that
- **New required env vars.** The backend will not boot without `REDIS_URL` (must be `rediss://` for Upstash / Redis Cloud) or with `OTP_JWT_SECRET` equal to `JWT_SECRET`. Also new: `OTP_HASH_SECRET`, the `OTP_*` policy knobs, `MAIL_*`, `CORS_ORIGIN`, `POSTGRES_*`. See `backend/.env.example`
- **Existing access tokens are invalid.** `AuthGuard` now requires `typ: 'access'`, which older tokens do not carry. Log in again
- **`user.email_verified` column added.** Applied via `synchronize`, audited before and after: all 15 tables kept their row counts and every id, email and password hash was unchanged. The 4 pre-existing accounts were then set to verified, since they predate the verification flow and would otherwise have been locked out — reverse with `UPDATE "user" SET email_verified = 0` if you want them to re-verify
- **Login is now two requests.** Any client calling `POST /auth/login` and expecting `access_token` in the response must be updated to follow up with `POST /auth/verify-otp`
- **`user.age` is now nullable.** The signup design collects name, email and password only, so a required age column would have made `/auth/register` impossible to satisfy. Applied and audited the same way as `email_verified`; existing ages are untouched. This also fixes `POST /users`, which returned 500 whenever the optional `age` in `CreateUserDto` was omitted

### Auth: email OTP (added)

Three flows, one mechanism. Every emailed code is a server-side challenge in Redis addressed by a short-lived pointer token; the flows differ only by a `purpose`.

**Infrastructure**

- `RedisModule` — one process-wide `ioredis` client behind a `REDIS_CLIENT` token, TLS via `rediss://`, PING on boot, connection closed on shutdown. The dev server now refuses to start without a reachable `REDIS_URL`
- `MailService` — nodemailer wrapper with `smtp` and `log` transports; `log` prints the code to the terminal and throws if `NODE_ENV=production`. Per-flow subjects and copy in `mail/templates/otp-email.ts`
- `OtpService` — the only code that touches Redis. Codes from `crypto.randomInt`, stored as peppered HMAC-SHA256 (never plaintext), `timingSafeEqual` comparison, atomic `SET NX` resend cooldown, atomic `HINCRBY` attempt counter, one-time use enforced via the `DEL` return value, plus a per-address lockout that survives across challenges
- `@nestjs/throttler` with `ip` and `email` throttlers (the latter keyed on a hash of the request body's email), applied per auth route rather than globally

**Login second factor** — `POST /auth/login` now checks the password and emails a 6-digit code instead of returning a token; `POST /auth/verify-otp` exchanges the code for the access token; `POST /auth/resend-otp` rotates it. Access tokens carry `typ: 'access'` and `AuthGuard` rejects anything else, so a challenge token cannot reach a protected route.

**Email verification on signup** — new `POST /auth/register` (self-signup was previously impossible; `POST /users` is guard-locked), `POST /auth/verify-email`, `POST /auth/resend-verification`. Added `User.emailVerified`, default false. Login refuses unverified accounts with a 403 carrying `emailVerificationRequired` and a fresh verification token — checked *after* the password, so account state never leaks to an anonymous caller.

**Password reset** — `POST /auth/forgot-password` and `POST /auth/reset-password`, scoped to a `password_reset` purpose. Unknown addresses get an identical 200, an identical body shape, an identical cooldown and an identical wrong-code error, via a real challenge that is simply never mailed.

**Flow isolation** — challenge tokens are signed with `OTP_JWT_SECRET`, separate from `JWT_SECRET`, and carry `typ` of `otp_challenge` | `email_verify` | `password_reset`. The purpose is bound twice: on the JWT claim and again against the copy in the Redis challenge, so a token from one flow cannot be spent on another. Boot fails if the two secrets are equal.

**Tests** — 79 unit tests across `auth/*`, `mail/*` and `users.service`, covering one-time use, cross-flow token confusion for every pair, cooldown and lockout behaviour, and enumeration parity. Plus an out-of-tree end-to-end pass (33 checks) driving the real HTTP surface against an in-memory Redis.

### Backend (NestJS + TypeORM/SQLite)

- Users module with auth-aware create/update (password hash hidden from responses)
- Catalog: `products`, `categories`, `product-images`, `product-options`, `product-option-values`, `product-skus`, `product-sku-option-values` — full CRUD, soft-delete on SKU option values
- Product search/listing: home feed, mall-only feed, category filter, free-text search, price/rating filters (query builder w/ brackets)
- `storeType` (`mall` / `seller`) added to products for marketplace vs first-party distinction
- Cart: `cart-items` module
- Orders: `orders`, `order_items`, `addresses` modules with relations wired together
- Shipping: `shipments`, `shipment_events`, `carriers` modules
- Image uploads via Multer + `ServeStaticModule`, serving `uploads/products` and `uploads/categories`
- Entity column naming cleanup: migrated snake_case DB fields to camelCase across product, cart-item, order, shipment, and user entities

### Auth UI (added)

Five Quasar screens converted from the Claude Design mockup at `Everything/RUMO Authentication Design/Authentication.dc.html`, which held all of them in one component switched by `state.view`.

- `layouts/AuthLayout.vue` plus `pages/auth/{Login,Register,Otp,ForgotPassword,ResetPassword}Page.vue` at `/login`, `/register`, `/verify`, `/forgot-password`, `/reset-password`
- `OtpPage` covers both the login second factor and signup verification, swapping its title, back link and submit target on the challenge purpose — mirroring the mockup's shared `isOtpView`
- Shared pieces: `components/auth/{AuthField,OtpDigits,ResendLine}.vue`, `composables/useOtpTimer.ts` (300s expiry / 60s resend, matching the backend), `css/auth.scss` holding every transcribed design token
- `OtpDigits` keeps the mockup's input behaviour: a pasted six-digit string fills forward from the focused box, backspace and arrows walk between boxes, filled boxes take the brand border
- `stores/authStore.ts` — session (`accessToken` + `user` in localStorage) kept separate from the in-flight challenge (`otpToken` + purpose in sessionStorage). `resend` dispatches to `resend-otp`, `resend-verification`, or a repeat `forgot-password` depending on the flow
- Router guard for `guestOnly` and `requiresChallenge`; `requiresAuth` is wired but unused
- Axios request interceptor attaches the bearer token; the response interceptor clears a dead session on 401 but ignores `/auth/*`, where 401 means "wrong code"
- Registered Quasar's `Notify` and `Loading` plugins, which were never registered — every existing `Notify.create` / `Loading.show` call in the product/category stores had been a silent no-op

### Frontend (Vue 3 + Quasar)

- Axios boot module with a shared `$api` instance
- `MainLayout` with clickable/active nav, search bar, shadowed active state
- `HomePage`: product grid, category buttons, filter dialog (price/rating/store type), loading/empty states
- `MallPage` and `CouponPage`
- `SearchPage` with filters and image/text display fixes
- `ProductCard` and `CategoryCard` components
- `ProductDetailPage` with `ProductGallery` (4-thumbnail preview, arrow navigation, full-image lightbox dialog), showing category on open
- Pinia stores: `productStore`, `categoryStore`, `productImageStore`
- Shared `models.ts` TypeScript interfaces mirroring backend entities
- i18n scaffolding (`en-US`)

### Security fixes

- **User enumeration via status code**: `UsersService.findOneByEmail` uses `findOneOrFail`, so an unknown address threw `EntityNotFoundError` → HTTP 500 while a wrong password returned 401 — a reliable oracle for which addresses have accounts. Added `findOneByEmailForAuth`, which returns `null`, and switched auth to it
- **User enumeration via timing**: login now runs `bcrypt.compare` against a dummy hash when no user exists, so the "no such account" path costs the same as "wrong password"
- `SignInDto.email` had no `@IsEmail()` — it now feeds Redis keys and throttler buckets, so it is validated
- `ValidationPipe` ran with no options, silently accepting unknown body properties; now `{ whitelist: true, transform: true }`
- `app.enableCors()` allowed every origin; now restricted via `CORS_ORIGIN`
- Removed a duplicated `.addBearerAuth()` and unreachable code after a `return` in `AuthService.signIn`

### Fixed

- Jest could not resolve the `src/...` absolute imports used throughout the source, so any spec importing across modules failed to run — added `modulePaths` to the jest config
- Product/category image upload flows (multipart form handling, optional image on update)
- Mall-route vs `:id`-route controller ordering conflict
- Repeated route clicks forcing unwanted page reloads
- Filter state not resetting on category change / dialog cancel
- Various DTO/entity/service mismatches surfaced while scaffolding new resources
