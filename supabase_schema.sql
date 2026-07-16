-- ============================================================
-- MitraDrive: Schema Lengkap
-- Jalankan SQL ini di Supabase SQL Editor
-- ============================================================

-- 1. Buat Tabel Peminjaman Mobil
CREATE TABLE IF NOT EXISTS peminjaman_mobil (
  id             UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID    REFERENCES auth.users(id) ON DELETE SET NULL,
  peminjam_nama  TEXT    NOT NULL,
  kendaraan_nama TEXT    NOT NULL,
  kendaraan_plat TEXT    NOT NULL,
  tanggal        TEXT    NOT NULL,
  jam_mulai      TEXT    NOT NULL,
  jam_selesai    TEXT    NOT NULL,
  tujuan         TEXT    NOT NULL,
  keperluan      TEXT    NOT NULL,
  leader_nama    TEXT    NOT NULL,
  leader_email   TEXT    NOT NULL,
  status         TEXT    DEFAULT 'menunggu',  -- menunggu | menunggu_leader | menunggu_admin | disetujui | ditolak | selesai
  catatan_leader TEXT,
  sisa_bensin    TEXT,
  sisa_etol      TEXT,
  kondisi_mobil  TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Jika tabel sudah ada sebelumnya, jalankan ALTER berikut:
-- ALTER TABLE peminjaman_mobil ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
-- ALTER TABLE peminjaman_mobil ADD COLUMN IF NOT EXISTS sisa_bensin TEXT;
-- ALTER TABLE peminjaman_mobil ADD COLUMN IF NOT EXISTS sisa_etol TEXT;
-- ALTER TABLE peminjaman_mobil ADD COLUMN IF NOT EXISTS kondisi_mobil TEXT;

-- ============================================================
-- 2. Enable Row Level Security (RLS)
-- ============================================================
ALTER TABLE peminjaman_mobil ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. Hapus policy lama (agar tidak konflik)
-- ============================================================
DROP POLICY IF EXISTS "Siapapun bisa mengajukan"          ON peminjaman_mobil;
DROP POLICY IF EXISTS "User lihat riwayat sendiri"        ON peminjaman_mobil;
DROP POLICY IF EXISTS "Leader bisa lihat pengajuan"       ON peminjaman_mobil;
DROP POLICY IF EXISTS "Leader bisa update status"         ON peminjaman_mobil;
DROP POLICY IF EXISTS "Allow all select"                  ON peminjaman_mobil;

-- ============================================================
-- 4. Policy: INSERT — siapa saja (user login) bisa mengajukan
-- ============================================================
CREATE POLICY "Siapapun bisa mengajukan"
  ON peminjaman_mobil
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- 5. Policy: SELECT — user hanya bisa melihat data miliknya sendiri
--    ATAU jika dia adalah leader (semua data terlihat)
-- ============================================================
CREATE POLICY "User dan Leader bisa baca"
  ON peminjaman_mobil
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    (auth.jwt() ->> 'role') = 'authenticated'
  );

-- ============================================================
-- 6. Policy: UPDATE — siapa saja yang authenticated bisa update
--    (leader update status, user tidak perlu update)
-- ============================================================
CREATE POLICY "Leader bisa update status"
  ON peminjaman_mobil
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- DAFTAR AKUN LEADER (Wakasek & HOD)
-- Buat akun via tombol "Inisialisasi Akun Leader" di login.html
-- Format Password: MI2100[namapertama]
-- ============================================================

-- Wakasek:
-- elis.rika@mitradrive.id         | MI2100elis
-- abdul.munir@mitradrive.id       | MI2100munir
-- hidayat.atori@mitradrive.id     | MI2100hidayat
-- nuryana.fitriyani@mitradrive.id | MI2100nuryana
-- aprilia.rahayu@mitradrive.id    | MI2100aprilia

-- HOD:
-- ryo.maytana@mitradrive.id       | MI2100ryo
-- okxy.ixganda@mitradrive.id      | MI2100okxy
-- astri.afmi@mitradrive.id        | MI2100astri
-- eldha.luvyzha@mitradrive.id     | MI2100eldha
-- kiki.widhia@mitradrive.id       | MI2100kiki
-- refty.royan@mitradrive.id       | MI2100refty
-- abdillah.putra@mitradrive.id    | MI2100abdillah
-- heru.triatmo@mitradrive.id      | MI2100heru
