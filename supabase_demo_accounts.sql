-- ============================================================
-- MitraDrive: Inisialisasi Akun Pengujian (Testing Accounts)
-- Jalankan SQL ini di Supabase SQL Editor (New Query -> Run)
-- Semua akun otomatis aktif (Email Confirmed)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Buat Tabel Profiles jika belum ada
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    role TEXT DEFAULT 'peminjam',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles read" ON public.profiles;
CREATE POLICY "Public profiles read" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "User update own profile" ON public.profiles;
CREATE POLICY "User update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Helper Function untuk Pembuatan Akun Otomatis
CREATE OR REPLACE FUNCTION create_test_account(
    p_email TEXT,
    p_password TEXT,
    p_full_name TEXT,
    p_role TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_user_id UUID;
    v_existing_id UUID;
BEGIN
    SELECT id INTO v_existing_id FROM auth.users WHERE email = p_email;
    
    IF v_existing_id IS NOT NULL THEN
        -- Update password dan metadata jika sudah ada
        UPDATE auth.users 
        SET encrypted_password = crypt(p_password, gen_salt('bf')),
            email_confirmed_at = NOW(),
            raw_user_meta_data = json_build_object('full_name', p_full_name, 'role', p_role)::jsonb,
            updated_at = NOW()
        WHERE id = v_existing_id;

        INSERT INTO public.profiles (id, full_name, role)
        VALUES (v_existing_id, p_full_name, p_role)
        ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;

        RETURN 'UPDATED: ' || p_email;
    END IF;

    v_user_id := gen_random_uuid();

    -- Insert ke auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
        v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        p_email, crypt(p_password, gen_salt('bf')), NOW(),
        '{"provider":"email","providers":["email"]}',
        json_build_object('full_name', p_full_name, 'role', p_role)::jsonb,
        NOW(), NOW(), '', '', '', ''
    );

    -- Insert ke auth.identities
    INSERT INTO auth.identities (
        id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), v_user_id, p_email,
        json_build_object('sub', v_user_id::text, 'email', p_email)::jsonb,
        'email', NOW(), NOW(), NOW()
    );

    -- Insert ke public.profiles
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (v_user_id, p_full_name, p_role)
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;

    RETURN 'CREATED: ' || p_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- EKSEKUSI PEMBUATAN AKUN TESTING
-- ============================================================

-- 1. Akun Peminjam (User Biasa)
SELECT create_test_account('peminjam.tes@mitradrive.id', 'UserTest123', 'Tester Peminjam', 'peminjam');

-- 2. Akun Leader (Approver Wakasek)
SELECT create_test_account('elis.rika@mitradrive.id', 'MI2100elis', 'Elis Rika Sugiarti', 'leader');

-- 3. Akun Admin (Administrator Global)
SELECT create_test_account('admin@mitradrive.id', 'MitraAdmin2100', 'Administrator MitraDrive', 'admin');

-- Verifikasi Akun yang Dibuat
SELECT email, raw_user_meta_data->>'full_name' as nama, raw_user_meta_data->>'role' as role 
FROM auth.users 
WHERE email IN ('peminjam.tes@mitradrive.id', 'elis.rika@mitradrive.id', 'admin@mitradrive.id');
