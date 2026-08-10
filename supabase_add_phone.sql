-- ============================================================
-- MitraDrive: Tambah Kolom Phone untuk Notifikasi WhatsApp
-- Jalankan SQL ini di Supabase SQL Editor
-- ============================================================

-- 1. Tambah kolom phone ke tabel profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- ============================================================
-- 2. Update nomor HP setiap Leader & Approver
--    Ganti '628xxxxxxxxxx' dengan nomor WA sebenarnya (format internasional, tanpa +)
-- ============================================================

-- Koordinator TEFA (Aprilia Rahayu) — selalu dapat notif
UPDATE public.profiles SET phone = '628xxxxxxxxxx'
WHERE email = 'aprilia.rahayu@mitradrive.id';

-- Wakasek Leaders
UPDATE public.profiles SET phone = '628xxxxxxxxxx'
WHERE email = 'elis.rika@mitradrive.id';

UPDATE public.profiles SET phone = '628xxxxxxxxxx'
WHERE email = 'abdul.munir@mitradrive.id';

UPDATE public.profiles SET phone = '628xxxxxxxxxx'
WHERE email = 'puspita.sari@mitradrive.id';

UPDATE public.profiles SET phone = '628xxxxxxxxxx'
WHERE email = 'nuryana.fitriyani@mitradrive.id';

-- HOD Leaders
UPDATE public.profiles SET phone = '628xxxxxxxxxx'
WHERE email = 'ryo.maytana@mitradrive.id';

UPDATE public.profiles SET phone = '628xxxxxxxxxx'
WHERE email = 'okxy.ixganda@mitradrive.id';

UPDATE public.profiles SET phone = '628xxxxxxxxxx'
WHERE email = 'astri.afmi@mitradrive.id';

UPDATE public.profiles SET phone = '628xxxxxxxxxx'
WHERE email = 'eldha.luvyzha@mitradrive.id';

UPDATE public.profiles SET phone = '628xxxxxxxxxx'
WHERE email = 'kiki.widhia@mitradrive.id';

UPDATE public.profiles SET phone = '628xxxxxxxxxx'
WHERE email = 'refty.royan@mitradrive.id';

UPDATE public.profiles SET phone = '628xxxxxxxxxx'
WHERE email = 'abdillah.putra@mitradrive.id';

UPDATE public.profiles SET phone = '628xxxxxxxxxx'
WHERE email = 'heru.triatmo@mitradrive.id';

-- ============================================================
-- 3. Verifikasi - cek phone yang sudah diisi
-- ============================================================
SELECT email, full_name, role, phone
FROM public.profiles
WHERE role IN ('leader', 'koordinator_tefa')
ORDER BY role, full_name;
