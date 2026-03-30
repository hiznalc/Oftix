# API Documentation

See the main [README.md](../README.md) for the full API endpoint table.

## Auth Flow

1. `POST /api/auth/register` — creates user, sends verification email
2. `POST /api/auth/login` — returns JWT in httpOnly cookie
3. `POST /api/auth/logout` — clears cookie

## Password Reset Flow

1. `POST /api/auth/forgot-password` — sends reset token (15 min expiry)
2. `POST /api/auth/reset-password` — validates token, updates password

## Role Access

| Role   | Accessible Routes         |
|--------|---------------------------|
| admin  | /api/admin/*              |
| branch | /api/branch/*             |
| client | /api/client/*             |

## Branch Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/branch/dashboard | Stats: clients, revenue, tickets, pending apps |
| GET | /api/branch/clients | Active clients in branch |
| PUT | /api/branch/clients/:id | Update client status |
| GET | /api/branch/applications | All applications for branch |
| PUT | /api/branch/applications/:id | Approve / reject / schedule application |
| GET | /api/branch/payments | Payments for branch |
| PUT | /api/branch/payments/:id/verify | Mark payment as verified |
| GET | /api/branch/tickets | Support tickets for branch |
| PUT | /api/branch/tickets/:id | Update ticket status |
| GET | /api/branch/schedule | Installation schedule |
| POST | /api/branch/schedule | Add installation to schedule |

## Client Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/client/dashboard | Dashboard data |
| GET | /api/client/profile | Own profile |
| PUT | /api/client/profile | Update name, contact, address |
| GET | /api/client/subscription | Active subscription + plan |
| GET | /api/client/payments | Payment history |
| POST | /api/client/payments | Submit payment with reference |
| GET | /api/client/tickets | Own tickets |
| POST | /api/client/tickets | Submit new ticket |
| POST | /api/client/apply | Apply for connection |
| GET | /api/client/plans | Available plans |

## Admin Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/admin/dashboard | System-wide stats |
| GET | /api/admin/users | All users |
| PUT | /api/admin/users/:id | Update user |
| DELETE | /api/admin/users/:id | Delete user |
| GET | /api/admin/branches | All branches |
| POST | /api/admin/branches | Create branch |
| PUT | /api/admin/branches/:id | Update branch |
| DELETE | /api/admin/branches/:id | Delete branch |
| GET | /api/admin/clients | All clients with plan & branch |
| GET | /api/admin/payments | All payments |
| GET | /api/admin/tickets | All tickets |
| GET | /api/admin/plans | All plans |
