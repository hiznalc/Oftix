# Oftix — Architecture

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│  frontend/pages/*.html  +  frontend/assets/js/script.js     │
└────────────────────────┬────────────────────────────────────┘
                         │ fetch() with credentials: 'include'
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Express API  (backend/server.js)                │
│                                                             │
│  Middleware stack (in order):                               │
│    helmet (CSP) → json (20kb) → urlencoded (20kb)           │
│    → cookieParser → cors → morgan                           │
│                                                             │
│  Static serving:                                            │
│    /assets          → frontend/assets/                      │
│    /                → frontend/pages/index.html             │
│    /register.html   → frontend/pages/register.html          │
│    /admin-dashboard.html, /branch-dashboard.html,           │
│    /client-dashboard.html → respective pages                │
│    /* (fallback)    → frontend/pages/index.html             │
│                                                             │
│  Routes:                                                    │
│    /api/health   → inline health check                      │
│    /api/auth/*   → authRoutes   → authController            │
│    /api/admin/*  → adminRoutes  → adminController           │
│    /api/branch/* → branchRoutes → branchController          │
│    /api/client/* → clientRoutes → clientController          │
│                                                             │
│  Auth middleware:  verifyToken → requireRole                │
│  Error middleware: handleErrors (last)                      │
└────────────────────────┬────────────────────────────────────┘
                         │ mysql2 promise pool
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    MySQL 8 Database                         │
│                                                             │
│  branches · users · clients · plans · subscriptions         │
│  applications · installation_schedule · payment_methods     │
│  payments · tickets · ticket_replies                        │
│  password_resets · login_logs                               │
└─────────────────────────────────────────────────────────────┘
```

## Roles

| Role   | Dashboard               | Access                                     |
|--------|-------------------------|--------------------------------------------|
| admin  | /admin-dashboard.html   | Full system — users, branches, all data    |
| branch | /branch-dashboard.html  | Own branch clients, payments, tickets      |
| client | /client-dashboard.html  | Own profile, subscription, payments        |

## Auth Flow

```
Register → bcrypt hash → INSERT user (email_verified=0) → send verification email (stub)
         ↓
GET /verify-email/:token → UPDATE email_verified=1
         ↓
Login → bcrypt.compare → check status (suspended blocked)
      → jwt.sign → httpOnly cookie (JWT_EXPIRES_IN)
      → INSERT login_logs (success/failed)
         ↓
Protected route → verifyToken (jwt.verify from cookie) → requireRole → controller
         ↓
Logout → clear cookie
```

## Password Reset Flow

```
POST /forgot-password → generate UUID token → INSERT password_resets (expires_at = +15min)
POST /reset-password  → validate token + expiry + used=0 → bcrypt hash → UPDATE password → mark used=1
```

## GCash Payment Flow

```
Client clicks Pay Now → GET /api/client/payments/qr
  → JOIN clients → branches → subscriptions → plans
  → build gcash://pay?number=<gcash_number>&amount=<price>
  → QRCode.toDataURL(deepLink) → return { qr, gcash_number, branch_name, amount }
         ↓
Client scans QR with GCash app → pays → gets reference number
         ↓
Client submits reference number → POST /api/client/payments
  → INSERT payments (status=pending, reference_number)
         ↓
Branch admin → Payments section → clicks Verify
  → PUT /api/branch/payments/:id/verify
  → UPDATE payments SET status=verified
  → UPDATE subscriptions SET payment_status=paid
```

## Database Schema

```
branches             — id, name, location, admin_id, gcash_number, status, created_at, updated_at
users                — id, name, email, username, password, role, contact, address, branch_id,
                       email_verified, email_verification_token, email_verification_expires,
                       status, created_at, updated_at
clients              — id, user_id, branch_id, status, installation_date, created_at, updated_at
plans                — id, name, speed (Mbps), price (PHP), description, status, created_at, updated_at
subscriptions        — id, client_id, plan_id, start_date, end_date, next_billing_date,
                       status, payment_status, created_at, updated_at
applications         — id, user_id, branch_id, plan_id, status, application_date,
                       approval_date, installation_date, notes, created_at, updated_at
installation_schedule— id, application_id, scheduled_date, technician_team, notes,
                       status, created_at, updated_at
payment_methods      — id, name, description, is_active, created_at
payments             — id, subscription_id, client_id, branch_id, amount, payment_method_id,
                       reference_number, status, payment_date, verified_date, verified_by,
                       receipt_url, notes, created_at, updated_at
tickets              — id, client_id, user_id, branch_id, subject, message, priority,
                       category, status, assigned_to, created_at, updated_at, resolved_at
ticket_replies       — id, ticket_id, user_id, message, is_staff_reply, created_at
password_resets      — id, user_id, token, expires_at, used, created_at
login_logs           — id, user_id, username, ip_address, user_agent, status, created_at
```

### Enums

| Table                | Column         | Values                                                       |
|----------------------|----------------|--------------------------------------------------------------|
| branches             | status         | active, inactive                                             |
| users                | role           | admin, branch, client                                        |
| users                | status         | active, inactive, suspended                                  |
| clients              | status         | prospect, active, inactive, suspended                        |
| plans                | status         | active, inactive                                             |
| subscriptions        | status         | active, suspended, cancelled, pending                        |
| subscriptions        | payment_status | paid, unpaid, overdue                                        |
| applications         | status         | pending, approved, scheduled, installed, rejected, cancelled |
| installation_schedule| status         | scheduled, in-progress, completed, postponed, cancelled      |
| payments             | status         | pending, verified, failed, refunded                          |
| tickets              | priority       | low, medium, high, critical                                  |
| tickets              | status         | open, in-progress, resolved, closed, reopened                |
| login_logs           | status         | success, failed                                              |

## Security Layers

| Layer         | Implementation                                                        |
|---------------|-----------------------------------------------------------------------|
| Auth          | JWT in httpOnly cookie, bcrypt rounds=12                              |
| Transport     | Helmet with strict CSP (cdn.jsdelivr.net, fonts.googleapis.com allowed)|
| Rate limiting | login 8/15min · register 10/hr · password-reset 6/hr                 |
| Input         | express-validator on every mutating route (422 on failure)            |
| Body size     | JSON + urlencoded capped at 20kb                                      |
| RBAC          | requireRole middleware on all protected routes                        |
| IDOR          | branch_id ownership verified before every mutation                    |
| Suspended     | Accounts with status=suspended blocked at login                       |
| Logging       | Winston (structured JSON) + Morgan (HTTP) — auth events & errors      |
| Audit log     | All login attempts (success/failed) recorded in login_logs            |
| Secrets       | All in .env; server exits with code 1 if JWT_SECRET is missing        |
| CORS          | Restricted to FRONTEND_ORIGIN with credentials: true                  |

## Frontend Features

| Feature              | Scope                        | Notes                                          |
|----------------------|------------------------------|------------------------------------------------|
| Dark / Light mode    | All dashboards               | Toggle button in topbar, saved to localStorage |
| Search               | All table modules            | Filters rows client-side                       |
| Export CSV           | All table modules            | Downloads filtered rows as .csv                |
| Export PDF           | All table modules            | Opens print-ready page in new tab              |
| GCash QR modal       | Client dashboard             | Fetches QR on open, shows gcash deep link      |
| Inline form errors   | Registration page            | Per-field validation before submit             |
| Applications badge   | Branch dashboard nav         | Shows real pending count from API              |
| Time slot picker     | Branch schedule form         | Hour + minute + AM/PM dropdowns with preview   |

## API Routes

### /api/auth (public)
| Method | Path                 | Description                    |
|--------|----------------------|--------------------------------|
| GET    | /branches            | List active branches           |
| POST   | /register            | Register new client            |
| GET    | /verify-email/:token | Verify email address           |
| POST   | /login               | Login (all roles)              |
| POST   | /logout              | Clear auth cookie              |
| POST   | /forgot-password     | Request password reset         |
| POST   | /reset-password      | Reset with token               |

### /api/admin (role: admin)
| Method | Path              | Description               |
|--------|-------------------|---------------------------|
| GET    | /dashboard        | Stats overview            |
| GET    | /users            | List all users            |
| PUT    | /users/:id        | Update user               |
| DELETE | /users/:id        | Delete user               |
| GET    | /branches         | List branches             |
| POST   | /branches         | Create branch             |
| PUT    | /branches/:id     | Update branch             |
| DELETE | /branches/:id     | Delete branch             |
| GET    | /clients          | All clients (plan+branch) |
| GET    | /payments         | All payments              |
| GET    | /tickets          | All tickets               |
| GET    | /plans            | List plans                |

### /api/branch (role: branch)
| Method | Path                  | Description               |
|--------|-----------------------|---------------------------|
| GET    | /dashboard            | Branch stats              |
| GET    | /clients              | Branch clients            |
| PUT    | /clients/:id          | Update client status      |
| GET    | /applications         | Branch applications       |
| PUT    | /applications/:id     | Update application status |
| GET    | /payments             | Branch payments           |
| PUT    | /payments/:id/verify  | Verify a payment          |
| GET    | /tickets              | Branch tickets            |
| PUT    | /tickets/:id          | Update ticket status      |
| GET    | /schedule             | Installation schedule     |
| POST   | /schedule             | Add schedule entry        |

### /api/client (role: client)
| Method | Path          | Description                     |
|--------|---------------|---------------------------------|
| GET    | /dashboard    | Client dashboard                |
| GET    | /profile      | Get profile                     |
| PUT    | /profile      | Update profile                  |
| GET    | /subscription | Active subscription             |
| GET    | /payments/qr  | GCash QR code + branch info     |
| GET    | /payments     | Payment history                 |
| POST   | /payments     | Submit payment (reference #)    |
| GET    | /tickets      | My tickets                      |
| POST   | /tickets      | Submit ticket                   |
| POST   | /apply        | Apply for connection            |
| GET    | /plans        | Available plans                 |

### /api/health (public)
| Method | Path | Description  |
|--------|------|--------------|
| GET    | /    | Health check |

## Seed Data

| Entity           | Count | Notes                                                   |
|------------------|-------|---------------------------------------------------------|
| Payment methods  | 4     | GCash, Bank Transfer, Cash, Online Credit Card          |
| Plans            | 4     | Fiber 25/50/100/200 (999–2999 PHP/mo)                   |
| Branches         | 4     | QC, Makati, Manila, Eastwood (GCash: 09507724215)       |
| Users (staff)    | 5     | 1 admin (`superadmin`) + 4 branch managers              |
| Users (clients)  | 6     | juandc, mariasantos, carlom, sofian, jeromeb, ginalopez |
| Subscriptions    | 5     | Mix of paid/unpaid                                      |
| Applications     | 2     | Both approved, with installation schedules              |
| Payments         | 3     | All verified                                            |
| Tickets          | 3     | 2 open, 1 resolved                                      |
