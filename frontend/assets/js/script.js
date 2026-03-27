'use strict';

const API_BASE = '/api';

// ── Utilities ────────────────────────────────────────────────────────────────

const toast = (msg, type = 'info', dur = 3500) => {
  let c = document.getElementById('toast-container');
  if (!c) { c = document.createElement('div'); c.id = 'toast-container'; document.body.appendChild(c); }
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  c.appendChild(el);
  setTimeout(() => el.remove(), dur);
};

const request = async (path, options = {}) => {
  const res = await fetch(API_BASE + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Server error');
  return data;
};

const redirectByRole = (role) => {
  const map = { admin: '/admin-dashboard.html', branch: '/branch-dashboard.html', client: '/client-dashboard.html' };
  window.location.href = map[role] || '/index.html';
};

// ── Auth ─────────────────────────────────────────────────────────────────────

const handleLogin = async (e) => {
  e?.preventDefault();
  const username = document.getElementById('login-user')?.value.trim();
  const password = document.getElementById('login-pass')?.value;
  if (!username || !password) return toast('Please fill username and password', 'danger');
  try {
    const result = await request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
    toast(result.message, 'success');
    setTimeout(() => redirectByRole(result.data.role), 800);
  } catch (err) { toast(err.message, 'danger'); }
};

const handleAdminLogin = async (e) => {
  e?.preventDefault();
  const username = document.getElementById('admin-user')?.value.trim();
  const password = document.getElementById('admin-pass')?.value;
  const role = document.getElementById('admin-role-select')?.value;
  if (!username || !password) return toast('Please fill username and password', 'danger');
  try {
    const result = await request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password, role }) });
    toast(result.message, 'success');
    setTimeout(() => redirectByRole(result.data.role), 800);
  } catch (err) { toast(err.message, 'danger'); }
};

const handleRegister = async (e) => {
  e?.preventDefault();
  const name     = document.getElementById('reg-name')?.value.trim();
  const email    = document.getElementById('reg-email')?.value.trim();
  const username = document.getElementById('reg-username')?.value.trim();
  const password = document.getElementById('reg-pass')?.value;
  const contact  = document.getElementById('reg-contact')?.value.trim();
  const address  = document.getElementById('reg-address')?.value.trim();
  const branch_id = document.getElementById('reg-branch')?.value;
  if (!name || !email || !username || !password || !branch_id)
    return toast('Please fill all required fields', 'danger');
  try {
    const result = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, username, password, contact, address, branch_id }),
    });
    toast(result.message, 'success');
    setTimeout(() => { window.location.href = '/index.html'; }, 1200);
  } catch (err) { toast(err.message, 'danger'); }
};

const handleForgotPassword = async (e) => {
  e?.preventDefault();
  const email = document.getElementById('forgot-email')?.value.trim();
  if (!email) return toast('Please enter your email', 'danger');
  try {
    const result = await request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
    toast(result.message, 'success');
  } catch (err) { toast(err.message, 'danger'); }
};

const handleLogout = async () => {
  try { await request('/auth/logout', { method: 'POST' }); } finally {
    window.location.href = '/index.html';
  }
};

// ── Branch dropdown (register page) ─────────────────────────────────────────

const loadBranches = async (selectId) => {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  try {
    const result = await request('/admin/branches');
    result.data.forEach((b) => {
      const opt = document.createElement('option');
      opt.value = b.id;
      opt.textContent = b.name;
      sel.appendChild(opt);
    });
  } catch {
    // fallback: leave select empty, user will see no options
  }
};

// ── Admin gate PIN ────────────────────────────────────────────────────────────

const verifyPin = async () => {
  const boxes = document.querySelectorAll('.pin-box');
  const pin = Array.from(boxes).map(b => b.value).join('');
  if (pin.length < 3) return toast('Enter the 3-digit PIN', 'danger');
  try {
    await request('/auth/verify-pin', { method: 'POST', body: JSON.stringify({ pin }) });
    document.getElementById('pin-step').style.display = 'none';
    document.getElementById('admin-login-step').style.display = 'block';
    loadBranches('admin-branch-sel');
  } catch (err) { toast(err.message || 'Invalid PIN', 'danger'); }
};

