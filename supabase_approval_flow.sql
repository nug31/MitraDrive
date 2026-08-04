-- ============================================================
-- MitraDrive: Migration - Alur Approval 4 Tahap
-- Jalankan SQL ini di Supabase SQL Editor
-- ============================================================
-- Alur:
--   Peminjam → PIC Peminjaman (Enggar) → Checker (Hanif)
--           → Direct Leader → Koordinator TEFA (Aprilia) → Disetujui
-- ============================================================

-- 1. Tambahkan kolom approval per tahap
ALTER TABLE peminjaman_mobil ADD COLUMN IF NOT EXISTS status_pic         TEXT DEFAULT 'pending';
ALTER TABLE peminjaman_mobil ADD COLUMN IF NOT EXISTS status_checker      TEXT DEFAULT 'pending';
ALTER TABLE peminjaman_mobil ADD COLUMN IF NOT EXISTS status_koordinator  TEXT DEFAULT 'pending';
ALTER TABLE peminjaman_mobil ADD COLUMN IF NOT EXISTS catatan_pic         TEXT;
ALTER TABLE peminjaman_mobil ADD COLUMN IF NOT EXISTS catatan_checker     TEXT;
ALTER TABLE peminjaman_mobil ADD COLUMN IF NOT EXISTS catatan_koordinator TEXT;
ALTER TABLE peminjaman_mobil ADD COLUMN IF NOT EXISTS pic_approved_at     TIMESTAMPTZ;
ALTER TABLE peminjaman_mobil ADD COLUMN IF NOT EXISTS checker_approved_at TIMESTAMPTZ;
ALTER TABLE peminjaman_mobil ADD COLUMN IF NOT EXISTS leader_approved_at  TIMESTAMPTZ;
ALTER TABLE peminjaman_mobil ADD COLUMN IF NOT EXISTS koordinator_approved_at TIMESTAMPTZ;

-- ============================================================
-- 2. Update status awal — pengajuan baru masuk ke menunggu_pic
-- (Tidak perlu ALTER TYPE karena status adalah TEXT)
-- Status yang valid sekarang:
--   menunggu_pic       → Menunggu PIC Peminjaman (Enggar Fata)
--   menunggu_checker   → Menunggu Checker (Hanif)
--   menunggu_leader    → Menunggu Direct Leader
--   menunggu_koordinator → Menunggu Koordinator TEFA (Aprilia)
--   disetujui          → Disetujui (final, oleh Koordinator TEFA)
--   ditolak            → Ditolak
--   selesai            → Selesai
-- ============================================================

-- ============================================================
-- 3. Buat akun PIC Peminjaman (Enggar Fata) dan Checker (Hanif)
-- ============================================================

-- Akun Enggar Fata (PIC Peminjaman)
DO $$
DECLARE
  pic_uid UUID;
BEGIN
  SELECT id INTO pic_uid FROM auth.users WHERE email = 'enggar.fata@mitradrive.id';

  IF pic_uid IS NULL THEN
    pic_uid := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      aud, role, confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      pic_uid,
      '00000000-0000-0000-0000-000000000000',
      'enggar.fata@mitradrive.id',
      crypt('MI2100enggar', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"pic_peminjaman","full_name":"Enggar Fata","nama":"Enggar Fata"}',
      NOW(), NOW(), 'authenticated', 'authenticated',
      '', '', '', ''
    );
  ELSE
    UPDATE auth.users SET
      encrypted_password = crypt('MI2100enggar', gen_salt('bf')),
      raw_user_meta_data = '{"role":"pic_peminjaman","full_name":"Enggar Fata","nama":"Enggar Fata"}'
    WHERE id = pic_uid;
  END IF;
END $$;

-- Akun Hanif (PIC Checker)
DO $$
DECLARE
  checker_uid UUID;
BEGIN
  SELECT id INTO checker_uid FROM auth.users WHERE email = 'hanif@mitradrive.id';

  IF checker_uid IS NULL THEN
    checker_uid := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      aud, role, confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      checker_uid,
      '00000000-0000-0000-0000-000000000000',
      'hanif@mitradrive.id',
      crypt('MI2100hanif', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"checker","full_name":"Hanif","nama":"Hanif"}',
      NOW(), NOW(), 'authenticated', 'authenticated',
      '', '', '', ''
    );
  ELSE
    UPDATE auth.users SET
      encrypted_password = crypt('MI2100hanif', gen_salt('bf')),
      raw_user_meta_data = '{"role":"checker","full_name":"Hanif","nama":"Hanif"}'
    WHERE id = checker_uid;
  END IF;
END $$;

-- ============================================================
-- 4. Update role Aprilia Rahayu menjadi koordinator_tefa
-- ============================================================
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'),
    '{role}',
    '"koordinator_tefa"'
)
WHERE email = 'aprilia.rahayu@mitradrive.id';

-- ============================================================
-- RINGKASAN AKUN:
--
-- PIC Peminjaman:
-- Email    : enggar.fata@mitradrive.id
-- Password : MI2100enggar
-- Role     : pic_peminjaman
--
-- PIC Checker:
-- Email    : hanif@mitradrive.id
-- Password : MI2100hanif
-- Role     : checker
--
-- Koordinator TEFA:
-- Email    : aprilia.rahayu@mitradrive.id
-- Password : MI2100aprilia
-- Role     : koordinator_tefa (diupdate dari leader)
-- ============================================================
