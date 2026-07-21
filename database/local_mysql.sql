-- ─────────────────────────────────────────────────────────────────────────────
-- Digital Insurance Claim & Premiums Portal — Schema + Seed Data
-- Import once on a fresh machine:
--   mysql -u root < database/local_mysql.sql
--
-- Contains: all table definitions + initial seed data
--   (insurance types, insurance packages, admin account, scheduler settings)
-- After import, Hibernate (ddl-auto=update) keeps the schema up to date.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE DATABASE IF NOT EXISTS `insurance_portal`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `insurance_portal`;

-- MySQL dump 10.13  Distrib 8.0.42, for Linux (x86_64)
--
-- Host: localhost    Database: insurance_portal
-- ------------------------------------------------------
-- Server version	8.0.42

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

--
-- Table structure for table `auto_check_logs`
--

DROP TABLE IF EXISTS `auto_check_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auto_check_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `affected_count` int NOT NULL,
  `ai_assisted` bit(1) NOT NULL,
  `check_type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `details` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `summary` text COLLATE utf8mb4_unicode_ci,
  `total_checked` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auto_check_logs`
--

LOCK TABLES `auto_check_logs` WRITE;
/*!40000 ALTER TABLE `auto_check_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `auto_check_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `claims`
--

DROP TABLE IF EXISTS `claims`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `claims` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `admin_note` text COLLATE utf8mb4_unicode_ci,
  `agent_note` text COLLATE utf8mb4_unicode_ci,
  `amount` decimal(20,2) NOT NULL,
  `claim_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `documents_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `form_data` text COLLATE utf8mb4_unicode_ci,
  `incident_date` date DEFAULT NULL,
  `revision_deadline` datetime(6) DEFAULT NULL,
  `status` enum('PENDING','VERIFIED','APPROVED','REJECTED','REVISION_REQUESTED') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `agent_id` bigint DEFAULT NULL,
  `application_id` bigint NOT NULL,
  `customer_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKdklxndjl72peqs3a0hje32dqu` (`agent_id`),
  KEY `FK7rx6b1qpcks4w1ayeglbvvslj` (`application_id`),
  KEY `FK1112dl0wn9t5rmmri551xmayo` (`customer_id`),
  CONSTRAINT `FK1112dl0wn9t5rmmri551xmayo` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FK7rx6b1qpcks4w1ayeglbvvslj` FOREIGN KEY (`application_id`) REFERENCES `policy_applications` (`id`),
  CONSTRAINT `FKdklxndjl72peqs3a0hje32dqu` FOREIGN KEY (`agent_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `claims`
--

LOCK TABLES `claims` WRITE;
/*!40000 ALTER TABLE `claims` DISABLE KEYS */;
/*!40000 ALTER TABLE `claims` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feedbacks`
--

DROP TABLE IF EXISTS `feedbacks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feedbacks` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `rating` int NOT NULL,
  `is_read` bit(1) DEFAULT NULL,
  `customer_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK8kw5agn6ypgg4lkjrbc54wk0c` (`customer_id`),
  CONSTRAINT `FK8kw5agn6ypgg4lkjrbc54wk0c` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feedbacks`
--

LOCK TABLES `feedbacks` WRITE;
/*!40000 ALTER TABLE `feedbacks` DISABLE KEYS */;
/*!40000 ALTER TABLE `feedbacks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `form_fields`
--

DROP TABLE IF EXISTS `form_fields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `form_fields` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `field_label` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `field_options` text COLLATE utf8mb4_unicode_ci,
  `field_type` enum('LABEL','NAME','EMAIL','PHONE','TEXT','TEXTAREA','CHECKBOX','DATE','NRC','IMAGE_UPLOAD','PDF_UPLOAD') COLLATE utf8mb4_unicode_ci NOT NULL,
  `required` bit(1) NOT NULL,
  `sort_order` int DEFAULT NULL,
  `template_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK68c4qtkb6rfbcrfwuj2urvwim` (`template_id`),
  CONSTRAINT `FK68c4qtkb6rfbcrfwuj2urvwim` FOREIGN KEY (`template_id`) REFERENCES `form_templates` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `form_fields`
--

LOCK TABLES `form_fields` WRITE;
/*!40000 ALTER TABLE `form_fields` DISABLE KEYS */;
/*!40000 ALTER TABLE `form_fields` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `form_templates`
--

DROP TABLE IF EXISTS `form_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `form_templates` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `active` bit(1) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `form_type` enum('APPLICATION','CLAIM') COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `package_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_form_template_package_type` (`package_id`,`form_type`),
  CONSTRAINT `FK14moxcmd442vkxklapffmkus2` FOREIGN KEY (`package_id`) REFERENCES `insurance_packages` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `form_templates`
--

LOCK TABLES `form_templates` WRITE;
/*!40000 ALTER TABLE `form_templates` DISABLE KEYS */;
/*!40000 ALTER TABLE `form_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `insurance_packages`
--

DROP TABLE IF EXISTS `insurance_packages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `insurance_packages` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `active` bit(1) NOT NULL,
  `beneficiary_info` text COLLATE utf8mb4_unicode_ci,
  `benefits` text COLLATE utf8mb4_unicode_ci,
  `coverage_max` decimal(20,2) NOT NULL,
  `coverage_min` decimal(20,2) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `duration_tiers` text COLLATE utf8mb4_unicode_ci,
  `eligibility` text COLLATE utf8mb4_unicode_ci,
  `exclusions` text COLLATE utf8mb4_unicode_ci,
  `max_claim_amount` decimal(20,2) DEFAULT NULL,
  `min_policy_term` int DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_frequency` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_interval_months` int DEFAULT NULL,
  `policy_term` int DEFAULT NULL,
  `premium_rate` decimal(8,4) DEFAULT NULL,
  `required_documents` text COLLATE utf8mb4_unicode_ci,
  `terms_and_conditions` text COLLATE utf8mb4_unicode_ci,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `insurance_packages`
--

LOCK TABLES `insurance_packages` WRITE;
/*!40000 ALTER TABLE `insurance_packages` DISABLE KEYS */;
INSERT INTO `insurance_packages` VALUES (1,_binary '','The policyholder may designate one or more beneficiaries.\nBeneficiaries must be named at policy inception or updated in writing.\nMinor beneficiaries require a legal guardian to receive the payout.\nIn the absence of a named beneficiary, proceeds go to the legal estate.','Death benefit payout to named beneficiary\nAccidental death double indemnity\nTotal permanent disability benefit\n24/7 customer support hotline\nDigital policy documents & e-certificate',50000000.00,5000000.00,'2026-07-21 04:27:09.721039','Essential life coverage for individuals and families. Affordable premiums with a reliable death benefit payout.','[{\"years\":1,\"premiumRate\":0.0200},{\"years\":2,\"premiumRate\":0.0190},{\"years\":3,\"premiumRate\":0.0185},{\"years\":5,\"premiumRate\":0.0175}]','Age 18–60 years at time of application.\nMyanmar citizen or permanent resident.\nNo terminal illness or life-threatening condition at application date.\nMust pass basic health declaration form.','Suicide within the first 2 years of the policy.\nDeath caused by war, terrorism, or civil unrest.\nPre-existing conditions not declared at application.\nDeath while under the influence of alcohol or illegal substances.',50000000.00,NULL,'Basic Life Protection','YEARLY',12,NULL,NULL,'[\"National Registration Card (NRC) — front and back copy\",\"Passport-size photograph (2 copies)\",\"Completed health declaration form\",\"Bank account details for premium debit\"]','1. POLICY TERM: This policy is valid for the selected duration from the activation date.\n2. PREMIUM PAYMENT: Premiums must be paid annually by the due date. A 30-day grace period applies.\n3. LAPSE: Failure to pay within the grace period will lapse the policy without cash value.\n4. REINSTATEMENT: A lapsed policy may be reinstated within 2 years subject to a health re-declaration.\n5. CLAIMS: All claims must be submitted within 90 days of the insured event with supporting documentation.\n6. CONTESTABILITY: The insurer reserves the right to contest claims within 2 years of policy inception if material misrepresentation is found.\n7. GOVERNING LAW: This policy is governed by the laws of Myanmar.','LIFE','2026-07-21 04:27:09.721061'),(2,_binary '','Up to 3 beneficiaries may be named with percentage allocation.\nBeneficiary details can be updated at any anniversary date.\nJoint-life option available for married couples.\nTrustee appointment available for minor beneficiaries.','Death benefit payout to named beneficiary\nCritical illness rider — covers 10 major illnesses\nAccidental death & total permanent disability benefit\nFree annual health screening (clinic partner network)\nWaiver of premium on disability\nDigital policy documents & e-certificate',200000000.00,20000000.00,'2026-07-21 04:27:09.722457','Comprehensive life coverage with added riders for critical illness and disability. Ideal for breadwinners and high-value protection needs.','[{\"years\":5,\"premiumRate\":0.0250},{\"years\":10,\"premiumRate\":0.0240},{\"years\":15,\"premiumRate\":0.0230},{\"years\":20,\"premiumRate\":0.0220}]','Age 18–55 years at time of application.\nMyanmar citizen or permanent resident.\nMust complete full medical underwriting for coverage above MMK 100,000,000.\nNon-smoker preferred rate available.','Suicide within the first 2 years of the policy.\nDeath caused by war, terrorism, or civil unrest.\nPre-existing critical illnesses diagnosed before policy inception.\nHazardous activities (skydiving, mountaineering) unless additional rider purchased.\nAlcohol or drug-related deaths.',200000000.00,NULL,'Premium Life Shield','MONTHLY',1,NULL,NULL,'[\"National Registration Card (NRC) — front and back copy\",\"Passport-size photograph (2 copies)\",\"Completed health declaration & medical questionnaire\",\"Income proof (payslip or business registration) for high-sum assured\",\"Bank account details for premium debit\"]','1. POLICY TERM: 5, 10, 15, or 20 years from activation date.\n2. PREMIUM PAYMENT: Monthly via direct debit. A 30-day grace period applies.\n3. CRITICAL ILLNESS CLAIM: Diagnosed illness must survive 30 days after diagnosis to trigger the rider payout.\n4. LAPSE & REINSTATEMENT: Policy lapses after the grace period. Reinstatement within 2 years with fresh medical evidence.\n5. FREE-LOOK PERIOD: 14 days from policy delivery to cancel for a full refund.\n6. CLAIMS PROCEDURE: Submit certified medical reports, death certificate (if applicable), and claim form within 90 days.\n7. GOVERNING LAW: Governed by the laws of Myanmar.','LIFE','2026-07-21 04:27:09.722472'),(3,_binary '','Health plans cover the named policyholder only unless a Family Floater option is selected.\nFamily Floater covers spouse and up to 3 dependent children.\nEach member uses a shared pool of the total coverage amount per policy year.\nAdding a new dependent requires written notice within 30 days of the qualifying event.','Hospitalization — room, board & ICU costs\nOutpatient treatment & specialist consultations\nSurgery & anaesthesia coverage\nEmergency medical evacuation\nMaternity & new-born care benefits\nPrescription drug reimbursement up to MMK 500,000/year\nDental emergency coverage',30000000.00,2000000.00,'2026-07-21 04:27:09.723907','Full medical coverage including hospitalization, outpatient care, surgery, and emergency evacuation. Perfect for individuals and families.','[{\"years\":1,\"premiumRate\":0.0280},{\"years\":2,\"premiumRate\":0.0265},{\"years\":3,\"premiumRate\":0.0250}]','Age 1–65 years (children must be added under a family plan).\nMyanmar citizen or resident with valid address.\nNo hospitalization for chronic illness in the past 12 months at application.\nPre-existing conditions covered after a 12-month waiting period.','Cosmetic or elective procedures not medically necessary.\nExperimental treatments not approved by MOH Myanmar.\nSelf-inflicted injuries.\nAlcohol or substance abuse treatment.\nDental treatments other than emergency extractions.\nSTDs and HIV/AIDS-related treatment.',30000000.00,NULL,'Health Plus','QUARTERLY',3,NULL,NULL,'[\"National Registration Card (NRC) — front and back copy\",\"Passport-size photograph\",\"Completed health declaration form\",\"Birth certificate (for dependent children)\",\"Medical records for any pre-existing condition declared\"]','1. COVERAGE YEAR: Benefits reset on each policy anniversary date.\n2. PRE-AUTHORIZATION: Planned surgeries and specialist referrals require pre-authorization at least 48 hours in advance.\n3. CASHLESS CLAIMS: Available at network hospitals — present your e-card at admission.\n4. REIMBURSEMENT CLAIMS: Submit receipts within 60 days of treatment for out-of-network claims.\n5. WAITING PERIOD: 30-day general waiting period; 12 months for pre-existing conditions; 9 months for maternity.\n6. CO-PAYMENT: 10% co-payment applies to outpatient claims.\n7. RENEWAL: Policy must be renewed before expiry. Premium may be revised at renewal based on claims history.','HEALTH','2026-07-21 04:27:09.723921'),(4,_binary '','The vehicle owner is the default beneficiary for own-damage claims.\nThird-party claims are paid directly to the injured party or their legal representative.\nIn the event of total loss, settlement is based on the vehicle\'s market value at the time of loss minus any depreciation.\nFinance companies with a registered interest will be noted on the policy as co-payees.','Accident repair costs — own vehicle damage\nTotal loss replacement (declared write-off)\nTheft & attempted theft coverage\nThird-party bodily injury & property liability\nRoadside assistance 24/7 (towing up to 50 km)\nFire and flood (natural disaster) damage\nPersonal accident cover for driver (MMK 5,000,000)',80000000.00,3000000.00,'2026-07-21 04:27:09.725473','Comprehensive vehicle insurance for cars, motorcycles, and commercial vehicles. Covers accidents, theft, fire, flood, and third-party liability.','[{\"years\":1,\"premiumRate\":0.0300},{\"years\":2,\"premiumRate\":0.0285},{\"years\":3,\"premiumRate\":0.0270}]','Vehicle registered in Myanmar with valid road-tax.\nDriver must hold a valid Myanmar driving licence.\nVehicles up to 10 years old at inception (older vehicles subject to inspection).\nCommercial vehicles (taxis, delivery vans) must declare commercial use.','Damage caused while driving under the influence of alcohol or drugs.\nWear and tear, mechanical or electrical breakdown.\nUsing the vehicle in a race, rally, or speed test.\nIntentional damage by the policyholder.\nDamage occurring outside Myanmar unless international cover rider is purchased.\nConsequential losses (loss of earnings during repair).',80000000.00,NULL,'Vehicle Protect Plus','YEARLY',12,NULL,NULL,'[\"Vehicle registration certificate (front & back)\",\"Valid road-tax sticker\",\"Driver\'s licence of the named driver\",\"Chassis and engine number photographs\",\"National Registration Card (NRC) of the owner\",\"Existing damage photographs (if any)\"]','1. VEHICLE INSPECTION: An inspection may be required before cover is bound for vehicles over 5 years old or with prior damage.\n2. ACCIDENT CLAIMS: Notify us within 24 hours of an accident. Do not authorize repairs without written approval.\n3. THEFT CLAIMS: Report theft to the nearest police station and obtain a police report within 24 hours.\n4. APPROVED REPAIRERS: Use our network of approved repair workshops for cashless service.\n5. EXCESS: A standard excess of MMK 500,000 applies per own-damage claim.\n6. NO-CLAIM DISCOUNT (NCD): A 10% NCD applies on renewal for each claim-free year, up to 30%.\n7. CANCELLATION: Midterm cancellation refunds the pro-rata unused premium less a 10% administration fee.','VEHICLE','2026-07-21 04:27:09.725507'),(5,_binary '','The named insured (owner or tenant) is the primary beneficiary.\nMortgagee (bank or finance company) may be noted as a co-payee for the building section.\nContents coverage applies to personal belongings of the named insured and immediate family members residing at the property.\nHigh-value items (jewellery, art, electronics) over MMK 5,000,000 must be individually listed to be covered.','Structural damage — fire, earthquake, flood, storm\nContents & household belongings coverage\nTheft and burglary — forcible entry\nAccidental breakage (glass, sanitary ware)\nTemporary accommodation allowance (up to 90 days)\nLandlord liability coverage\nRent loss coverage (for landlords)\nEmergency home assistance (plumber, electrician)',500000000.00,10000000.00,'2026-07-21 04:27:09.727371','Protect your home and valuables against fire, theft, natural disasters, and accidental damage. Comprehensive coverage for homeowners and landlords.','[{\"years\":1,\"premiumRate\":0.0150},{\"years\":2,\"premiumRate\":0.0142},{\"years\":3,\"premiumRate\":0.0135},{\"years\":5,\"premiumRate\":0.0125}]','Property must be located in Myanmar and used for residential purposes.\nBuilding must be constructed of permanent materials (brick, concrete, steel).\nApplicant must be the legal owner or authorized tenant.\nProperty must not have been subject to a claim in the past 3 years for the same peril unless repairs are certified.','Gradual deterioration, wear and tear, or rust.\nDamage caused by insects, vermin, or fungus.\nWar, invasion, or acts of foreign enemies.\nNuclear radiation or contamination.\nIntentional damage or fraud by the insured.\nUninhabited properties (vacant for more than 60 days without prior notification).',500000000.00,NULL,'Home & Property Shield','YEARLY',12,NULL,NULL,'[\"Property ownership certificate or land title deed\",\"National Registration Card (NRC) of the owner\",\"Photographs of the property — exterior and all rooms\",\"Proof of tenancy (if applicable)\",\"List of high-value contents to be specifically insured\",\"Previous insurance certificate (if renewing)\"]','1. SUM INSURED BASIS: The building is insured on a reinstatement basis; contents on indemnity (market value) basis.\n2. AVERAGE CLAUSE: If the sum insured is below 80% of the replacement value, claims will be proportionally reduced.\n3. CLAIMS NOTIFICATION: Notify the insurer within 48 hours of a loss event. Do not dispose of damaged property before inspection.\n4. PROOF OF LOSS: Submit itemized list of damaged/lost property with purchase receipts where available within 30 days.\n5. TEMPORARY ACCOMMODATION: Pre-approval required. Maximum MMK 2,000,000/month for up to 90 days.\n6. PREMIUM PAYMENT: Annual premium due on the policy start date. 30-day grace period before cover lapses.\n7. GOVERNING LAW: Governed by the laws of Myanmar.','PROPERTY','2026-07-21 04:27:09.727385'),(6,_binary '','The named insured business entity is the sole beneficiary for first-party covers.\nLiability claims are settled directly with the third-party claimant.\nIn the event of a business interruption claim, benefits are calculated on the basis of the Gross Profit declared at inception — ensure this figure is accurate.\nPartners or co-directors listed on the policy are covered for personal accident benefits.','Business interruption — lost revenue during forced closure\nBuilding & fitout damage (fire, flood, storm)\nMachinery, equipment & stock coverage\nTheft, robbery & employee dishonesty\nPublic & product liability protection\nEmployee personal accident (up to 20 staff)\nElectronic equipment & data loss coverage\nMoney in transit & on premises',1000000000.00,50000000.00,'2026-07-21 04:27:09.729214','Business interruption and multi-risk asset protection designed for small and medium enterprises. Keep your business running through unexpected events.','[{\"years\":1,\"premiumRate\":0.0180},{\"years\":2,\"premiumRate\":0.0170},{\"years\":3,\"premiumRate\":0.0160}]','Registered business entity in Myanmar (sole proprietor, partnership, or company).\nAnnual turnover up to MMK 10 billion.\nBusiness premises must be permanently constructed and maintained in good condition.\nBusiness must have been operating for at least 6 months.\nFood & beverage and manufacturing businesses require on-site risk assessment.','Losses arising from intentional acts, fraud, or dishonesty of the owner/directors.\nBusiness interruption due to contractual disputes or government penalties.\nCyber-attacks unless cyber-liability extension is purchased.\nStock spoilage due to power failure unless consequential loss rider is added.\nWar, terrorism, nuclear risks.\nLiability arising from professional advice (requires separate professional indemnity cover).',1000000000.00,NULL,'SME Business Protect','HALF_YEARLY',6,NULL,NULL,'[\"Business registration certificate (DICA)\",\"Company NRC or directors\' NRC copies\",\"Premises lease agreement or ownership deed\",\"Last 2 years financial statements (for business interruption cover)\",\"Asset register or equipment list with purchase values\",\"Photographs of premises — exterior, office, storage\"]','1. BUSINESS INTERRUPTION: The indemnity period is 12 months from the date of loss. Revenue projections must be supported by 2 years of financial records.\n2. RISK ASSESSMENT: A site survey may be required for premises over MMK 200,000,000 sum insured.\n3. EMPLOYEE DISHONESTY: A 30-day discovery period applies after policy expiry.\n4. STOCK DECLARATION: Stock values must be declared quarterly; premium is adjusted at year-end on actual values.\n5. CLAIMS NOTIFICATION: Notify insurer immediately (and no later than 48 hours) of any loss. Preserve all evidence.\n6. PREMIUM PAYMENT: Half-yearly. Failure to pay the second instalment within the grace period suspends cover.\n7. GOVERNING LAW: Governed by the laws of Myanmar.','PROPERTY','2026-07-21 04:27:09.729229');
/*!40000 ALTER TABLE `insurance_packages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `insurance_types`
--

DROP TABLE IF EXISTS `insurance_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `insurance_types` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `benefits` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(6) DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rules` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_oh6db2t70imkcmadxefmejvms` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `insurance_types`
--

LOCK TABLES `insurance_types` WRITE;
/*!40000 ALTER TABLE `insurance_types` DISABLE KEYS */;
INSERT INTO `insurance_types` VALUES (1,NULL,'2026-07-21 04:27:09.706051',NULL,'LIFE',NULL),(2,NULL,'2026-07-21 04:27:09.709981',NULL,'HEALTH',NULL),(3,NULL,'2026-07-21 04:27:09.711350',NULL,'VEHICLE',NULL),(4,NULL,'2026-07-21 04:27:09.713361',NULL,'PROPERTY',NULL);
/*!40000 ALTER TABLE `insurance_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` bit(1) DEFAULT NULL,
  `target_role` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('INFO','APPROVAL','REJECTION','PAYMENT','CLAIM','REMINDER') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recipient_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKqqnsjxlwleyjbxlmm213jaj3f` (`recipient_id`),
  CONSTRAINT `FKqqnsjxlwleyjbxlmm213jaj3f` FOREIGN KEY (`recipient_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_method_configs`
--

DROP TABLE IF EXISTS `payment_method_configs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_method_configs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `active` bit(1) NOT NULL,
  `color` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `logo_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `method_key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `qr_code_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_f8v1i1mexy8jf3asfm7ruoep8` (`method_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_method_configs`
--

LOCK TABLES `payment_method_configs` WRITE;
/*!40000 ALTER TABLE `payment_method_configs` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment_method_configs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `amount` decimal(20,2) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_method` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `period_label` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `period_number` int DEFAULT NULL,
  `screenshot_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('PENDING','VERIFIED','REJECTED') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transaction_amount` decimal(20,2) DEFAULT NULL,
  `transaction_last_six_digits` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `verified_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `application_id` bigint NOT NULL,
  `customer_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKdeaqlpxpp5n0x8ikobjuoqikl` (`application_id`),
  KEY `FKd1qot1f3alweegm6ledjow6nj` (`customer_id`),
  CONSTRAINT `FKd1qot1f3alweegm6ledjow6nj` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKdeaqlpxpp5n0x8ikobjuoqikl` FOREIGN KEY (`application_id`) REFERENCES `policy_applications` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `policy_applications`
--

DROP TABLE IF EXISTS `policy_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `policy_applications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `admin_note` text COLLATE utf8mb4_unicode_ci,
  `agent_note` text COLLATE utf8mb4_unicode_ci,
  `common_info` text COLLATE utf8mb4_unicode_ci,
  `coverage_amount` decimal(20,2) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `documents_path` text COLLATE utf8mb4_unicode_ci,
  `duration` int NOT NULL,
  `extra_info` text COLLATE utf8mb4_unicode_ci,
  `form_data` text COLLATE utf8mb4_unicode_ci,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `policy_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `premium_amount` decimal(20,2) DEFAULT NULL,
  `revision_deadline` datetime(6) DEFAULT NULL,
  `risk_level` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('PENDING','VERIFIED','APPROVED','REJECTED','CANCELLED','REVISION_REQUESTED') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `agent_id` bigint DEFAULT NULL,
  `customer_id` bigint NOT NULL,
  `package_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKpmnamrr9b8k6ns7vy2xew0hy4` (`agent_id`),
  KEY `FK2hutrb5fsky4hf7tbm9sn35ie` (`customer_id`),
  KEY `FKsgj4fof1fnosv8rq4xesvy7i0` (`package_id`),
  CONSTRAINT `FK2hutrb5fsky4hf7tbm9sn35ie` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKpmnamrr9b8k6ns7vy2xew0hy4` FOREIGN KEY (`agent_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKsgj4fof1fnosv8rq4xesvy7i0` FOREIGN KEY (`package_id`) REFERENCES `insurance_packages` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `policy_applications`
--

LOCK TABLES `policy_applications` WRITE;
/*!40000 ALTER TABLE `policy_applications` DISABLE KEYS */;
/*!40000 ALTER TABLE `policy_applications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `scheduler_settings`
--

DROP TABLE IF EXISTS `scheduler_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `scheduler_settings` (
  `id` bigint NOT NULL,
  `enabled` bit(1) NOT NULL,
  `min_pending_hours` int NOT NULL,
  `reminder_cron` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `revision_cleanup_cron` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `verify_cron` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `scheduler_settings`
--

LOCK TABLES `scheduler_settings` WRITE;
/*!40000 ALTER TABLE `scheduler_settings` DISABLE KEYS */;
INSERT INTO `scheduler_settings` VALUES (1,_binary '',1,'0 30 1 * * *','0 0 3 * * *','2026-07-21 04:27:08.956083','0 30 2 * * *');
/*!40000 ALTER TABLE `scheduler_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `active` bit(1) NOT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `insurance_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `profile_picture` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('ADMIN','AGENT','CUSTOMER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_6dotkott2kjsp8vw4d0m25fb7` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,_binary '',NULL,'2026-07-21 04:27:09.849114','admin@dicp.com.mm',NULL,'Admin','$2a$10$xE23.r0KfCYltI3zMaKjrOJfk.2dtvLtrPsprJLaAKB9dCmi2zs9K','+95 9 000 000 001',NULL,'ADMIN','2026-07-21 04:27:09.849135');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'insurance_portal'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-21  4:40:42
