'use strict';

const API_BASE = '/api';

// ── Utilities ─────────────────────────────────────────────────────────────────

const escapeHtml = (str) => {
  const map = { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' };
  return String(str||'').replace(/[&<>"']/g, c => map[c]);
};

const toast = (msg, type='info', dur=4000) => {
  const icons = { success:'✅', danger:'❌', warning:'⚠️', info:'ℹ️' };
  const colors = {
    success: 'background:#0a3d1f;border:2px solid #22cc66;color:#afffcb',
    danger:  'background:#3d0a0a;border:2px solid #ff4444;color:#ffb3b3',
    warning: 'background:#3d2e00;border:2px solid #ffaa00;color:#ffe599',
    info:    'background:#0a1f3d;border:2px solid #0099ff;color:#b3d9ff',
  };
  const el = document.createElement('div');
  el.style.cssText = `position:fixed;top:20px;right:20px;z-index:9999999;
    padding:14px 20px;border-radius:12px;font-size:.95rem;font-weight:700;
    font-family:sans-serif;max-width:340px;box-shadow:0 8px 32px rgba(0,0,0,.4);
    ${colors[type]||colors.info}`;
  el.textContent = (icons[type]||'') + ' ' + msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), dur);
};

const request = async (path, options={}) => {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(API_BASE + path, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...options,
    });
    let data;
    try { data = await res.json(); } catch { throw new Error('Invalid server response'); }
    if (!res.ok) throw new Error(data.message || 'Server error');
    return data;
  } finally { clearTimeout(tid); }
};

const fmt = (n) => Number(n||0).toLocaleString('en-PH', { minimumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' }) : '—';

const redirectByRole = (role) => {
  const map = { admin:'/admin-dashboard.html', branch:'/branch-dashboard.html', client:'/client-dashboard.html' };
  window.location.href = map[role] || '/';
};

// ── Auth ──────────────────────────────────────────────────────────────────────

const handleLogin = async (e) => {
  e?.preventDefault();
  const username = document.getElementById('login-user')?.value.trim();
  const password = document.getElementById('login-pass')?.value;
  if (!username || !password) return toast('Please fill username and password', 'danger');
  try {
    const result = await request('/auth/login', { method:'POST', body: JSON.stringify({ username, password }) });
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
    const result = await request('/auth/login', { method:'POST', body: JSON.stringify({ username, password, role }) });
    toast(result.message, 'success');
    setTimeout(() => redirectByRole(result.data.role), 800);
  } catch (err) { toast(err.message, 'danger'); }
};

const setFieldError = (id, msg) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.border = msg ? '1.5px solid #ff4444' : '';
  let err = el.parentElement.querySelector('.field-err');
  if (msg) {
    if (!err) { err = document.createElement('div'); err.className = 'field-err'; err.style.cssText = 'color:#ff6666;font-size:.78rem;margin-top:4px'; el.parentElement.appendChild(err); }
    err.textContent = '⚠ ' + msg;
  } else if (err) err.remove();
};
const clearFieldErrors = () => document.querySelectorAll('.field-err').forEach(e => e.remove());

const handleRegister = async (e) => {
  e?.preventDefault();
  clearFieldErrors();
  const name      = document.getElementById('reg-name')?.value.trim();
  const email     = document.getElementById('reg-email')?.value.trim();
  const username  = document.getElementById('reg-username')?.value.trim();
  const password  = document.getElementById('reg-pass')?.value;
  const contact   = document.getElementById('reg-contact')?.value.trim();
  const address   = document.getElementById('reg-address')?.value.trim();
  const branch_id = parseInt(document.getElementById('reg-branch')?.value, 10) || null;

  let valid = true;
  if (!name)                          { setFieldError('reg-name','Name is required'); valid=false; }
  if (!email || !/\S+@\S+\.\S+/.test(email)) { setFieldError('reg-email','Valid email is required'); valid=false; }
  if (!username || username.length<3) { setFieldError('reg-username','Username must be at least 3 characters'); valid=false; }
  if (!password || password.length<8) { setFieldError('reg-pass','Password must be at least 8 characters'); valid=false; }
  if (!branch_id)                     { setFieldError('reg-branch','Please select a branch'); valid=false; }
  if (!valid) return;

  try {
    const result = await request('/auth/register', { method:'POST', body: JSON.stringify({ name, email, username, password, contact, address, branch_id }) });
    toast(result.message, 'success');
    setTimeout(() => { window.location.href = '/'; }, 1200);
  } catch (err) {
    // show server errors inline if validation errors returned
    if (err.message?.toLowerCase().includes('email')) setFieldError('reg-email', err.message);
    else if (err.message?.toLowerCase().includes('username')) setFieldError('reg-username', err.message);
    else toast(err.message, 'danger');
  }
};

const handleLogout = async () => {
  try { await request('/auth/logout', { method:'POST' }); } finally { window.location.href = '/'; }
};

// ── Branch dropdown ───────────────────────────────────────────────────────────

const loadBranches = async (selectId) => {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  try {
    const result = await request('/auth/branches');
    result.data.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.id; opt.textContent = b.name;
      sel.appendChild(opt);
    });
  } catch {}
};

// ── Admin PIN gate ────────────────────────────────────────────────────────────

const verifyPin = () => {
  const boxes = document.querySelectorAll('.pin-box');
  const pin = Array.from(boxes).map(b => b.value).join('');
  if (pin.length < 3) return toast('Enter the 3-digit PIN', 'danger');
  if (pin !== '123') return toast('Invalid PIN', 'danger');
  document.getElementById('pin-step').style.display = 'none';
  document.getElementById('admin-login-step').style.display = 'block';
};

