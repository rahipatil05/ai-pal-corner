-- Delete all user-related data
-- This will cascade delete conversations and companion agent assignments
DELETE FROM public.profiles;

-- Delete all custom (non-default) agents created by users
DELETE FROM public.agents WHERE is_default = false;