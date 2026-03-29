# Oftix — Full-Stack ISP Billing & Dashboard

A secure, role-based full-stack billing and dashboard system for Internet Service Providers.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express 4 |
| Database | MySQL 8 via mysql2 |
| Auth | JWT (httpOnly cookies), bcrypt |
| Security | Helmet, CORS, express-rate-limit, express-validator |
| Logging | Winston, Morgan |
| Frontend | Vanilla HTML/CSS/JS |

---

## Prerequisites

- Node.js >= 18
- MySQL >= 8
- npm >= 9

---

## Installation

```bash
git clone <repo-url>
cd Oftix
npm install
cp .env.example .env       # fill in your values
mysql -u root < database.sql
npm run dev
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_USER` | MySQL user | `root` |
| `DB_PASSWORD` | MySQL password | _(empty)_ |
| `DB_NAME` | Database name | `oftix` |
| `DB_CONNECTION_LIMIT` | Pool size | `10` |
| `JWT_SECRET` | **Required.** JWT signing secret | — |
| `JWT_EXPIRES_IN` | Token expiry | `1d` |
| `BCRYPT_ROUNDS` | bcrypt cost factor | `12` |
| `FRONTEND_ORIGIN` | Allowed CORS origin | `http://localhost:5500` |
| `NODE_ENV` | Environment | `development` |

---

## Project Structure

```
Oftix/
├── backend/
│   ├── config/db.js           # MySQL connection pool
│   ├── controllers/           # Route handlers
│   ├── middleware/            # Auth, rate limiting, validation, error handler
│   ├── models/                # (reserved for ORM models)
│   ├── routes/                # Express route definitions
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
├── docs/API.md
├── database.sql
├── nodemon.json
├── .env.example
└── package.json
```

---

## API Endpoints

| Method | Route | Role | Description |
|--------|-------|------|-------------|
| POST | /api/auth/register | public | Register new user |
| GET | /api/auth/verify-email/:token | public | Verify email |
| POST | /api/auth/login | public | Login |
| POST | /api/auth/logout | public | Logout |
| POST | /api/auth/forgot-password | public | Request password reset |
| POST | /api/auth/reset-password | public | Reset password |
| GET | /api/admin/dashboard | admin | Stats overview |
| GET | /api/admin/users | admin | List all users |
| PUT | /api/admin/users/:id | admin | Update user |
| DELETE | /api/admin/users/:id | admin | Delete user |
| GET | /api/admin/branches | admin | List branches |
| POST | /api/admin/branches | admin | Create branch |
| PUT | /api/admin/branches/:id | admin | Update branch |
| DELETE | /api/admin/branches/:id | admin | Delete branch |
| GET | /api/branch/dashboard | branch | Branch stats |
| GET | /api/branch/clients | branch | List branch clients |
| PUT | /api/branch/clients/:id | branch | Update client |
| GET | /api/client/dashboard | client | Client dashboard |
| GET | /api/client/profile | client | Get own profile |
| PUT | /api/client/profile | client | Update own profile |

---

## Security Measures

1. **JWT in httpOnly cookies** — token never exposed to JavaScript
2. **bcrypt password hashing** — cost factor 12
3. **Rate limiting** — login (8/15min), register (10/hr), reset (6/hr), global (150/15min)
4. **Input validation** — express-validator on all routes
5. **RBAC** — role checked on every protected route
6. **IDOR protection** — ownership verified before any data mutation
7. **Helmet** — secure HTTP headers
8. **CORS** — restricted to configured origin
9. **JWT_SECRET guard** — server refuses to start if secret is missing
10. **Winston logging** — auth events, errors, and unusual traffic logged
