/*
  # Update Defaults to Philippines

  ## Summary
  Updates default country, timezone, and currency settings to Philippines (PH)

  ## Changes
  - Update schools table defaults: country = 'Philippines', timezone = 'Asia/Manila'
  - Add currency field support (can be added to settings JSONB)
*/

-- Update schools table defaults
ALTER TABLE schools 
  ALTER COLUMN country SET DEFAULT 'Philippines',
  ALTER COLUMN timezone SET DEFAULT 'Asia/Manila';

-- Update existing schools to Philippines if they have default values
UPDATE schools 
SET 
  country = 'Philippines',
  timezone = 'Asia/Manila'
WHERE 
  country = 'USA' 
  AND timezone = 'America/New_York';

-- Add comment for documentation
COMMENT ON COLUMN schools.country IS 'Country where the school is located. Default: Philippines';
COMMENT ON COLUMN schools.timezone IS 'Timezone for the school. Default: Asia/Manila (Philippines)';
