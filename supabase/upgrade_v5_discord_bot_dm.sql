-- ==============================================================================
-- Upgrade v5: Support Discord Bot Direct Messages (DM)
-- Run this in Supabase SQL Editor
-- ==============================================================================

-- Add discord_user_id column to personnel
ALTER TABLE public.personnel 
ADD COLUMN IF NOT EXISTS discord_user_id TEXT;
