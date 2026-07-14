-- ============================================================
-- TABEL PROFILES: Menyimpan semua user (leader + peminjam)
-- Otomatis sinkron dengan auth.users via trigger
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Buat tabel profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       TEXT,
    full_name   TEXT,
    role        TEXT DEFAULT 'peminjam',   -- 'leader' atau 'peminjam'
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Semua orang bisa melihat profiles
DROP POLICY IF EXISTS "Profiles bisa dilihat semua" ON public.profiles;
CREATE POLICY "Profiles bisa dilihat semua"
    ON public.profiles FOR SELECT
    USING (true);

-- User hanya bisa update profil sendiri
DROP POLICY IF EXISTS "User bisa update profil sendiri" ON public.profiles;
CREATE POLICY "User bisa update profil sendiri"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Insert bisa dilakukan oleh system/trigger
DROP POLICY IF EXISTS "System bisa insert profiles" ON public.profiles;
CREATE POLICY "System bisa insert profiles"
    ON public.profiles FOR INSERT
    WITH CHECK (true);

-- 3. Trigger: otomatis buat profile saat user baru daftar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
        COALESCE(NEW.raw_user_meta_data ->> 'role', 'peminjam')
    )
    ON CONFLICT (id) DO UPDATE SET
        email     = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role      = EXCLUDED.role,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pasang trigger di auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Isi profiles dari user yang sudah ada sekarang
INSERT INTO public.profiles (id, email, full_name, role, created_at)
SELECT
    id,
    email,
    COALESCE(raw_user_meta_data ->> 'full_name', ''),
    COALESCE(raw_user_meta_data ->> 'role', 'peminjam'),
    created_at
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
    email     = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role      = EXCLUDED.role,
    updated_at = NOW();

-- 5. Verifikasi - tampilkan semua user
SELECT id, email, full_name, role, created_at
FROM public.profiles
ORDER BY role, full_name;
