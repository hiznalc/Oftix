# Oftix — Full-Stack ISP Billing & Dashboard

A secure, role-based full-stack billing and dashboard system for Internet Service Providers.

---

## Tech Stack

| Layer    | Technology                                      |
|----------|-------------------------------------------------|
| Backend  | Node.js, Express 4                              |
| Database | MySQL 8 via mysql2/promise (connection pool)    |
| Auth     | JWT (httpOnly cookies), bcryptjs                |
| Security | Helmet (CSP), CORS, express-rate-limit, express-validator |
| Logging  | Winston, Morgan                                 |
| Frontend | Vanilla HTML/CSS/JS (Bootstrap 5)               |
| QR Code  | qrcode (GCash deep link generation)             |

---

## Prerequisites

- Node.js >= 18
- MySQL >= 8 (XAMPP recommended)
- npm >= 9

---

## Installation

```bash
git clone <repo-url>
cd Oftix
npm install
cp .env.example .env       # fill in your values
# Import database.sql via phpMyAdmin or mysql CLI
node seed-passwords.js     # seed sample account passwords (optional if using database.sql)
npm run dev
```

> `database.sql` already includes bcrypt-hashed passwords — no need to run `seed-passwords.js` after a fresh import.

---

## Environment Variables

| Variable              | Description                      | Default                  |
|-----------------------|----------------------------------|--------------------------|
| `PORT`                | Server port                      | `3000`                   |
| `DB_HOST`             | MySQL host                       | `localhost`              |
| `DB_USER`             | MySQL user                       | `root`                   |
| `DB_PASSWORD`         | MySQL password                   | _(empty)_                |
| `DB_NAME`             | Database name                    | `oftix`                  |
| `DB_CONNECTION_LIMIT` | Pool size                        | `10`                     |
| `JWT_SECRET`          | **Required.** JWT signing secret | — (server exits if unset)|
| `JWT_EXPIRES_IN`      | Token expiry                     | `1d`                     |
| `BCRYPT_ROUNDS`       | bcrypt cost factor               | `12`                     |
| `FRONTEND_ORIGIN`     | Allowed CORS origin              | `http://localhost:3000`  |
| `NODE_ENV`            | Environment                      | `development`            |

---

## Project Structure

```
Oftix/
├── backend/
│   ├── config/db.js                  # mysql2 promise pool
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── adminController.js
│   │   ├── branchController.js
│   │   └── clientController.js
│   ├── middleware/
│   │   ├── auth.js                   # verifyToken, requireRole
│   │   ├── errorHandler.js           # handleErrors
│   │   ├── rateLimiter.js            # loginLimiter, registerLimiter, passwordResetLimiter
│   │   └── validate.js               # validateRequest (express-validator)
│   ├── routes/
│   │   ├── authRoutes.js             # includes public GET /branches
│   │   ├── adminRoutes.js
│   │   ├── branchRoutes.js
│   │   └── clientRoutes.js           # includes GET /payments/qr
│   ├── services/
│   │   └── emailService.js           # stub — replace with nodemailer/SendGrid
│   ├── utils/
│   │   ├── apiResponse.js            # { success, message, data? } formatter
│   │   └── logger.js                 # Winston (JSON + colorized console)
│   └── server.js
├── frontend/
│   ├── assets/
│   │   ├── css/styles.css            # dual theme (dark/light)
│   │   ├── js/script.js
│   │   └── images/
│   │       ├── oftix-logo.svg
│   │       └── oftix-logo-anim.svg
│   └── pages/
│       ├── index.html                # Login page (served at /)
│       ├── register.html             # Client registration
│       ├── admin-dashboard.html      # Super Admin
│       ├── branch-dashboard.html     # Branch Admin
│       └── client-dashboard.html    # Client portal
├── docs/API.md
├── ARCHITECTURE.md
├── SAMPLE_ACCOUNTS.md
├── database.sql
├── seed-passwords.js
├── .env.example
├── nodemon.json
└── package.json
```

---

## API Endpoints

### Auth (Public)
| Method | Route                        | Description                    |
|--------|------------------------------|--------------------------------|
| GET    | /api/auth/branches           | List active branches (public)  |
| POST   | /api/auth/register           | Register new client            |
| GET    | /api/auth/verify-email/:token| Verify email address           |
| POST   | /api/auth/login              | Login (all roles)              |
| POST   | /api/auth/logout             | Logout                         |
| POST   | /api/auth/forgot-password    | Request password reset         |
| POST   | /api/auth/reset-password     | Reset with token               |

