-- Fix the data type mismatch in notifications table
-- Change related_id from uuid to text to accommodate different ID types
ALTER TABLE notifications ALTER COLUMN related_id TYPE text USING related_id::text;