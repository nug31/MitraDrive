-- ============================================================
-- MitraDrive: FIX RLS - Admin bisa baca & approve semua data
-- Jalankan SQL ini di Supabase SQL Editor
-- ============================================================

-- Hapus SEMUA policy lama yang ada
DROP POLICY IF EXISTS "Siapapun bisa mengajukan"     ON peminjaman_mobil;
DROP POLICY IF EXISTS "User lihat riwayat sendiri"   ON peminjaman_mobil;
DROP POLICY IF EXISTS "Leader bisa lihat pengajuan"  ON peminjaman_mobil;
DROP POLICY IF EXISTS "Leader bisa update status"    ON peminjaman_mobil;
DROP POLICY IF EXISTS "Allow all select"             ON peminjaman_mobil;
DROP POLICY IF EXISTS "User dan Leader bisa baca"    ON peminjaman_mobil;
DROP POLICY IF EXISTS "Admin bisa baca semua"        ON peminjaman_mobil;
DROP POLICY IF EXISTS "Admin bisa update semua"      ON peminjaman_mobil;
DROP POLICY IF EXISTS "Admin bisa hapus data"        ON peminjaman_mobil;

-- ============================================================
-- 1. INSERT — siapa saja yang login bisa mengajukan
-- ============================================================
CREATE POLICY "insert_authenticated"
  ON peminjaman_mobil
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- 2. SELECT — semua user login bisa melihat semua data
--    (admin & leader butuh lihat semua pengajuan)
-- ============================================================
CREATE POLICY "select_all_authenticated"
  ON peminjaman_mobil
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- 3. UPDATE — semua user login bisa update
--    (leader update status pengajuan mereka, admin update semua)
-- ============================================================
CREATE POLICY "update_all_authenticated"
  ON peminjaman_mobil
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- 4. DELETE — hanya admin yang bisa hapus data
-- ============================================================
CREATE POLICY "delete_admin_only"
  ON peminjaman_mobil
  FOR DELETE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- ============================================================
-- Verifikasi: cek semua policy yang aktif
-- ============================================================
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'peminjaman_mobil';
