DROP DATABASE IF EXISTS oftix;
CREATE DATABASE oftix CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE oftix;

CREATE TABLE branches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  admin_id INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

ALTER TABLE branches ADD CONSTRAINT fk_branch_admin FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  branch_id INT NOT NULL,
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

CREATE TABLE password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT,
  branch_id INT,
  subject VARCHAR(255),
  message TEXT,
  status ENUM('open','resolved','closed') DEFAULT 'open',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

-- seed
INSERT INTO branches (name,location) VALUES
('Oftix Quezon City','Quezon City, Metro Manila');

INSERT INTO users (name,email,username,password,role,contact,address,branch_id,email_verified) VALUES
('Super Admin','admin@oftix.local','superadmin','', 'admin','09171234567','HQ',NULL,1),
('Branch Manager QC','qcadmin@oftix.local','admin_qc','', 'branch','09179876543','QC',1,1),
('Client One','client1@oftix.local','client1','', 'client','09179991234','QC',1,1);

INSERT INTO clients (user_id,branch_id,details) VALUES
(3,1,'Fiber 50 plan, active');