// ── Dashboard data ────────────────────────────────────────────────────────────

const loadAdminDashboard = async () => {
  try {
    const resp = await request('/admin/dashboard');
    const d = resp.data;
    document.getElementById('stat-clients')  && (document.getElementById('stat-clients').textContent  = d.total_clients  ?? '0');
    document.getElementById('stat-branches') && (document.getElementById('stat-branches').textContent = d.total_branches ?? '0');
    document.getElementById('stat-admins')   && (document.getElementById('stat-admins').textContent   = d.total_users    ?? '0');
  } catch (err) {
    toast('Admin access required', 'danger');
    setTimeout(() => { window.location.href = '/index.html'; }, 1000);
  }
};

const loadBranchDashboard = async () => {
  try {
    const resp = await request('/branch/dashboard');
    const d = resp.data;
    const stats = document.querySelectorAll('.adm-stat .adm-stat-val');
    // Update clients and tickets if stat elements exist by id
    document.getElementById('stat-clients')  && (document.getElementById('stat-clients').textContent  = d.total_clients  ?? '0');
    document.getElementById('stat-tickets')  && (document.getElementById('stat-tickets').textContent  = d.total_tickets  ?? '0');
  } catch (err) {
    toast('Branch access required', 'danger');
    setTimeout(() => { window.location.href = '/index.html'; }, 1000);
  }
};

const loadClientDashboard = async () => {
  try {
    const resp = await request('/client/profile');
    const u = resp.data;
    document.getElementById('u-name-disp')  && (document.getElementById('u-name-disp').textContent  = u.name    || '');
    document.getElementById('u-role-disp')  && (document.getElementById('u-role-disp').textContent  = u.role    || '');
    document.getElementById('u-email-disp') && (document.getElementById('u-email-disp').textContent = u.email   || '');
  } catch (err) {
    toast('Client access required', 'danger');
    setTimeout(() => { window.location.href = '/index.html'; }, 1000);
  }
};

// ── Route guard ───────────────────────────────────────────────────────────────

const guardPage = async (requiredRole) => {
  try {
    const resp = await request('/client/profile');
    if (resp.data.role !== requiredRole) {
      window.location.href = '/index.html';
    }
  } catch {
    window.location.href = '/index.html';
  }
};

// ── Init ──────────────────────────────────────────────────────────────────────

const init = () => {
  const route = window.location.pathname;

  // Auth buttons
  document.getElementById('login-btn')      ?.addEventListener('click', handleLogin);
  document.getElementById('admin-login-btn') ?.addEventListener('click', handleAdminLogin);
  document.getElementById('reg-submit')     ?.addEventListener('click', handleRegister);
  document.getElementById('logout-btn')     ?.addEventListener('click', handleLogout);
  document.getElementById('pin-verify-btn') ?.addEventListener('click', verifyPin);
  document.getElementById('forgot-btn')     ?.addEventListener('click', handleForgotPassword);

  // PIN box auto-advance
  document.querySelectorAll('.pin-box').forEach((box, i, all) => {
    box.addEventListener('input', () => { if (box.value && all[i + 1]) all[i + 1].focus(); });
  });

  // Admin gate — open modal
  document.getElementById('admin-access-btn')?.addEventListener('click', () => {
    const modal = document.getElementById('admin-gate-modal');
    if (modal) modal.style.display = 'flex';
  });

  // Register page — load branches from API
  if (route.includes('register')) loadBranches('reg-branch');

  // Dashboard guards + data
  if (route.includes('admin-dashboard'))  loadAdminDashboard();
  if (route.includes('branch-dashboard')) loadBranchDashboard();
  if (route.includes('client-dashboard')) loadClientDashboard();
};

window.addEventListener('DOMContentLoaded', init);

// ── Modal helpers (used inline in HTML) ──────────────────────────────────────
window.closeModal = (id) => {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
};
