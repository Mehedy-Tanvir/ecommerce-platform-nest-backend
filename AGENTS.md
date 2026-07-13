# AGENTS.md — E-Commerce NestJS Backend

## Quick start

### Local dev (no Docker)
```bash
cp .env.example .env   # fill in DATABASE_URL, JWT secrets
npm install             # postinstall auto-runs prisma generate
npx prisma migrate dev  # create/apply local migrations (migrations/ are gitignored)
npm run start:dev       # http://localhost:3000, Swagger at /api/docs
```

### Docker dev (Postgres + Redis + app)
```bash
cp .env.example .env
npm run docker:build    # build image & start all services
npm run docker:ps       # verify all 3 containers are Up
npm run docker:migrate  # run Prisma migrations
npm run docker:seed     # seed DB with sample data
# App at http://localhost:3000 — Postgres at :5433, Redis at :6379
```

## Commands
| Command | What it does |
|---------|-------------|
| `npm run start:dev` | Hot-reload dev server |
| `npm run build` | `nest build` (deletes dist/ first via nest-cli.json) |
| `npm run start:prod` | `node dist/main` |
| `npm run lint` | ESLint flat config — auto-fixes |
| `npm run format` | Prettier (singleQuote, trailingComma: all) |
| `npm test` | Jest unit tests matching `src/**/*.spec.ts` |
| `npm run test:cov` | Unit tests with coverage |
| `npm run test:e2e` | E2E tests matching `test/**/*.e2e-spec.ts` |
| `npm run seed` | Seed database with demo data |
| `docker compose up -d` | Start all services (db + redis + app) |
| `docker compose down` | Stop all services |
| `docker compose exec app npx prisma db seed` | Seed inside container |
| `npx prisma studio` | Browse DB via Prisma Studio |
| `npx prisma migrate deploy` | Apply pending migrations |
| `npx prisma generate` | Regenerate Prisma client |
| `npm run docker:build` | Build image & start all services (first-time setup) |
| `npm run docker:up` | Start all services (skip rebuild) |
| `npm run docker:down` | Stop all services |
| `npm run docker:down:clean` | Stop all services and wipe DB volume |
| `npm run docker:ps` | Show container status |
| `npm run docker:logs` | Tail-follow app logs |
| `npm run docker:restart` | Restart the app container |
| `npm run docker:migrate` | Run Prisma migrations inside the container |
| `npm run docker:seed` | Seed database with sample data |
| `npm run docker:exec -- <cmd>` | Run any command inside the app container |

