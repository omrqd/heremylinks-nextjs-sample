-- Set default template to Influencer Hero (template3) for new users

ALTER TABLE users 
MODIFY COLUMN template VARCHAR(50) DEFAULT 'template3';

