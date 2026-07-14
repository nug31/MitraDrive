-- ============================================================
-- BUAT AKUN LEADER MITRADRIVE LANGSUNG VIA SQL
-- Jalankan di Supabase: SQL Editor → New Query → Run
-- Akun langsung aktif, tidak perlu konfirmasi email
-- ============================================================

-- Hapus fungsi lama jika ada
DROP FUNCTION IF EXISTS create_leader_account(TEXT, TEXT, TEXT);

-- Fungsi helper: cek dulu sebelum insert
CREATE OR REPLACE FUNCTION create_leader_account(
    p_email TEXT,
    p_password TEXT,
    p_full_name TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_user_id UUID;
    v_existing_id UUID;
BEGIN
    -- Cek apakah email sudah ada
    SELECT id INTO v_existing_id FROM auth.users WHERE email = p_email;
    
    IF v_existing_id IS NOT NULL THEN
        RETURN 'SKIP: ' || p_email || ' sudah ada';
    END IF;

    v_user_id := gen_random_uuid();

    -- Insert ke auth.users
    INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change
    ) VALUES (
        v_user_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        p_email,
        crypt(p_password, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        json_build_object('full_name', p_full_name, 'role', 'leader')::jsonb,
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    );

    -- Insert ke auth.identities
    INSERT INTO auth.identities (
        id,
        user_id,
        provider_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        v_user_id,
        p_email,
        json_build_object('sub', v_user_id::text, 'email', p_email)::jsonb,
        'email',
        NOW(),
        NOW(),
        NOW()
    );

    RETURN 'OK: ' || p_email || ' berhasil dibuat';

EXCEPTION WHEN OTHERS THEN
    RETURN 'ERROR: ' || p_email || ' → ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- BUAT SEMUA AKUN LEADER (5 Wakasek + 8 HOD = 13 akun)
-- ============================================================

-- ── WAKASEK ──
SELECT create_leader_account('elis.rika@mitradrive.id',         'MI2100elis',      'Elis Rika Sugiarti');
SELECT create_leader_account('abdul.munir@mitradrive.id',       'MI2100munir',     'Abdul Munir');
SELECT create_leader_account('hidayat.atori@mitradrive.id',     'MI2100hidayat',   'Hidayat Atori');
SELECT create_leader_account('nuryana.fitriyani@mitradrive.id', 'MI2100nuryana',   'Nuryana Fitriyani');
SELECT create_leader_account('aprilia.rahayu@mitradrive.id',    'MI2100aprilia',   'Aprilia Rahayu Wilujeng');

-- ── HOD ──
SELECT create_leader_account('ryo.maytana@mitradrive.id',       'MI2100ryo',       'Ryo Maytana');
SELECT create_leader_account('okxy.ixganda@mitradrive.id',      'MI2100okxy',      'Okxy Ixganda');
SELECT create_leader_account('astri.afmi@mitradrive.id',        'MI2100astri',     'Astri Afmi Wulandari');
SELECT create_leader_account('eldha.luvyzha@mitradrive.id',     'MI2100eldha',     'Eldha Luvyzha');
SELECT create_leader_account('kiki.widhia@mitradrive.id',       'MI2100kiki',      'Kiki Widhia Swara');
SELECT create_leader_account('refty.royan@mitradrive.id',       'MI2100refty',     'Refty Royan');
SELECT create_leader_account('abdillah.putra@mitradrive.id',    'MI2100abdillah',  'Abdillah Putra');
SELECT create_leader_account('heru.triatmo@mitradrive.id',      'MI2100heru',      'Heru Triatmo');

-- ============================================================
-- VERIFIKASI — tampilkan semua akun @mitradrive.id
-- ============================================================
SELECT
    email,
    raw_user_meta_data ->> 'full_name'      AS nama,
    raw_user_meta_data ->> 'role'           AS role,
    (email_confirmed_at IS NOT NULL)        AS sudah_confirmed,
    to_char(created_at, 'DD Mon YYYY HH24:MI') AS dibuat
FROM auth.users
WHERE email LIKE '%@mitradrive.id'
ORDER BY created_at;

-- ============================================================
-- CLEANUP (opsional, jalankan setelah selesai)
-- ============================================================
-- DROP FUNCTION IF EXISTS create_leader_account(TEXT, TEXT, TEXT);
