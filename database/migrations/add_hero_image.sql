-- Add hero_image column for banner/header images
-- This is separate from the profile_image and used for template3

ALTER TABLE users 
ADD COLUMN hero_image TEXT DEFAULT NULL AFTER profile_image;

ALTER TABLE users 
MODIFY COLUMN hero_image TEXT DEFAULT NULL COMMENT 'Hero/banner image for profile page (separate from profile picture)';

