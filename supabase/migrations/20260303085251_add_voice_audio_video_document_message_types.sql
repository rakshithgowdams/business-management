/*
  # Add voice, audio, video, and document message types

  1. Changes
    - Update `team_messages_message_type_check` constraint to allow:
      - `voice` (voice recordings)
      - `audio` (audio file attachments)
      - `video` (video file attachments)
      - `document` (document file attachments)
    - These types are already used by the frontend but were missing from the DB constraint

  2. Important Notes
    - This is a non-destructive change - only expanding allowed values
    - Existing data is not affected
*/

ALTER TABLE team_messages DROP CONSTRAINT IF EXISTS team_messages_message_type_check;

ALTER TABLE team_messages ADD CONSTRAINT team_messages_message_type_check
  CHECK (message_type = ANY (ARRAY['text', 'image', 'file', 'system', 'voice', 'audio', 'video', 'document']));
