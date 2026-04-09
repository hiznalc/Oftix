# Oftix — System Flow

End-to-end user journeys for all three roles.

---

## 1. Client Journey

### Registration & Onboarding
```
Visit /register.html
  → Fill form (name, email, username, password, branch)
  → POST /api/auth/register
  → Account created (email_verified=0)
  → Redirected to login page
         ↓
Login at /
  → POST /api/auth/login
  → JWT set in httpOnly cookie
  → Redirected to /client-dashboard.html
         ↓
Dashboard loads (no subscription yet)
  → Shows plan cards (Fiber 25/50/100/200)
  → Click "Apply for Connection"
  → Fill address, contact, select plan
  → POST /api/client/apply
  → Application submitted (status=pending)
  → Waiting for branch admin approval
```

### After Installation (Active Subscriber)
```
Branch admin marks application as installed
  → Client record created
  → Subscription created (status=active, payment_status=unpaid)
         ↓
Client logs in → full dashboard unlocks:
  ├── Dashboard    — speed, status, monthly bill, due date
  ├── My Profile   — view personal info
  ├── My Plan      — plan details, usage, installation timeline
  ├── Billing      — pay bill, payment history
  └── Tickets      — submit and track support issues
```

### Paying a Bill
```
Click "Pay Now" (any Pay button)
  → Payment modal opens (Step 1)
  → Click "Generate PayMongo Payment"
  → POST /api/client/payments/link
  → PayMongo creates checkout link
  → Modal shows QR code + clickable link (Step 2)
         ↓
Client scans QR or clicks link
  → PayMongo hosted checkout page opens
  → Client pays via GCash / card
         ↓
System polls every 5 seconds
  → GET /api/client/payments/link/:id
  → PayMongo returns status=paid
  → Payment auto-verified in DB
  → Toast "Payment confirmed!" → modal closes
         ↓
Fallback: enter reference number manually
  → POST /api/client/payments
  → Branch admin verifies manually
```

### Submitting a Support Ticket
```
Go to Tickets section
  → Fill subject + description
  → POST /api/client/tickets
  → Ticket created (status=open)
  → Branch admin responds and updates status
```

---

## 2. Branch Admin Journey

### Login
```
Visit / → click "Staff / Admin Access"
  → Enter 3-digit PIN (786)
  → Select role: Branch Admin
  → Enter username + password
  → POST /api/auth/login
  → Redirected to /branch-dashboard.html
```

### Managing Applications
```
Applications section shows pending count badge
  → View all applications for this branch
  → Approve → PUT /api/branch/applications/:id { status: approved }
  → Schedule → POST /api/branch/schedule (date + time slot + technician)
  → Mark Installed → PUT /api/branch/applications/:id { status: installed }
    → Client record + subscription auto-created
```

### Verifying Payments
```
Payments section → shows all branch payments
  → Pending payments show "Verify" button
  → Click Verify → PUT /api/branch/payments/:id/verify
    → Payment status → verified
    → Subscription payment_status → paid
    → Row updates in-place (no page reload)
```

### Managing Tickets
```
Tickets section → shows all branch tickets
  → Update status → PUT /api/branch/tickets/:id { status: in-progress / resolved }
```

### Installation Schedule
```
Schedule section → view upcoming installations
  → Add to Schedule:
    - Select approved application
    - Pick date (calendar picker)
    - Set time slot (hour:min AM/PM dropdowns)
    - Assign technician team
  → POST /api/branch/schedule
```

---

## 3. Super Admin Journey

### Login
```
Visit / → click "Staff / Admin Access"
  → Enter PIN (786)
  → Select role: Main Admin
  → Enter superadmin credentials
  → Redirected to /admin-dashboard.html
```

### System Overview
```
Dashboard → network-wide stats:
  - Total clients, branches, revenue, tickets
  - Recent applications across all branches
```

### Branch Management
```
Branches section:
  → View all branches
  → Create branch → POST /api/admin/branches
  → Edit branch (name, location, PayMongo number)
  → Delete branch → DELETE /api/admin/branches/:id
```

### User Management
```
Branch Admins section:
  → View all staff accounts
  → Create branch admin → POST /api/admin/users (via modal)
  → Update user → PUT /api/admin/users/:id
  → Delete user → DELETE /api/admin/users/:id
```

### Monitoring
```
All Clients  → network-wide subscriber list (search + export CSV/PDF)
All Payments → all transactions across branches (search + export)
All Tickets  → all support tickets (search + export)
```

---

## 4. Data Flow Summary

```
[New User]
  Register → Login → Apply → (wait) → Installed → Pay → Verified

[Branch Admin]
  Login → Approve App → Schedule → Mark Installed → Verify Payments → Resolve Tickets

[Super Admin]
  Login → Monitor → Manage Branches → Manage Users → Export Reports
```

---

## 5. Payment States

```
submitted (pending)
  ├── PayMongo auto-verify → verified  ✅
  └── Branch manual verify → verified  ✅
                          └── failed   ❌
```

## 6. Application States

```
pending → approved → scheduled → installed → (client activated)
       └── rejected
       └── cancelled
```

## 7. Ticket States

```
open → in-progress → resolved → closed
    └──────────────────────────→ reopened
```
