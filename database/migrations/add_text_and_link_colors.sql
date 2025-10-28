-- Add color customization for text elements and links
-- Run this migration to add color customization features

-- Add text color columns to users table
ALTER TABLE users 
ADD COLUMN username_color VARCHAR(10) DEFAULT '#1a1a1a' AFTER custom_text,
ADD COLUMN bio_color VARCHAR(10) DEFAULT '#6b7280' AFTER username_color,
ADD COLUMN custom_text_color VARCHAR(10) DEFAULT '#4b5563' AFTER bio_color;

-- Add link customization columns to bio_links table
ALTER TABLE bio_links
ADD COLUMN background_color VARCHAR(10) DEFAULT '#ffffff' AFTER layout,
ADD COLUMN text_color VARCHAR(10) DEFAULT '#1a1a1a' AFTER background_color,
ADD COLUMN is_transparent BOOLEAN DEFAULT FALSE AFTER text_color;

-- Add comments for documentation
ALTER TABLE users 
MODIFY COLUMN username_color VARCHAR(10) DEFAULT '#1a1a1a' COMMENT 'Username text color',
MODIFY COLUMN bio_color VARCHAR(10) DEFAULT '#6b7280' COMMENT 'Bio text color',
MODIFY COLUMN custom_text_color VARCHAR(10) DEFAULT '#4b5563' COMMENT 'Custom text color';

ALTER TABLE bio_links
MODIFY COLUMN background_color VARCHAR(10) DEFAULT '#ffffff' COMMENT 'Link card background color',
MODIFY COLUMN text_color VARCHAR(10) DEFAULT '#1a1a1a' COMMENT 'Link text color',
MODIFY COLUMN is_transparent BOOLEAN DEFAULT FALSE COMMENT 'Whether link background is transparent';

