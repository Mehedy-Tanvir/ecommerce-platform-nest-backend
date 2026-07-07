<h1 align="center">
  🛒 E-Commerce Platform — NestJS REST API
</h1>

<p align="center">
  A production-grade, scalable REST API backend for an e-commerce platform built with <strong>NestJS</strong>, <strong>Prisma ORM</strong>, and <strong>PostgreSQL</strong>. Featuring JWT-based authentication with refresh token rotation, role-based access control, and full Swagger documentation. Deployed serverlessly on <strong>Vercel</strong>.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-v11-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-7.x-2D3748?style=for-the-badge&logo=prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Swagger-OpenAPI-85EA2D?style=for-the-badge&logo=swagger&logoColor=black" />
  <img src="https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" />
  <img src="https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" />
</p>

<p align="center">
  🔗 <strong>Live API:</strong> <a href="https://ecommerce-platform-nest-backend.vercel.app">https://ecommerce-platform-nest-backend.vercel.app</a><br/>
  📖 <strong>Live Swagger Docs:</strong> <a href="https://ecommerce-platform-nest-backend.vercel.app/api/docs">https://ecommerce-platform-nest-backend.vercel.app/api/docs</a>
</p>

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Live Demo](#-live-demo)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [API Endpoints](#-api-endpoints)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Deployment (Vercel)](#-deployment-vercel)
- [Testing](#-testing)
- [Scripts Reference](#-scripts-reference)

---

## 🌟 Overview

This is a **fully-featured, production-ready REST API** for an e-commerce platform. It handles authentication, user management, product catalog, category management, shopping cart, orders, and payments — all following enterprise-level architecture patterns with clean separation of concerns.

The API is versioned (`/api/v1`), fully documented with **Swagger/OpenAPI**, and enforces strict input validation via **class-validator** throughout. It's deployed as a serverless function on **Vercel**, with a cached NestJS application instance and a connection-pooled Prisma/PostgreSQL setup optimized for the serverless runtime.

---

## 🚀 Live Demo

| Resource                          | URL                                                                                                                          |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Base API URL**                  | [`https://ecommerce-platform-nest-backend.vercel.app/api/v1`](https://ecommerce-platform-nest-backend.vercel.app/api/v1)     |
| **Swagger UI (Interactive Docs)** | [`https://ecommerce-platform-nest-backend.vercel.app/api/docs`](https://ecommerce-platform-nest-backend.vercel.app/api/docs) |

The Swagger UI is fully interactive — you can register a user, log in, authorize with the returned JWT, and try out every endpoint directly from the browser, no local setup required.

---

## ✨ Features

### 🔐 Authentication & Security

- **JWT Access + Refresh Token** — Dual-token strategy with short-lived access tokens (15 min) and long-lived refresh tokens
- **Refresh Token Rotation** — Refresh tokens are hashed and stored securely; rotated on every refresh call
- **Secure Logout** — Invalidates the stored refresh token on logout
- **Password Hashing** — All passwords are hashed using **bcrypt** (v6)
- **Global Validation Pipe** — Strict `whitelist` + `forbidNonWhitelisted` DTO validation on every request

### 👤 User Management

- Register & login with email/password
- Get own profile (`GET /api/v1/users/me`)
- Update own profile & change password
- Delete own account
- Admin can list, fetch, and delete any user

### 🛍️ Product Catalog

- Create, update, and retrieve products (Admin only for mutations)
- **SKU-based** unique product identification
- Product stock management
- Soft-activate/deactivate products via `isActive` flag
- **Paginated & filterable** product listing

### 📂 Category Management

- Full CRUD for product categories (Admin only for mutations)
- **Slug-based** category lookup (SEO-friendly)
- Filterable and paginated category listing
- Guard against deleting categories that have associated products

### 🛒 Shopping Cart

- Cart per user with cart items
- Prevent duplicate product entries per cart (`@@unique([cartId, productId])`)
- Checkout flow linking carts to orders

### 📦 Orders & Payments

- Full order lifecycle: `PENDING → PROCESSING → SHIPPED → DELIVERED → CANCELLED`
- Payment tracking: `PENDING → COMPLETED → FAILED → REFUNDED`
- Multi-currency payment support
- Transaction ID tracking

### 🏗️ Architecture & Developer Experience

- **Role-Based Access Control (RBAC)** — `USER` and `ADMIN` roles enforced via custom `@Roles()` decorator + `RolesGuard`
- **Custom Decorators** — `@GetUser()` decorator for clean user extraction from JWT payload
- **Modular Architecture** — Each domain (`auth`, `users`, `products`, `category`) is a self-contained NestJS module
- **Database Indexing** — Optimized indexes on frequently queried fields (email, SKU, slug, status, userId)
- **CORS Configured** — Configurable allowed origins via environment variable
- **Swagger UI** — Interactive API docs available at `/api/docs`, with a dynamic server URL that automatically points at wherever the API is currently deployed
- **Serverless-Optimized** — Cached NestJS application instance across warm Lambda invocations, and a `pg.Pool`-backed Prisma adapter tuned for serverless connection reuse

---

## 🧰 Tech Stack

| Layer                | Technology                                                      |
| -------------------- | --------------------------------------------------------------- |
| **Framework**        | [NestJS v11](https://nestjs.com/)                               |
| **Language**         | TypeScript 5.7                                                  |
| **ORM**              | [Prisma v7](https://www.prisma.io/) (with `@prisma/adapter-pg`) |
| **Database**         | PostgreSQL 16                                                   |
| **Authentication**   | JWT (`@nestjs/jwt`, `passport-jwt`)                             |
| **Password Hashing** | bcrypt v6                                                       |
| **Validation**       | class-validator + class-transformer                             |
| **API Docs**         | Swagger / OpenAPI (`@nestjs/swagger`)                           |
| **Configuration**    | `@nestjs/config` (dotenv)                                       |
| **Deployment**       | Vercel (Serverless Functions)                                   |
| **Testing**          | Jest + Supertest                                                |
| **Linting**          | ESLint + Prettier                                               |

---

## 📁 Project Structure

```
ecommerce-platform-nest-backend/
├── api/
│   └── index.ts                # Vercel serverless entry point (caches the Nest app)
├── prisma/
│   ├── schema.prisma           # Database schema & models
│   └── migrations/             # Prisma migration history
├── src/
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── get-user.decorator.ts    # @GetUser() param decorator
│   │   │   └── roles.decorator.ts       # @Roles() metadata decorator
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts        # JWT access token guard
│   │   │   └── roles.guard.ts           # Role-based access control guard
│   │   └── interfaces/
│   │       └── request-with-user.interface.ts
│   ├── modules/
│   │   ├── auth/              # Registration, Login, Logout, Refresh
│   │   ├── users/             # User profile & admin user management
│   │   ├── products/          # Product catalog CRUD
│   │   └── category/          # Category management
│   ├── prisma/                # PrismaService (singleton, pg.Pool-backed)
│   ├── app.module.ts           # Root application module
│   ├── create-app.ts          # Shared Nest app factory (Swagger, CORS, pipes)
│   └── main.ts                 # Local dev bootstrap (listens on PORT)
├── .env                        # Environment variables
├── vercel.json                 # Vercel build & routing config
├── nest-cli.json
├── tsconfig.json
└── package.json
```

---

## 🗄️ Database Schema

The application uses **PostgreSQL** with **Prisma ORM**. Below is the entity relationship overview:

```
User ──< Order ──< OrderItem >── Product >── Category
 │                                  │
 └──< Cart ──< CartItem >───────────┘
 │
 └──< Payment
```

| Model       | Key Fields                                                                       |
| ----------- | -------------------------------------------------------------------------------- |
| `User`      | `id`, `email` (unique), `password` (hashed), `role` (USER/ADMIN), `refreshToken` |
| `Product`   | `id`, `name`, `sku` (unique), `price`, `stock`, `isActive`, `categoryId`         |
| `Category`  | `id`, `name` (unique), `slug` (unique), `isActive`                               |
| `Order`     | `id`, `orderNumber` (unique), `status`, `totalAmount`, `shippingAddress`         |
| `Cart`      | `id`, `userId`, `checkedOut`                                                     |
| `OrderItem` | `quantity`, `price` (snapshot at time of order)                                  |
| `CartItem`  | `quantity`, unique per `(cartId, productId)`                                     |
| `Payment`   | `amount`, `currency`, `paymentMethod`, `transactionId`, `status`                 |

---

## 📡 API Endpoints

> **Live Base URL:** `https://ecommerce-platform-nest-backend.vercel.app/api/v1`
> **Local Base URL:** `http://localhost:3000/api/v1`

### 🔐 Auth — `/auth`

| Method | Endpoint         | Auth          | Description                       |
| ------ | ---------------- | ------------- | --------------------------------- |
| `POST` | `/auth/register` | Public        | Register a new user               |
| `POST` | `/auth/login`    | Public        | Login and receive tokens          |
| `POST` | `/auth/refresh`  | Refresh Token | Rotate and get a new access token |
| `POST` | `/auth/logout`   | JWT           | Invalidate refresh token          |

### 👤 Users — `/users`

| Method   | Endpoint             | Auth | Role  | Description         |
| -------- | -------------------- | ---- | ----- | ------------------- |
| `GET`    | `/users/me`          | JWT  | Any   | Get own profile     |
| `PATCH`  | `/users/me`          | JWT  | Any   | Update own profile  |
| `PATCH`  | `/users/me/password` | JWT  | Any   | Change own password |
| `DELETE` | `/users/me`          | JWT  | Any   | Delete own account  |
| `GET`    | `/users`             | JWT  | Admin | Get all users       |
| `GET`    | `/users/:id`         | JWT  | Admin | Get user by ID      |
| `DELETE` | `/users/:id`         | JWT  | Admin | Delete user by ID   |

### 📦 Products — `/products`

| Method   | Endpoint              | Auth   | Role  | Description                           |
| -------- | --------------------- | ------ | ----- | ------------------------------------- |
| `GET`    | `/products`           | Public | Any   | List products (paginated, filterable) |
| `GET`    | `/products/:id`       | Public | Any   | Get product by ID                     |
| `POST`   | `/products`           | JWT    | Admin | Create a new product                  |
| `PATCH`  | `/products/:id`       | JWT    | Admin | Update a product                      |
| `PATCH`  | `/products/:id/stock` | JWT    | Admin | Update product stock                  |
| `DELETE` | `/products/:id`       | JWT    | Admin | Delete a product                      |

### 📂 Categories — `/categories`

| Method   | Endpoint                 | Auth   | Role  | Description                 |
| -------- | ------------------------ | ------ | ----- | --------------------------- |
| `GET`    | `/categories`            | Public | Any   | List categories (paginated) |
| `GET`    | `/categories/:id`        | Public | Any   | Get category by ID          |
| `GET`    | `/categories/slug/:slug` | Public | Any   | Get category by slug        |
| `POST`   | `/categories`            | JWT    | Admin | Create a new category       |
| `PATCH`  | `/categories/:id`        | JWT    | Admin | Update a category           |
| `DELETE` | `/categories/:id`        | JWT    | Admin | Delete a category           |

### 📦 Orders — `/orders`

| Method   | Endpoint            | Auth | Role  | Description               |
| -------- | ------------------- | ---- | ----- | ------------------------- |
| `POST`   | `/orders`           | JWT  | Any   | Create a new order        |
| `GET`    | `/orders`           | JWT  | Any   | List own orders           |
| `GET`    | `/orders/:id`       | JWT  | Any   | Get own order by ID       |
| `PATCH`  | `/orders/:id`       | JWT  | Any   | Update own order          |
| `DELETE` | `/orders/:id`       | JWT  | Any   | Cancel/delete own order   |
| `GET`    | `/orders/admin/all` | JWT  | Admin | List all orders           |
| `GET`    | `/orders/admin/:id` | JWT  | Admin | Get any order by ID       |
| `PATCH`  | `/orders/admin/:id` | JWT  | Admin | Update any order's status |
| `DELETE` | `/orders/admin/:id` | JWT  | Admin | Delete any order          |

### 💳 Payments — `/payments`

| Method | Endpoint                   | Auth | Description             |
| ------ | -------------------------- | ---- | ----------------------- |
| `POST` | `/payments/create-intent`  | JWT  | Create a payment intent |
| `POST` | `/payments/confirm`        | JWT  | Confirm a payment       |
| `GET`  | `/payments`                | JWT  | List own payments       |
| `GET`  | `/payments/:id`            | JWT  | Get payment by ID       |
| `GET`  | `/payments/order/:orderId` | JWT  | Get payment by order ID |

---

## ✅ Prerequisites

Make sure you have the following installed:

- **Node.js** ≥ 20.x → [Download](https://nodejs.org/)
- **npm** ≥ 10.x (comes with Node.js)
- **PostgreSQL** ≥ 14 → [Download](https://www.postgresql.org/download/) **OR** use a cloud provider like [Neon](https://neon.tech) (free tier, recommended for serverless — use its **pooled connection string**)
- **Git** → [Download](https://git-scm.com/)
- **Vercel CLI** (optional, for local deployment testing) → `npm i -g vercel`

---

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Mehedy-Tanvir/ecommerce-platform-nest-backend.git
cd ecommerce-platform-nest-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Then edit `.env` with your database credentials and secrets. See [Environment Variables](#-environment-variables) below.

### 4. Run Database Migrations

```bash
npx prisma migrate deploy
```

To also generate the Prisma client:

```bash
npx prisma generate
```

> **Optional:** Explore your database with Prisma Studio:
>
> ```bash
> npx prisma studio
> ```

### 5. Start the Application

```bash
# Development (with hot reload)
npm run start:dev

# Production
npm run build
npm run start:prod
```

The API will be available at: **`http://localhost:3000`**
Swagger docs at: **`http://localhost:3000/api/docs`**

---

## 🔑 Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Server
PORT=3000

# Database (PostgreSQL connection string — use a POOLED connection string in production/serverless)
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require

# JWT — Access Token
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=900          # seconds (15 minutes)

# JWT — Refresh Token
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here

# CORS (comma-separated list of allowed origins, or * for all)
CORS_ORIGIN=http://localhost:3001,https://your-frontend.com

# Public API URL used in Swagger's "Server" dropdown when deployed behind a custom domain.
# Optional — on Vercel's default *.vercel.app domain this is not required,
# since VERCEL_URL is injected automatically at runtime.
PUBLIC_API_URL=https://api.yourdomain.com
```

> **⚠️ Security Note:** Never commit real secrets to version control. Generate strong secrets using:
>
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

> **ℹ️ Note on `VERCEL_URL`:** This variable is injected automatically by Vercel at runtime for every deployment — you do **not** need to set it yourself, either locally or in Vercel's dashboard. It's used internally by `create-app.ts` to build the correct Swagger "Server" URL for whichever deployment is currently running.

---

## ▶️ Running the Application

```bash
# Development mode (watch for file changes)
npm run start:dev

# Debug mode
npm run start:debug

# Production mode
npm run start:prod
```

---

## 📖 API Documentation

### Live

```
https://ecommerce-platform-nest-backend.vercel.app/api/docs
```

### Local

```
http://localhost:3000/api/docs
```

The **Swagger UI** provides:

- 📋 Full documentation of all endpoints
- 🔑 JWT Bearer token authentication built-in (persisted across page reloads)
- ▶️ Interactive "Try it out" for every endpoint — the server dropdown automatically resolves to whichever environment you're viewing the docs from (local vs. live deployment)
- 📤 Request/response schema explorer

---

## ☁️ Deployment (Vercel)

This API is deployed as a **Vercel Serverless Function**. A few implementation details make it work reliably in that environment:

- **`api/index.ts`** is the serverless entry point. It builds the NestJS application **once** and caches it at module scope so that warm Lambda containers reuse the same app instance (and its database connections) across multiple requests, instead of rebuilding and tearing down the app on every single invocation.
- **`src/prisma/prisma.service.ts`** uses `@prisma/adapter-pg` with a tuned `pg.Pool` (`max: 5`, `idleTimeoutMillis: 30000`) suited for connection reuse across warm invocations, rather than aggressively opening/closing connections per request.
- **Swagger's server URL is dynamic** — it resolves to `PUBLIC_API_URL` if set, otherwise to Vercel's auto-injected `VERCEL_URL`, otherwise to `localhost` for local dev — so "Try it out" always targets the correct host.
- **`vercel.json`** bundles the Swagger UI static assets (`swagger-ui-dist`) explicitly via `includeFiles`, since Vercel's dependency tracing doesn't automatically pick up files that are read dynamically at runtime rather than statically imported.

### Deploying your own instance

1. Push your repository to GitHub.
2. Import the project into [Vercel](https://vercel.com/new).
3. Add the environment variables from the [Environment Variables](#-environment-variables) section in **Project → Settings → Environment Variables** (use a **pooled** `DATABASE_URL` — e.g. Neon's `-pooler` endpoint — since multiple concurrent serverless containers each hold their own connection pool).
4. Ensure your build/install step runs `npx prisma generate` (and `npx prisma migrate deploy` against your production database, either manually or as part of your CI/CD).
5. Deploy. Vercel will use the existing `vercel.json` for routing and static asset bundling.

---

## 🧪 Testing

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate test coverage report
npm run test:cov

# Run end-to-end tests
npm run test:e2e
```

---

## 📜 Scripts Reference

| Script               | Description                               |
| -------------------- | ----------------------------------------- |
| `npm run start:dev`  | Start in development mode with hot-reload |
| `npm run start:prod` | Start in production mode                  |
| `npm run build`      | Compile TypeScript to `dist/`             |
| `npm run lint`       | Lint and auto-fix with ESLint             |
| `npm run format`     | Format code with Prettier                 |
| `npm run test`       | Run unit tests                            |
| `npm run test:cov`   | Run tests with coverage report            |
| `npm run test:e2e`   | Run end-to-end tests                      |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the project
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is **UNLICENSED** — for portfolio/demonstration purposes.

---

<p align="center">
  Built with ❤️ using <a href="https://nestjs.com/">NestJS</a> · Deployed on <a href="https://vercel.com/">Vercel</a>
</p>
