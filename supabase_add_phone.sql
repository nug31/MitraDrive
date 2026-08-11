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
UPDATE public.profiles SET phone = '6281932580977'
WHERE email = 'aprilia.rahayu@mitradrive.id';

-- Wakasek Leaders
UPDATE public.profiles SET phone = '6281290244416'
WHERE email = 'elis.rika@mitradrive.id';

UPDATE public.profiles SET phone = '6285220907987'
WHERE email = 'abdul.munir@mitradrive.id';

UPDATE public.profiles SET phone = '6287837155685'
WHERE email = 'puspita.sari@mitradrive.id';

UPDATE public.profiles SET phone = '6282112847033'
WHERE email = 'nuryana.fitriyani@mitradrive.id';

-- HOD Leaders
UPDATE public.profiles SET phone = '628988816828'
WHERE email = 'ryo.maytana@mitradrive.id';

UPDATE public.profiles SET phone = '6282295444559'
WHERE email = 'okxy.ixganda@mitradrive.id';

UPDATE public.profiles SET phone = '6282218005572'
WHERE email = 'astri.afmi@mitradrive.id';

UPDATE public.profiles SET phone = '6281297083722'
WHERE email = 'eldha.luvyzha@mitradrive.id';

UPDATE public.profiles SET phone = '6285319953225'
WHERE email = 'kiki.widhia@mitradrive.id';

UPDATE public.profiles SET phone = '6281291506911'
WHERE email = 'refty.royan@mitradrive.id';

UPDATE public.profiles SET phone = '6282260878861'
WHERE email = 'abdillah.putra@mitradrive.id';

UPDATE public.profiles SET phone = '6283898079307'
WHERE email = 'heru.triatmo@mitradrive.id';

-- ============================================================
-- 3. Verifikasi - cek phone yang sudah diisi
-- ============================================================
SELECT email, full_name, role, phone
FROM public.profiles
WHERE role IN ('leader', 'koordinator_tefa')
ORDER BY role, full_name;
