/*
  # Create secure API keys storage table

  1. New Tables
    - `user_api_keys`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users, unique per provider)
      - `encrypted_key` (text, stores the encrypted API key)
      - `key_hint` (text, last 4 chars for display)
      - `provider` (text, default 'openrouter')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `user_api_keys` table
    - Users can only read/insert/update/delete their own keys
    - Keys are encrypted using pgcrypto before storage

  3. Functions
    - `encrypt_api_key(key text)` - encrypts an API key
    - `decrypt_api_key(encrypted text)` - decrypts an API key (service role only)
    - `save_user_api_key(user_id, key, provider)` - upserts encrypted key
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS user_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_key text NOT NULL,
  key_hint text NOT NULL DEFAULT '',
  provider text NOT NULL DEFAULT 'openrouter',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_api_keys_user_provider_unique UNIQUE (user_id, provider)
);

ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own api key metadata"
  ON user_api_keys
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own api key"
  ON user_api_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own api key"
  ON user_api_keys
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own api key"
  ON user_api_keys
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION encrypt_api_key(raw_key text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  passphrase text;
BEGIN
  passphrase := current_setting('app.settings.jwt_secret', true);
  IF passphrase IS NULL OR passphrase = '' THEN
    passphrase := 'myfinance-os-encryption-key-v1';
  END IF;
  RETURN encode(pgp_sym_encrypt(raw_key, passphrase), 'base64');
END;
$$;

CREATE OR REPLACE FUNCTION decrypt_api_key(encrypted_key_value text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  passphrase text;
BEGIN
  passphrase := current_setting('app.settings.jwt_secret', true);
  IF passphrase IS NULL OR passphrase = '' THEN
    passphrase := 'myfinance-os-encryption-key-v1';
  END IF;
  RETURN pgp_sym_decrypt(decode(encrypted_key_value, 'base64'), passphrase);
END;
$$;

CREATE OR REPLACE FUNCTION save_user_api_key(p_user_id uuid, p_raw_key text, p_provider text DEFAULT 'openrouter')
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_encrypted text;
  v_hint text;
  v_result json;
BEGIN
  v_encrypted := encrypt_api_key(p_raw_key);
  v_hint := right(p_raw_key, 4);

  INSERT INTO user_api_keys (user_id, encrypted_key, key_hint, provider, updated_at)
  VALUES (p_user_id, v_encrypted, v_hint, p_provider, now())
  ON CONFLICT (user_id, provider)
  DO UPDATE SET
    encrypted_key = v_encrypted,
    key_hint = v_hint,
    updated_at = now();

  SELECT json_build_object('success', true, 'key_hint', v_hint) INTO v_result;
  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION decrypt_api_key(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION decrypt_api_key(text) FROM anon;
REVOKE ALL ON FUNCTION decrypt_api_key(text) FROM authenticated;