// ── Admin Dashboard ───────────────────────────────────────────────────────────

const loadAdminDashboard = async () => {
  try {
    const [statsRes, branchRes, clientRes, payRes, ticketRes] = await Promise.all([
      request('/admin/dashboard'),
      request('/admin/branches'),
      request('/admin/clients'),
      request('/admin/payments'),
      request('/admin/tickets'),
    ]);
    const d = statsRes.data || {};
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = String(v??'0'); };
    set('stat-clients', d.total_clients);
    set('stat-branches', d.total_branches);
    set('stat-admins', d.total_users);
    set('stat-income', '₱' + fmt(d.monthly_revenue));

    const branches = branchRes.data || [];
    const clients  = clientRes.data || [];
    const payments = payRes.data || [];
    const tickets  = ticketRes.data || [];

    // Branches table
    const btb = document.getElementById('branches-tbody');
    if (btb) {
      btb.innerHTML = '';
      branches.forEach(b => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${escapeHtml(b.name)}</td><td>${escapeHtml(b.location)}</td>
          <td>${escapeHtml(b.gcash_number||'—')}</td>
          <td>${clients.filter(c=>c.branch===b.name).length}</td>
          <td><span class="badge badge-${b.status==='active'?'success':'warning'}">${escapeHtml(b.status)}</span></td>
          <td><button class="btn btn-sm btn-outline-dk" onclick="editBranch(${b.id},'${escapeHtml(b.name)}','${escapeHtml(b.location)}','${escapeHtml(b.gcash_number||'')}')">Edit</button>
          <button class="btn btn-sm btn-danger-dk" onclick="deleteBranch(${b.id})">Delete</button></td>`;
        btb.appendChild(tr);
      });
      // populate add-admin branch select
      const sel = document.getElementById('new-admin-branch');
      if (sel) { sel.innerHTML = '<option value="" disabled selected>— Select branch —</option>'; branches.forEach(b => { const o = document.createElement('option'); o.value=b.id; o.textContent=b.name; sel.appendChild(o); }); }
    }

    // Admins table
    const atb = document.getElementById('admins-tbody');
    if (atb) {
      atb.innerHTML = '';
      const admins = (await request('/admin/users')).data.filter(u => u.role === 'branch');
      admins.forEach(u => {
        const br = branches.find(b => b.id === u.branch_id);
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${escapeHtml(u.name)}</td><td>${escapeHtml(u.username)}</td>
          <td>${escapeHtml(br?.name||'—')}</td>
          <td><span class="badge badge-success">Active</span></td>
          <td><button class="btn btn-sm btn-danger-dk" onclick="deleteUser(${u.id})">Remove</button></td>`;
        atb.appendChild(tr);
      });
    }

    // All clients table
    const ctb = document.getElementById('all-clients-tbody');
    if (ctb) {
      ctb.innerHTML = '';
      clients.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${escapeHtml(c.name)}</td><td>${escapeHtml(c.plan||'—')}</td>
          <td>${escapeHtml(c.branch||'—')}</td>
          <td><span class="badge badge-${c.status==='active'?'success':'warning'}">${escapeHtml(c.status)}</span></td>
          <td><span class="badge badge-${c.payment_status==='paid'?'success':'warning'}">${escapeHtml(c.payment_status||'—')}</span></td>
          <td>${fmtDate(c.installation_date)}</td><td>${fmtDate(c.next_billing_date)}</td>`;
        ctb.appendChild(tr);
      });
    }

    // All payments table
    const ptb = document.getElementById('all-payments-tbody');
    if (ptb) {
      ptb.innerHTML = '';
      payments.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${escapeHtml(p.client)}</td><td>${escapeHtml(p.branch)}</td>
          <td>₱${fmt(p.amount)}</td><td>${escapeHtml(p.method||'—')}</td>
          <td>${fmtDate(p.payment_date)}</td>
          <td><span class="badge badge-${p.status==='verified'?'success':'warning'}">${escapeHtml(p.status)}</span></td>
          <td>${p.receipt_url?'<span class="badge badge-info">Yes</span>':'—'}</td>`;
        ptb.appendChild(tr);
      });
    }

    // All tickets table
    const ttb = document.getElementById('all-tickets-tbody');
    if (ttb) {
      ttb.innerHTML = '';
      tickets.forEach(t => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${escapeHtml(t.client)}</td><td>${escapeHtml(t.branch||'—')}</td>
          <td>${escapeHtml(t.subject)}</td><td>${fmtDate(t.created_at)}</td>
          <td><span class="badge badge-${t.status==='open'?'warning':t.status==='resolved'?'success':'info'}">${escapeHtml(t.status)}</span></td>
          <td>${escapeHtml(t.priority)}</td>`;
        ttb.appendChild(tr);
      });
    }
  } catch (err) {
    toast(err.message || 'Admin access required', 'danger');
  }
};

window.addBranch = async () => {
  const name = document.getElementById('new-branch-name')?.value.trim();
  const location = document.getElementById('new-branch-address')?.value.trim();
  const gcash_number = document.getElementById('new-branch-gcash')?.value.trim();
  if (!name || !location) return toast('Name and address required', 'danger');
  try {
    await request('/admin/branches', { method:'POST', body: JSON.stringify({ name, location, gcash_number }) });
    toast('Branch created!', 'success');
    closeModal('add-branch-modal');
    loadAdminDashboard();
  } catch (err) { toast(err.message, 'danger'); }
};

window.editBranch = (id, name, location, gcash) => {
  document.getElementById('new-branch-name').value = name;
  document.getElementById('new-branch-address').value = location;
  document.getElementById('new-branch-gcash').value = gcash;
  const btn = document.querySelector('#add-branch-modal .btn-primary-dk');
  if (btn) { btn.textContent = '✅ Update Branch'; btn.onclick = async () => {
    try {
      await request(`/admin/branches/${id}`, { method:'PUT', body: JSON.stringify({ name: document.getElementById('new-branch-name').value, location: document.getElementById('new-branch-address').value, gcash_number: document.getElementById('new-branch-gcash').value }) });
      toast('Branch updated!', 'success'); closeModal('add-branch-modal'); loadAdminDashboard();
    } catch (err) { toast(err.message, 'danger'); }
  }; }
  openModal('add-branch-modal');
};

window.deleteBranch = async (id) => {
  if (!confirm('Delete this branch?')) return;
  try { await request(`/admin/branches/${id}`, { method:'DELETE' }); toast('Branch deleted', 'success'); loadAdminDashboard(); }
  catch (err) { toast(err.message, 'danger'); }
};

window.deleteUser = async (id) => {
  if (!confirm('Remove this admin?')) return;
  try { await request(`/admin/users/${id}`, { method:'DELETE' }); toast('User removed', 'success'); loadAdminDashboard(); }
  catch (err) { toast(err.message, 'danger'); }
};

window.addAdmin = async () => {
  const name = document.getElementById('new-admin-name')?.value.trim();
  const username = document.getElementById('new-admin-user')?.value.trim();
  const password = document.getElementById('new-admin-pass')?.value;
  const branch_id = document.getElementById('new-admin-branch')?.value;
  if (!name||!username||!password||!branch_id) return toast('All fields required','danger');
  try {
    await request('/auth/register', { method:'POST', body: JSON.stringify({ name, username, email: username+'@oftix.local', password, role:'branch', branch_id }) });
    toast('Admin created!','success'); closeModal('add-admin-modal'); loadAdminDashboard();
  } catch (err) { toast(err.message,'danger'); }
};

window.changePin = () => toast('PIN change saved (demo)','success');
window.backupSystem = () => { const btn = document.getElementById('backup-btn'); if(btn){btn.textContent='⏳ Backing up…';setTimeout(()=>{btn.textContent='💾 Run Backup Now';toast('Backup complete! 💾','success');},2000);} };

// ── Branch Dashboard ──────────────────────────────────────────────────────────

const loadBranchDashboard = async () => {
  try {
    const [dashRes, appsRes, clientsRes, paymentsRes, ticketsRes, schedRes] = await Promise.all([
      request('/branch/dashboard'),
      request('/branch/applications'),
      request('/branch/clients'),
      request('/branch/payments'),
      request('/branch/tickets'),
      request('/branch/schedule'),
    ]);

    const d = dashRes.data || {};
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = String(v??'0'); };
    set('stat-clients', d.total_clients);
    set('stat-tickets', d.total_tickets);
    set('stat-pending', d.pending_apps);
    set('stat-revenue', '₱' + fmt(d.monthly_revenue));
    const badge = document.getElementById('apps-badge');
    if (badge) { badge.textContent = d.pending_apps || 0; badge.style.display = d.pending_apps > 0 ? '' : 'none'; }

    // Overview recent apps
    const oatb = document.getElementById('overview-apps-tbody');
    if (oatb) {
      oatb.innerHTML = '';
      (d.recent_apps||[]).forEach(a => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${escapeHtml(a.name)}</td><td>${escapeHtml(a.plan)}</td>
          <td>${fmtDate(a.application_date)}</td>
          <td><span class="badge badge-${a.status==='pending'?'warning':a.status==='approved'?'info':'success'}">${escapeHtml(a.status)}</span></td>
          <td>${a.status==='pending'?`<button class="btn btn-success btn-sm" onclick="approveApp(${a.id})">Approve</button>`
            :a.status==='approved'?`<button class="btn btn-warning btn-sm" onclick="scheduleAppModal(${a.id})">Schedule</button>`:'—'}</td>`;
        oatb.appendChild(tr);
      });
    }

    // Applications table
    const atb = document.getElementById('apps-tbody');
    if (atb) {
      atb.innerHTML = '';
      (appsRes.data||[]).forEach(a => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${escapeHtml(a.name)}</td><td>${escapeHtml(a.contact||'—')}</td>
          <td>${escapeHtml(a.plan)}</td><td>${fmtDate(a.application_date)}</td>
          <td><span class="badge badge-${a.status==='pending'?'warning':a.status==='approved'||a.status==='scheduled'?'info':a.status==='installed'?'success':'danger'}">${escapeHtml(a.status)}</span></td>
          <td style="display:flex;gap:6px;flex-wrap:wrap">
            ${a.status==='pending'?`<button class="btn btn-success btn-sm" onclick="approveApp(${a.id})">Approve</button><button class="btn btn-danger btn-sm" onclick="rejectApp(${a.id})">Reject</button>`:''}
            ${a.status==='approved'?`<button class="btn btn-warning btn-sm" onclick="scheduleAppModal(${a.id})">Schedule</button>`:''}
            ${a.status==='scheduled'?`<button class="btn btn-primary-dk btn-sm" onclick="markInstalled(${a.id})">Mark Installed</button>`:''}
          </td>`;
        atb.appendChild(tr);
      });
    }

    // Clients table
    const ctb = document.getElementById('clients-tbody');
    if (ctb) {
      ctb.innerHTML = '';
      (clientsRes.data||[]).forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${escapeHtml(c.name)}</td><td>${escapeHtml(c.contact||'—')}</td>
          <td>${escapeHtml(c.plan||'—')}</td>
          <td><span class="badge badge-${c.status==='active'?'success':'warning'}">${escapeHtml(c.status)}</span></td>
          <td><span class="badge badge-${c.payment_status==='paid'?'success':'warning'}">${escapeHtml(c.payment_status||'—')}</span></td>
          <td>${fmtDate(c.installation_date)}</td>`;
        ctb.appendChild(tr);
      });
    }

    // Payments table
    const ptb = document.getElementById('payments-tbody');
    if (ptb) {
      ptb.innerHTML = '';
      (paymentsRes.data||[]).forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${escapeHtml(p.client)}</td><td>₱${fmt(p.amount)}</td>
          <td>${escapeHtml(p.reference_number||'—')}</td>
          <td>${escapeHtml(p.method||'—')}</td><td>${fmtDate(p.payment_date)}</td>
          <td><span class="badge badge-${p.status==='verified'?'success':'warning'}">${escapeHtml(p.status)}</span></td>
          <td>${p.receipt_url?'<span class="badge badge-info">Yes</span>':'—'}</td>
          <td id="pay-action-${p.id}">${p.status==='pending'?`<button class="btn btn-success btn-sm" onclick="verifyPayment(${p.id})">Verify</button>`:'—'}</td>`;
        ptb.appendChild(tr);
      });
    }

    // Tickets table
    const ttb = document.getElementById('tickets-tbody');
    if (ttb) {
      ttb.innerHTML = '';
      (ticketsRes.data||[]).forEach(t => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${escapeHtml(t.client)}</td><td>${escapeHtml(t.subject)}</td>
          <td style="max-width:200px;font-size:.82rem">${escapeHtml(t.message)}</td>
          <td>${fmtDate(t.created_at)}</td>
          <td><span class="badge badge-${t.status==='open'?'warning':t.status==='resolved'?'success':'info'}">${escapeHtml(t.status)}</span></td>
          <td>${t.status!=='resolved'?`<button class="btn btn-success btn-sm" onclick="resolveTicket(${t.id})">Resolve</button>`:'—'}</td>`;
        ttb.appendChild(tr);
      });
    }

    // Schedule table
    const stb = document.getElementById('schedule-tbody');
    if (stb) {
      stb.innerHTML = '';
      (schedRes.data||[]).forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${escapeHtml(s.client)}</td><td>${escapeHtml(s.address||'—')}</td>
          <td>${escapeHtml(s.plan)}</td><td>${fmtDate(s.scheduled_date)}</td>
          <td>${escapeHtml(s.technician_team||'—')}</td>
          <td><span class="badge badge-${s.status==='completed'?'success':'warning'}">${escapeHtml(s.status)}</span></td>`;
        stb.appendChild(tr);
      });
    }

    // Populate schedule app select
    const appSel = document.getElementById('sched-app-select');
    if (appSel) {
      appSel.innerHTML = '<option value="" disabled selected>— Select application —</option>';
      (appsRes.data||[]).filter(a=>a.status==='approved').forEach(a => {
        const o = document.createElement('option'); o.value=a.id; o.textContent=a.name+' — '+a.plan; appSel.appendChild(o);
      });
    }

  } catch (err) { toast(err.message||'Branch access required','danger'); }
};

window.approveApp = async (id) => {
  try { await request(`/branch/applications/${id}`, { method:'PUT', body: JSON.stringify({ status:'approved' }) }); toast('Application approved!','success'); loadBranchDashboard(); }
  catch (err) { toast(err.message,'danger'); }
};
window.rejectApp = async (id) => {
  if (!confirm('Reject this application?')) return;
  try { await request(`/branch/applications/${id}`, { method:'PUT', body: JSON.stringify({ status:'rejected' }) }); toast('Application rejected','info'); loadBranchDashboard(); }
  catch (err) { toast(err.message,'danger'); }
};
window.markInstalled = async (id) => {
  try { await request(`/branch/applications/${id}`, { method:'PUT', body: JSON.stringify({ status:'installed' }) }); toast('Marked as installed! Client activated.','success'); loadBranchDashboard(); }
  catch (err) { toast(err.message,'danger'); }
};
window.scheduleAppModal = (id) => {
  const sel = document.getElementById('sched-app-select');
  if (sel) sel.value = id;
  document.querySelector('[data-sec="schedule"]')?.click();
};
window.verifyPayment = async (id) => {
  try {
    await request(`/branch/payments/${id}/verify`, { method:'PUT' });
    toast('Payment verified!','success');
    const cell = document.getElementById(`pay-action-${id}`);
    if (cell) cell.innerHTML = '<span class="badge badge-success">verified ✅</span>';
  } catch (err) { toast(err.message,'danger'); }
};
window.resolveTicket = async (id) => {
  try { await request(`/branch/tickets/${id}`, { method:'PUT', body: JSON.stringify({ status:'resolved' }) }); toast('Ticket resolved!','success'); loadBranchDashboard(); }
  catch (err) { toast(err.message,'danger'); }
};
window.selectSlot = (btn, value) => {
  document.querySelectorAll('#time-slot-btns .slot-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const input = document.getElementById('sched-time');
  if (input) input.value = value;
};

window.updateSlotDisplay = () => {
  const sh = parseInt(document.getElementById('slot-sh')?.value||'9');
  const sm = document.getElementById('slot-sm')?.value || '00';
  const sa = document.getElementById('slot-sa')?.value || 'AM';
  const eh = parseInt(document.getElementById('slot-eh')?.value||'4');
  const em = document.getElementById('slot-em')?.value || '00';
  const ea = document.getElementById('slot-ea')?.value || 'PM';

  const to24 = (h, ampm) => ampm==='PM' ? (h===12?12:h+12) : (h===12?0:h);
  const h24 = to24(sh, sa);
  const input = document.getElementById('sched-time');
  if (input) input.value = `${String(h24).padStart(2,'0')}:${sm}:00`;

  const preview = document.getElementById('slot-preview');
  if (preview) preview.textContent = `🕘 ${String(sh).padStart(2,'0')}:${sm} ${sa} – ${String(eh).padStart(2,'0')}:${em} ${ea}`;
};

window.addSchedule = async () => {
  const app_id = document.getElementById('sched-app-select')?.value;
  const date   = document.getElementById('sched-date')?.value;
  const time   = document.getElementById('sched-time')?.value;
  const tech   = document.getElementById('sched-tech')?.value;
  if (!app_id||!date) return toast('Select application and date','danger');
  try {
    await request('/branch/schedule', { method:'POST', body: JSON.stringify({ application_id: app_id, scheduled_date: date+(time?' '+time:''), technician_team: tech }) });
    toast('Scheduled!','success'); loadBranchDashboard();
  } catch (err) { toast(err.message,'danger'); }
};
window.saveGCash = () => toast('GCash settings saved!','success');

// ── Client Dashboard ──────────────────────────────────────────────────────────

const loadClientDashboard = async () => {
  try {
    const [profileRes, dashRes, plansRes] = await Promise.all([
      request('/client/profile'),
      request('/client/dashboard'),
      request('/client/plans'),
    ]);
    const u = profileRes.data || {};
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = String(v||''); };
    set('u-name-disp', u.name); set('u-role-disp', u.role);
    set('u-email-disp', u.email); set('disp-name', u.name);
    set('disp-name2', u.name); set('disp-name3', u.name);
    const av = document.getElementById('u-avatar-disp');
    if (av) av.textContent = (u.name||'C')[0].toUpperCase();
    const avLg = document.getElementById('u-avatar-lg');
    if (avLg) avLg.textContent = (u.name||'C')[0].toUpperCase();

    // Plans in apply modal
    const planSel = document.getElementById('apply-plan');
    if (planSel) {
      planSel.innerHTML = '<option value="" disabled selected>— Select your plan —</option>';
      (plansRes.data||[]).forEach(p => {
        const o = document.createElement('option'); o.value=p.id;
        o.textContent = `${p.name} — ${p.speed}Mbps — ₱${fmt(p.price)}/mo`;
        planSel.appendChild(o);
      });
    }

    const sub = dashRes.data?.subscription;
    const unapplied = document.getElementById('view-unapplied');
    const applied   = document.getElementById('view-applied');

    if (sub) {
      if (unapplied) unapplied.style.display = 'none';
      if (applied)   applied.style.display = 'block';
      set('disp-speed', sub.speed + ' Mbps');
      set('disp-price', '₱' + fmt(sub.price));
      set('disp-price2', '₱' + fmt(sub.price));
      set('disp-price3', '₱' + fmt(sub.price));
      set('plan-name-big', sub.plan_name);
      set('plan-speed-big', sub.speed + ' Mbps');
      set('plan-price-big', '₱' + fmt(sub.price) + '/month');
      const due = fmtDate(sub.next_billing_date);
      set('disp-due', due); set('disp-due2', due); set('disp-due3', due); set('plan-due-big', due);
      set('disp-plan', sub.plan_name);

      // unlock locked nav items
      document.querySelectorAll('.cli-nav-item.locked').forEach(el => {
        el.classList.remove('locked');
        el.querySelector('.lock-icon')?.remove();
      });

      // load payments & tickets
      loadClientPayments();
      loadClientTickets();
    } else {
      if (unapplied) unapplied.style.display = 'block';
      if (applied)   applied.style.display = 'none';
    }

    // pre-fill apply modal
    const applyName = document.getElementById('apply-name');
    const applyContact = document.getElementById('apply-contact');
    const applyAddress = document.getElementById('apply-address');
    if (applyName) applyName.value = u.name || '';
    if (applyContact) applyContact.value = u.contact || '';
    if (applyAddress) applyAddress.value = u.address || '';

  } catch (err) { toast(err.message||'Client access required','danger'); }
};

const loadClientPayments = async () => {
  try {
    const res = await request('/client/payments');
    const tbody = document.querySelector('.cli-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    (res.data||[]).forEach(p => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${fmtDate(p.payment_date)||'—'}</td><td>₱${fmt(p.amount)}</td>
        <td>${escapeHtml(p.method||'—')}</td><td>${fmtDate(p.payment_date)}</td>
        <td><span class="badge badge-${p.status==='verified'?'success':'warning'}">${escapeHtml(p.status)}</span></td>`;
      tbody.appendChild(tr);
    });
  } catch {}
};

