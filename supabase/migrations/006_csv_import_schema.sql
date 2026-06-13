-- Add wheelchair_accessible column (normalised from CSV "Wheelchair Access" field).
-- Yes → true, No/Stairs/other negatives → false, TBC/blank → NULL.
ALTER TABLE public.nights
  ADD COLUMN IF NOT EXISTS wheelchair_accessible BOOLEAN;

-- Drop pricing column — entry price data is not available in the CSV.
ALTER TABLE public.nights DROP COLUMN IF EXISTS pricing;

-- how_to_book stays JSONB but its shape changes to { "contact": "..." }.
-- No DDL needed; shape is enforced by the application layer.
-- Existing rows are cleared by 005_delete_seeded_nights.sql so no backfill required.
