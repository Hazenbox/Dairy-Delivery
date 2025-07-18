-- FRESH SUPABASE SETUP - RUN THIS AFTER RESET
-- This creates everything from scratch with proper configuration
-- Copy and paste this into your Supabase SQL Editor and click RUN

-- 1. Create users table (profiles table for user data)
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'staff', 'delivery')) DEFAULT 'staff',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create products table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create customers table
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  address TEXT,
  lat DECIMAL(10,8),
  lng DECIMAL(11,8),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create subscriptions table
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity DECIMAL(10,2) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  frequency TEXT CHECK (frequency IN ('daily', 'alternate', 'custom')) DEFAULT 'daily',
  custom_schedule INTEGER[],
  is_active BOOLEAN DEFAULT true,
  start_date DATE NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create deliveries table
CREATE TABLE deliveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'delivered', 'missed')) DEFAULT 'pending',
  amount DECIMAL(10,2) NOT NULL,
  notes TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create payments table
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  mode TEXT CHECK (mode IN ('cash', 'upi', 'card')) DEFAULT 'cash',
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for users table (CRITICAL FOR AUTHENTICATION)
-- Allow anyone to insert new users (for registration)
CREATE POLICY "Allow user registration" ON users
FOR INSERT
WITH CHECK (true);

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON users
FOR SELECT
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON users
FOR UPDATE
USING (auth.uid() = id);

-- Allow admins to view all users
CREATE POLICY "Admins can view all users" ON users
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Allow admins to update any user
CREATE POLICY "Admins can update any user" ON users
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- 9. Create RLS policies for other tables
-- Products policies
CREATE POLICY "Anyone can view products" ON products
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can manage products" ON products
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Customers policies
CREATE POLICY "Authenticated users can view customers" ON customers
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage customers" ON customers
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Subscriptions policies
CREATE POLICY "Authenticated users can view subscriptions" ON subscriptions
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage subscriptions" ON subscriptions
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Deliveries policies
CREATE POLICY "Authenticated users can view deliveries" ON deliveries
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage deliveries" ON deliveries
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Payments policies
CREATE POLICY "Authenticated users can view payments" ON payments
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage payments" ON payments
FOR ALL
USING (auth.uid() IS NOT NULL);

-- 10. Create trigger function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'), 
    'staff'
  );
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

-- 11. Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 12. Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user() TO anon;

-- Fresh setup complete! 
-- Your database is now ready for user registration and the full dairy delivery app. 