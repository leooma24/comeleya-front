# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**ComeleYa** — Multi-tenant digital menu + delivery/orders platform. This repo is the **frontend only**. The Laravel backend lives at `c:\laragon\www\comeleya-laravel` and is served at `https://app.comeleya.com/api/`. When a task mentions "the backend" or "back", edit files there.

## Commands

```bash
npm run dev          # quasar dev — local dev server
npm run build        # quasar build — outputs to dist/spa
npm run lint         # eslint .js/.vue
npm run format       # prettier
npm run test         # vitest watch
npm run test:run     # vitest run (single pass)
```

Single test: `npx vitest run path/to/file.test.js`

## Deploy

`deploy.ps1` (PowerShell + FTP) handles both front and back:

- `.\deploy.ps1 front` — build + FTP upload to `/public_html` (renames `index.html` → `index.php`, injects `metadata.php` include)
- `.\deploy.ps1 back [minutes]` — scans `app/routes/config/database` in the Laravel repo for files modified in the last N minutes (default 60), prompts before uploading to `/app.comeleya.com`
- `.\deploy.ps1 all`

The `back` command is interactive (`Read-Host`). When calling from Claude, either upload backend files directly via FTP in a one-shot PowerShell call (credentials are in `deploy.ps1`) or use `.\deploy.ps1 back 9999` to include everything.

After backend deploy, run in production: `php artisan migrate --force`, `php artisan config:clear`.

## Architecture

**Stack:** Vue 3 (Composition API, `<script setup>`) + Quasar 2 (Vite) + Pinia + Vue Router 4 (history mode). Path aliases via `jsconfig.json` (`components/*`, `stores/*`, `pages/*`, `layouts/*`, `boot/*`).

### Routing (multi-tenant by slug)

- `/` — marketing landing (MainPage + PageLayout)
- `/:slug` — customer-facing restaurant menu (IndexPage + MainLayout)
- `/:slug/admin` — per-restaurant admin dashboard (AdminPage + AdminLayout, requires auth)
- `/admin` — super-admin dashboard
- `/nuevo-establecimiento`, `/recuperar-contrasena`, `/restablecer-contrasena`, `/suscripcion/resultado` — standalone flows

Route guards in `src/boot/routes.js` enforce `requiresAuth`. Unauthenticated admin access redirects to `/{slug}/admin/iniciar-sesion`.

### Stores (Pinia, some persisted via `pinia-plugin-persistedstate`)

| Store | Role |
|-------|------|
| `main-store` | Global UI state + customer order flow (cart drawers, payment, tip, coupon, `creatingOrder`, `buildWhatsAppUrl`, `openWhatsApp`, `validationDialog`) |
| `user-store` | Auth (`token`, `user`), persisted |
| `cart-store` | Shopping cart array + total, persisted |
| `order-store` | Current order, admin orders list, `orderHistory` (last 20, persisted) |
| `company-store` | Establishment config for current slug, persisted |
| `products` | Product catalog, persisted |
| `admin-store` | Admin panel state (forms, prospects, packages) |
| `message-store` | Notify wrapper |

### API layer

`src/boot/axios.js` creates the `api` instance. Base URL comes from `VITE_API_URL` env, fallback `https://app.comeleya.com/api/`. Interceptors: auto-attach `Bearer` token, inject `X-Timezone` header, auto-logout on 401 or `"Unauthenticated."` response.

### Customer order flow (key UX path)

1. Customer browses `/{slug}` menu → adds items to cart (`cart-store`)
2. Checkout dialogs: `DataDrawer` (name/address) → `PaymentDrawer` (method, tip, coupon)
3. `main-store.creatingOrder()` POSTs to `/establishment/{slug}/order`
4. On success: `buildWhatsAppUrl()` constructs a formatted WhatsApp message, `ValidationDialog` opens, customer taps the WhatsApp button to send the order to the restaurant.
5. **Do not call `openWhatsApp()` automatically after the `await`** — mobile browsers block the popup outside user-gesture context. Rely on the button click in `ValidationDialog`.

### Ticket printing

Both `ValidationDialog.vue` (customer) and `admin/Orders.vue` (admin) implement `printOrder()` using the same pattern: `window.open('', '_blank')` → `document.write()` with inline `<style>` → `print()` → `close()`. The admin version consumes fields from the orders endpoint (`order.items[].dish`, `order.items[].extras[].options[]`, `order.total`, `discount`, `tip`, `payment_method`, `delivery_address`, etc. — these are selected explicitly in `AdminController@orders` / `@moreOrders`). The reference implementation with monospace ticket styling (sep lines, section titles) lives in these two files plus `admin/Analytics.vue`.

### Admin panel

Composed of sections in `src/components/admin/`: `Orders.vue` (status tabs + polling via `setTimeout` every 10s + browser notifications + audio beep on new order), `Products.vue`, `Categories.vue`, `Crm.vue` (pipeline de prospectos), `Analytics.vue`, `Drivers.vue`, etc. Single `AdminPage.vue` switches between them via `adminStore.tab`.
