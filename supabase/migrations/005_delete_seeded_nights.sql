-- Delete fabricated seed data before importing real CSV data.
-- ON DELETE CASCADE on favourites and attendance makes this safe.
DELETE FROM public.nights;
