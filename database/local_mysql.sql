-- ─────────────────────────────────────────────────────────────────────────────
-- Digital Insurance Claim & Premiums Portal — Latest Schema
-- Import once on a fresh machine:
--   mysql -u root -p < database/local_mysql.sql
--
-- After import, Hibernate (ddl-auto=update) keeps the schema up to date
-- automatically whenever you restart the backend.
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
  `active`          bit(1)       NOT NULL,
  `address`         varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at`      datetime(6)  DEFAULT NULL,
  `email`           varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `insurance_type`  varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name`            varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password`        varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone`           varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `profile_picture` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role`            enum('ADMIN','AGENT','CUSTOMER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at`      datetime(6)  DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_6dotkott2kjsp8vw4d0m25fb7` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── insurance_types ───────────────────────────────────────────────────────────
CREATE TABLE `insurance_types` (
  `id`          bigint       NOT NULL AUTO_INCREMENT,
  `created_at`  datetime(6)  DEFAULT NULL,
  `name`        varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text         COLLATE utf8mb4_unicode_ci,
  `benefits`    text         COLLATE utf8mb4_unicode_ci,
  `rules`       text         COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_oh6db2t70imkcmadxefmejvms` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── scheduler_settings ────────────────────────────────────────────────────────
CREATE TABLE `scheduler_settings` (
  `id`                    bigint       NOT NULL,
  `enabled`               bit(1)       NOT NULL,
  `min_pending_hours`     int          NOT NULL,
  `reminder_cron`         varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `revision_cleanup_cron` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at`            datetime(6)  DEFAULT NULL,
  `verify_cron`           varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── auto_check_logs ───────────────────────────────────────────────────────────
CREATE TABLE `auto_check_logs` (
  `id`             bigint      NOT NULL AUTO_INCREMENT,
  `affected_count` int         NOT NULL,
  `ai_assisted`    bit(1)      NOT NULL,
  `check_type`     varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at`     datetime(6) DEFAULT NULL,
  `details`        text        COLLATE utf8mb4_unicode_ci,
  `status`         varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `summary`        text        COLLATE utf8mb4_unicode_ci,
  `total_checked`  int         NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── insurance_packages ────────────────────────────────────────────────────────
CREATE TABLE `insurance_packages` (
  `id`                      bigint        NOT NULL AUTO_INCREMENT,
  `active`                  bit(1)        NOT NULL,
  `beneficiary_info`        text          COLLATE utf8mb4_unicode_ci,
  `benefits`                text          COLLATE utf8mb4_unicode_ci,
  `coverage_max`            decimal(20,2) NOT NULL,
  `coverage_min`            decimal(20,2) NOT NULL,
  `created_at`              datetime(6)   DEFAULT NULL,
  `description`             text          COLLATE utf8mb4_unicode_ci,
  `duration_tiers`          text          COLLATE utf8mb4_unicode_ci,
  `eligibility`             text          COLLATE utf8mb4_unicode_ci,
  `exclusions`              text          COLLATE utf8mb4_unicode_ci,
  `max_claim_amount`        decimal(20,2) DEFAULT NULL,
  `min_policy_term`         int           DEFAULT NULL,
  `name`                    varchar(255)  COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_frequency`       varchar(20)   COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_interval_months` int           DEFAULT NULL,
  `policy_term`             int           DEFAULT NULL,
  `premium_rate`            decimal(8,4)  DEFAULT NULL,
  `required_documents`      text          COLLATE utf8mb4_unicode_ci,
  `terms_and_conditions`    text          COLLATE utf8mb4_unicode_ci,
  `type`                    varchar(255)  COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at`              datetime(6)   DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── payment_method_configs ────────────────────────────────────────────────────
CREATE TABLE `payment_method_configs` (
  `id`          bigint       NOT NULL AUTO_INCREMENT,
  `active`      bit(1)       NOT NULL,
  `color`       varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at`  datetime(6)  DEFAULT NULL,
  `logo_path`   varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `method_key`  varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name`        varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `qr_code_path`varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at`  datetime(6)  DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_f8v1i1mexy8jf3asfm7ruoep8` (`method_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── form_templates ────────────────────────────────────────────────────────────
CREATE TABLE `form_templates` (
  `id`          bigint      NOT NULL AUTO_INCREMENT,
  `active`      bit(1)      NOT NULL,
  `created_at`  datetime(6) DEFAULT NULL,
  `description` text        COLLATE utf8mb4_unicode_ci,
  `form_type`   enum('APPLICATION','CLAIM') COLLATE utf8mb4_unicode_ci NOT NULL,
  `name`        varchar(255)COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at`  datetime(6) DEFAULT NULL,
  `package_id`  bigint      NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_form_template_package_type` (`package_id`,`form_type`),
  CONSTRAINT `FK14moxcmd442vkxklapffmkus2` FOREIGN KEY (`package_id`) REFERENCES `insurance_packages` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── form_fields ───────────────────────────────────────────────────────────────
CREATE TABLE `form_fields` (
  `id`            bigint      NOT NULL AUTO_INCREMENT,
  `field_label`   varchar(255)COLLATE utf8mb4_unicode_ci NOT NULL,
  `field_options` text        COLLATE utf8mb4_unicode_ci,
  `field_type`    enum('LABEL','NAME','EMAIL','PHONE','TEXT','TEXTAREA','CHECKBOX','DATE','NRC','IMAGE_UPLOAD','PDF_UPLOAD') COLLATE utf8mb4_unicode_ci NOT NULL,
  `required`      bit(1)      NOT NULL,
  `sort_order`    int         DEFAULT NULL,
  `template_id`   bigint      NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK68c4qtkb6rfbcrfwuj2urvwim` (`template_id`),
  CONSTRAINT `FK68c4qtkb6rfbcrfwuj2urvwim` FOREIGN KEY (`template_id`) REFERENCES `form_templates` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── policy_applications ───────────────────────────────────────────────────────
CREATE TABLE `policy_applications` (
  `id`                bigint        NOT NULL AUTO_INCREMENT,
  `admin_note`        text          COLLATE utf8mb4_unicode_ci,
  `agent_note`        text          COLLATE utf8mb4_unicode_ci,
  `common_info`       text          COLLATE utf8mb4_unicode_ci,
  `coverage_amount`   decimal(20,2) NOT NULL,
  `created_at`        datetime(6)   DEFAULT NULL,
  `documents_path`    text          COLLATE utf8mb4_unicode_ci,
  `duration`          int           NOT NULL,
  `extra_info`        text          COLLATE utf8mb4_unicode_ci,
  `form_data`         text          COLLATE utf8mb4_unicode_ci,
  `notes`             text          COLLATE utf8mb4_unicode_ci,
  `policy_number`     varchar(50)   COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `premium_amount`    decimal(20,2) DEFAULT NULL,
  `revision_deadline` datetime(6)   DEFAULT NULL,
  `risk_level`        varchar(10)   COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status`            enum('PENDING','VERIFIED','APPROVED','REJECTED','CANCELLED','REVISION_REQUESTED') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at`        datetime(6)   DEFAULT NULL,
  `agent_id`          bigint        DEFAULT NULL,
  `customer_id`       bigint        NOT NULL,
  `package_id`        bigint        NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKpmnamrr9b8k6ns7vy2xew0hy4` (`agent_id`),
  KEY `FK2hutrb5fsky4hf7tbm9sn35ie` (`customer_id`),
  KEY `FKsgj4fof1fnosv8rq4xesvy7i0` (`package_id`),
  CONSTRAINT `FK2hutrb5fsky4hf7tbm9sn35ie` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKpmnamrr9b8k6ns7vy2xew0hy4` FOREIGN KEY (`agent_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKsgj4fof1fnosv8rq4xesvy7i0` FOREIGN KEY (`package_id`) REFERENCES `insurance_packages` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── payments ──────────────────────────────────────────────────────────────────
CREATE TABLE `payments` (
  `id`                           bigint        NOT NULL AUTO_INCREMENT,
  `amount`                       decimal(20,2) DEFAULT NULL,
  `created_at`                   datetime(6)   DEFAULT NULL,
  `notes`                        varchar(255)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_method`               varchar(255)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_type`                 varchar(255)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `period_label`                 varchar(30)   COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `period_number`                int           DEFAULT NULL,
  `screenshot_path`              varchar(255)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status`                       enum('PENDING','VERIFIED','REJECTED') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transaction_amount`           decimal(20,2) DEFAULT NULL,
  `transaction_last_six_digits`  varchar(6)    COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at`                   datetime(6)   DEFAULT NULL,
  `verified_by`                  varchar(255)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `application_id`               bigint        NOT NULL,
  `customer_id`                  bigint        NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKdeaqlpxpp5n0x8ikobjuoqikl` (`application_id`),
  KEY `FKd1qot1f3alweegm6ledjow6nj` (`customer_id`),
  CONSTRAINT `FKd1qot1f3alweegm6ledjow6nj` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKdeaqlpxpp5n0x8ikobjuoqikl` FOREIGN KEY (`application_id`) REFERENCES `policy_applications` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── claims ────────────────────────────────────────────────────────────────────
CREATE TABLE `claims` (
  `id`                bigint        NOT NULL AUTO_INCREMENT,
  `admin_note`        text          COLLATE utf8mb4_unicode_ci,
  `agent_note`        text          COLLATE utf8mb4_unicode_ci,
  `amount`            decimal(20,2) NOT NULL,
  `claim_type`        varchar(255)  COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at`        datetime(6)   DEFAULT NULL,
  `description`       text          COLLATE utf8mb4_unicode_ci,
  `documents_path`    varchar(255)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `form_data`         text          COLLATE utf8mb4_unicode_ci,
  `incident_date`     date          DEFAULT NULL,
  `revision_deadline` datetime(6)   DEFAULT NULL,
  `status`            enum('PENDING','VERIFIED','APPROVED','REJECTED','REVISION_REQUESTED') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at`        datetime(6)   DEFAULT NULL,
  `agent_id`          bigint        DEFAULT NULL,
  `application_id`    bigint        NOT NULL,
  `customer_id`       bigint        NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKdklxndjl72peqs3a0hje32dqu` (`agent_id`),
  KEY `FK7rx6b1qpcks4w1ayeglbvvslj` (`application_id`),
  KEY `FK1112dl0wn9t5rmmri551xmayo` (`customer_id`),
  CONSTRAINT `FK1112dl0wn9t5rmmri551xmayo` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FK7rx6b1qpcks4w1ayeglbvvslj` FOREIGN KEY (`application_id`) REFERENCES `policy_applications` (`id`),
  CONSTRAINT `FKdklxndjl72peqs3a0hje32dqu` FOREIGN KEY (`agent_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── feedbacks ─────────────────────────────────────────────────────────────────
CREATE TABLE `feedbacks` (
  `id`          bigint      NOT NULL AUTO_INCREMENT,
  `category`    varchar(255)COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at`  datetime(6) DEFAULT NULL,
  `message`     text        COLLATE utf8mb4_unicode_ci NOT NULL,
  `rating`      int         NOT NULL,
  `is_read`     bit(1)      DEFAULT NULL,
  `customer_id` bigint      NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK8kw5agn6ypgg4lkjrbc54wk0c` (`customer_id`),
  CONSTRAINT `FK8kw5agn6ypgg4lkjrbc54wk0c` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── notifications ─────────────────────────────────────────────────────────────
CREATE TABLE `notifications` (
  `id`           bigint      NOT NULL AUTO_INCREMENT,
  `created_at`   datetime(6) DEFAULT NULL,
  `message`      text        COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read`      bit(1)      DEFAULT NULL,
  `target_role`  varchar(255)COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title`        varchar(255)COLLATE utf8mb4_unicode_ci NOT NULL,
  `type`         enum('INFO','APPROVAL','REJECTION','PAYMENT','CLAIM','REMINDER') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recipient_id` bigint      NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKqqnsjxlwleyjbxlmm213jaj3f` (`recipient_id`),
  KEY `idx_notifications_recipient_read` (`recipient_id`, `is_read`),
  CONSTRAINT `FKqqnsjxlwleyjbxlmm213jaj3f` FOREIGN KEY (`recipient_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Supplemental performance indexes ─────────────────────────────────────────
-- MySQL 8 does not support CREATE INDEX IF NOT EXISTS.
-- These are added via start-backend.sh on fresh installs; see that script for the idempotent form.
CREATE INDEX `idx_applications_status`          ON `policy_applications` (`status`);
CREATE INDEX `idx_claims_status`                ON `claims` (`status`);
CREATE INDEX `idx_payments_status`              ON `payments` (`status`);
CREATE INDEX `idx_feedbacks_is_read`            ON `feedbacks` (`is_read`);
CREATE INDEX `idx_notifications_recipient_read` ON `notifications` (`recipient_id`, `is_read`);

-- ─────────────────────────────────────────────────────────────────────────────
-- Sample seed data — Agents & Customers
-- Passwords: Agent@123 (agents) | Customer@123 (customers)  [BCrypt, cost 10]
-- Safe to re-import: INSERT IGNORE skips rows whose email already exists.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT IGNORE INTO `users`
  (`name`, `email`, `password`, `phone`, `address`, `role`, `insurance_type`, `active`, `created_at`, `updated_at`)
VALUES
  -- ── Agents (one per insurance type) ───────────────────────────────────────
  ('Aung Kyaw Zin', 'aungkyawzin@dicp.com.mm',
   '$2a$10$bU/iXxFdZlJrPB24jqQ4KuClSmzHDFckFT9v1Rmwm1TGVY5EdMYxS',
   '+95942001101', 'No.5, Pyay Road, Yangon',
   'AGENT', 'HEALTH', 1, NOW(), NOW()),

  ('Thida Oo', 'thidaoo@dicp.com.mm',
   '$2a$10$Snqahds/lplHVAUgmOLPYePPQA4GlRd2G8JEaAF38z3dZP9XEa2EK',
   '+95942001102', 'No.12, Strand Road, Yangon',
   'AGENT', 'LIFE', 1, NOW(), NOW()),

  ('Kyaw Myo Htun', 'kyawmyohtun@dicp.com.mm',
   '$2a$10$6NS.eSE.gC42JjOVmAk7PuAHwnFta9fM.P23Kwmb8zYMMW5UXkqYW',
   '+95942001103', 'No.8, Mandalay-Lashio Road, Mandalay',
   'AGENT', 'PROPERTY', 1, NOW(), NOW()),

  ('Nwe Nwe Aye', 'nwenweaye@dicp.com.mm',
   '$2a$10$mEkdPo0e8gRQlpfp9WshueLJEG/Ng1bYbkR0hl6KrIZSzUjcKgRY2',
   '+95942001104', 'No.3, Bogyoke Road, Naypyidaw',
   'AGENT', 'VEHICLE', 1, NOW(), NOW()),

  -- ── Customers (20) ────────────────────────────────────────────────────────
  ('Zaw Min Htun', 'zawminhtun@gmail.com',
   '$2a$10$mEqV1TB6eq1oOEBlWMfGK.KozRkzlh1C1wv2YLp3eodPg52StGLqm',
   '+95951002101', 'No.15, Shwe Taung Road, Yangon',
   'CUSTOMER', NULL, 1, NOW(), NOW()),

  ('Ei Phyu Phyu', 'eiphyuphyu@gmail.com',
   '$2a$10$eKUUSAYo.2Tycy9JQFhbZeAsrEyJ1EGNJxpzq74p.kgxLH.aLgosG',
   '+95951002102', 'No.22, University Avenue, Yangon',
   'CUSTOMER', NULL, 1, NOW(), NOW()),

  ('Ye Naing Win', 'yenaingwin@gmail.com',
   '$2a$10$wqdGNiwWUawHS0fcZ7CHz.fivoTb2g8sbVF.29fNoDZzOFKEgpYSq',
   '+95951002103', 'No.7, Inya Road, Yangon',
   'CUSTOMER', NULL, 1, NOW(), NOW()),

  ('Su Su Htwe', 'susuhtwe@gmail.com',
   '$2a$10$JtBT/AB.FLCF1YyhlMS6teuaSznxyJiloJtYSe5nVWw.BY8U37eWO',
   '+95951002104', 'No.3, Kaba Aye Pagoda Road, Yangon',
   'CUSTOMER', NULL, 1, NOW(), NOW()),

  ('Kyaw Zin Htet', 'kyawzinhtet@gmail.com',
   '$2a$10$pyOBZcJ3BcT1gLSOBTLXnOV8zqByXD.VutUF0Gf.kqRhkwUvxMgZO',
   '+95951002105', 'No.18, Pyay Road, Yangon',
   'CUSTOMER', NULL, 1, NOW(), NOW()),

  ('Aye Aye Khin', 'ayayekhin@gmail.com',
   '$2a$10$/bYgDtIbmKL4i/xWBTQwme5W2emsvP4N.BQsTNtYI32b7fkQEjVFK',
   '+95951002106', 'No.9, Strand Road, Yangon',
   'CUSTOMER', NULL, 1, NOW(), NOW()),

  ('Htet Aung Naing', 'htetaungnaing@gmail.com',
   '$2a$10$kSEq0XEAKcC4Udaob0lxzuvgoeN9W/dzW.x.ifrk9vbO3WZuDvlFO',
   '+95951002107', 'No.4, 78th Street, Mandalay',
   'CUSTOMER', NULL, 1, NOW(), NOW()),

  ('Nilar Oo', 'nilaroo@gmail.com',
   '$2a$10$7PFR67yFNSWz0pDhsdbU0eWh6q.XYjGW82EJBj/9hDSU9KQx5hFdS',
   '+95951002108', 'No.11, 35th Street, Mandalay',
   'CUSTOMER', NULL, 1, NOW(), NOW()),

  ('Phyo Wai Lwin', 'phyowailwin@gmail.com',
   '$2a$10$hV/FfQyBZ6UjCaB/z37ebOD51OP2VCWxVzoLD2rcQa8oIjIp9o3Zm',
   '+95951002109', 'No.6, Chanayethazan, Mandalay',
   'CUSTOMER', NULL, 1, NOW(), NOW()),

  ('Thin Zar Hlaing', 'thinzarhlaing@gmail.com',
   '$2a$10$DQCS7MVRPYjU0OIyMM7YbefKxS2OJusqbFL3GwSYQUjjQNNsGcCqy',
   '+95951002110', 'No.20, Pyigyitagon, Mandalay',
   'CUSTOMER', NULL, 1, NOW(), NOW()),

  ('Min Thura Zaw', 'minthurazaw@gmail.com',
   '$2a$10$jgQ3LzqJuY3IivGzLB973OOPGi6DXyDKmLWcjC4kH.yK7oSdnRk9O',
   '+95951002111', 'No.2, Naypyidaw Road, Naypyidaw',
   'CUSTOMER', NULL, 1, NOW(), NOW()),

  ('Hnin Wai Wai', 'hninwaiwai@gmail.com',
   '$2a$10$VVrmDPG62kNyl5m2/yI34Onyu9nq2Q3UXl6EznWI3ayCMcq96ZPkm',
   '+95951002112', 'No.14, Zabuthiri, Naypyidaw',
   'CUSTOMER', NULL, 1, NOW(), NOW()),

  ('Aung Htet Oo', 'aunghtetoo@gmail.com',
   '$2a$10$q5LIjMdoYtlJIUfJazn7E.9P/EdNU/tebQRSr0rRbc7XxpZgjUMEy',
   '+95951002113', 'No.5, Pyinmana, Naypyidaw',
   'CUSTOMER', NULL, 1, NOW(), NOW()),

  ('Khin Mar Aye', 'khinmaraye@gmail.com',
   '$2a$10$wdXxgDb3AE8CUInn8vOoveG3L9IH.b4JihmnIJldfa.FYZAPgm82S',
   '+95951002114', 'No.30, Bogyoke Road, Bago',
   'CUSTOMER', NULL, 1, NOW(), NOW()),

  ('Wai Yan Kyaw', 'waiyankyaw@gmail.com',
   '$2a$10$49idrZH7QQDP8dD5LlHUY.RI6iuGaXr0ZJ0gTtuhY1gGMFbLwyE7i',
   '+95951002115', 'No.8, Taungoo Road, Bago',
   'CUSTOMER', NULL, 1, NOW(), NOW()),

  ('Cho Cho Win', 'chochowin@gmail.com',
   '$2a$10$BxD5B6jC.zd6IxxI.BE1MegS72jvyD9.Rk.dXerMaKamUSHw4FP4K',
   '+95951002116', 'No.17, Mawlamyine Road, Mon State',
   'CUSTOMER', NULL, 1, NOW(), NOW()),

  ('Pyae Phyo Aung', 'pyaephyoaung@gmail.com',
   '$2a$10$82bLNqQgnnJ/GTe14CdlFu8d5ntrnjGD0MlwEk2e0Y.ym60Rcxw..',
   '+95951002117', 'No.12, Hpa-An, Karen State',
   'CUSTOMER', NULL, 1, NOW(), NOW()),

  ('May Zin Oo', 'mayzinoo@gmail.com',
   '$2a$10$VAeP0Mo89IvLsplJCYCZduIC9R87CEvBf0fQcwRyPOp7czD.0V4PG',
   '+95951002118', 'No.6, Monywa Road, Sagaing',
   'CUSTOMER', NULL, 1, NOW(), NOW()),

  ('Zin Ko Ko', 'zinkoko@gmail.com',
   '$2a$10$ThTm3P2eylQt.VqEcSCIme7V82iCxRPejLLHJXeht3eh..cCHg0Hy',
   '+95951002119', 'No.25, Taunggyi, Shan State',
   'CUSTOMER', NULL, 1, NOW(), NOW()),

  ('Nang Hseng Kham', 'nanghsengkham@gmail.com',
   '$2a$10$5/WfITCU6juub77mMEs7CuDMwl2rWWMPvo5UJClkxRyXoMTQHnDk.',
   '+95951002120', 'No.3, Kengtung, Shan State',
   'CUSTOMER', NULL, 1, NOW(), NOW());
