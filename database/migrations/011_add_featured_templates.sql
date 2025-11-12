-- Add is_featured_creator field to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_featured_creator BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS featured_creator_since TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_is_featured_creator ON users(is_featured_creator) WHERE is_featured_creator = TRUE;

-- Add comments for documentation
COMMENT ON COLUMN users.is_featured_creator IS 'Whether this user templates are featured for premium users to copy';
COMMENT ON COLUMN users.featured_creator_since IS 'When the user was marked as featured template creator';