const loadClientTickets = async () => {
  try {
    const res = await request('/client/tickets');
    const container = document.querySelector('#cli-sec-tickets .d-card:last-child .d-card-hdr')?.parentElement;
    if (!container) return;
    const existing = container.querySelectorAll('.d-tkt');
    existing.forEach(el => el.remove());
    const hdr = container.querySelector('.d-card-hdr');
    (res.data||[]).forEach(t => {
      const div = document.createElement('div');
      div.className = 'd-tkt';
      div.style.cssText = 'background:var(--cli-card2);border:1.5px solid var(--cli-border);border-radius:12px;padding:16px;margin-bottom:12px';
      div.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
        <div style="font-weight:800;color:var(--cli-text)">${escapeHtml(t.subject)}</div>
        <span class="badge badge-${t.status==='open'?'warning':t.status==='resolved'?'success':'info'}">${escapeHtml(t.status)}</span></div>
        <div style="font-size:.78rem;color:var(--cli-muted);margin-bottom:5px">${fmtDate(t.created_at)}</div>
        <div style="font-size:.87rem;color:var(--cli-text)">${escapeHtml(t.message)}</div>`;
      hdr.insertAdjacentElement('afterend', div);
    });
  } catch {}
};

window.submitApplication = async () => {
  const plan_id = document.getElementById('apply-plan')?.value;
  const address = document.getElementById('apply-address')?.value.trim();
  const contact = document.getElementById('apply-contact')?.value.trim();
  if (!plan_id) return toast('Please select a plan','danger');
  try {
    await request('/client/apply', { method:'POST', body: JSON.stringify({ plan_id, address, contact }) });
    toast('Application submitted! Our team will contact you soon.','success');
    closeModal('apply-modal');
    setTimeout(() => loadClientDashboard(), 800);
  } catch (err) { toast(err.message,'danger'); }
};

window.openPaymentModal = async (amount, subscriptionId) => {
  const amtEl  = document.getElementById('qr-amount-disp');
  const subEl  = document.getElementById('pay-sub-id');
  const amtVal = document.getElementById('pay-amount-val');
  const qrImg  = document.getElementById('qr-img');
  const qrLoad = document.getElementById('qr-loading');
  const qrNum  = document.getElementById('qr-gcash-num');
  const branchEl = document.getElementById('qr-branch-disp');
  const refEl  = document.getElementById('pay-ref');

  if (refEl)  refEl.value = '';
  if (subEl)  subEl.value = subscriptionId || '';
  if (amtVal) amtVal.value = amount || '';
  if (amtEl)  amtEl.textContent = amount ? `₱${fmt(amount)}` : 'Loading…';
  if (qrImg)  { qrImg.style.display = 'none'; qrImg.src = ''; }
  if (qrLoad) { qrLoad.style.display = 'block'; qrLoad.textContent = 'Loading QR code…'; }

  openModal('payment-modal');

  try {
    const res = await request('/client/payments/qr');
    const { qr, gcash_number, branch_name, amount: apiAmount } = res.data;
    if (qrLoad) qrLoad.style.display = 'none';
    if (qrImg)  { qrImg.src = qr; qrImg.style.display = 'inline-block'; }
    if (qrNum)  qrNum.textContent = gcash_number || '—';
    if (branchEl) branchEl.textContent = branch_name || '—';
    if (apiAmount) {
      if (amtEl)  amtEl.textContent = `₱${fmt(apiAmount)}`;
      if (amtVal) amtVal.value = apiAmount;
    }
  } catch (err) {
    if (qrLoad) { qrLoad.style.display = 'block'; qrLoad.textContent = 'Failed to load QR. Please try again.'; }
    if (qrImg)  qrImg.style.display = 'none';
  }
};

window.submitPayment = async () => {
  const ref = document.getElementById('pay-ref')?.value.trim();
  const subId = document.getElementById('pay-sub-id')?.value;
  const amount = document.getElementById('pay-amount-val')?.value;
  if (!ref) return toast('Enter your GCash reference number', 'danger');
  try {
    await request('/client/payments', { method: 'POST', body: JSON.stringify({ payment_method_id: 1, reference_number: ref, amount: parseFloat(amount) || 0 }) });
    toast('Payment submitted! Awaiting verification.', 'success');
    closeModal('payment-modal');
    loadClientPayments();
  } catch (err) { toast(err.message, 'danger'); }
};

window.submitTicket = async () => {
  const subject = document.getElementById('ticket-subject')?.value.trim();
  const message = document.getElementById('ticket-msg')?.value.trim();
  if (!subject||!message) return toast('Please fill subject and description','danger');
  try {
    await request('/client/tickets', { method:'POST', body: JSON.stringify({ subject, message }) });
    toast('Ticket submitted!','success');
    document.getElementById('ticket-subject').value='';
    document.getElementById('ticket-msg').value='';
    loadClientTickets();
  } catch (err) { toast(err.message,'danger'); }
};

// ── Theme toggle (admin & branch dashboards) ──────────────────────────────────

window.toggleTheme = () => {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') !== 'light';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) btn.textContent = isDark ? '🌙' : '☀️';
  localStorage.setItem('oftix-theme', isDark ? 'light' : 'dark');
};

// restore saved theme on load
(()=>{
  const saved = localStorage.getItem('oftix-theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
    document.addEventListener('DOMContentLoaded', () => {
      const btn = document.getElementById('theme-toggle-btn');
      if (btn) btn.textContent = saved === 'light' ? '🌙' : '☀️';
    });
  }
})();

// ── Route guard ───────────────────────────────────────────────────────────────

const guardPage = async (requiredRole) => {
  const map = { admin:'/admin/dashboard', branch:'/branch/dashboard', client:'/client/profile' };
  try {
    await request(map[requiredRole] || '/client/profile');
  } catch {
    window.location.href = '/';
  }
};

// ── Modal helpers ─────────────────────────────────────────────────────────────

window.openModal = (id) => { const el = document.getElementById(id); if (el) el.style.display='flex'; };
window.closeModal = (id) => { const el = document.getElementById(id); if (el) el.style.display='none'; };

// close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) e.target.style.display='none';
});

// ── Sidebar nav ───────────────────────────────────────────────────────────────

const initNav = (prefix) => {
  document.querySelectorAll(`.${prefix}-nav-item`).forEach(item => {
    item.addEventListener('click', () => {
      if (item.classList.contains('locked')) { toast('Apply for a connection to unlock this section','info'); return; }
      document.querySelectorAll(`.${prefix}-nav-item`).forEach(i => i.classList.remove('active'));
      document.querySelectorAll(`.${prefix}-sec`).forEach(s => s.classList.remove('active'));
      item.classList.add('active');
      const sec = item.dataset.sec;
      const secEl = document.getElementById(`${prefix}-sec-${sec}`);
      if (secEl) secEl.classList.add('active');
      const title = document.getElementById(`${prefix==='adm'?'adm':'cli'}-page-title`);
      if (title) title.textContent = item.querySelector('.n-label')?.textContent || '';
    });
  });
};

// ── Init ──────────────────────────────────────────────────────────────────────

const init = () => {
  const route = window.location.pathname;

  document.getElementById('login-btn')       ?.addEventListener('click', handleLogin);
  document.getElementById('admin-login-btn') ?.addEventListener('click', handleAdminLogin);
  document.getElementById('reg-submit')      ?.addEventListener('click', handleRegister);
  document.getElementById('logout-btn')      ?.addEventListener('click', handleLogout);
  document.getElementById('pin-verify-btn')  ?.addEventListener('click', verifyPin);

  document.querySelectorAll('.pin-box').forEach((box, i, all) => {
    box.addEventListener('input', () => { if (box.value && all[i+1]) all[i+1].focus(); });
  });

  document.getElementById('admin-access-btn')?.addEventListener('click', () => {
    const m = document.getElementById('admin-gate-modal');
    if (m) m.style.display='flex';
  });

  if (route.includes('register')) loadBranches('reg-branch');

  if (route.includes('admin-dashboard'))  { initNav('adm'); loadAdminDashboard(); }
  if (route.includes('branch-dashboard')) { initNav('adm'); loadBranchDashboard(); }
  if (route.includes('client-dashboard')) { initNav('cli'); loadClientDashboard(); }
};

window.addEventListener('DOMContentLoaded', init);

// ── All Clients search & export ───────────────────────────────────────────────

let _allClientsData = [];

// override to cache data after load
const _origLoadAdmin = loadAdminDashboard;
// patch: cache clients after table render
const _patchClientCache = (clients) => { _allClientsData = clients || []; };

window.filterClients = (q) => {
  const term = q.toLowerCase();
  const tbody = document.getElementById('all-clients-tbody');
  if (!tbody) return;
  const rows = tbody.querySelectorAll('tr');
  rows.forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
  });
};

window.exportClients = (type) => {
  const tbody = document.getElementById('all-clients-tbody');
  if (!tbody) return;
  const headers = ['Name','Plan','Branch','Status','Payment','Install Date','Due Date'];
  const rows = Array.from(tbody.querySelectorAll('tr'))
    .filter(r => r.style.display !== 'none')
    .map(r => Array.from(r.querySelectorAll('td')).map(td => td.textContent.trim()));

  if (type === 'excel') {
    let csv = headers.join(',') + '\n';
    rows.forEach(r => { csv += r.map(c => `"${c.replace(/"/g,'""')}"`).join(',') + '\n'; });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'oftix-clients.csv'; a.click();
  } else {
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Oftix Clients</title>
      <style>body{font-family:sans-serif;padding:20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px;font-size:12px}th{background:#003db3;color:#fff}</style></head><body>
      <h2>Oftix Network — All Clients</h2><p>Generated: ${new Date().toLocaleString()}</p>
      <table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>
      <script>window.print();window.close();<\/script></body></html>`);
    win.document.close();
  }
};

// close export dropdown on outside click
document.addEventListener('click', (e) => {
  const dd = document.getElementById('export-dd');
  if (dd && !e.target.closest('#export-dd') && !e.target.textContent.includes('Generate')) dd.style.display = 'none';
});

// ── All Payments search & export ──────────────────────────────────────────────

// ── Generic table search & export ─────────────────────────────────────────────

window.filterTbl = (input, tbodyId) => {
  const term = input.value.toLowerCase();
  document.querySelectorAll(`#${tbodyId} tr`).forEach(r => {
    r.style.display = r.textContent.toLowerCase().includes(term) ? '' : 'none';
  });
};

