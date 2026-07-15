-- ============================================================
-- MitraDrive: Setup Akun Admin
-- Jalankan SQL ini di Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. Buat kolom is_admin di tabel profiles (jika belum ada)
--    atau gunakan metadata saja (lebih simpel)
-- ============================================================

-- Pastikan user_id column ada di peminjaman_mobil
ALTER TABLE peminjaman_mobil
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ============================================================
-- 2. RLS Policy untuk Admin: bisa SELECT semua data
-- ============================================================
DROP POLICY IF EXISTS "Admin bisa baca semua" ON peminjaman_mobil;
CREATE POLICY "Admin bisa baca semua"
  ON peminjaman_mobil
  FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR auth.uid() = user_id
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'leader'
  );

-- ============================================================
-- 3. RLS Policy untuk Admin: bisa UPDATE semua data
-- ============================================================
DROP POLICY IF EXISTS "Admin bisa update semua" ON peminjaman_mobil;
CREATE POLICY "Admin bisa update semua"
  ON peminjaman_mobil
  FOR UPDATE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR auth.uid() IS NOT NULL
  );

-- ============================================================
-- 4. RLS Policy untuk Admin: bisa DELETE data
-- ============================================================
DROP POLICY IF EXISTS "Admin bisa hapus data" ON peminjaman_mobil;
CREATE POLICY "Admin bisa hapus data"
  ON peminjaman_mobil
  FOR DELETE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- ============================================================
-- 5. Buat Akun Admin Langsung via SQL
-- ============================================================
-- Pastikan pgcrypto aktif (biasanya sudah default di Supabase)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  admin_uid uuid;
BEGIN
  -- Cek apakah admin sudah ada
  SELECT id INTO admin_uid FROM auth.users WHERE email = 'admin@mitradrive.id';
  
  IF admin_uid IS NULL THEN
    -- Jika belum ada, buat baru
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@mitradrive.id',
      crypt('MitraAdmin2100', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"admin", "nama":"Administrator"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  ELSE
    -- Jika sudah ada, perbarui password dan role
    UPDATE auth.users SET 
      encrypted_password = crypt('MitraAdmin2100', gen_salt('bf')),
      raw_user_meta_data = '{"role":"admin", "nama":"Administrator"}'
    WHERE id = admin_uid;
  END IF;
END $$;

-- ============================================================
-- CATATAN: 
-- Akun admin otomatis terbuat setelah script ini dijalankan.
--
-- Email    : admin@mitradrive.id
-- Password : MitraAdmin2100
-- Role     : admin 
-- ============================================================
