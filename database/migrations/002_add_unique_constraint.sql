-- ============================================================
-- Migration: Add UNIQUE constraint to external_id
-- Purpose: Prevent duplicate transactions at database level
-- Date: 2025-11-03
-- ============================================================

-- First, let's clean up any existing duplicates before adding the constraint
-- Keep only the oldest transaction for each external_id
WITH duplicates AS (
  SELECT 
    id,
    external_id,
    ROW_NUMBER() OVER (PARTITION BY external_id ORDER BY created_at ASC) as rn
  FROM billing_transactions
  WHERE external_id IS NOT NULL
)
DELETE FROM billing_transactions
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Now add the UNIQUE constraint
-- Note: If external_id was NULL for any row, set it to a unique value first
UPDATE billing_transactions 
SET external_id = CONCAT('legacy_', id::text) 
WHERE external_id IS NULL;

-- Make external_id NOT NULL
ALTER TABLE billing_transactions 
ALTER COLUMN external_id SET NOT NULL;

-- Add UNIQUE constraint
ALTER TABLE billing_transactions 
ADD CONSTRAINT unique_external_id UNIQUE (external_id);

-- Verify the constraint was added
SELECT 
  conname AS constraint_name,
  contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'billing_transactions'::regclass
  AND conname = 'unique_external_id';

\echo '✅ Migration complete: UNIQUE constraint added to external_id'
\echo '📊 Current transaction count:'
SELECT COUNT(*) as total_transactions FROM billing_transactions;

