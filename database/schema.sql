-- ═══════════════════════════════════════════════════════════════════
-- Digital Insurance Claim and Premiums Portal
-- MySQL 8+ Database Schema
-- ═══════════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS insurance_portal
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE insurance_portal;

-- ─── users ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    name           VARCHAR(150)         NOT NULL,
    email          VARCHAR(191)         NOT NULL UNIQUE,
    password       VARCHAR(255)         NOT NULL,
    role           ENUM('ADMIN','AGENT','CUSTOMER') NOT NULL DEFAULT 'CUSTOMER',
    phone          VARCHAR(30),
    address        VARCHAR(255),
    insurance_type VARCHAR(20),          -- for agents: LIFE | HEALTH | VEHICLE | PROPERTY | ALL
    active         TINYINT(1)           NOT NULL DEFAULT 1,
    created_at     DATETIME             NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME             NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email  (email),
    INDEX idx_users_role   (role),
    INDEX idx_users_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── insurance_packages ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS insurance_packages (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(200)         NOT NULL,
    type          ENUM('LIFE','HEALTH','VEHICLE','PROPERTY') NOT NULL,
    description   TEXT,
    coverage_min  DECIMAL(20,2)        NOT NULL,
    coverage_max  DECIMAL(20,2)        NOT NULL,
    premium_rate  DECIMAL(8,4)         NOT NULL COMMENT '0.0200 = 2% per year',
    durations     VARCHAR(50)          DEFAULT '1,2,3,5' COMMENT 'comma-separated years',
    benefits      TEXT                 COMMENT 'newline-separated benefit items',
    active        TINYINT(1)           NOT NULL DEFAULT 1,
    created_at    DATETIME             NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME             NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_packages_type   (type),
    INDEX idx_packages_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── policy_applications ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS policy_applications (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id       BIGINT              NOT NULL,
    package_id        BIGINT              NOT NULL,
    agent_id          BIGINT,
    coverage_amount   DECIMAL(20,2)       NOT NULL,
    duration          INT                 NOT NULL COMMENT 'years',
    status            ENUM('PENDING','VERIFIED','APPROVED','REJECTED','CANCELLED','REVISION_REQUESTED')
                                          NOT NULL DEFAULT 'PENDING',
    notes             TEXT,
    agent_note        TEXT,
    admin_note        TEXT,
    revision_deadline DATETIME,
    documents_path    TEXT COMMENT 'JSON array of uploaded supporting document paths',
    created_at        DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_app_customer FOREIGN KEY (customer_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_app_package  FOREIGN KEY (package_id)  REFERENCES insurance_packages (id),
    CONSTRAINT fk_app_agent    FOREIGN KEY (agent_id)    REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_app_customer (customer_id),
    INDEX idx_app_agent    (agent_id),
    INDEX idx_app_status   (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── claims ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS claims (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    application_id    BIGINT              NOT NULL,
    customer_id       BIGINT              NOT NULL,
    agent_id          BIGINT,
    claim_type        VARCHAR(100)        NOT NULL,
    amount            DECIMAL(20,2)       NOT NULL,
    description       TEXT,
    incident_date     DATE,
    documents_path    TEXT COMMENT 'JSON array of uploaded claim evidence document paths',
    status            ENUM('PENDING','VERIFIED','APPROVED','REJECTED','REVISION_REQUESTED')
                                          NOT NULL DEFAULT 'PENDING',
    agent_note        TEXT,
    admin_note        TEXT,
    revision_deadline DATETIME,
    created_at        DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_claim_application FOREIGN KEY (application_id) REFERENCES policy_applications (id) ON DELETE CASCADE,
    CONSTRAINT fk_claim_customer    FOREIGN KEY (customer_id)    REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_claim_agent       FOREIGN KEY (agent_id)       REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_claims_customer (customer_id),
    INDEX idx_claims_agent    (agent_id),
    INDEX idx_claims_status   (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── payments ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    application_id   BIGINT              NOT NULL,
    customer_id      BIGINT              NOT NULL,
    amount           DECIMAL(20,2),
    payment_type     ENUM('PREMIUM','RENEWAL') NOT NULL DEFAULT 'PREMIUM',
    payment_method   VARCHAR(30) COMMENT 'KBZ_PAY | WAVE_PAY | AYA_PAY',
    screenshot_path  VARCHAR(500),
    status           ENUM('PENDING','VERIFIED','REJECTED') NOT NULL DEFAULT 'PENDING',
    notes            TEXT,
    verified_by      VARCHAR(150),
    created_at       DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_application FOREIGN KEY (application_id) REFERENCES policy_applications (id) ON DELETE CASCADE,
    CONSTRAINT fk_payment_customer    FOREIGN KEY (customer_id)    REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_payments_application (application_id),
    INDEX idx_payments_customer    (customer_id),
    INDEX idx_payments_status      (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── notifications ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    recipient_id BIGINT               NOT NULL,
    title        VARCHAR(255)         NOT NULL,
    message      TEXT                 NOT NULL,
    type         ENUM('INFO','APPROVAL','REJECTION','PAYMENT','CLAIM','REMINDER')
                                      NOT NULL DEFAULT 'INFO',
    is_read      TINYINT(1)           NOT NULL DEFAULT 0,
    target_role  VARCHAR(20),
    created_at   DATETIME             NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_recipient FOREIGN KEY (recipient_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_notif_recipient (recipient_id),
    INDEX idx_notif_read      (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── feedback ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id  BIGINT,
    name         VARCHAR(150),
    email        VARCHAR(191),
    subject      VARCHAR(255),
    message      TEXT                 NOT NULL,
    created_at   DATETIME             NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_feedback_customer FOREIGN KEY (customer_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════════
-- SEED DATA
-- ═══════════════════════════════════════════════════════════════════

-- ── User Seed Notes ────────────────────────────────────────────────────────────
-- Admin and agent accounts are NOT seeded here.
-- The application automatically creates the admin account on first startup using
-- credentials provided via the ADMIN_EMAIL and ADMIN_PASSWORD environment variables.
-- Agent accounts are created through the Admin portal (POST /admin/users/agents).
-- ──────────────────────────────────────────────────────────────────────────────

-- Sample insurance packages
INSERT IGNORE INTO insurance_packages
    (name, type, description, coverage_min, coverage_max, premium_rate, durations, benefits, active)
VALUES
(
    'Basic Life Protection',
    'LIFE',
    'Essential life coverage for individuals and families.',
    5000000.00, 50000000.00, 0.0200,
    '1,2,3,5',
    'Death benefit payout\nAccidental death coverage\n24/7 customer support\nDigital policy documents',
    1
),
(
    'Premium Life Shield',
    'LIFE',
    'Comprehensive life coverage with added riders for critical illness.',
    20000000.00, 200000000.00, 0.0250,
    '5,10,15,20',
    'Death benefit payout\nCritical illness rider\nAccidental death & disability\nFree annual health check\nDigital policy documents',
    1
),
(
    'Health Plus',
    'HEALTH',
    'Full medical coverage including hospitalization and outpatient care.',
    2000000.00, 30000000.00, 0.0250,
    '1,2,3',
    'Hospitalization coverage\nOutpatient treatment\nSurgery coverage\nEmergency evacuation\nMaternity benefits',
    1
),
(
    'Vehicle Protect Plus',
    'VEHICLE',
    'Comprehensive vehicle insurance for cars, motorcycles and commercial vehicles.',
    3000000.00, 80000000.00, 0.0300,
    '1,2,3',
    'Accident repair costs\nTheft protection\nThird-party liability\nRoadside assistance\nFire and flood damage',
    1
),
(
    'Home & Property Shield',
    'PROPERTY',
    'Protect your home and valuables against damage, theft and natural disasters.',
    10000000.00, 500000000.00, 0.0150,
    '1,2,3,5',
    'Fire and natural disaster\nTheft and burglary\nContents coverage\nTemporary accommodation\nPersonal liability',
    1
);

-- ═══════════════════════════════════════════════════════════════════
-- END OF SCHEMA
-- ═══════════════════════════════════════════════════════════════════
