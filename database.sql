DROP DATABASE IF EXISTS oftix;
CREATE DATABASE oftix CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE oftix;

-- ════════════════════════════════════════════════════════════════════════════
-- CORE TABLES
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE branches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  admin_id INT NULL,
  gcash_number VARCHAR(50) COMMENT 'GCash payment number for branch',
  status ENUM('active','inactive') DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status)
);

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','branch','client') NOT NULL DEFAULT 'client',
  contact VARCHAR(50),
  address TEXT,
  branch_id INT NULL,
  email_verified TINYINT(1) DEFAULT 0,
  email_verification_token VARCHAR(255),
  email_verification_expires DATETIME,
  status ENUM('active','inactive','suspended') DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
  INDEX idx_role (role),
  INDEX idx_email (email),
  INDEX idx_username (username),
  INDEX idx_status (status)
);

ALTER TABLE branches ADD CONSTRAINT fk_branch_admin FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  branch_id INT NOT NULL,
  status ENUM('prospect','active','inactive','suspended') DEFAULT 'prospect',
  installation_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_branch (user_id, branch_id),
  INDEX idx_status (status),
  INDEX idx_branch_id (branch_id)
);

-- ════════════════════════════════════════════════════════════════════════════
-- INTERNET PLANS & SUBSCRIPTIONS
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE COMMENT 'e.g., Fiber 25, Fiber 50, etc.',
  speed INT NOT NULL COMMENT 'Speed in Mbps',
  price DECIMAL(10,2) NOT NULL COMMENT 'Monthly price in PHP',
  description TEXT,
  status ENUM('active','inactive') DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status)
);

CREATE TABLE subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  plan_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  next_billing_date DATE NOT NULL,
  status ENUM('active','suspended','cancelled','pending') DEFAULT 'pending',
  payment_status ENUM('paid','unpaid','overdue') DEFAULT 'unpaid',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE RESTRICT,
  INDEX idx_status (status),
  INDEX idx_payment_status (payment_status),
  INDEX idx_client_id (client_id)
);

-- ════════════════════════════════════════════════════════════════════════════
-- APPLICATIONS & INSTALLATIONS
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  branch_id INT NOT NULL,
  plan_id INT NOT NULL,
  status ENUM('pending','approved','scheduled','installed','rejected','cancelled') DEFAULT 'pending',
  application_date DATE NOT NULL,
  approval_date DATE,
  installation_date DATE,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE RESTRICT,
  INDEX idx_status (status),
  INDEX idx_branch_id (branch_id),
  INDEX idx_user_id (user_id)
);

CREATE TABLE installation_schedule (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL,
  scheduled_date DATETIME NOT NULL,
  technician_team VARCHAR(100),
  notes TEXT,
  status ENUM('scheduled','in-progress','completed','postponed','cancelled') DEFAULT 'scheduled',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  INDEX idx_scheduled_date (scheduled_date),
  INDEX idx_status (status)
);

-- ════════════════════════════════════════════════════════════════════════════
-- PAYMENTS
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE payment_methods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE COMMENT 'e.g., GCash, Bank Transfer, etc.',
  description TEXT,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subscription_id INT NOT NULL,
  client_id INT NOT NULL,
  branch_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method_id INT,
  reference_number VARCHAR(100) COMMENT 'GCash ref, bank receipt, etc.',
  status ENUM('pending','verified','failed','refunded') DEFAULT 'pending',
  payment_date DATETIME,
  verified_date DATETIME,
  verified_by INT COMMENT 'branch admin who verified',
  receipt_url VARCHAR(500) COMMENT 'Image URL of receipt',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
  FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL,
  FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_payment_date (payment_date),
  INDEX idx_client_id (client_id),
  INDEX idx_subscription_id (subscription_id)
);

-- ════════════════════════════════════════════════════════════════════════════
-- SUPPORT & TICKETS
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT,
  user_id INT,
  branch_id INT,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  priority ENUM('low','medium','high','critical') DEFAULT 'medium',
  category VARCHAR(100) COMMENT 'e.g., connection-issue, billing, installation, etc.',
  status ENUM('open','in-progress','resolved','closed','reopened') DEFAULT 'open',
  assigned_to INT COMMENT 'branch staff assigned',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  INDEX idx_client_id (client_id),
  INDEX idx_branch_id (branch_id)
);

CREATE TABLE ticket_replies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NOT NULL,
  user_id INT NOT NULL,
  message TEXT NOT NULL,
  is_staff_reply TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_ticket_id (ticket_id)
);

-- ════════════════════════════════════════════════════════════════════════════
-- AUTHENTICATION & SECURITY
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token)
);

CREATE TABLE login_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  username VARCHAR(100),
  ip_address VARCHAR(45),
  user_agent TEXT,
  status ENUM('success','failed') DEFAULT 'success',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);

-- ════════════════════════════════════════════════════════════════════════════
-- SEED DATA
-- ════════════════════════════════════════════════════════════════════════════

-- Payment Methods
INSERT INTO payment_methods (name, description, is_active) VALUES
('GCash', 'Mobile payment via GCash', 1),
('Bank Transfer', 'Direct bank deposit', 1),
('Cash', 'In-person payment at branch office', 1),
('Online Credit Card', 'Credit/Debit card (Stripe/PayMo)', 1);

