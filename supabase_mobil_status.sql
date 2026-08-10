-- ============================================================
-- MitraDrive: Tabel Status Mobil (Manajemen Kendaraan)
-- Jalankan SQL ini di Supabase SQL Editor
-- ============================================================

-- 1. Buat Tabel mobil_status
CREATE TABLE IF NOT EXISTS mobil_status (
    id SERIAL PRIMARY KEY,
    nama TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'Tersedia', -- 'Tersedia' atau 'Perbaikan'
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insert data mobil awal (berdasarkan mockCars di frontend)
INSERT INTO mobil_status (id, nama, status) VALUES
(1, 'Hyundai H1', 'Tersedia'),
(2, 'Toyota Fortuner', 'Tersedia'),
(3, 'Isuzu Elf 24', 'Tersedia'),
(4, 'Honda CRV', 'Tersedia'),
(5, 'Omoda 5', 'Tersedia'),
(6, 'Ambulance', 'Tersedia')
ON CONFLICT (nama) DO NOTHING;

-- 3. Enable RLS (Row Level Security)
ALTER TABLE mobil_status ENABLE ROW LEVEL SECURITY;

-- 4. Policy: Semua orang (bahkan anon) bisa membaca status mobil
DROP POLICY IF EXISTS "Siapapun bisa baca status mobil" ON mobil_status;
CREATE POLICY "Siapapun bisa baca status mobil"
    ON mobil_status
    FOR SELECT
    USING (true);

-- 5. Policy: Hanya role 'admin' yang bisa update status mobil
DROP POLICY IF EXISTS "Hanya admin bisa update status mobil" ON mobil_status;
CREATE POLICY "Hanya admin bisa update status mobil"
    ON mobil_status
    FOR UPDATE
    USING (
        (auth.jwt() ->> 'role') = 'admin' 
        OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );
