-- ============================================================
-- MitraDrive: Buat Akun Checker untuk Umar
-- Jalankan SQL ini di Supabase SQL Editor
-- ============================================================

DO $$
DECLARE
  uid UUID := gen_random_uuid();
BEGIN
  -- 1. Buat Akun Umar di auth.users (jika belum ada)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'umar@mitradrive.id') THEN
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, recovery_sent_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'umar@mitradrive.id',
      crypt('MI2100umar', gen_salt('bf')),
      now(), NULL, NULL,
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Umar","role":"checker"}',
      now(), now(), '', '', '', ''
    );
  ELSE
    SELECT id INTO uid FROM auth.users WHERE email = 'umar@mitradrive.id';
    
    -- Pastikan user metadata-nya benar
    UPDATE auth.users 
    SET raw_user_meta_data = '{"full_name":"Umar","role":"checker"}' 
    WHERE id = uid;
  END IF;

  -- 2. Pastikan ada di public.profiles dengan role checker
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (uid, 'umar@mitradrive.id', 'Umar', 'checker')
  ON CONFLICT (id) DO UPDATE 
  SET role = 'checker', full_name = 'Umar';

END $$;
