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
-- CATATAN: Buat akun admin via tombol di login.html
-- atau signup manual dengan kredensial berikut:
--
-- Email    : admin@mitradrive.id
-- Password : MitraAdmin2100
-- Role     : admin (set otomatis lewat tombol inisialisasi)
-- ============================================================
