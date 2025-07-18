-- FIX RLS POLICIES - REMOVE INFINITE RECURSION
-- Copy and paste this into your Supabase SQL Editor and click RUN

-- 1. Drop all existing policies on users table
DROP POLICY IF EXISTS "Allow user registration" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update any user" ON users;

-- 2. Create simple, non-recursive policies
-- Allow anyone to insert (for registration)
CREATE POLICY "Allow user registration" ON users
FOR INSERT
WITH CHECK (true);

-- Allow users to view their own profile (no recursion)
CREATE POLICY "Users can view own profile" ON users
FOR SELECT
USING (auth.uid() = id);

-- Allow users to update their own profile (no recursion)
CREATE POLICY "Users can update own profile" ON users
FOR UPDATE
USING (auth.uid() = id);

-- For admin access, we'll use a simpler approach without self-referencing
-- Allow users with admin role to view all users (but avoid recursion by using auth.jwt())
CREATE POLICY "Admins can view all users" ON users
FOR SELECT
USING (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  OR auth.uid() = id
);

-- Allow users with admin role to update any user (but avoid recursion)
CREATE POLICY "Admins can update any user" ON users
FOR UPDATE
USING (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  OR auth.uid() = id
);

-- 3. Update the trigger function to also set user metadata for role checking
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into users table
  INSERT INTO users (id, email, name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'), 
    'staff'
  );
  
  -- Update auth.users metadata to include role for policy checking
  UPDATE auth.users 
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'staff')
  WHERE id = NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- User already exists, just return
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail the auth process
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies fixed! This should resolve the infinite recursion issue. 