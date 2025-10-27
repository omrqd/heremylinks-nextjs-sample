# ************************************************************
# Sequel Ace SQL dump
# Version 20095
#
# https://sequel-ace.com/
# https://github.com/Sequel-Ace/Sequel-Ace
#
# Host: localhost (MySQL 9.4.0)
# Database: heremylinks
# Generation Time: 2025-10-27 11:28:03 +0000
# ************************************************************


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
SET NAMES utf8mb4;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE='NO_AUTO_VALUE_ON_ZERO', SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


# Dump of table accounts
# ------------------------------------------------------------

DROP TABLE IF EXISTS `accounts`;

CREATE TABLE `accounts` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider_account_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `refresh_token` text COLLATE utf8mb4_unicode_ci,
  `access_token` text COLLATE utf8mb4_unicode_ci,
  `expires_at` bigint DEFAULT NULL,
  `token_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `scope` text COLLATE utf8mb4_unicode_ci,
  `id_token` text COLLATE utf8mb4_unicode_ci,
  `session_state` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_provider_account` (`provider`,`provider_account_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_provider` (`provider`),
  CONSTRAINT `accounts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `accounts` WRITE;
/*!40000 ALTER TABLE `accounts` DISABLE KEYS */;

INSERT INTO `accounts` (`id`, `user_id`, `type`, `provider`, `provider_account_id`, `refresh_token`, `access_token`, `expires_at`, `token_type`, `scope`, `id_token`, `session_state`, `created_at`)
VALUES
	('8563bd0f-a31e-4a31-8b3a-bf7eef6e056a','0e528847-4829-451e-8a5a-4f2d76e2e23a','oidc','google','102849301751037279538',NULL,'ya29.A0ATi6K2tWTP20ZXGpyiI5oFPDspI0LNYtADE358_pSeEdIKRRUYSRIxoi73yjG8eObTvPj8cV4OvsJZQ2GWRTmrEnj5wr4CUy2St5VjWi3MQL_8EPnFT2-5GIfOlfvG1aw4lKPHThpsBCgUXXCtvaReO4T1iv5FzDeUCbNxP2iaDF-HTc_EwUusRs7nEuJ5QlWXAuAWh82I-bIL_u5k-8kfBigT3LG6wK-wCNXNlq5RTjhJ1Dpsd14FAVnkxLYb6YZnNQhmTcAWk2KBry1aPS1zdH8jNQaCgYKAT8SARMSFQHGX2MidzpKtjoQ2XNVll7Be_T6Fg0291',1761519414,'bearer','https://www.googleapis.com/auth/userinfo.email openid https://www.googleapis.com/auth/userinfo.profile','eyJhbGciOiJSUzI1NiIsImtpZCI6Ijg4NDg5MjEyMmUyOTM5ZmQxZjMxMzc1YjJiMzYzZWM4MTU3MjNiYmIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI1MTgyNzI2NzI3NzctZ3RuZ3V1azZsYXVsaWQ1N3Y5NmxuZGw3Zjd0ZDMyaW4uYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI1MTgyNzI2NzI3NzctZ3RuZ3V1azZsYXVsaWQ1N3Y5NmxuZGw3Zjd0ZDMyaW4uYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDI4NDkzMDE3NTEwMzcyNzk1MzgiLCJlbWFpbCI6Im1vcmEuZHhidWFlQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoiM2dLUHhjSndDZTRRTkx6WUZlbFJpdyIsIm5hbWUiOiJPbWFyIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0wzdl9FSDFHT29XWmlqT2ItRDJHaVVTcGk3QUFJM1Z5QWNUYWdhX0ttcmJzZVhFZz1zOTYtYyIsImdpdmVuX25hbWUiOiJPbWFyIiwiaWF0IjoxNzYxNTE1ODE2LCJleHAiOjE3NjE1MTk0MTZ9.YDsPcLp3YLXTppmvnuM0ZnDADCtRF2BGVAyPAnU_KZEAq31UMqnm1YzK_sE6RcKt4h3pgdo5U2-6jUi4DndQ734x_22Zu1yGKeTBRSeB-R42u6g-ITpQgv6e-DByAH2oEvZytjr7ju4ib0fbKf4mR3sgrW1p5RXlOARKGfcZ521JgvW_eH6g9AzMvgdWmiuKEyiy1CNsFECyeLp01UTNnGBt81VBm2EbgLlmahpfQzx7QHsQ0mFEZ-LBXHfPlpwubUbqEzwL0vW9A3FCwbTA04eXAV5G7XwHuvUIvJvdHr9MPfGmVdaUNPiGrZlY7O2wXGJf0qUILOzlsoUH8LWsEQ',NULL,'2025-10-27 00:56:56');

/*!40000 ALTER TABLE `accounts` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table bio_links
# ------------------------------------------------------------

DROP TABLE IF EXISTS `bio_links`;

CREATE TABLE `bio_links` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image` longtext COLLATE utf8mb4_unicode_ci,
  `layout` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'simple',
  `background_color` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `text_color` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `order` int DEFAULT '0',
  `is_visible` tinyint(1) DEFAULT '1',
  `click_count` int DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_user_order` (`user_id`,`order`),
  CONSTRAINT `bio_links_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `bio_links` WRITE;
/*!40000 ALTER TABLE `bio_links` DISABLE KEYS */;

INSERT INTO `bio_links` (`id`, `user_id`, `title`, `url`, `icon`, `image`, `layout`, `background_color`, `text_color`, `order`, `is_visible`, `click_count`, `created_at`, `updated_at`)
VALUES
	('b919d80c-befa-431c-b65f-d2768a9db59a','0e528847-4829-451e-8a5a-4f2d76e2e23a','My 🔥🔥','https://fb.com',NULL,'/uploads/links/c873a95d-776d-4284-9593-bac755bbcc8e.png','image-large',NULL,NULL,3,1,0,'2025-10-27 14:03:09','2025-10-27 14:03:09');

/*!40000 ALTER TABLE `bio_links` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table social_links
# ------------------------------------------------------------

DROP TABLE IF EXISTS `social_links`;

CREATE TABLE `social_links` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `platform` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `social_links_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `social_links` WRITE;
/*!40000 ALTER TABLE `social_links` DISABLE KEYS */;

INSERT INTO `social_links` (`id`, `user_id`, `platform`, `url`, `icon`, `created_at`)
VALUES
	('2423321d-34b4-454c-a084-df42aff4c476','0e528847-4829-451e-8a5a-4f2d76e2e23a','Instagram','https://instagram.com/0mr55','fab fa-instagram','2025-10-27 14:04:40'),
	('892d7e86-e706-49a7-a42d-5267f0cd4a70','0e528847-4829-451e-8a5a-4f2d76e2e23a','LinkedIn','https://linkedin.com','fab fa-linkedin-in','2025-10-27 14:04:50');

/*!40000 ALTER TABLE `social_links` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table users
# ------------------------------------------------------------

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified` datetime DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image` text COLLATE utf8mb4_unicode_ci,
  `bio` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT 'Add your bio here',
  `password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `provider` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `provider_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `profile_image` longtext COLLATE utf8mb4_unicode_ci,
  `theme_color` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT '#667eea',
  `background_color` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT '#ffffff',
  `template` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'default',
  `is_published` tinyint(1) DEFAULT '0',
  `custom_domain` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `verification_code` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verification_code_expires` timestamp NULL DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_username` (`username`),
  KEY `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;

INSERT INTO `users` (`id`, `username`, `email`, `email_verified`, `name`, `image`, `bio`, `password`, `provider`, `provider_id`, `profile_image`, `theme_color`, `background_color`, `template`, `is_published`, `custom_domain`, `created_at`, `updated_at`, `verification_code`, `verification_code_expires`, `is_verified`)
VALUES
	('0e528847-4829-451e-8a5a-4f2d76e2e23a','mromarnasr','mora.dxbuae@gmail.com','2025-10-27 00:56:56','DR Ahmed Khaled','https://lh3.googleusercontent.com/a/ACg8ocL3v_EH1GOoWZijOb-D2GiUSpi7AAI3VyAcTaga_KmrbseXEg=s96-c','Software Developer @ Google.com',NULL,'google','102849301751037279538','/uploads/profiles/fadbe17d-37c8-400d-b032-b2e5d6b88f15.PNG','#667eea','#ffffff','default',1,NULL,'2025-10-27 00:56:56','2025-10-27 14:13:56',NULL,NULL,1);

/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;



/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
