-- ============================================================
-- MitraDrive: Migration - Fix Role di Tabel Profiles
-- Jalankan SQL ini di Supabase SQL Editor
-- ============================================================

-- Update atau buat profile untuk Enggar Fata (PIC Peminjaman)
DO $$
DECLARE
  uid UUID;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'enggar.fata@mitradrive.id';
  IF uid IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (uid, 'enggar.fata@mitradrive.id', 'Enggar Fata', 'pic_peminjaman')
    ON CONFLICT (id) DO UPDATE 
    SET role = 'pic_peminjaman', full_name = 'Enggar Fata';
  END IF;
END $$;

-- Update atau buat profile untuk Hanif (Checker)
DO $$
DECLARE
  uid UUID;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'hanif@mitradrive.id';
  IF uid IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (uid, 'hanif@mitradrive.id', 'Hanif', 'checker')
    ON CONFLICT (id) DO UPDATE 
    SET role = 'checker', full_name = 'Hanif';
  END IF;
END $$;

-- Update atau buat profile untuk Aprilia (Koordinator TEFA)
DO $$
DECLARE
  uid UUID;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'aprilia.rahayu@mitradrive.id';
  IF uid IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (uid, 'aprilia.rahayu@mitradrive.id', 'Aprilia Rahayu Wilujeng', 'koordinator_tefa')
    ON CONFLICT (id) DO UPDATE 
    SET role = 'koordinator_tefa', full_name = 'Aprilia Rahayu Wilujeng';
  END IF;
END $$;
