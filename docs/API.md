# API Documentation

See the main [README.md](../README.md) for the full API endpoint table.

## Auth Flow

1. `POST /api/auth/register` — creates user, sends verification email
2. `GET /api/auth/verify-email/:token` — verifies email (45 min window)
3. `POST /api/auth/login` — returns JWT in httpOnly cookie
4. `POST /api/auth/logout` — clears cookie

## Password Reset Flow

1. `POST /api/auth/forgot-password` — sends reset token (15 min expiry)
2. `POST /api/auth/reset-password` — validates token, updates password

## Role Access

| Role   | Accessible Routes         |
|--------|---------------------------|
| admin  | /api/admin/*              |
| branch | /api/branch/*             |
| client | /api/client/*             |
