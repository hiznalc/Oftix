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
│  Middleware stack:                                          │
│    helmet → cors → json → cookieParser → morgan             │
│    → globalRateLimiter                                      │
│                                                             │
│  Routes:                                                    │
│    /api/auth/*    → authRoutes    → authController          │
│    /api/admin/*   → adminRoutes   → adminController         │
│    /api/branch/*  → branchRoutes  → branchController        │
│    /api/client/*  → clientRoutes  → clientController        │
│                                                             │
│  Auth middleware:  verifyToken → requireRole                │
└────────────────────────┬────────────────────────────────────┘
                         │ mysql2 pool
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    MySQL 8 Database                         │
│  users · branches · clients · password_resets · tickets     │
└─────────────────────────────────────────────────────────────┘
```

## Roles

| Role   | Access                                      |
|--------|---------------------------------------------|
| admin  | Full system — users, branches, all clients  |
| branch | Own branch clients and tickets only         |
| client | Own profile and dashboard only              |

## Auth Flow

```
Register → bcrypt hash → INSERT user (email_verified=0) → send verification email
         ↓
Verify email → UPDATE email_verified=1
         ↓
Login → bcrypt.compare → jwt.sign → httpOnly cookie
         ↓
Protected route → verifyToken (jwt.verify) → requireRole → controller
```

## Password Reset Flow

```
POST /forgot-password → generate UUID token → INSERT password_resets (15min expiry)
POST /reset-password  → validate token + expiry → bcrypt hash → UPDATE password → mark token used
```

## Database Schema

```
users            — id, name, email, username, password, role, branch_id, email_verified
branches         — id, name, location, admin_id
clients          — id, user_id, branch_id, details
password_resets  — id, user_id, token, expires_at, used
tickets          — id, client_id, branch_id, subject, message, status
```

## Security Layers

| Layer | Implementation |
|-------|---------------|
| Auth | JWT in httpOnly cookie, bcrypt rounds=12 |
| Transport | Helmet secure headers, HTTPS in production |
| Rate limiting | login 8/15min, register 10/hr, reset 6/hr, global 150/15min |
| Input | express-validator on every route |
| RBAC | requireRole middleware on all protected routes |
| IDOR | ownership check before every mutation |
| Logging | Winston + Morgan — auth events, errors, traffic |
| Secrets | All in .env, never in frontend code |

## API Routes

### /api/auth (public)
- POST /register
- GET  /verify-email/:token
- POST /login
- POST /logout
- POST /forgot-password
- POST /reset-password

### /api/admin (admin only)
- GET    /dashboard
- GET    /users
- PUT    /users/:id
- DELETE /users/:id
- GET    /branches
- POST   /branches
- PUT    /branches/:id
- DELETE /branches/:id

### /api/branch (branch only)
- GET /dashboard
- GET /clients
- PUT /clients/:id

### /api/client (client only)
- GET /dashboard
- GET /profile
- PUT /profile
