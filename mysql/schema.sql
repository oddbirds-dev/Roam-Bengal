-- Roam Bengal MySQL 8.0 schema. Run once in Hostinger phpMyAdmin.
-- Former PostgreSQL arrays and jsonb values are stored as native MySQL JSON.

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL PRIMARY KEY,
  email VARCHAR(200) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin') NOT NULL DEFAULT 'admin',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS media (
  id CHAR(36) NOT NULL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  content_type VARCHAR(100) NOT NULL,
  bytes MEDIUMBLOB NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX media_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activities (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(220) NOT NULL UNIQUE,
  description TEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS destinations (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(220) NOT NULL UNIQUE,
  region VARCHAR(200) NULL,
  tagline TEXT NULL,
  intro TEXT NULL,
  best_time VARCHAR(200) NULL,
  highlights JSON NOT NULL,
  image_url TEXT NULL,
  image_alt TEXT NULL,
  image_title TEXT NULL,
  image_description TEXT NULL,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tours (
  id CHAR(36) NOT NULL PRIMARY KEY,
  slug VARCHAR(220) NOT NULL UNIQUE,
  title VARCHAR(300) NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'day-tour',
  summary TEXT NULL,
  overview LONGTEXT NULL,
  overview_tip TEXT NULL,
  destination_label VARCHAR(200) NULL,
  primary_destination_slug VARCHAR(220) NULL,
  duration_days INT NOT NULL DEFAULT 1,
  duration_label VARCHAR(100) NULL,
  activity_label VARCHAR(200) NULL,
  group_size_max INT NULL,
  price_usd DECIMAL(12,2) NULL,
  price_bdt DECIMAL(12,2) NULL,
  child_price_usd DECIMAL(12,2) NULL,
  discount_price_usd DECIMAL(12,2) NULL,
  discount_child_price_usd DECIMAL(12,2) NULL,
  price_note TEXT NULL,
  price_tiers JSON NOT NULL,
  rating DECIMAL(3,2) NULL,
  reviews_count INT NOT NULL DEFAULT 0,
  stops_count INT NULL,
  activities_count INT NULL,
  hero_image TEXT NULL,
  hero_image_alt TEXT NULL,
  hero_image_title TEXT NULL,
  hero_image_description TEXT NULL,
  images JSON NOT NULL,
  highlights JSON NOT NULL,
  inclusions JSON NOT NULL,
  exclusions JSON NOT NULL,
  itinerary JSON NOT NULL,
  facts JSON NOT NULL,
  glance JSON NOT NULL,
  faqs JSON NOT NULL,
  offers JSON NOT NULL,
  addons JSON NOT NULL,
  advice JSON NOT NULL,
  accessibility JSON NOT NULL,
  pledge JSON NOT NULL,
  why_items JSON NOT NULL,
  hidden_sections JSON NOT NULL,
  related_slugs JSON NOT NULL,
  related_post_slugs JSON NOT NULL,
  map_embed TEXT NULL,
  video_url TEXT NULL,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX tours_public_sort (is_published, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tour_activities (
  tour_id CHAR(36) NOT NULL,
  activity_id CHAR(36) NOT NULL,
  PRIMARY KEY (tour_id, activity_id),
  CONSTRAINT fk_ta_tour FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE,
  CONSTRAINT fk_ta_activity FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS blog_posts (
  id CHAR(36) NOT NULL PRIMARY KEY,
  slug VARCHAR(220) NOT NULL UNIQUE,
  title VARCHAR(300) NOT NULL,
  excerpt TEXT NULL,
  body JSON NOT NULL,
  category VARCHAR(120) NULL,
  cover_image TEXT NULL,
  cover_image_alt TEXT NULL,
  cover_image_title TEXT NULL,
  cover_image_description TEXT NULL,
  author_name VARCHAR(200) NULL,
  author_role VARCHAR(200) NULL,
  author_avatar TEXT NULL,
  author_avatar_alt TEXT NULL,
  author_avatar_title TEXT NULL,
  author_avatar_description TEXT NULL,
  date_label VARCHAR(100) NULL,
  read_time VARCHAR(100) NULL,
  related_slugs JSON NOT NULL,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX posts_public_sort (is_published, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS testimonials (
  id CHAR(36) NOT NULL PRIMARY KEY,
  author VARCHAR(200) NOT NULL,
  location VARCHAR(200) NULL,
  quote TEXT NOT NULL,
  headline TEXT NULL,
  platform VARCHAR(100) NULL,
  tour_label VARCHAR(200) NULL,
  rating INT NULL,
  avatar_url TEXT NULL,
  avatar_alt TEXT NULL,
  avatar_title TEXT NULL,
  avatar_description TEXT NULL,
  images JSON NOT NULL,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX testimonials_public_sort (is_published, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS faqs (
  id CHAR(36) NOT NULL PRIMARY KEY,
  question TEXT NOT NULL,
  answer LONGTEXT NOT NULL,
  category VARCHAR(120) NULL,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX faqs_public_sort (is_published, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS site_settings (
  id CHAR(36) NOT NULL PRIMARY KEY,
  `key` VARCHAR(200) NOT NULL UNIQUE,
  value JSON NOT NULL,
  description TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS seo_meta (
  id CHAR(36) NOT NULL PRIMARY KEY,
  entity_type VARCHAR(80) NOT NULL,
  entity_id CHAR(36) NOT NULL,
  meta_title TEXT NULL,
  meta_description TEXT NULL,
  focus_keyphrase VARCHAR(300) NULL,
  extra_keyphrases JSON NOT NULL,
  synonyms JSON NOT NULL,
  canonical_url TEXT NULL,
  robots_noindex BOOLEAN NOT NULL DEFAULT FALSE,
  cornerstone BOOLEAN NOT NULL DEFAULT FALSE,
  schema_type VARCHAR(100) NULL,
  og_title TEXT NULL,
  og_description TEXT NULL,
  og_image TEXT NULL,
  og_image_alt TEXT NULL,
  og_image_width INT NULL,
  og_image_height INT NULL,
  twitter_title TEXT NULL,
  twitter_description TEXT NULL,
  twitter_image TEXT NULL,
  twitter_image_alt TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY seo_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS redirects (
  id CHAR(36) NOT NULL PRIMARY KEY,
  from_path VARCHAR(300) NOT NULL UNIQUE,
  to_path VARCHAR(500) NOT NULL,
  status_code SMALLINT NOT NULL DEFAULT 301,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inquiries (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(200) NOT NULL,
  phone VARCHAR(40) NULL,
  country VARCHAR(120) NULL,
  tour_slug VARCHAR(120) NULL,
  destination VARCHAR(120) NULL,
  start_date DATE NULL,
  travelers INT NULL,
  budget VARCHAR(50) NULL,
  message TEXT NOT NULL,
  status ENUM('new', 'read', 'handled') NOT NULL DEFAULT 'new',
  admin_note TEXT NULL,
  handled_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX inquiries_status_created (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id CHAR(36) NOT NULL PRIMARY KEY,
  email VARCHAR(200) NOT NULL UNIQUE,
  source VARCHAR(60) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
