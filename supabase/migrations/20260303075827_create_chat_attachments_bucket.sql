/*
  # Create Chat Attachments Storage Bucket

  1. New Storage Bucket
    - `chat-attachments` - Storage for files, images, audio, video shared in team messenger
  2. Security
    - Public read access for attachment URLs
    - 50MB file size limit
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('chat-attachments', 'chat-attachments', true, 52428800)
ON CONFLICT (id) DO NOTHING;
