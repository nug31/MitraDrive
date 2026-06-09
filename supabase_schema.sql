-- ============================================================
-- MitraDrive: Schema Tambahan
-- Jalankan SQL ini di Supabase SQL Editor
-- ============================================================

-- 1. Tabel Peminjaman Mobil
CREATE TABLE IF NOT EXISTS peminjaman_mobil (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,                     -- Hubungan ke auth.users
  peminjam_nama TEXT NOT NULL,
  kendaraan_nama TEXT NOT NULL,
  kendaraan_plat TEXT NOT NULL,
  tanggal TEXT NOT NULL,
  jam_mulai TEXT NOT NULL,
  jam_selesai TEXT NOT NULL,
  tujuan TEXT NOT NULL,
  keperluan TEXT NOT NULL,
  leader_nama TEXT NOT NULL,
  leader_email TEXT NOT NULL,
  status TEXT DEFAULT 'menunggu',   -- menunggu | disetujui | ditolak
  catatan_leader TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jalankan ini jika tabel sudah pernah dibuat sebelumnya:
-- ALTER TABLE peminjaman_mobil ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 2. Enable RLS
ALTER TABLE peminjaman_mobil ENABLE ROW LEVEL SECURITY;

-- 3. Policy: siapa saja bisa insert (pengajuan baru)
DROP POLICY IF EXISTS "Siapapun bisa mengajukan" ON peminjaman_mobil;
CREATE POLICY "Siapapun bisa mengajukan"
ON peminjaman_mobil FOR INSERT WITH CHECK (true);

-- 4. Policy: leader bisa melihat & update pengajuan yang ditujukan ke mereka
DROP POLICY IF EXISTS "Leader bisa lihat pengajuan" ON peminjaman_mobil;
CREATE POLICY "Leader bisa lihat pengajuan"
ON peminjaman_mobil FOR SELECT USING (true);

DROP POLICY IF EXISTS "Leader bisa update status" ON peminjaman_mobil;
CREATE POLICY "Leader bisa update status"
ON peminjaman_mobil FOR UPDATE USING (true);

-- ============================================================
-- AKUN LEADER (Wakasek & HOD)
-- Jalankan blok INSERT ini SETELAH akun dibuat via Auth
-- ============================================================
-- Format Email  : namapertama.namabelakang@mitradrive.id
-- Format Password: MI2100[namapertama]
-- Contoh: Elis Rika → email: elis.rika@mitradrive.id | pw: MI2100elis

-- Wakasek
-- elis.rika@mitradrive.id        | MI2100elis
-- abdul.munir@mitradrive.id      | MI2100munir
-- hidayat.atori@mitradrive.id    | MI2100hidayat
-- nuryana.fitriyani@mitradrive.id| MI2100nuryana
-- aprilia.rahayu@mitradrive.id   | MI2100aprilia

-- HOD
-- ryo.maytana@mitradrive.id      | MI2100ryo
-- okxy.ixganda@mitradrive.id     | MI2100okxy
-- astri.afmi@mitradrive.id       | MI2100astri
-- eldha.luvyzha@mitradrive.id    | MI2100eldha
-- kiki.widhia@mitradrive.id      | MI2100kiki
-- refty.royan@mitradrive.id      | MI2100refty
-- abdillah.putra@mitradrive.id   | MI2100abdillah
-- heru.triatmo@mitradrive.id     | MI2100heru
