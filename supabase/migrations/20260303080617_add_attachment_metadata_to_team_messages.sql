/*
  # Add attachment metadata to team messages

  1. Modified Tables
    - `team_messages`
      - `attachment_size` (bigint) - File size in bytes
      - `attachment_mime` (text) - MIME type of the attachment
  2. Notes
    - Supports new message types: audio, video, document, voice
    - Backwards compatible with existing messages
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_messages' AND column_name = 'attachment_size'
  ) THEN
    ALTER TABLE team_messages ADD COLUMN attachment_size bigint DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_messages' AND column_name = 'attachment_mime'
  ) THEN
    ALTER TABLE team_messages ADD COLUMN attachment_mime text DEFAULT '';
  END IF;
END $$;
