-- ============================================================
-- MitraDrive: Reset status lama ke alur approval baru
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- Data lama yang masih 'menunggu_leader' atau 'menunggu_admin' 
-- berarti belum melewati PIC dan Checker.
-- Reset semua booking pending lama ke 'menunggu_pic' supaya
-- harus melalui alur yang benar dari awal.

UPDATE public.peminjaman_mobil
SET status = 'menunggu_pic'
WHERE status IN ('menunggu', 'menunggu_leader', 'menunggu_admin', 'menunggu_checker')
  AND (
    -- hanya booking yang belum final
    status NOT IN ('disetujui', 'ditolak', 'selesai')
  );

-- Verifikasi hasil update
SELECT id, peminjam_nama, kendaraan_nama, status, created_at
FROM public.peminjaman_mobil
ORDER BY created_at DESC
LIMIT 20;
