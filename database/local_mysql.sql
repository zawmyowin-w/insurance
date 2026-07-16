-- =============================================================================
--  Digital Insurance Claim and Premiums Portal
--  Local MySQL Setup Script  (localhost only — no Replit dependency)
--
--  HOW TO USE:
--    mysql -u root -p < database/local_mysql.sql
--
--  After importing, start the backend:
--    cd backend && mvn spring-boot:run
--
--  Default login:
--    Email   : admin@dicp.com.mm
--    Password: Admin@123
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET time_zone = '+00:00';

-- ---------------------------------------------------------------------------
-- Database
-- ---------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS insurance_portal
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE insurance_portal;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    name            VARCHAR(255)    NOT NULL,
    email           VARCHAR(255)    NOT NULL,
    password        VARCHAR(255)    NOT NULL,
    role            VARCHAR(50)     NOT NULL COMMENT 'ADMIN | AGENT | CUSTOMER',
    phone           VARCHAR(50)     DEFAULT NULL,
    address         VARCHAR(500)    DEFAULT NULL,
    insurance_type  VARCHAR(50)     DEFAULT NULL COMMENT 'Agents only: LIFE | HEALTH | VEHICLE | PROPERTY | ALL',
    profile_picture VARCHAR(500)    DEFAULT NULL COMMENT 'Path under ./uploads/profile-pictures',
    active          TINYINT(1)      NOT NULL DEFAULT 1,
    created_at      DATETIME(6)     DEFAULT NULL,
    updated_at      DATETIME(6)     DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- insurance_packages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS insurance_packages (
    id            BIGINT          NOT NULL AUTO_INCREMENT,
    name          VARCHAR(255)    NOT NULL,
    type          VARCHAR(50)     NOT NULL COMMENT 'LIFE | HEALTH | VEHICLE | PROPERTY',
    description   TEXT            DEFAULT NULL,
    coverage_min  DECIMAL(20,2)   NOT NULL,
    coverage_max  DECIMAL(20,2)   NOT NULL,
    premium_rate  DECIMAL(8,4)    NOT NULL COMMENT 'e.g. 0.0200 = 2% per year',
    durations     VARCHAR(100)    DEFAULT NULL COMMENT 'comma-separated years e.g. 1,2,3,5',
    benefits      TEXT            DEFAULT NULL COMMENT 'newline-separated benefit strings',
    exclusions    TEXT            DEFAULT NULL,
    eligibility   TEXT            DEFAULT NULL,
    policy_term   INT             DEFAULT NULL COMMENT 'Maximum policy term in years',
    active        TINYINT(1)      NOT NULL DEFAULT 1,
    created_at    DATETIME(6)     DEFAULT NULL,
    updated_at    DATETIME(6)     DEFAULT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- form_templates
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS form_templates (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    name         VARCHAR(255) NOT NULL,
    package_id   BIGINT       NOT NULL,
    form_type    VARCHAR(50)  NOT NULL COMMENT 'APPLICATION | CLAIM',
    description  TEXT         DEFAULT NULL,
    active       TINYINT(1)   NOT NULL DEFAULT 1,
    created_at   DATETIME(6)  DEFAULT NULL,
    updated_at   DATETIME(6)  DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_form_template_package_type (package_id, form_type),
    CONSTRAINT fk_ft_package FOREIGN KEY (package_id)
        REFERENCES insurance_packages (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- form_fields
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS form_fields (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    template_id   BIGINT       NOT NULL,
    field_label   VARCHAR(255) NOT NULL,
    field_type    VARCHAR(50)  NOT NULL COMMENT 'LABEL | TEXT | TEXTAREA | CHECKBOX | IMAGE_UPLOAD | PDF_UPLOAD',
    field_options TEXT         DEFAULT NULL COMMENT 'CHECKBOX: JSON array of option strings',
    required      TINYINT(1)   NOT NULL DEFAULT 0,
    sort_order    INT          NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT fk_ff_template FOREIGN KEY (template_id)
        REFERENCES form_templates (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- policy_applications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS policy_applications (
    id                 BIGINT        NOT NULL AUTO_INCREMENT,
    customer_id        BIGINT        NOT NULL,
    package_id         BIGINT        NOT NULL,
    agent_id           BIGINT        DEFAULT NULL,
    coverage_amount    DECIMAL(20,2) NOT NULL,
    duration           INT           NOT NULL COMMENT 'Policy duration in years',
    status             VARCHAR(50)   NOT NULL DEFAULT 'PENDING'
                                     COMMENT 'PENDING | VERIFIED | APPROVED | REJECTED | CANCELLED | REVISION_REQUESTED',
    notes              TEXT          DEFAULT NULL COMMENT 'Customer notes',
    agent_note         TEXT          DEFAULT NULL,
    admin_note         TEXT          DEFAULT NULL,
    revision_deadline  DATETIME(6)   DEFAULT NULL,
    risk_level         VARCHAR(10)   DEFAULT NULL COMMENT 'LOW | MEDIUM | HIGH',
    policy_number      VARCHAR(50)   DEFAULT NULL,
    common_info        TEXT          DEFAULT NULL COMMENT 'JSON: legacy personal details',
    extra_info         TEXT          DEFAULT NULL COMMENT 'JSON: legacy plan-specific fields',
    form_data          TEXT          DEFAULT NULL COMMENT 'JSON: dynamic form data {fieldId: value}',
    premium_amount     DECIMAL(20,2) DEFAULT NULL,
    documents_path     TEXT          DEFAULT NULL COMMENT 'JSON array of uploaded file paths',
    created_at         DATETIME(6)   DEFAULT NULL,
    updated_at         DATETIME(6)   DEFAULT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_pa_customer FOREIGN KEY (customer_id) REFERENCES users (id),
    CONSTRAINT fk_pa_package  FOREIGN KEY (package_id)  REFERENCES insurance_packages (id),
    CONSTRAINT fk_pa_agent    FOREIGN KEY (agent_id)    REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- claims
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS claims (
    id                BIGINT        NOT NULL AUTO_INCREMENT,
    application_id    BIGINT        NOT NULL,
    customer_id       BIGINT        NOT NULL,
    agent_id          BIGINT        DEFAULT NULL,
    claim_type        VARCHAR(100)  NOT NULL,
    amount            DECIMAL(20,2) NOT NULL,
    description       TEXT          DEFAULT NULL,
    incident_date     DATE          DEFAULT NULL,
    documents_path    VARCHAR(500)  DEFAULT NULL,
    form_data         TEXT          DEFAULT NULL COMMENT 'JSON: dynamic claim form data',
    status            VARCHAR(50)   NOT NULL DEFAULT 'PENDING'
                                    COMMENT 'PENDING | VERIFIED | APPROVED | REJECTED | REVISION_REQUESTED',
    agent_note        TEXT          DEFAULT NULL,
    admin_note        TEXT          DEFAULT NULL,
    revision_deadline DATETIME(6)   DEFAULT NULL,
    created_at        DATETIME(6)   DEFAULT NULL,
    updated_at        DATETIME(6)   DEFAULT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_cl_application FOREIGN KEY (application_id) REFERENCES policy_applications (id),
    CONSTRAINT fk_cl_customer    FOREIGN KEY (customer_id)    REFERENCES users (id),
    CONSTRAINT fk_cl_agent       FOREIGN KEY (agent_id)       REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id              BIGINT        NOT NULL AUTO_INCREMENT,
    application_id  BIGINT        NOT NULL,
    customer_id     BIGINT        NOT NULL,
    amount          DECIMAL(20,2) DEFAULT NULL,
    payment_type    VARCHAR(50)   DEFAULT NULL COMMENT 'PREMIUM | RENEWAL',
    payment_method  VARCHAR(50)   DEFAULT NULL COMMENT 'KBZ_PAY | WAVE_PAY | AYA_PAY',
    screenshot_path VARCHAR(500)  DEFAULT NULL,
    status          VARCHAR(50)   NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING | VERIFIED | REJECTED',
    notes           VARCHAR(500)  DEFAULT NULL,
    verified_by     VARCHAR(255)  DEFAULT NULL,
    created_at      DATETIME(6)   DEFAULT NULL,
    updated_at      DATETIME(6)   DEFAULT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_py_application FOREIGN KEY (application_id) REFERENCES policy_applications (id),
    CONSTRAINT fk_py_customer    FOREIGN KEY (customer_id)    REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    recipient_id BIGINT       NOT NULL,
    title        VARCHAR(255) NOT NULL,
    message      TEXT         NOT NULL,
    type         VARCHAR(50)  NOT NULL DEFAULT 'INFO'
                              COMMENT 'INFO | APPROVAL | REJECTION | PAYMENT | CLAIM | REMINDER',
    is_read      TINYINT(1)   NOT NULL DEFAULT 0,
    target_role  VARCHAR(50)  DEFAULT NULL,
    created_at   DATETIME(6)  DEFAULT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_nt_recipient FOREIGN KEY (recipient_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- feedbacks
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feedbacks (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    customer_id BIGINT       NOT NULL,
    rating      INT          NOT NULL COMMENT '1 to 5',
    category    VARCHAR(100) DEFAULT NULL COMMENT 'General | Claims | Payments | Support',
    message     TEXT         NOT NULL,
    is_read     TINYINT(1)   NOT NULL DEFAULT 0,
    created_at  DATETIME(6)  DEFAULT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_fb_customer FOREIGN KEY (customer_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- SEED DATA
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Default admin account
--   Email   : admin@dicp.com.mm
--   Password: Admin@123  (BCrypt hash below)
--
-- NOTE: The backend also auto-creates this account on first startup
-- if it does not already exist, so this INSERT IGNORE is just a shortcut.
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO users
    (name, email, password, role, phone, active, created_at, updated_at)
VALUES (
    'Administrator',
    'admin@dicp.com.mm',
    '$2a$10$jLlELALnM0oUsMeKVP/9SOtiCPUveEN6yJOHZ/oWbV523VFxA1/Nu',
    'ADMIN',
    '+95 9 000 000 001',
    1,
    NOW(6),
    NOW(6)
);

-- ---------------------------------------------------------------------------
-- Default insurance packages
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO insurance_packages
    (name, type, description, coverage_min, coverage_max, premium_rate,
     durations, benefits, active, created_at, updated_at)
VALUES
(
    'Basic Life Protection', 'LIFE',
    'Essential life coverage for individuals and families.',
    5000000.00, 50000000.00, 0.0200, '1,2,3,5',
    'Death benefit payout\nAccidental death coverage\n24/7 customer support\nDigital policy documents',
    1, NOW(6), NOW(6)
),
(
    'Premium Life Shield', 'LIFE',
    'Comprehensive life coverage with added riders for critical illness.',
    20000000.00, 200000000.00, 0.0250, '5,10,15,20',
    'Death benefit payout\nCritical illness rider\nAccidental death & disability\nFree annual health check\nDigital policy documents',
    1, NOW(6), NOW(6)
),
(
    'Health Plus', 'HEALTH',
    'Full medical coverage including hospitalization and outpatient care.',
    2000000.00, 30000000.00, 0.0250, '1,2,3',
    'Hospitalization coverage\nOutpatient treatment\nSurgery coverage\nEmergency evacuation\nMaternity benefits',
    1, NOW(6), NOW(6)
),
(
    'Vehicle Protect Plus', 'VEHICLE',
    'Comprehensive vehicle insurance for cars, motorcycles and commercial vehicles.',
    3000000.00, 80000000.00, 0.0300, '1,2,3',
    'Accident repair costs\nTheft protection\nThird-party liability\nRoadside assistance\nFire and flood damage',
    1, NOW(6), NOW(6)
),
(
    'Home & Property Shield', 'PROPERTY',
    'Protect your home and valuables against damage, theft and natural disasters.',
    10000000.00, 500000000.00, 0.0150, '1,2,3,5',
    'Structural damage coverage\nContents protection\nTheft and burglary\nNatural disaster coverage\nTemporary accommodation allowance',
    1, NOW(6), NOW(6)
),
(
    'SME Business Protect', 'PROPERTY',
    'Business interruption and asset protection for small and medium enterprises.',
    50000000.00, 1000000000.00, 0.0180, '1,2,3',
    'Business interruption\nEquipment and asset coverage\nLiability protection\nEmployee accident coverage\nFire and theft',
    1, NOW(6), NOW(6)
);

-- =============================================================================
-- Verify with:
--   SHOW TABLES;
--   SELECT id, name, email, role FROM users;
--   SELECT id, name, type, active FROM insurance_packages;
-- =============================================================================
