-- Remove nights that haven't been verified in over 3 years.
-- last_verified maps to the CSV "Last Update" field. Favourites/attendance
-- rows cascade on delete, so this is safe to run directly.
DELETE FROM public.nights
WHERE last_verified < (CURRENT_DATE - INTERVAL '3 years');