### Admin (role: admin)
| Method | Route                   | Description               |
|--------|-------------------------|---------------------------|
| GET    | /api/admin/dashboard    | Stats overview            |
| GET    | /api/admin/users        | List all users            |
| PUT    | /api/admin/users/:id    | Update user               |
| DELETE | /api/admin/users/:id    | Delete user               |
| GET    | /api/admin/branches     | List branches             |
| POST   | /api/admin/branches     | Create branch             |
| PUT    | /api/admin/branches/:id | Update branch             |
| DELETE | /api/admin/branches/:id | Delete branch             |
| GET    | /api/admin/clients      | All clients (plan+branch) |
| GET    | /api/admin/payments     | All payments              |
| GET    | /api/admin/tickets      | All tickets               |
| GET    | /api/admin/plans        | List plans                |

### Branch (role: branch)
| Method | Route                              | Description               |
|--------|------------------------------------|---------------------------|
| GET    | /api/branch/dashboard              | Branch stats              |
| GET    | /api/branch/clients                | Branch clients            |
| PUT    | /api/branch/clients/:id            | Update client status      |
| GET    | /api/branch/applications           | Branch applications       |
| PUT    | /api/branch/applications/:id       | Update application status |
| GET    | /api/branch/payments               | Branch payments           |
| PUT    | /api/branch/payments/:id/verify    | Verify a payment          |
| GET    | /api/branch/tickets                | Branch tickets            |
| PUT    | /api/branch/tickets/:id            | Update ticket status      |
| GET    | /api/branch/schedule               | Installation schedule     |
| POST   | /api/branch/schedule               | Add schedule entry        |

### Client (role: client)
| Method | Route                     | Description                        |
|--------|---------------------------|------------------------------------|
| GET    | /api/client/dashboard     | Client dashboard                   |
| GET    | /api/client/profile       | Get profile                        |
| PUT    | /api/client/profile       | Update profile                     |
| GET    | /api/client/subscription  | Active subscription                |
| GET    | /api/client/payments/qr   | GCash QR code + branch info        |
| GET    | /api/client/payments      | Payment history                    |
| POST   | /api/client/payments      | Submit payment (with reference #)  |
| GET    | /api/client/tickets       | My tickets                         |
| POST   | /api/client/tickets       | Submit ticket                      |
| POST   | /api/client/apply         | Apply for connection               |
| GET    | /api/client/plans         | Available plans                    |

### Health (Public)
| Method | Route       | Description  |
|--------|-------------|--------------|
| GET    | /api/health | Health check |

---

## Roles & Access

| Role     | Dashboard                | Description                        |
|----------|--------------------------|------------------------------------|
| `admin`  | `/admin-dashboard.html`  | Full system access                 |
| `branch` | `/branch-dashboard.html` | Branch-scoped access               |
| `client` | `/client-dashboard.html` | Own data only                      |

> The admin/branch login is behind a 3-digit PIN (`786`) on the login page.

---

## Sample Accounts

| Role   | Username         | Password      |
|--------|------------------|---------------|
| Admin  | `superadmin`     | `superadmin`  |
| Branch | `admin_qc`       | `admin`       |
| Branch | `admin_makati`   | `admin`       |
| Branch | `admin_manila`   | `admin`       |
| Branch | `admin_eastwood` | `admin`       |
| Client | `juandc`         | `Client@1234` |

> Passwords are pre-hashed in `database.sql`. Run `node seed-passwords.js` only if you need to reset them.

---

## Features

### Payment
- GCash QR code generated via `gcash://pay?number=...&amount=...` deep link
- Client scans QR → GCash app opens with pre-filled number and amount
- Client submits GCash reference number after payment
- Branch admin verifies payment per row

### Dashboards
- **Dark / Light mode** toggle on all dashboards (preference saved to localStorage)
- **Search** on all table modules
- **Export CSV / PDF** on all table modules (clients, payments, tickets, applications, archive)
- **Real-time badge** on Applications nav showing pending count per branch

### Registration
- Inline field-level validation errors
- Branch dropdown loaded from public `/api/auth/branches` endpoint
- `branch_id` sent as integer

### Installation Schedule
- Date picker with native calendar
- Time slot: dual dropdowns (start hour:min AM/PM → end hour:min AM/PM)
- Live preview display

### Security
- Login audit log — all attempts recorded in `login_logs` with IP and user agent
- Suspended accounts blocked at login
- Branch-scoped data — each branch admin only sees their own data

---

## Email Service

`backend/services/emailService.js` is currently a **stub** that logs to console. To enable real email delivery, replace it with nodemailer or SendGrid.

---

## Scripts

| Command                | Description                              |
|------------------------|------------------------------------------|
| `npm start`            | Start server (production)                |
| `npm run dev`          | Start with nodemon (auto-reload)         |
| `node seed-passwords.js` | Re-hash and update all sample passwords |
