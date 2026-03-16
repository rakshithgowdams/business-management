/*
  # Fix double-encoded followup_sequences steps

  1. Problem
    - The `steps` JSONB column in `followup_sequences` contains double-encoded JSON strings
    - Data was stored as `"[{...}]"` (string) instead of `[{...}]` (array)
    - This causes the frontend to fail when trying to iterate steps

  2. Fix
    - Update all rows where `steps` is a JSON string (not an array) by parsing the string
    - This converts the double-encoded strings back to proper JSONB arrays
*/

UPDATE followup_sequences
SET steps = (steps #>> '{}')::jsonb
WHERE jsonb_typeof(steps) = 'string';
