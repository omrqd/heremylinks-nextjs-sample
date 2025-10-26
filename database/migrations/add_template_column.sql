-- Migration: Add template column to users table
-- This adds support for selecting different design templates

USE heremylinks;

ALTER TABLE users ADD COLUMN IF NOT EXISTS template VARCHAR(50) DEFAULT 'default' AFTER background_color;

-- Migration complete!