## Architecture
- **Framework**: NestJS v11, TypeScript 5.7, ESM-flavored (`nodenext` module resolution).
- **ORM**: Prisma v7 via `@prisma/adapter-pg` — uses a `pg.Pool` (max 5, idleTimeout 30s) tuned for Vercel serverless.
- **API prefix**: All routes under `/api/v1` (set in `create-app.ts`).
- **Global validation**: `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.
- **Rate limiting**: 10 req/60s global (`@nestjs/throttler`). Custom decorators at `src/common/decorators/custom-throttler.decorator.ts`: `@StrictThrottle` (3/s), `@ModerateThrottle` (5/s), `@RelaxedThrottle` (20/s).
- **Two entry points**: `src/main.ts` (local dev) and `api/index.ts` (Vercel serverless — caches Nest app at module scope).
- **tRPC**: Type-safe API layer at `/api/trpc`. Uses `@trpc/server` with Express adapter. Routers at `src/trpc/routers/`. Context extracts JWT user same as Passport strategies. Procedures: `publicProcedure` (no auth), `protectedProcedure` (JWT required), `adminProcedure` (JWT + ADMIN role required).
- **PrismaModule is `@Global()`** — `PrismaService` available everywhere without importing.

## Modules (under `src/modules/`)
| Module | Controllers | Notes |
|--------|-------------|-------|
| auth | AuthController | JWT access + refresh token rotation (Passport strategies: `jwt`, `jwt-refresh`) |
| users | UsersController | Self-profile + admin user management |
| products | ProductsController | SKU-based, paginated/filterable, soft-activate via `isActive` |
| category | CategoryController | Slug-based lookup, paginated/filterable |
| orders | OrdersController | Order lifecycle: PENDING→PROCESSING→SHIPPED→DELIVERED→CANCELLED |
| payments | PaymentsController | Stripe payment intents, multi-currency |
| trpc | — | tRPC router at `/api/trpc`. Sub-routers: products, categories, auth, orders, users |

## Guards & decorators (`src/common/`)
- **`@UseGuards(JwtAuthGuard)`** — validates JWT access token.
- **`@Roles(Role.ADMIN)` / `@Roles(Role.USER)`** — RBAC (consumed by `RolesGuard`). Requires `JwtAuthGuard` first.
- **`@GetUser()`** param decorator — extracts `request.user` (or `.email`, `.id` etc).
- **`RefreshTokenGuard`** (`extends AuthGuard('jwt-refresh')`) — for `/auth/refresh`.

## Key quirks
- **`src/*` path alias** is configured in tsconfig (`baseUrl: "./", paths: {"src/*": ["src/*"]}`). Use `import { X } from 'src/foo'` in tests.
- **Migrations are gitignored** (`/prisma/migrations/` in `.gitignore`). Run `npx prisma migrate dev` locally. For deployment, run `npx prisma migrate deploy` in CI or manually.
- **`binaryTargets`** in schema includes `"rhel-openssl-3.0.x"` for Vercel deployment compatibility.
- **SwaggerUI static assets** are explicitly bundled in `vercel.json` (`includeFiles: "node_modules/swagger-ui-dist/**"`) because Vercel's tracer doesn't auto-detect them.
- **E2E tests** have a separate Jest config at `test/jest-e2e.json` (rootDir: `.`, regex: `.e2e-spec.ts$`). Unit tests use the in-package.json Jest config (rootDir: `src`).
- **`PrismaService.cleanDatabase()`** deletes all rows — throws in production. Safe for test teardown.
- **Global exception filter** at `src/common/filters/http-exception.filter.ts` catches all exceptions, logs them, and returns a uniform JSON error response with `success: false`.
- **Logging interceptor** at `src/common/interceptors/logging.interceptor.ts` logs every HTTP request (method, url, status, duration).
- **No CI workflows** in `.github/workflows`.

## tRPC Usage

### Calling tRPC endpoints
```bash
# Public query (products)
curl -X POST http://localhost:3000/api/trpc \
  -H "Content-Type: application/json" \
  -d '{"method": "products.getAll", "params": {"limit": 5}}'

# Protected query (with JWT)
curl -X POST http://localhost:3000/api/trpc \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"method": "orders.getMyOrders", "params": {}}'

# Mutation (login)
curl -X POST http://localhost:3000/api/trpc \
  -H "Content-Type: application/json" \
  -d '{"method": "auth.login", "params": {"email": "john@example.com", "password": "Admin123!"}}'
```

### Available routers
| Router | Key | Procedures |
|--------|-----|------------|
| Products | `products` | `getAll`, `getById`, `create`, `update`, `updateStock`, `delete` |
| Categories | `categories` | `getAll`, `getById`, `getBySlug`, `create`, `update`, `delete` |
| Auth | `auth` | `register`, `login`, `refresh`, `logout`, `me` |
| Orders | `orders` | `create`, `getMyOrders`, `getById`, `cancel` |
| Users | `users` | `getProfile`, `updateProfile`, `changePassword` |

### Validation
All tRPC inputs are validated with Zod schemas located at `src/trpc/schemas/`. Errors are returned as `{ success: false, message, code }` matching the REST error shape.

### Auth flow
Protected procedures require a valid JWT access token in the `Authorization: Bearer <token>` header. The token is verified using the same `JwtService` and secret as REST endpoints.
