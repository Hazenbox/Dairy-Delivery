-- COMPLETE SUPABASE RESET - RUN THIS FIRST
-- This will delete EVERYTHING and start fresh
-- Copy and paste this into your Supabase SQL Editor and click RUN

-- 1. Drop all triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Drop all functions
DROP FUNCTION IF EXISTS handle_new_user();

-- 3. Drop all tables (in correct order to handle foreign keys)
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS deliveries CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 4. Delete all users from auth.users (this will remove all authentication)
-- WARNING: This deletes ALL users from your project
DELETE FROM auth.users;

-- 5. Clean up any remaining policies (just in case)
-- Note: Policies are automatically dropped when tables are dropped

-- Reset complete! Your Supabase database is now completely clean.
-- Run the FRESH-SETUP.sql script next. 