-- Add hero_height and hide_profile_picture columns for Influencer Hero template customization

ALTER TABLE users 
ADD COLUMN hero_height INT DEFAULT 300 AFTER hero_image,
ADD COLUMN hide_profile_picture BOOLEAN DEFAULT FALSE AFTER hero_height;

-- Add comments for clarity
ALTER TABLE users 
MODIFY COLUMN hero_height INT DEFAULT 300 COMMENT 'Height of hero banner in pixels (for template3)',
MODIFY COLUMN hide_profile_picture BOOLEAN DEFAULT FALSE COMMENT 'Hide profile picture in template3 (hero only)';

