/*
  # Fix missing handle_new_user trigger

  The `handle_new_user` function existed but the trigger on `auth.users` was missing.
  This meant new signups never got a `profiles` row created, causing RLS failures
  and broken dashboard access.

  1. Changes
    - Recreate `handle_new_user` function with robust error handling
    - Attach trigger to `auth.users` on INSERT so profiles are auto-created
    - Backfill any existing auth users who are missing a profile row

  2. Security
    - Function runs as SECURITY DEFINER to write to public.profiles
    - search_path locked to public
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.email, '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (id, full_name, email)
SELECT
  au.id,
  COALESCE(au.raw_user_meta_data ->> 'full_name', ''),
  COALESCE(au.email, '')
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;
