-- Infinite Yatra — fresh production schema (MariaDB 10.6+ / 13.x).
--
-- FRESH LAUNCH. No historical customer data is migrated: users, bookings,
-- travellers, payments and documents all start empty. Only business catalogue
-- data is imported.
--
-- MONEY: every monetary column is a BIGINT of MINOR UNITS (paise for INR).
-- There is no FLOAT or DECIMAL anywhere in this file for money. A rupee value
-- never exists in the database; conversion happens once, at the presentation
-- edge. `currency` and `minor_units_per_major` travel with each amount so a
-- stored figure can always be interpreted without external assumption.
--
-- SOFT DELETE: `deleted_at` on catalogue and content rows, which admins edit
-- and may need to restore. Bookings are NEVER hard-deleted and never soft-
-- deleted either: they are financial records and move by status only.

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ---------------------------------------------------------------------------
-- Customers
-- ---------------------------------------------------------------------------

CREATE TABLE users (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id         CHAR(26)        NOT NULL,           -- exposed instead of the PK
  email             VARCHAR(254)    NOT NULL,
  email_normalised  VARCHAR(254)    NOT NULL,           -- lowercased; uniqueness is on this
  email_verified_at DATETIME(3)     NULL,
  password_hash     VARCHAR(255)    NOT NULL,           -- argon2id
  full_name         VARCHAR(160)    NULL,
  phone             VARCHAR(32)     NULL,
  status            ENUM('active','suspended','closed') NOT NULL DEFAULT 'active',
  failed_logins     INT UNSIGNED    NOT NULL DEFAULT 0,
  locked_until      DATETIME(3)     NULL,
  last_login_at     DATETIME(3)     NULL,
  created_at        DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at        DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_public_id (public_id),
  UNIQUE KEY uq_users_email_normalised (email_normalised),
  KEY idx_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sessions live server-side so logout and "sign out everywhere" are real, and
-- so a stolen cookie can be revoked. The cookie carries only an opaque token;
-- only its hash is stored, so a database leak does not yield usable sessions.
CREATE TABLE user_sessions (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      BIGINT UNSIGNED NOT NULL,
  token_hash   CHAR(64)        NOT NULL,               -- sha256 of the cookie value
  user_agent   VARCHAR(255)    NULL,
  ip_hash      CHAR(64)        NULL,                   -- hashed, never the raw address
  expires_at   DATETIME(3)     NOT NULL,
  revoked_at   DATETIME(3)     NULL,
  created_at   DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  last_seen_at DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_sessions_token_hash (token_hash),
  KEY idx_sessions_user (user_id),
  KEY idx_sessions_expiry (expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One table for password reset and email verification. Single-use: `used_at`
-- is set inside the same transaction that consumes it.
CREATE TABLE user_tokens (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,
  purpose    ENUM('password_reset','email_verify') NOT NULL,
  token_hash CHAR(64)        NOT NULL,
  expires_at DATETIME(3)     NOT NULL,
  used_at    DATETIME(3)     NULL,
  created_at DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_tokens_hash (token_hash),
  KEY idx_user_tokens_user_purpose (user_id, purpose),
  CONSTRAINT fk_user_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Staff
-- ---------------------------------------------------------------------------

-- Staff are a separate table from customers on purpose. A customer row can
-- never acquire a staff role by having a column flipped, and the canonical
-- roles are an ENUM so an unrecognised value cannot be stored at all — the
-- failure SA-1 existed to fix (a claim of "operations" that no rule knew).
CREATE TABLE staff_users (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id     CHAR(26)        NOT NULL,
  email         VARCHAR(254)    NOT NULL,
  email_normalised VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255)    NOT NULL,
  full_name     VARCHAR(160)    NULL,
  role          ENUM('admin','booking_manager','tour_manager','hotel_manager','finance_manager','content_manager') NOT NULL,
  status        ENUM('active','suspended') NOT NULL DEFAULT 'active',
  failed_logins INT UNSIGNED    NOT NULL DEFAULT 0,
  locked_until  DATETIME(3)     NULL,
  last_login_at DATETIME(3)     NULL,
  created_at    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_staff_public_id (public_id),
  UNIQUE KEY uq_staff_email_normalised (email_normalised),
  KEY idx_staff_role_status (role, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE staff_sessions (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  staff_id     BIGINT UNSIGNED NOT NULL,
  token_hash   CHAR(64)        NOT NULL,
  user_agent   VARCHAR(255)    NULL,
  ip_hash      CHAR(64)        NULL,
  expires_at   DATETIME(3)     NOT NULL,
  revoked_at   DATETIME(3)     NULL,
  created_at   DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  last_seen_at DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_staff_sessions_token_hash (token_hash),
  KEY idx_staff_sessions_staff (staff_id),
  CONSTRAINT fk_staff_sessions_staff FOREIGN KEY (staff_id) REFERENCES staff_users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------

CREATE TABLE packages (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug           VARCHAR(160)    NOT NULL,
  legacy_id      VARCHAR(128)    NULL,   -- the imported Firestore doc id, for traceability
  title          VARCHAR(200)    NOT NULL,
  location       VARCHAR(160)    NULL,
  duration       VARCHAR(80)     NULL,
  description    MEDIUMTEXT      NULL,
  -- Authoritative list price. The client never supplies a price.
  base_price_minor BIGINT UNSIGNED NOT NULL,
  currency       CHAR(3)         NOT NULL DEFAULT 'INR',
  minor_units_per_major SMALLINT UNSIGNED NOT NULL DEFAULT 100,
  min_travellers SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  max_group_size SMALLINT UNSIGNED NULL,
  hero_image_url VARCHAR(512)    NULL,
  images_json    JSON            NULL,
  inclusions_json JSON           NULL,
  exclusions_json JSON           NULL,
  cancellation_policy_json JSON  NULL,
  itinerary_json JSON            NULL,
  is_visible     TINYINT(1)      NOT NULL DEFAULT 1,
  created_at     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at     DATETIME(3)     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_packages_slug (slug),
  UNIQUE KEY uq_packages_legacy_id (legacy_id),
  KEY idx_packages_visible (is_visible, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Per-pickup-point pricing. PB-1 selected a pickup location by INDEX; an index
-- is not an identity, so each option gets a real id and bookings reference that.
CREATE TABLE package_pickup_options (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  package_id  BIGINT UNSIGNED NOT NULL,
  label       VARCHAR(160)    NOT NULL,
  price_minor BIGINT UNSIGNED NOT NULL,
  sort_order  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_pickup_package_label (package_id, label),
  KEY idx_pickup_package (package_id, sort_order),
  CONSTRAINT fk_pickup_package FOREIGN KEY (package_id) REFERENCES packages (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE hotels (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug         VARCHAR(160)    NOT NULL,
  legacy_id    VARCHAR(128)    NULL,
  name         VARCHAR(200)    NOT NULL,
  location     VARCHAR(160)    NULL,
  description  MEDIUMTEXT      NULL,
  star_rating  TINYINT UNSIGNED NULL,
  base_price_minor BIGINT UNSIGNED NULL,
  currency     CHAR(3)         NOT NULL DEFAULT 'INR',
  minor_units_per_major SMALLINT UNSIGNED NOT NULL DEFAULT 100,
  hero_image_url VARCHAR(512)  NULL,
  images_json  JSON            NULL,
  amenities_json JSON          NULL,
  is_visible   TINYINT(1)      NOT NULL DEFAULT 1,
  created_at   DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at   DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at   DATETIME(3)     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_hotels_slug (slug),
  UNIQUE KEY uq_hotels_legacy_id (legacy_id),
  KEY idx_hotels_visible (is_visible, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE content_pages (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug       VARCHAR(160)    NOT NULL,
  legacy_id  VARCHAR(128)    NULL,
  kind       ENUM('story','page','homepage_block') NOT NULL DEFAULT 'page',
  title      VARCHAR(200)    NOT NULL,
  body       MEDIUMTEXT      NULL,
  images_json JSON           NULL,
  is_published TINYINT(1)    NOT NULL DEFAULT 1,
  created_at DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3)     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_content_slug (slug),
  UNIQUE KEY uq_content_legacy_id (legacy_id),
  KEY idx_content_kind (kind, is_published, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
