# Sample Accounts — Development & Testing Only

> ⚠️ WARNING: These credentials are for local development only. Never use in production.

---

## Seeding the Database

```bash
mysql -u root < database.sql
```

Then set known passwords (the seed inserts empty password hashes — run this once in Node):

```js
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({ host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });

async function seed() {
  const hash = (p) => bcrypt.hash(p, 12);
  await pool.execute('UPDATE users SET password=? WHERE username=?', [await hash('Admin@1234'), 'superadmin']);
  await pool.execute('UPDATE users SET password=? WHERE username=?', [await hash('Branch@1234'), 'admin_qc']);
  await pool.execute('UPDATE users SET password=? WHERE username=?', [await hash('Client@1234'), 'client1']);
  console.log('Passwords seeded.');
  process.exit(0);
}
seed();
```

---

## Accounts

### Super Admin
| Field    | Value               |
|----------|---------------------|
| Email    | admin@oftix.local   |
| Username | superadmin          |
| Password | Admin@1234          |
| Role     | admin               |

### Branch Admin (QC)
| Field     | Value               |
|-----------|---------------------|
| Email     | qcadmin@oftix.local |
| Username  | admin_qc            |
| Password  | Branch@1234         |
| Role      | branch              |
| Branch ID | 1                   |

### Client
| Field     | Value                |
|-----------|----------------------|
| Email     | client1@oftix.local  |
| Username  | client1              |
| Password  | Client@1234          |
| Role      | client               |
| Branch ID | 1                    |

---

## Access Matrix

| Route prefix    | admin | branch | client |
|-----------------|-------|--------|--------|
| /api/admin/*    | ✅    | ❌     | ❌     |
| /api/branch/*   | ❌    | ✅     | ❌     |
| /api/client/*   | ❌    | ❌     | ✅     |
| /api/auth/*     | ✅    | ✅     | ✅     |
