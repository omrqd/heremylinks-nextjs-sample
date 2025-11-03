-- ============================================================
-- IMMEDIATE FIX: Remove duplicate transactions
-- Run this in your Supabase SQL Editor NOW
-- ============================================================

-- Step 1: View current duplicates (for verification)
SELECT 
  external_id,
  COUNT(*) as count,
  STRING_AGG(id::text, ', ') as transaction_ids,
  MAX(created_at) as latest_created
FROM billing_transactions
GROUP BY external_id
HAVING COUNT(*) > 1
ORDER BY latest_created DESC;

-- Step 2: Delete duplicate transactions (keep only the oldest one for each external_id)
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

-- Step 3: Add UNIQUE constraint to prevent future duplicates
ALTER TABLE billing_transactions 
ADD CONSTRAINT IF NOT EXISTS unique_external_id UNIQUE (external_id);

-- Step 4: Verify results
SELECT 
  'Total Transactions' as metric,
  COUNT(*) as value
FROM billing_transactions
UNION ALL
SELECT 
  'Unique External IDs' as metric,
  COUNT(DISTINCT external_id) as value
FROM billing_transactions;

-- ✅ Done! Your duplicates are removed and future duplicates are prevented.

