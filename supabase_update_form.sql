-- ============================================================
-- MitraDrive: Migration - Form Peminjaman & Pengecekan Bensin Operasional
-- Jalankan SQL ini di Supabase SQL Editor untuk menambahkan kolom baru
-- ============================================================

ALTER TABLE peminjaman_mobil ADD COLUMN IF NOT EXISTS km_awal TEXT;
ALTER TABLE peminjaman_mobil ADD COLUMN IF NOT EXISTS km_akhir TEXT;
ALTER TABLE peminjaman_mobil ADD COLUMN IF NOT EXISTS bensin_awal TEXT;
ALTER TABLE peminjaman_mobil ADD COLUMN IF NOT EXISTS bensin_akhir TEXT;
ALTER TABLE peminjaman_mobil ADD COLUMN IF NOT EXISTS driver_nama TEXT;
ALTER TABLE peminjaman_mobil ADD COLUMN IF NOT EXISTS penumpang TEXT;
ALTER TABLE peminjaman_mobil ADD COLUMN IF NOT EXISTS request_etoll TEXT;
ALTER TABLE peminjaman_mobil ADD COLUMN IF NOT EXISTS saldo_etoll_awal TEXT;
ALTER TABLE peminjaman_mobil ADD COLUMN IF NOT EXISTS saldo_etoll_akhir TEXT;
ALTER TABLE peminjaman_mobil ADD COLUMN IF NOT EXISTS catatan_abnormaliti TEXT;
