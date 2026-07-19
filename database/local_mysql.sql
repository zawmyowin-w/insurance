-- ─────────────────────────────────────────────────────────────────────────────
-- Digital Insurance Claim & Premiums Portal — Reference Schema
-- Import once on a fresh machine:  mysql -u root < database/local_mysql.sql
-- After import, Hibernate (ddl-auto=update) keeps the schema up to date.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE DATABASE IF NOT EXISTS `insurance_portal`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `insurance_portal`;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `auto_check_logs`;
DROP TABLE IF EXISTS `claims`;
DROP TABLE IF EXISTS `feedbacks`;
DROP TABLE IF EXISTS `form_fields`;
DROP TABLE IF EXISTS `form_templates`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `policy_applications`;
DROP TABLE IF EXISTS `payment_method_configs`;
DROP TABLE IF EXISTS `insurance_packages`;
DROP TABLE IF EXISTS `insurance_types`;
DROP TABLE IF EXISTS `scheduler_settings`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- ── users ─────────────────────────────────────────────────────────────────────
CREATE TABLE `users` (
  `id`              bigint       NOT NULL AUTO_INCREMENT,
  `name`            varchar(255) NOT NULL,
  `email`           varchar(255) NOT NULL,
  `password`        varchar(255) NOT NULL,
  `role`            enum('ADMIN','AGENT','CUSTOMER') NOT NULL,
  `active`          bit(1)       NOT NULL DEFAULT 1,
  `phone`           varchar(255) DEFAULT NULL,
  `address`         varchar(255) DEFAULT NULL,
  `insurance_type`  varchar(255) DEFAULT NULL,
  `profile_picture` varchar(255) DEFAULT NULL,
  `created_at`      datetime(6)  DEFAULT NULL,
  `updated_at`      datetime(6)  DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── insurance_types ───────────────────────────────────────────────────────────
CREATE TABLE `insurance_types` (
  `id`         bigint       NOT NULL AUTO_INCREMENT,
  `name`       varchar(100) NOT NULL,
  `created_at` datetime(6)  DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_insurance_types_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── insurance_packages ────────────────────────────────────────────────────────
CREATE TABLE `insurance_packages` (
  `id`                      bigint        NOT NULL AUTO_INCREMENT,
  `name`                    varchar(255)  NOT NULL,
  `type`                    varchar(50)   NOT NULL,
  `description`             text          DEFAULT NULL,
  `benefits`                text          DEFAULT NULL,
  `eligibility`             text          DEFAULT NULL,
  `exclusions`              text          DEFAULT NULL,
  `coverage_min`            decimal(20,2) DEFAULT NULL,
  `coverage_max`            decimal(20,2) DEFAULT NULL,
  `max_claim_amount`        decimal(20,2) DEFAULT NULL,
  `premium_rate`            double        NOT NULL,
  `payment_frequency`       varchar(50)   DEFAULT NULL,
  `payment_interval_months` int           DEFAULT NULL,
  `durations`               varchar(255)  DEFAULT NULL,
  `min_policy_term`         int           DEFAULT NULL,
  `policy_term`             int           DEFAULT NULL,
  `active`                  bit(1)        NOT NULL DEFAULT 1,
  `created_at`              datetime(6)   DEFAULT NULL,
  `updated_at`              datetime(6)   DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── policy_applications ───────────────────────────────────────────────────────
CREATE TABLE `policy_applications` (
  `id`                bigint        NOT NULL AUTO_INCREMENT,
  `customer_id`       bigint        NOT NULL,
  `agent_id`          bigint        DEFAULT NULL,
  `package_id`        bigint        NOT NULL,
  `coverage_amount`   decimal(20,2) DEFAULT NULL,
  `premium_amount`    decimal(20,2) DEFAULT NULL,
  `duration`          int           DEFAULT NULL,
  `status`            varchar(50)   NOT NULL DEFAULT 'PENDING',
  `risk_level`        varchar(50)   DEFAULT NULL,
  `policy_number`     varchar(100)  DEFAULT NULL,
  `payment_frequency` varchar(50)   DEFAULT NULL,
  `notes`             text          DEFAULT NULL,
  `agent_note`        text          DEFAULT NULL,
  `admin_note`        text          DEFAULT NULL,
  `common_info`       text          DEFAULT NULL,
  `extra_info`        text          DEFAULT NULL,
  `form_data`         text          DEFAULT NULL,
  `documents_path`    text          DEFAULT NULL,
  `revision_deadline` datetime(6)   DEFAULT NULL,
  `created_at`        datetime(6)   DEFAULT NULL,
  `updated_at`        datetime(6)   DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_app_customer` (`customer_id`),
  KEY `fk_app_agent`    (`agent_id`),
  KEY `fk_app_package`  (`package_id`),
  CONSTRAINT `fk_app_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_app_agent`    FOREIGN KEY (`agent_id`)    REFERENCES `users` (`id`),
  CONSTRAINT `fk_app_package`  FOREIGN KEY (`package_id`)  REFERENCES `insurance_packages` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── claims ────────────────────────────────────────────────────────────────────
CREATE TABLE `claims` (
  `id`                bigint        NOT NULL AUTO_INCREMENT,
  `application_id`    bigint        NOT NULL,
  `customer_id`       bigint        NOT NULL,
  `agent_id`          bigint        DEFAULT NULL,
  `claim_type`        varchar(255)  DEFAULT NULL,
  `amount`            decimal(20,2) DEFAULT NULL,
  `description`       text          DEFAULT NULL,
  `incident_date`     date          DEFAULT NULL,
  `status`            varchar(50)   NOT NULL DEFAULT 'PENDING',
  `agent_note`        text          DEFAULT NULL,
  `admin_note`        text          DEFAULT NULL,
  `form_data`         text          DEFAULT NULL,
  `documents_path`    text          DEFAULT NULL,
  `revision_deadline` datetime(6)   DEFAULT NULL,
  `created_at`        datetime(6)   DEFAULT NULL,
  `updated_at`        datetime(6)   DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_claim_application` (`application_id`),
  KEY `fk_claim_customer`    (`customer_id`),
  KEY `fk_claim_agent`       (`agent_id`),
  CONSTRAINT `fk_claim_application` FOREIGN KEY (`application_id`) REFERENCES `policy_applications` (`id`),
  CONSTRAINT `fk_claim_customer`    FOREIGN KEY (`customer_id`)    REFERENCES `users` (`id`),
  CONSTRAINT `fk_claim_agent`       FOREIGN KEY (`agent_id`)       REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── payments ──────────────────────────────────────────────────────────────────
-- Covers both incoming premium payments and outgoing claim payouts (paymentType=CLAIM_PAYOUT).
CREATE TABLE `payments` (
  `id`              bigint        NOT NULL AUTO_INCREMENT,
  `application_id`  bigint        NOT NULL,
  `customer_id`     bigint        NOT NULL,
  `amount`          decimal(20,2) DEFAULT NULL,
  `payment_type`    varchar(50)   DEFAULT NULL,   -- PREMIUM | RENEWAL | CLAIM_PAYOUT
  `payment_method`  varchar(50)   DEFAULT NULL,
  `screenshot_path` varchar(255)  DEFAULT NULL,
  `status`          varchar(50)   NOT NULL DEFAULT 'PENDING',
  `notes`           text          DEFAULT NULL,
  `period_number`   int           DEFAULT NULL,
  `period_label`    varchar(30)   DEFAULT NULL,
  `verified_by`     varchar(255)  DEFAULT NULL,
  `created_at`      datetime(6)   DEFAULT NULL,
  `updated_at`      datetime(6)   DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_payment_application` (`application_id`),
  KEY `fk_payment_customer`    (`customer_id`),
  CONSTRAINT `fk_payment_application` FOREIGN KEY (`application_id`) REFERENCES `policy_applications` (`id`),
  CONSTRAINT `fk_payment_customer`    FOREIGN KEY (`customer_id`)    REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── notifications ─────────────────────────────────────────────────────────────
CREATE TABLE `notifications` (
  `id`          bigint       NOT NULL AUTO_INCREMENT,
  `user_id`     bigint       NOT NULL,
  `title`       varchar(255) NOT NULL,
  `message`     text         NOT NULL,
  `type`        varchar(50)  DEFAULT NULL,
  `target_role` varchar(50)  DEFAULT NULL,
  `is_read`     bit(1)       DEFAULT 0,
  `created_at`  datetime(6)  DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_notif_user` (`user_id`),
  CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── feedbacks ─────────────────────────────────────────────────────────────────
CREATE TABLE `feedbacks` (
  `id`         bigint       NOT NULL AUTO_INCREMENT,
  `user_id`    bigint       NOT NULL,
  `subject`    varchar(255) DEFAULT NULL,
  `message`    text         NOT NULL,
  `rating`     int          DEFAULT NULL,
  `created_at` datetime(6)  DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_feedback_user` (`user_id`),
  CONSTRAINT `fk_feedback_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── form_templates ────────────────────────────────────────────────────────────
CREATE TABLE `form_templates` (
  `id`         bigint       NOT NULL AUTO_INCREMENT,
  `package_id` bigint       NOT NULL,
  `name`       varchar(255) NOT NULL,
  `form_type`  varchar(50)  NOT NULL,   -- APPLICATION | CLAIM
  `created_at` datetime(6)  DEFAULT NULL,
  `updated_at` datetime(6)  DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_form_package` (`package_id`),
  CONSTRAINT `fk_form_package` FOREIGN KEY (`package_id`) REFERENCES `insurance_packages` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── form_fields ───────────────────────────────────────────────────────────────
CREATE TABLE `form_fields` (
  `id`            bigint       NOT NULL AUTO_INCREMENT,
  `template_id`   bigint       NOT NULL,
  `field_label`   varchar(255) NOT NULL,
  `field_type`    varchar(50)  NOT NULL,
  `field_options` text         DEFAULT NULL,
  `required`      bit(1)       NOT NULL DEFAULT 0,
  `sort_order`    int          DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_field_template` (`template_id`),
  CONSTRAINT `fk_field_template` FOREIGN KEY (`template_id`) REFERENCES `form_templates` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── payment_method_configs ────────────────────────────────────────────────────
CREATE TABLE `payment_method_configs` (
  `id`           bigint       NOT NULL AUTO_INCREMENT,
  `name`         varchar(255) NOT NULL,
  `method_key`   varchar(100) NOT NULL,
  `color`        varchar(20)  DEFAULT NULL,
  `logo_path`    varchar(255) DEFAULT NULL,
  `qr_code_path` varchar(255) DEFAULT NULL,
  `active`       bit(1)       NOT NULL DEFAULT 1,
  `created_at`   datetime(6)  DEFAULT NULL,
  `updated_at`   datetime(6)  DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_method_key` (`method_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── auto_check_logs ───────────────────────────────────────────────────────────
CREATE TABLE `auto_check_logs` (
  `id`            bigint      NOT NULL AUTO_INCREMENT,
  `check_type`    varchar(30) NOT NULL,   -- AUTO_VERIFY | REMINDER | REVISION_CLEANUP
  `status`        varchar(20) NOT NULL,   -- SUCCESS | PARTIAL | SKIPPED | ERROR
  `summary`       text        DEFAULT NULL,
  `details`       text        DEFAULT NULL,
  `total_checked` int         NOT NULL DEFAULT 0,
  `affected_count`int         NOT NULL DEFAULT 0,
  `ai_assisted`   bit(1)      NOT NULL DEFAULT 0,
  `created_at`    datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── scheduler_settings (singleton row) ───────────────────────────────────────
CREATE TABLE `scheduler_settings` (
  `id`                    bigint       NOT NULL DEFAULT 1,
  `enabled`               bit(1)       NOT NULL DEFAULT 1,
  `verify_cron`           varchar(100) NOT NULL DEFAULT '0 30 2 * * *',
  `reminder_cron`         varchar(100) NOT NULL DEFAULT '0 30 1 * * *',
  `revision_cleanup_cron` varchar(100) NOT NULL DEFAULT '0 0 3 * * *',
  `min_pending_hours`     int          NOT NULL DEFAULT 1,
  `updated_at`            datetime(6)  DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