window.exportTbl = (tbodyId, filename) => {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const headers = Array.from(tbody.closest('table').querySelectorAll('thead th')).map(th => th.textContent.trim());
  const rows = Array.from(tbody.querySelectorAll('tr'))
    .filter(r => r.style.display !== 'none')
    .map(r => Array.from(r.querySelectorAll('td')).map(td => `"${td.textContent.trim().replace(/"/g,'""')}"`));
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `${filename}.csv`; a.click();
};

window.exportTblPdf = (tbodyId, title) => {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const headers = Array.from(tbody.closest('table').querySelectorAll('thead th')).map(th => th.textContent.trim());
  const rows = Array.from(tbody.querySelectorAll('tr'))
    .filter(r => r.style.display !== 'none')
    .map(r => `<tr>${Array.from(r.querySelectorAll('td')).map(td => `<td>${td.textContent.trim()}</td>`).join('')}</tr>`);
  const win = window.open('', '_blank');
  win.document.write(`<html><head><title>${title}</title>
    <style>body{font-family:sans-serif;padding:20px}h2{margin-bottom:4px}p{font-size:12px;color:#666;margin-bottom:16px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:7px 10px;font-size:12px}th{background:#003db3;color:#fff}</style></head>
    <body><h2>Oftix Network — ${title}</h2><p>Generated: ${new Date().toLocaleString()}</p>
    <table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>
    <script>window.print();<\/script></body></html>`);
};

