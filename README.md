# 🎬 Streamly — Full-Stack Netflix Clone

[![Vercel Deployment](https://img.shields.io/badge/Frontend-Vercel-black?style=for-the-badge&logo=vercel)](https://netflix-clone-ten-rho-69.vercel.app/)
[![Render Backend](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://netflix-clone-ufzp.onrender.com)

> **🚀 Live Demo URL:** [https://netflix-clone-ten-rho-69.vercel.app/](https://netflix-clone-ten-rho-69.vercel.app/)  
> **⚡ Backend API Live URL:** [https://netflix-clone-ufzp.onrender.com/api/v1](https://netflix-clone-ufzp.onrender.com/api/v1)

> **📡 Health Check:** [https://netflix-clone-ufzp.onrender.com/health](https://netflix-clone-ufzp.onrender.com/health)

A modern, production-grade **Netflix Clone** (Streamly) built with **React 19, TypeScript, Vite, Tailwind CSS v4**, and a **Node.js, Express, MongoDB (Mongoose)** backend. Features real-time JWT authentication with OTP email verification, multi-profile architecture, Stripe subscription billing, live TMDB metadata integration, admin dashboard with analytics & video CRUD, and a custom HTML5 media player with adaptive fallback streaming.

---


## 🌟 Key Highlights & Features

### 🎬 Streaming & User Experience
- **Adaptive HTML5 Video Player**: Custom controls (speed 0.5x–2x, seek, volume, aspect ratio cover/contain, subtitles, fullscreen, Ambilight glow effect).
- **Auto-Next Episode & Countdown**: Continuous playback support for TV shows and related movies.
- **Dynamic Content Catalogue**: Live TMDB API integration for Trending, Popular, Top Rated, and Genre rows, with built-in resilient fallback catalogue.
- **Smart Watch History & Watchlist (My List)**: Real-time tracking of watch progress per profile with automated debounced saving.
- **Search with Instant Debounce**: Cross-catalogue instant search across movie titles, casts, and genres.

### 👥 Profile & Account Management
- **Multi-Profile System**: Up to 5 profiles per user account with custom avatar selection, Kids Mode toggle, and independent watch histories.
- **Interactive Startup Animation**: Netflix/Streamly cinematic logo unfolding splash screen with sound/glow aesthetics.
- **Account & Billing Portal**: View active subscription plan, change plans, manage payment methods, and review invoice history.

### 💳 Payments & Monetization (Stripe)
- **Stripe Checkout & SetupIntents**: PCI-compliant payment method updating and subscription checkout sessions.
- **Tiered Subscription Plans**: Mobile (₹149/mo), Standard (₹499/mo), and Premium Ultra (₹649/mo, 4K HDR).
- **Webhooks Handling**: Secure raw-body signature validation for instant subscription status lifecycle sync.

### 🔐 Security & Authentication
- **Multi-Factor OTP Flow**: Nodemailer-powered email verification OTPs and secure password reset OTPs.
- **Token Rotation**: Stateless Access Tokens (JWT) + Refresh Tokens stored in secure HTTP-only cookies.
- **Google OAuth Integration**: One-tap Google Sign-In via `google-auth-library`.
- **Hardened Backend**: `helmet` headers, Zod schema request validation, `bcryptjs` password hashing, and `express-rate-limit` DDoS/brute-force mitigation.

### 🛠️ Admin Control Center
- **Executive Analytics**: Real-time stats on registered users, active subscriptions, estimated MRR, and viewing trends.
- **User & Subscription Management**: Complete user CRUD and manual subscription status/tier overrides.
- **Video & Media Management**: Upload, update, and manage catalogue items with custom stream URLs.
- **Plan Management**: Create, edit, and toggle subscription pricing packages.

---

## 🏗️ Repository Architecture

```
netflix-clone/
├── client/                     # Frontend Application (React 19 + Vite)
│   ├── src/
│   │   ├── components/         # Navbar, Billboard, MovieRow, Modals, Providers
│   │   ├── pages/              # Browse, Watch, Account, Profiles, Admin, Auth
│   │   ├── lib/                # API client, Auth session, Video catalog, Analytics
│   │   ├── types/              # Media, User, and Profile TypeScript interfaces
│   │   └── App.tsx             # Routing & global providers
│   ├── .env                    # Frontend environment configuration
│   └── package.json
├── server/                     # Backend API (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── config/             # DB connection, environment variables
│   │   ├── controllers/        # Auth, Payment, Media, Profile, Admin controllers
│   │   ├── middlewares/        # JWT protect, Admin guard, Rate limiter, Error handler
│   │   ├── models/             # User, Profile, Media, Plan, Notification (Mongoose)
│   │   ├── routes/             # RESTful route definitions
│   │   ├── utils/              # Database seeder, Email dispatcher
│   │   └── server.ts           # Server bootstrap
│   ├── .env                    # Backend environment configuration
│   └── package.json
├── vercel.json                 # Vercel deployment SPA rewrite rules
└── README.md                   # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local instance or MongoDB Atlas URI
- **Package Manager**: npm or yarn

---

### 1. Backend Setup

1. Navigate to the server folder:
   ```bash
   cd server
   npm install
   ```

2. Configure environment variables in `server/.env`:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/streamly
   JWT_SECRET=your_super_secret_jwt_access_key_min_32_characters
   JWT_EXPIRES_IN=7d
   JWT_REFRESH_SECRET=your_super_secret_jwt_refresh_key_min_32_characters
   JWT_REFRESH_EXPIRES_IN=30d
   CORS_ORIGIN=http://localhost:5173
   
   # Optional Integrations
   TMDB_API_KEY=your_tmdb_v3_key
   TMDB_ACCESS_TOKEN=your_tmdb_v4_token
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_SUCCESS_URL=http://localhost:5173/account?payment=success
   STRIPE_CANCEL_URL=http://localhost:5173/account?payment=cancelled
   
   # SMTP Email Settings (Gmail / SendGrid / Mailtrap)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   SMTP_FROM=Streamly Support <no-reply@streamly.app>
   ```

3. Seed initial database records (Demo users, plans, media):
   ```bash
   npm run seed
   ```
   *Default Demo Accounts:*
   - **Regular User**: `demo@streamly.com` | `Password123`
   - **Administrator**: `admin@streamly.com` | `AdminPassword123`

4. Start development server:
   ```bash
   npm run dev
   ```
   Backend will run on `http://localhost:5000`.

---

### 2. Frontend Setup

1. Open a new terminal and navigate to the client folder:
   ```bash
   cd client
   npm install
   ```

2. Configure environment variables in `client/.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api/v1
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   VITE_TMDB_ACCESS_TOKEN=your_tmdb_v4_bearer_token
   VITE_TMDB_API_KEY=your_tmdb_v3_key
   ```

3. Start Vite dev server:
   ```bash
   npm run dev
   ```
   Frontend will be available at `http://localhost:5173`.

---

## 📡 API Reference Overview

**Base URL**: `/api/v1`

### 🔒 Authentication (`/auth`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/auth/register` | Register new user & dispatch verification OTP | Public |
| `POST` | `/auth/login` | Email/password sign-in | Public |
| `POST` | `/auth/google` | Google OAuth token verification | Public |
| `POST` | `/auth/logout` | Invalidate refresh session | Public |
| `POST` | `/auth/refresh` | Rotate access token | Public |
| `GET`  | `/auth/me` | Fetch authenticated user data & subscription | Bearer JWT |
| `POST` | `/auth/verify-email` | Validate registration OTP code | Public |
| `POST` | `/auth/resend-verification-otp` | Resend email verification code | Public |
| `POST` | `/auth/forgot-password-otp` | Request password reset OTP | Public |
| `POST` | `/auth/verify-reset-otp` | Validate password reset code | Public |
| `POST` | `/auth/reset-password` | Update password with validated token | Public |

### 👤 Profiles (`/profiles`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET`  | `/profiles` | List all profiles for user account | Bearer JWT |
| `POST` | `/profiles` | Create a new profile (max 5) | Bearer JWT |
| `PUT`  | `/profiles/:id` | Update profile name, avatar, or kids settings | Bearer JWT |
| `DELETE` | `/profiles/:id` | Remove a profile | Bearer JWT |
| `POST` | `/profiles/:id/select` | Set active profile for current session | Bearer JWT |

### 💳 Payments & Subscriptions (`/payments`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET`  | `/payments/subscription` | Fetch active subscription status & plan specs | Bearer JWT |
| `GET`  | `/payments/invoices` | List payment invoices & receipts | Bearer JWT |
| `POST` | `/payments/change-plan` | Upgrade/downgrade subscription tier | Bearer JWT |
| `POST` | `/payments/checkout-session` | Initialize Stripe Checkout redirect session | Bearer JWT |
| `POST` | `/payments/create-setup-intent` | Generate SetupIntent for card updates | Bearer JWT |
| `POST` | `/payments/cancel-subscription` | Schedule cancellation at billing period end | Bearer JWT |
| `POST` | `/payments/webhook` | Stripe event webhook handler | Stripe Sig |

### 👑 Admin Management (`/admin`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/admin/login` | Secure administrator login | Rate Limited |
| `GET`  | `/admin/analytics` | Retrieve metrics, MRR, views, and counts | Admin JWT |
| `GET`  | `/admin/users` | List all registered users | Admin JWT |
| `POST` | `/admin/users` | Create user manually | Admin JWT |
| `PUT`  | `/admin/users/:id` | Modify user attributes | Admin JWT |
| `DELETE`| `/admin/users/:id` | Delete user record | Admin JWT |
| `PATCH`| `/admin/users/:id/subscription` | Override user plan tier / status | Admin JWT |
| `GET`  | `/admin/catalog` | List all catalog media entries | Admin JWT |
| `POST` | `/admin/catalog` | Add new video/movie to catalog | Admin JWT |
| `PUT`  | `/admin/catalog/:id` | Update media details & stream URLs | Admin JWT |
| `DELETE`| `/admin/catalog/:id`| Remove media from catalog | Admin JWT |
| `GET`  | `/admin/plans` | Fetch subscription plans | Admin JWT |
| `POST` | `/admin/plans` | Create a new subscription package | Admin JWT |
| `PUT`  | `/admin/plans/:id` | Edit plan specs or pricing | Admin JWT |
| `DELETE`| `/admin/plans/:id`| Remove plan package | Admin JWT |

---

## 🧪 Testing & Code Quality

```bash
# Backend unit & integration test suite
cd server
npm test

# Backend API stress & concurrency benchmark
npm run test:stress

# Frontend component & logic tests
cd client
npm test

# TypeScript type validation
npm run typecheck
```

---

## 🚢 Deployment Guide

### Frontend Deployment (Vercel)
1. Push repository to GitHub.
2. Import project into Vercel and set the **Root Directory** to `client`.
3. Set environment variables:
   - `VITE_API_URL`: `https://netflix-clone-ufzp.onrender.com/api/v1`
   - `VITE_STRIPE_PUBLISHABLE_KEY`: `pk_live_...` or `pk_test_...`
   - `VITE_TMDB_ACCESS_TOKEN`: *(Optional TMDB v4 Token)*
4. Deploy! (`vercel.json` ensures full SPA routing fallback).

### Backend Deployment (Render / Railway)
1. Import repository and set **Root Directory** to `server`.
2. Build Command: `npm install && npm run build`
3. Start Command: `npm run start`
4. Configure all environment variables from `server/.env`.
5. Set `CORS_ORIGIN` to your deployed Vercel domain (`https://netflix-clone-ten-rho-69.vercel.app`).

---

## 👥 Collaborators & Builders

| Name | Role | Responsibilities |
|---|---|---|
| 🎨 **Rajkrishna Das** | **Frontend Engineer** | UI/UX Architecture, React 19 Components, Tailwind CSS v4 Styling, Motion Animations, and Media Player Interface. |
| ⚙️ **Sudipto Gayen** | **Backend & Database Engineer** | Node.js / Express Architecture, RESTful APIs, MongoDB / Mongoose Schemas & Indexing, Stripe Integration, Auth & Security. |

---

## 📜 License

This project is open-source under the **ISC License**.

