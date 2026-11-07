CREATE DATABASE IF NOT EXISTS dbcm_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE dbcm_portal;

CREATE TABLE IF NOT EXISTS departments (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  code VARCHAR(32) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(254) NOT NULL UNIQUE,
  username VARCHAR(80) NOT NULL UNIQUE,
  display_name VARCHAR(160) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','teacher') NOT NULL,
  department_id VARCHAR(64) NULL,
  designation VARCHAR(160) NULL,
  qualification VARCHAR(255) NULL,
  specialization VARCHAR(255) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  failed_login_attempts INT UNSIGNED NOT NULL DEFAULT 0,
  locked_until DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES departments(id),
  CONSTRAINT chk_user_department CHECK ((role = 'admin' AND department_id IS NULL) OR (role = 'teacher' AND department_id IS NOT NULL)),
  INDEX idx_users_department_role (department_id, role)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS registration_codes (
  id CHAR(36) PRIMARY KEY,
  code_hash CHAR(64) NOT NULL UNIQUE,
  department_id VARCHAR(64) NOT NULL,
  created_by CHAR(36) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_by CHAR(36) NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_codes_department FOREIGN KEY (department_id) REFERENCES departments(id),
  CONSTRAINT fk_codes_creator FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT fk_codes_user FOREIGN KEY (used_by) REFERENCES users(id),
  INDEX idx_codes_active (department_id, expires_at, used_at)
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS subjects (
  id VARCHAR(128) PRIMARY KEY,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  department_id VARCHAR(64) NOT NULL,
  program_level ENUM('UG','PG') NOT NULL DEFAULT 'UG',
  semester VARCHAR(40) NULL,
  track VARCHAR(64) NULL,
  credits DECIMAL(5,2) NULL,
  syllabus_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_subject_department FOREIGN KEY (department_id) REFERENCES departments(id),
  INDEX idx_subject_department_program (department_id, program_level),
  INDEX idx_subject_code (code)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS materials (
  id CHAR(36) PRIMARY KEY,
  subject_id VARCHAR(128) NOT NULL,
  uploaded_by CHAR(36) NOT NULL,
  category ENUM('notes','syllabus','pyqs','videos','questions') NOT NULL,
  title VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NULL,
  stored_name VARCHAR(255) NULL,
  mime_type VARCHAR(100) NULL,
  file_size BIGINT UNSIGNED NULL,
  external_url VARCHAR(2048) NULL,
  metadata JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_material_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  CONSTRAINT fk_material_teacher FOREIGN KEY (uploaded_by) REFERENCES users(id),
  INDEX idx_material_subject_category (subject_id, category)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS contributions (
  id CHAR(36) PRIMARY KEY,
  subject_id VARCHAR(128) NULL,
  department_id VARCHAR(64) NOT NULL,
  submitted_by_name VARCHAR(160) NULL,
  submitted_by_email VARCHAR(254) NULL,
  category ENUM('notes','syllabus','pyqs','videos','questions') NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  file_name VARCHAR(255) NULL,
  stored_name VARCHAR(255) NULL,
  mime_type VARCHAR(100) NULL,
  file_size BIGINT UNSIGNED NULL,
  external_url VARCHAR(2048) NULL,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  reviewed_by CHAR(36) NULL,
  reviewed_at DATETIME NULL,
  review_note VARCHAR(1000) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_contribution_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
  CONSTRAINT fk_contribution_department FOREIGN KEY (department_id) REFERENCES departments(id),
  CONSTRAINT fk_contribution_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id),
  INDEX idx_contribution_department_status (department_id, status, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  actor_id CHAR(36) NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id VARCHAR(128) NULL,
  ip_address VARCHAR(45) NULL,
  details JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB;

-- API bootstraps departments from frontend/data/curriculum.json and creates the
-- first administrator from backend/.env. No demo passwords are stored in SQL.
-- Create a separate least-privilege MySQL account for the API. Never expose the
-- database port to the public internet or use the root account in the API.
