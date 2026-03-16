/*
  # Fix Mutable Search Path on Functions

  Sets an immutable search_path on functions that had a role-mutable search_path,
  preventing potential security issues where the search_path could be manipulated.

  1. Functions Modified
    - decrypt_api_key
    - encrypt_api_key
    - save_user_api_key

  2. Security
    - Sets search_path to empty string to prevent search_path manipulation attacks
    - Functions now explicitly reference schemas preventing ambiguous object resolution
*/

ALTER FUNCTION public.decrypt_api_key SET search_path = '';
ALTER FUNCTION public.encrypt_api_key SET search_path = '';
ALTER FUNCTION public.save_user_api_key SET search_path = '';
