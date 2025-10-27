-- Add card background options (separate from page background)
-- Run this migration to add card background customization features

ALTER TABLE users 
ADD COLUMN card_background_color VARCHAR(10) DEFAULT '#ffffff' AFTER background_video,
ADD COLUMN card_background_image VARCHAR(500) DEFAULT NULL AFTER card_background_color,
ADD COLUMN card_background_video VARCHAR(500) DEFAULT NULL AFTER card_background_image;

-- Add comments for documentation
ALTER TABLE users 
MODIFY COLUMN card_background_color VARCHAR(10) DEFAULT '#ffffff' COMMENT 'Background color for the bio card',
MODIFY COLUMN card_background_image VARCHAR(500) DEFAULT NULL COMMENT 'Path to card background image file',
MODIFY COLUMN card_background_video VARCHAR(500) DEFAULT NULL COMMENT 'Path to card background video file';

