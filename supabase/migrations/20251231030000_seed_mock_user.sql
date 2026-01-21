-- Seed Mock User for Development
-- This ensures the MOCK_USER_ID exists in auth.users so that usage_ledger FK constraints are satisfied.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'fb1e11f1-fbea-4896-98c2-313eb75da59e') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      'fb1e11f1-fbea-4896-98c2-313eb75da59e',
      '00000000-0000-0000-0000-000000000000', -- Default instance_id in some setups, or can be null often
      'authenticated',
      'authenticated',
      'mock@example.com',
      '$2a$10$wT5HwMvP.ZzzZzzZzzZzZz.ZzzZzzZzzZzZzZzZzZzZzZzZzZz', -- Dummy bcrypted password
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    ) ON CONFLICT (id) DO NOTHING;
    
    -- Handle case where email exists but ID differs (optional, but good for safety)
    -- For now, just ensuring ID safety should fix the main path if keys align.
  END IF;
END $$;