-- Internet Plans
INSERT INTO plans (name, speed, price, description, status) VALUES
('Fiber 25', 25, 999.00, 'Light browsing & streaming', 'active'),
('Fiber 50', 50, 1499.00, 'Families & HD streaming (POPULAR)', 'active'),
('Fiber 100', 100, 1999.00, 'Work from home & power users', 'active'),
('Fiber 200', 200, 2999.00, 'Gaming & heavy users', 'active');

-- Branches
INSERT INTO branches (name, location, gcash_number, status) VALUES
('Oftix Quezon City', 'Quezon City, Metro Manila', '09178901234', 'active'),
('Oftix Makati', 'Makati City, Metro Manila', '09178901235', 'active'),
('Oftix Manila', 'Manila City, Metro Manila', '09178901236', 'active'),
('Oftix Eastwood', 'Libis, Quezon City', '09178901237', 'active');

-- Users (passwords are empty - should be hashed in real implementation)
INSERT INTO users (name, email, username, password, role, contact, address, branch_id, email_verified, status) VALUES
('Super Admin', 'admin@oftix.local', 'superadmin', '', 'admin', '09171234567', 'HQ, Metro Manila', NULL, 1, 'active'),
('Branch Manager - QC', 'admin_qc@oftix.local', 'admin_qc', '', 'branch', '09179876543', 'Quezon City', 1, 1, 'active'),
('Branch Manager - Makati', 'admin_makati@oftix.local', 'admin_makati', '', 'branch', '09179876544', 'Makati City', 2, 1, 'active'),
('Branch Manager - Manila', 'admin_manila@oftix.local', 'admin_manila', '', 'branch', '09179876545', 'Manila City', 3, 1, 'active'),
('Branch Manager - Eastwood', 'admin_eastwood@oftix.local', 'admin_eastwood', '', 'branch', '09179876546', 'Libis, QC', 4, 1, 'active');

-- Sample Clients
INSERT INTO users (name, email, username, password, role, contact, address, branch_id, email_verified, status) VALUES
('Juan Dela Cruz', 'juan@email.com', 'juandc', '', 'client', '09179991234', 'Quezon City', 1, 1, 'active'),
('Maria Santos', 'maria@email.com', 'mariasantos', '', 'client', '09179991235', 'Makati City', 2, 1, 'active'),
('Carlo Mendoza', 'carlo@email.com', 'carlom', '', 'client', '09179991236', 'Quezon City', 1, 1, 'active'),
('Sofia Tan', 'sofia@email.com', 'sofian', '', 'client', '09179991237', 'Manila City', 3, 1, 'active'),
('Jerome Bautista', 'jerome@email.com', 'jeromeb', '', 'client', '09179991238', 'Quezon City', 1, 0, 'active'),
('Gina Lopez', 'gina@email.com', 'ginalopez', '', 'client', '09179991239', 'Makati City', 2, 1, 'active');

-- Client Profiles
INSERT INTO clients (user_id, branch_id, status, installation_date) VALUES
(6, 1, 'active', '2025-10-15'),
(7, 2, 'active', '2025-08-22'),
(8, 1, 'active', '2025-11-03'),
(9, 3, 'active', '2025-09-10'),
(10, 1, 'prospect', NULL),
(11, 2, 'active', '2025-12-01');

-- Sample Subscriptions
INSERT INTO subscriptions (client_id, plan_id, start_date, next_billing_date, status, payment_status) VALUES
(1, 2, '2025-10-15', '2026-04-15', 'active', 'paid'),
(2, 3, '2025-08-22', '2026-04-22', 'active', 'paid'),
(3, 2, '2025-11-03', '2026-04-03', 'active', 'unpaid'),
(4, 1, '2025-09-10', '2026-04-10', 'active', 'paid'),
(6, 4, '2025-12-01', '2026-04-01', 'active', 'unpaid');

-- Sample Applications (Pending & Approved)
INSERT INTO applications (user_id, branch_id, plan_id, status, application_date, approval_date) VALUES
(10, 1, 2, 'approved', '2026-03-10', '2026-03-12'),
(11, 2, 3, 'approved', '2026-03-08', '2026-03-09');

-- Sample Installation Schedules
INSERT INTO installation_schedule (application_id, scheduled_date, technician_team, status) VALUES
(1, '2026-03-25 09:00:00', 'Tech Team A', 'scheduled'),
(2, '2026-03-27 13:00:00', 'Tech Team B', 'scheduled');

-- Sample Payments
INSERT INTO payments (subscription_id, client_id, branch_id, amount, payment_method_id, reference_number, status, payment_date, verified_date, verified_by) VALUES
(1, 1, 1, 1499.00, 1, 'GCH-001-20260315', 'verified', '2026-03-15 14:30:00', '2026-03-15 15:00:00', 2),
(2, 2, 2, 1999.00, 1, 'GCH-002-20260310', 'verified', '2026-03-10 10:15:00', '2026-03-10 10:45:00', 3),
(4, 4, 3, 999.00, 1, 'GCH-003-20260320', 'verified', '2026-03-20 16:20:00', '2026-03-20 16:50:00', 4);

-- Sample Tickets
INSERT INTO tickets (client_id, user_id, branch_id, subject, message, priority, category, status, assigned_to) VALUES
(3, 8, 1, 'Slow connection speed', 'My connection has been very slow the past few days, not getting the speed I paid for.', 'high', 'connection-issue', 'open', 2),
(4, 9, 3, 'Billing inquiry', 'Can you explain the charges on my latest bill?', 'medium', 'billing', 'open', 4),
(1, 6, 1, 'Installation support', 'Need help with setting up my router', 'medium', 'installation', 'resolved', 2);