window.filterPayments = (q) => {
  const term = q.toLowerCase();
  document.querySelectorAll('#all-payments-tbody tr').forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
  });
};

window.exportPayments = (type) => {
  const headers = ['Client','Branch','Amount','Method','Date','Status','Receipt'];
  const rows = Array.from(document.querySelectorAll('#all-payments-tbody tr'))
    .filter(r => r.style.display !== 'none')
    .map(r => Array.from(r.querySelectorAll('td')).map(td => td.textContent.trim()));

  if (type === 'excel') {
    let csv = headers.join(',') + '\n';
    rows.forEach(r => { csv += r.map(c => `"${c.replace(/"/g,'""')}"`).join(',') + '\n'; });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'oftix-payments.csv'; a.click();
  } else {
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Oftix Payments</title>
      <style>body{font-family:sans-serif;padding:20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px;font-size:12px}th{background:#003db3;color:#fff}</style></head><body>
      <h2>Oftix Network — All Payments</h2><p>Generated: ${new Date().toLocaleString()}</p>
      <table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>
      <script>window.print();window.close();<\/script></body></html>`);
    win.document.close();
  }
};

// close export-pay-dd on outside click
document.addEventListener('click', (e) => {
  const dd = document.getElementById('export-pay-dd');
  if (dd && !e.target.closest('#export-pay-dd') && !e.target.closest('[onclick*="export-pay-dd"]')) dd.style.display = 'none';
});

// ── All Tickets search & export ───────────────────────────────────────────────

window.filterTickets = (q) => {
  const term = q.toLowerCase();
  document.querySelectorAll('#all-tickets-tbody tr').forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
  });
};

window.exportTickets = (type) => {
  const headers = ['Client','Branch','Subject','Date','Status','Priority'];
  const rows = Array.from(document.querySelectorAll('#all-tickets-tbody tr'))
    .filter(r => r.style.display !== 'none')
    .map(r => Array.from(r.querySelectorAll('td')).map(td => td.textContent.trim()));

  if (type === 'excel') {
    let csv = headers.join(',') + '\n';
    rows.forEach(r => { csv += r.map(c => `"${c.replace(/"/g,'""')}"`).join(',') + '\n'; });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'oftix-tickets.csv'; a.click();
  } else {
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Oftix Tickets</title>
      <style>body{font-family:sans-serif;padding:20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px;font-size:12px}th{background:#003db3;color:#fff}</style></head><body>
      <h2>Oftix Network — All Tickets</h2><p>Generated: ${new Date().toLocaleString()}</p>
      <table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>
      <script>window.print();window.close();<\/script></body></html>`);
    win.document.close();
  }
};

document.addEventListener('click', (e) => {
  const dd = document.getElementById('export-tkt-dd');
  if (dd && !e.target.closest('#export-tkt-dd') && !e.target.closest('[onclick*="export-tkt-dd"]')) dd.style.display = 'none';
});

// ── Reports export ────────────────────────────────────────────────────────────

window.exportReport = (type) => {
  const headers = ['Branch','New Clients','Revenue','Tickets','Uptime'];
  const rows = Array.from(document.querySelectorAll('#adm-sec-reports table tbody tr'))
    .map(r => Array.from(r.querySelectorAll('td')).map(td => td.textContent.trim()));

  if (type === 'excel') {
    let csv = headers.join(',') + '\n';
    rows.forEach(r => { csv += r.map(c => `"${c.replace(/"/g,'""')}"`).join(',') + '\n'; });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'oftix-report.csv'; a.click();
  } else {
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Oftix Report</title>
      <style>body{font-family:sans-serif;padding:20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px;font-size:12px}th{background:#003db3;color:#fff}</style></head><body>
      <h2>Oftix Network — Monthly Report</h2><p>Generated: ${new Date().toLocaleString()}</p>
      <table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>
      <script>window.print();window.close();<\/script></body></html>`);
    win.document.close();
  }
};

document.addEventListener('click', (e) => {
  const dd = document.getElementById('export-rep-dd');
  if (dd && !e.target.closest('#export-rep-dd') && !e.target.closest('[onclick*="export-rep-dd"]')) dd.style.display = 'none';
});

window.filterReports = (q) => {
  const term = q.toLowerCase();
  document.querySelectorAll('#adm-sec-reports table tbody tr').forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
  });
};
