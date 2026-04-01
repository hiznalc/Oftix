# Sample Accounts — Development & Testing Only

> ⚠️ WARNING: These credentials are for local development only. Never use in production.

---

## Setup

1. Import `database.sql` via phpMyAdmin (passwords are pre-hashed — no extra step needed)
2. Or run `node seed-passwords.js` if you need to reset passwords

---

## Accounts

### Super Admin
| Field    | Value               |
|----------|---------------------|
| Username | `superadmin`        |
| Password | `superadmin`        |
| Email    | admin@oftix.local   |
| Role     | admin               |

### Branch Admins
| Username         | Password | Branch          |
|------------------|----------|-----------------|
| `admin_qc`       | `admin`  | Oftix Quezon City |
| `admin_makati`   | `admin`  | Oftix Makati    |
| `admin_manila`   | `admin`  | Oftix Manila    |
| `admin_eastwood` | `admin`  | Oftix Eastwood  |

### Clients
| Username      | Password      | Branch          |
|---------------|---------------|-----------------|
| `juandc`      | `Client@1234` | Quezon City     |
| `mariasantos` | `Client@1234` | Makati          |
| `carlom`      | `Client@1234` | Quezon City     |
| `sofian`      | `Client@1234` | Manila          |
| `jeromeb`     | `Client@1234` | Quezon City     |
| `ginalopez`   | `Client@1234` | Makati          |

---

## Access Matrix

| Route prefix  | admin | branch | client |
|---------------|-------|--------|--------|
| /api/admin/*  | ✅    | ❌     | ❌     |
| /api/branch/* | ❌    | ✅     | ❌     |
| /api/client/* | ❌    | ❌     | ✅     |
| /api/auth/*   | ✅    | ✅     | ✅     |

---

## Login Notes

- Admin/Branch login requires the **3-digit PIN `786`** on the login page first
- Client login goes directly through the main login form
- All accounts have `email_verified = 1` and `status = active` in the seed data
