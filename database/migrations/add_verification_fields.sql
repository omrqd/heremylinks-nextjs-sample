-- Add verification fields to users table
ALTER TABLE users 
ADD COLUMN verification_code VARCHAR(6) DEFAULT NULL,
ADD COLUMN verification_code_expires TIMESTAMP DEFAULT NULL,
ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;