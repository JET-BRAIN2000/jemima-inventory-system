-- Migration: Allow NULL for date_of_birth, address, profile_picture_path in profiles table
-- The schema already defines these as nullable, but this migration ensures
-- any existing sentinel values ('1900-01-01' for dates, empty strings) are
-- cleaned up to proper NULLs.

-- Clean up sentinel date_of_birth values
UPDATE profiles SET date_of_birth = NULL WHERE date_of_birth = '1900-01-01';

-- Clean up empty-string address values to NULL (optional, keeps data consistent)
UPDATE profiles SET address = NULL WHERE address = '';

-- Clean up empty-string profile_picture_path values to NULL
UPDATE profiles SET profile_picture_path = NULL WHERE profile_picture_path = '';
