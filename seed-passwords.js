'use strict';
const bcrypt = require('bcryptjs');
const pool = require('./backend/config/db');
require('dotenv').config();

const accounts = [
  { username: 'superadmin',     password: 'Admin@1234' },
  { username: 'admin_qc',       password: 'Branch@1234' },
  { username: 'admin_makati',   password: 'Branch@1234' },
  { username: 'admin_manila',   password: 'Branch@1234' },
  { username: 'admin_eastwood', password: 'Branch@1234' },
  { username: 'juandc',         password: 'Client@1234' },
  { username: 'mariasantos',    password: 'Client@1234' },
  { username: 'carlom',         password: 'Client@1234' },
  { username: 'sofian',         password: 'Client@1234' },
  { username: 'jeromeb',        password: 'Client@1234' },
  { username: 'ginalopez',      password: 'Client@1234' },
];

(async () => {
  for (const { username, password } of accounts) {
    const hash = await bcrypt.hash(password, 12);
    await pool.execute('UPDATE users SET password = ? WHERE username = ?', [hash, username]);
    console.log(`✓ ${username}`);
  }
  console.log('All passwords seeded.');
  process.exit(0);
})();
