-- ─────────────────────────────────────────────────────────────────────────────
-- Digital Insurance Claim & Premiums Portal — Local Setup Schema
-- Import once:  mysql -u root -p < database/local_mysql.sql
-- After import, Hibernate (ddl-auto=update) keeps the schema up to date.
-- ─────────────────────────────────────────────────────────────────────────────

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- ── Database ──────────────────────────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS `insurance_portal`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `insurance_portal`;

-- ── Drop in reverse FK order ──────────────────────────────────────────────────
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `claims`;
DROP TABLE IF EXISTS `feedbacks`;
DROP TABLE IF EXISTS `form_fields`;
DROP TABLE IF EXISTS `form_templates`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `policy_applications`;
DROP TABLE IF EXISTS `insurance_packages`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- ── users ─────────────────────────────────────────────────────────────────────
CREATE TABLE `users` (
  `id`             bigint       NOT NULL AUTO_INCREMENT,
  `active`         bit(1)       NOT NULL,
  `address`        varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at`     datetime(6)  DEFAULT NULL,
  `email`          varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `insurance_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name`           varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password`       varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone`          varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `profile_picture`varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role`           enum('ADMIN','AGENT','CUSTOMER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at`     datetime(6)  DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_6dotkott2kjsp8vw4d0m25fb7` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── insurance_packages ────────────────────────────────────────────────────────
CREATE TABLE `insurance_packages` (
  `id`                bigint         NOT NULL AUTO_INCREMENT,
  `active`            bit(1)         NOT NULL,
  `benefits`          text           COLLATE utf8mb4_unicode_ci,
  `coverage_max`      decimal(20,2)  DEFAULT NULL,
  `coverage_min`      decimal(20,2)  DEFAULT NULL,
  `created_at`        datetime(6)    DEFAULT NULL,
  `description`       text           COLLATE utf8mb4_unicode_ci,
  `durations`         varchar(255)   COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `eligibility`       text           COLLATE utf8mb4_unicode_ci,
  `exclusions`        text           COLLATE utf8mb4_unicode_ci,
  `min_policy_term`   int            DEFAULT NULL,
  `name`              varchar(255)   COLLATE utf8mb4_unicode_ci NOT NULL,
  `policy_term`       int            DEFAULT NULL,
  `premium_rate`      double         NOT NULL,
  `type`              varchar(50)    COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at`        datetime(6)    DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── policy_applications ───────────────────────────────────────────────────────
CREATE TABLE `policy_applications` (
  `id`                bigint        NOT NULL AUTO_INCREMENT,
  `admin_note`        text          COLLATE utf8mb4_unicode_ci,
  `coverage_amount`   decimal(20,2) DEFAULT NULL,
  `created_at`        datetime(6)   DEFAULT NULL,
  `documents_path`    text          COLLATE utf8mb4_unicode_ci,
  `duration`          int           DEFAULT NULL,
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
  CONSTRAINT `FKpmnamrr9b8k6ns7vy2xew0hy4` FOREIGN KEY (`agent_id`)    REFERENCES `users` (`id`),
  CONSTRAINT `FKsgj4fof1fnosv8rq4xesvy7i0` FOREIGN KEY (`package_id`)  REFERENCES `insurance_packages` (`id`)
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
  CONSTRAINT `FK1112dl0wn9t5rmmri551xmayo` FOREIGN KEY (`customer_id`)    REFERENCES `users` (`id`),
  CONSTRAINT `FK7rx6b1qpcks4w1ayeglbvvslj` FOREIGN KEY (`application_id`) REFERENCES `policy_applications` (`id`),
  CONSTRAINT `FKdklxndjl72peqs3a0hje32dqu` FOREIGN KEY (`agent_id`)       REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── feedbacks ─────────────────────────────────────────────────────────────────
CREATE TABLE `feedbacks` (
  `id`          bigint  NOT NULL AUTO_INCREMENT,
  `category`    varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at`  datetime(6)  DEFAULT NULL,
  `message`     text         COLLATE utf8mb4_unicode_ci NOT NULL,
  `rating`      int          NOT NULL,
  `is_read`     bit(1)       DEFAULT NULL,
  `customer_id` bigint       NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK8kw5agn6ypgg4lkjrbc54wk0c` (`customer_id`),
  CONSTRAINT `FK8kw5agn6ypgg4lkjrbc54wk0c` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── form_templates ────────────────────────────────────────────────────────────
CREATE TABLE `form_templates` (
  `id`          bigint       NOT NULL AUTO_INCREMENT,
  `active`      bit(1)       NOT NULL,
  `created_at`  datetime(6)  DEFAULT NULL,
  `description` text         COLLATE utf8mb4_unicode_ci,
  `form_type`   varchar(50)  COLLATE utf8mb4_unicode_ci NOT NULL,
  `name`        varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at`  datetime(6)  DEFAULT NULL,
  `package_id`  bigint       DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_form_templates_package` (`package_id`),
  CONSTRAINT `FK_form_templates_package` FOREIGN KEY (`package_id`) REFERENCES `insurance_packages` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── form_fields ───────────────────────────────────────────────────────────────
-- field_type values:
--   LABEL        — static section header
--   NAME         — auto-filled from customer profile (Full Name), read-only
--   EMAIL        — auto-filled from customer profile (Email), read-only
--   PHONE        — phone number input (customer fills in)
--   TEXT         — single-line text input
--   TEXTAREA     — multi-line text input
--   CHECKBOX     — multi-option checkbox (field_options = JSON array)
--   DATE         — date picker
--   NRC          — Myanmar NRC format
--   IMAGE_UPLOAD — JPG/PNG upload
--   PDF_UPLOAD   — PDF/document upload
CREATE TABLE `form_fields` (
  `id`           bigint       NOT NULL AUTO_INCREMENT,
  `field_label`  varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `field_options`text         COLLATE utf8mb4_unicode_ci,
  `field_type`   enum('LABEL','NAME','EMAIL','PHONE','TEXT','TEXTAREA','CHECKBOX','DATE','NRC','IMAGE_UPLOAD','PDF_UPLOAD')
                              COLLATE utf8mb4_unicode_ci NOT NULL,
  `required`     bit(1)       NOT NULL,
  `sort_order`   int          DEFAULT NULL,
  `template_id`  bigint       NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK68c4qtkb6rfbcrfwuj2urvwim` (`template_id`),
  CONSTRAINT `FK68c4qtkb6rfbcrfwuj2urvwim` FOREIGN KEY (`template_id`) REFERENCES `form_templates` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── notifications ─────────────────────────────────────────────────────────────
CREATE TABLE `notifications` (
  `id`         bigint       NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6)  DEFAULT NULL,
  `is_read`    bit(1)       DEFAULT NULL,
  `message`    text         COLLATE utf8mb4_unicode_ci NOT NULL,
  `title`      varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type`       varchar(50)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id`    bigint       NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_notifications_user` (`user_id`),
  CONSTRAINT `FK_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Restore session settings ──────────────────────────────────────────────────
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
