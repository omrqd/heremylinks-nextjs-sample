# ************************************************************
# Sequel Ace SQL dump
# Version 20095
#
# https://sequel-ace.com/
# https://github.com/Sequel-Ace/Sequel-Ace
#
# Host: localhost (MySQL 9.4.0)
# Database: heremylinks
# Generation Time: 2025-11-01 13:28:51 +0000
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
  `is_transparent` tinyint(1) DEFAULT '0',
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
  `hero_image` text COLLATE utf8mb4_unicode_ci COMMENT 'Hero/banner image for profile page (separate from profile picture)',
  `hero_height` int DEFAULT '300' COMMENT 'Height of hero banner in pixels (for template3)',
  `hide_profile_picture` tinyint(1) DEFAULT '0' COMMENT 'Hide profile picture in template3 (hero only)',
  `theme_color` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT '#667eea',
  `background_color` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT '#ffffff',
  `template` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'template3',
  `background_image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Path to background image file',
  `background_video` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Path to background video file',
  `card_background_color` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT '#ffffff',
  `card_background_image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `card_background_video` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `custom_text` text COLLATE utf8mb4_unicode_ci COMMENT 'Custom text block displayed on bio page',
  `username_color` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT '#1a1a1a' COMMENT 'Username text color',
  `bio_color` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT '#6b7280' COMMENT 'Bio text color',
  `custom_text_color` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT '#4b5563' COMMENT 'Custom text color',
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




/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
