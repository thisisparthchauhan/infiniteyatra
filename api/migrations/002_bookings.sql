-- Booking engine — the PB-1..PB-4 model on MariaDB.
--
-- Every integrity property PB-1 got from a Firestore transaction is preserved
-- here by a constraint rather than by application care:
--
--   unique booking reference   -> UNIQUE KEY on bookings.reference
--   idempotent create          -> UNIQUE KEY on (user_id, idempotency_key)
--   stable traveller identity  -> booking_travellers.public_id, never an index
--   one summary number per year-> UNIQUE KEY on (issued_year, sequence)
--   server-authoritative price -> pricing columns written only by the API
--
-- A constraint cannot be forgotten under load the way a code path can.

SET NAMES utf8mb4;

CREATE TABLE bookings (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id          CHAR(26)        NOT NULL,
  reference          VARCHAR(32)     NOT NULL,          -- IY-BKG-YYYY-XXXXXX
  user_id            BIGINT UNSIGNED NOT NULL,          -- ownership; never an email
  package_id         BIGINT UNSIGNED NOT NULL,
  pickup_option_id   BIGINT UNSIGNED NULL,

  -- Immutable snapshot of what was sold, so a later catalogue edit can never
  -- retroactively change a customer's booking.
  package_snapshot_json JSON         NOT NULL,

  departure_date     DATE            NOT NULL,
  traveller_count    SMALLINT UNSIGNED NOT NULL,
  special_requests   TEXT            NULL,

  -- Money, all minor units, all server-derived.
  currency               CHAR(3)     NOT NULL DEFAULT 'INR',
  minor_units_per_major  SMALLINT UNSIGNED NOT NULL DEFAULT 100,
  unit_price_minor       BIGINT UNSIGNED NOT NULL,
  tour_amount_minor      BIGINT UNSIGNED NOT NULL,
  hotel_amount_minor     BIGINT UNSIGNED NOT NULL DEFAULT 0,
  hotel_discount_minor   BIGINT UNSIGNED NOT NULL DEFAULT 0,
  gross_amount_minor     BIGINT UNSIGNED NOT NULL,
  -- Settlement is only ever moved by a recorded payment, never inferred from a
  -- status label. This is the P0-05 / legacy lesson written into the schema.
  amount_received_minor  BIGINT UNSIGNED NOT NULL DEFAULT 0,

  booking_status  ENUM('pending','confirmed','cancelled','completed') NOT NULL DEFAULT 'pending',
  payment_status  ENUM('unpaid','part_paid','paid','refunded') NOT NULL DEFAULT 'unpaid',
  document_status ENUM('not_started','uploaded','under_review','approved','rejected') NOT NULL DEFAULT 'not_started',

  hotel_id        BIGINT UNSIGNED NULL,
  source          VARCHAR(32)     NOT NULL DEFAULT 'web',
  idempotency_key VARCHAR(80)     NOT NULL,

  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),
  UNIQUE KEY uq_bookings_public_id (public_id),
  UNIQUE KEY uq_bookings_reference (reference),
  -- The idempotency guarantee. A double-clicked submit or a retried request
  -- collides here and returns the existing booking instead of creating a second.
  UNIQUE KEY uq_bookings_idempotency (user_id, idempotency_key),
  KEY idx_bookings_user_created (user_id, created_at),
  KEY idx_bookings_status (booking_status, created_at),
  KEY idx_bookings_package (package_id),
  CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_bookings_package FOREIGN KEY (package_id) REFERENCES packages (id),
  CONSTRAINT fk_bookings_hotel FOREIGN KEY (hotel_id) REFERENCES hotels (id),
  CONSTRAINT fk_bookings_pickup FOREIGN KEY (pickup_option_id) REFERENCES package_pickup_options (id),
  -- Arithmetic that must hold for every row, enforced by the engine.
  CONSTRAINT ck_bookings_gross CHECK (gross_amount_minor = tour_amount_minor + hotel_amount_minor - hotel_discount_minor),
  CONSTRAINT ck_bookings_received CHECK (amount_received_minor <= gross_amount_minor),
  CONSTRAINT ck_bookings_travellers CHECK (traveller_count >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contact details as given at booking time. Deliberately separate from the
-- customer account: the person booking may not be the account holder, and the
-- account's own details must not be rewritten by a booking.
CREATE TABLE booking_contacts (
  booking_id BIGINT UNSIGNED NOT NULL,
  full_name  VARCHAR(160) NOT NULL,
  email      VARCHAR(254) NOT NULL,
  phone      VARCHAR(32)  NOT NULL,
  created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (booking_id),
  CONSTRAINT fk_contacts_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A traveller's identity is public_id. Never the row order, never the array
-- index: reordering or removing one traveller must not reassign another
-- person's documents. This is the reason legacy bookings can never enter the
-- document workflow.
CREATE TABLE booking_travellers (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id   BIGINT UNSIGNED NOT NULL,
  public_id    VARCHAR(32)     NOT NULL,        -- tr_<hex>
  position     SMALLINT UNSIGNED NOT NULL,      -- display order ONLY
  first_name   VARCHAR(80)     NOT NULL,
  middle_name  VARCHAR(80)     NULL,
  last_name    VARCHAR(80)     NOT NULL,
  date_of_birth DATE           NULL,
  gender       VARCHAR(24)     NULL,
  nationality  VARCHAR(80)     NULL,
  created_at   DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_travellers_public_id (public_id),
  UNIQUE KEY uq_travellers_booking_position (booking_id, position),
  KEY idx_travellers_booking (booking_id),
  CONSTRAINT fk_travellers_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- PB-4. `sequence` is allocated per year under a row lock, so two concurrent
-- requests cannot mint the same Summary Number.
CREATE TABLE booking_summaries (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id     BIGINT UNSIGNED NOT NULL,
  public_id      CHAR(26)        NOT NULL,
  summary_number VARCHAR(32)     NOT NULL,      -- IY-BS-YYYY-NNNNNN
  issued_year    SMALLINT UNSIGNED NOT NULL,
  sequence       INT UNSIGNED    NOT NULL,
  version        INT UNSIGNED    NOT NULL DEFAULT 1,
  fingerprint    CHAR(64)        NOT NULL,      -- of the priced booking state
  currency       CHAR(3)         NOT NULL DEFAULT 'INR',
  minor_units_per_major SMALLINT UNSIGNED NOT NULL DEFAULT 100,
  amount_minor   BIGINT UNSIGNED NOT NULL,
  storage_path   VARCHAR(512)    NULL,          -- NULL while PDF storage is gated off
  superseded_by  BIGINT UNSIGNED NULL,
  issued_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_summaries_public_id (public_id),
  UNIQUE KEY uq_summaries_number (summary_number),
  UNIQUE KEY uq_summaries_year_sequence (issued_year, sequence),
  KEY idx_summaries_booking (booking_id, version),
  CONSTRAINT fk_summaries_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE,
  CONSTRAINT fk_summaries_superseded FOREIGN KEY (superseded_by) REFERENCES booking_summaries (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE summary_counters (
  issued_year SMALLINT UNSIGNED NOT NULL,
  next_value  INT UNSIGNED      NOT NULL DEFAULT 1,
  PRIMARY KEY (issued_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- PB-3 metadata only. No file is written anywhere until private storage
-- outside the web root is approved; `storage_path` stays NULL until then.
CREATE TABLE booking_documents (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id    BIGINT UNSIGNED NOT NULL,
  traveller_id  BIGINT UNSIGNED NOT NULL,
  public_id     CHAR(26)        NOT NULL,
  doc_type      ENUM('passport','aadhaar','pan','visa','other') NOT NULL,
  original_name VARCHAR(255)    NOT NULL,
  content_type  VARCHAR(127)    NOT NULL,
  size_bytes    BIGINT UNSIGNED NOT NULL,
  sha256        CHAR(64)        NULL,
  storage_path  VARCHAR(512)    NULL,
  review_status ENUM('uploaded','under_review','approved','rejected') NOT NULL DEFAULT 'uploaded',
  reviewed_by   BIGINT UNSIGNED NULL,
  reviewed_at   DATETIME(3)     NULL,
  review_note   VARCHAR(500)    NULL,
  created_at    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_documents_public_id (public_id),
  KEY idx_documents_booking (booking_id),
  KEY idx_documents_traveller (traveller_id),
  CONSTRAINT fk_documents_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE,
  CONSTRAINT fk_documents_traveller FOREIGN KEY (traveller_id) REFERENCES booking_travellers (id) ON DELETE CASCADE,
  CONSTRAINT fk_documents_reviewer FOREIGN KEY (reviewed_by) REFERENCES staff_users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payments are append-only facts. A booking's amount_received_minor is derived
-- from these rows, never typed in by hand and never guessed from a label.
CREATE TABLE payments (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id     BIGINT UNSIGNED NOT NULL,
  public_id      CHAR(26)        NOT NULL,
  currency       CHAR(3)         NOT NULL DEFAULT 'INR',
  minor_units_per_major SMALLINT UNSIGNED NOT NULL DEFAULT 100,
  amount_minor   BIGINT UNSIGNED NOT NULL,
  direction      ENUM('charge','refund') NOT NULL DEFAULT 'charge',
  method         VARCHAR(40)     NULL,
  status         ENUM('initiated','succeeded','failed','cancelled') NOT NULL DEFAULT 'initiated',
  provider       VARCHAR(40)     NULL,
  provider_ref   VARCHAR(128)    NULL,
  recorded_by    BIGINT UNSIGNED NULL,          -- staff who recorded an offline payment
  created_at     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_payments_public_id (public_id),
  UNIQUE KEY uq_payments_provider_ref (provider, provider_ref),
  KEY idx_payments_booking (booking_id, status),
  CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id) REFERENCES bookings (id),
  CONSTRAINT fk_payments_staff FOREIGN KEY (recorded_by) REFERENCES staff_users (id),
  CONSTRAINT ck_payments_amount CHECK (amount_minor > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE booking_activity (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id  BIGINT UNSIGNED NOT NULL,
  event       VARCHAR(64)     NOT NULL,
  actor_type  ENUM('customer','staff','system') NOT NULL,
  actor_id    BIGINT UNSIGNED NULL,
  detail_json JSON            NULL,
  created_at  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_activity_booking (booking_id, created_at),
  CONSTRAINT fk_activity_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE booking_notes (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id BIGINT UNSIGNED NOT NULL,
  staff_id   BIGINT UNSIGNED NOT NULL,
  body       TEXT            NOT NULL,
  created_at DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3)     NULL,
  PRIMARY KEY (id),
  KEY idx_notes_booking (booking_id, created_at),
  CONSTRAINT fk_notes_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE,
  CONSTRAINT fk_notes_staff FOREIGN KEY (staff_id) REFERENCES staff_users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notifications (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  channel     ENUM('email','whatsapp','sms') NOT NULL,
  recipient   VARCHAR(254)    NOT NULL,
  template    VARCHAR(64)     NOT NULL,
  booking_id  BIGINT UNSIGNED NULL,
  payload_json JSON           NULL,
  status      ENUM('queued','sent','failed') NOT NULL DEFAULT 'queued',
  error_text  VARCHAR(500)    NULL,
  attempts    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  sent_at     DATETIME(3)     NULL,
  PRIMARY KEY (id),
  KEY idx_notifications_status (status, created_at),
  CONSTRAINT fk_notifications_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE booking_references (
  reference  VARCHAR(32) NOT NULL,
  booking_id BIGINT UNSIGNED NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (reference)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
