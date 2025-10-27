-- Add background image, background video, and custom text fields
-- Run this migration to add new background customization features

ALTER TABLE users 
ADD COLUMN background_image VARCHAR(500) DEFAULT NULL AFTER template,
ADD COLUMN background_video VARCHAR(500) DEFAULT NULL AFTER background_image,
ADD COLUMN custom_text TEXT DEFAULT NULL AFTER background_video;

-- Add comments for documentation
ALTER TABLE users 
MODIFY COLUMN background_image VARCHAR(500) DEFAULT NULL COMMENT 'Path to background image file',
MODIFY COLUMN background_video VARCHAR(500) DEFAULT NULL COMMENT 'Path to background video file',
MODIFY COLUMN custom_text TEXT DEFAULT NULL COMMENT 'Custom text block displayed on bio page';

