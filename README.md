# Oftix — Full-Stack ISP Billing & Dashboard

A secure, role-based full-stack billing and dashboard system for Internet Service Providers.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express 4 |
| Database | MySQL 8 via mysql2 |
| Auth | JWT (httpOnly cookies), bcrypt |
| Security | Helmet, CORS, express-validator |
| Logging | Winston, Morgan |
| Frontend | Vanilla HTML/CSS/JS (Bootstrap 5) |

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
npm run dev
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `DB_HOST` | MySQL host | `127.0.0.1` |
| `DB_USER` | MySQL user | `root` |
| `DB_PASSWORD` | MySQL password | _(empty)_ |
| `DB_NAME` | Database name | `oftix` |
| `DB_CONNECTION_LIMIT` | Pool size | `10` |
| `JWT_SECRET` | **Required.** JWT signing secret | — |
| `JWT_EXPIRES_IN` | Token expiry | `1d` |
| `BCRYPT_ROUNDS` | bcrypt cost factor | `12` |
| `FRONTEND_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |
| `NODE_ENV` | Environment | `development` |

---

## Project Structure

```
Oftix/
├── backend/
│   ├── config/db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── adminController.js
│   │   ├── branchController.js
│   │   └── clientController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   ├── rateLimiter.js
│   │   └── validate.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── branchRoutes.js
│   │   └── clientRoutes.js
│   ├── services/emailService.js
│   ├── utils/
│   │   ├── apiResponse.js
│   │   └── logger.js
│   └── server.js
├── frontend/
│   ├── assets/
│   │   ├── css/styles.css
│   │   ├── js/script.js
│   │   └── images/
│   └── pages/
│       ├── index.html              # Login page
│       ├── register.html           # Client registration
│       ├── admin-dashboard.html    # Super Admin
│       ├── branch-dashboard.html   # Branch Admin
│       └── client-dashboard.html   # Client portal
├── docs/API.md
├── database.sql
├── .env.example
└── package.json
```

---

## API Endpoints

### Auth (Public)
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/register | Register new client |
| POST | /api/auth/login | Login (all roles) |
| POST | /api/auth/logout | Logout |
| POST | /api/auth/forgot-password | Request password reset |
| POST | /api/auth/reset-password | Reset password |

### Admin (role: admin)
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/admin/dashboard | Stats overview |
| GET | /api/admin/users | List all users |
| PUT | /api/admin/users/:id | Update user |
| DELETE | /api/admin/users/:id | Delete user |
| GET | /api/admin/branches | List branches |
| POST | /api/admin/branches | Create branch |
| PUT | /api/admin/branches/:id | Update branch |
| DELETE | /api/admin/branches/:id | Delete branch |
| GET | /api/admin/clients | All clients (with plan & branch) |
| GET | /api/admin/payments | All payments |
| GET | /api/admin/tickets | All tickets |
| GET | /api/admin/plans | List plans |

### Branch (role: branch)
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/branch/dashboard | Branch stats |
| GET | /api/branch/clients | Branch clients |
| PUT | /api/branch/clients/:id | Update client |
| GET | /api/branch/applications | Branch applications |
| PUT | /api/branch/applications/:id | Update application status |
| GET | /api/branch/payments | Branch payments |
| PUT | /api/branch/payments/:id/verify | Verify a payment |
| GET | /api/branch/tickets | Branch tickets |
| PUT | /api/branch/tickets/:id | Update ticket status |
| GET | /api/branch/schedule | Installation schedule |
| POST | /api/branch/schedule | Add to schedule |

### Client (role: client)
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/client/dashboard | Client dashboard |
| GET | /api/client/profile | Get profile |
| PUT | /api/client/profile | Update profile |
| GET | /api/client/subscription | Active subscription |
| GET | /api/client/payments | Payment history |
| POST | /api/client/payments | Submit payment |
| GET | /api/client/tickets | My tickets |
| POST | /api/client/tickets | Submit ticket |
| POST | /api/client/apply | Apply for connection |
| GET | /api/client/plans | Available plans |

---

## Roles & Access

| Role | Dashboard | Description |
|------|-----------|-------------|
| `admin` | `/admin-dashboard.html` | Full system access |
| `branch` | `/branch-dashboard.html` | Branch-scoped access |
| `client` | `/client-dashboard.html` | Own data only |

### Admin Login
The admin login is protected by a 3-digit PIN (`786`) before showing credentials.

---

## Sample Accounts

| Role | Username | Password |
|------|----------|----------|
| Admin | `superadmin` | `Admin@1234` |
| Branch | `admin_qc` | `Branch@1234` |
| Client | `juandc` | `Client@1234` |

> Run the password seed SQL in phpMyAdmin before first login. See `SAMPLE_ACCOUNTS.md`.

---

## Security Measures

1. **JWT in httpOnly cookies** — token never exposed to JavaScript
2. **bcrypt password hashing** — cost factor 12
3. **Input validation** — express-validator on all routes
4. **RBAC** — role checked on every protected route
5. **IDOR protection** — branch_id ownership verified before data mutation
6. **Helmet** — secure HTTP headers
7. **CORS** — restricted to configured origin
8. **JWT_SECRET guard** — server refuses to start if secret is missing
9. **Winston logging** — auth events and errors logged
