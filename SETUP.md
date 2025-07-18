# 🚀 Setup Guide - Authentication & Database

## Prerequisites
- Node.js 18+ (use `nvm use 18` if you have nvm installed)
- Supabase account

## 1. Install Dependencies
```bash
npm install
```

## 2. Environment Setup
Create a `.env.local` file in the root directory with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## 3. Database Setup

### Step 1: Run the SQL Schema
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `database-schema.sql` into the editor
4. Click "Run" to execute the SQL

### Step 2: Create an Admin User
You have two options:

**Option A: Using the script (Recommended)**
1. Add your Supabase service role key to `.env.local`:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
2. Run the admin creation script:
   ```bash
   node scripts/create-admin.js admin@example.com yourpassword "Admin Name"
   ```

**Option B: Manual creation**
1. Go to Authentication > Users in your Supabase dashboard
2. Click "Add user"
3. Enter email and password
4. After user is created, go to SQL Editor and run:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-admin-email@example.com';
   ```

## 4. Start Development Server
```bash
npm run dev
```

## 5. Test the Application
1. Open http://localhost:3000
2. Click "Sign In" and use your admin credentials
3. You should see admin navigation items
4. Go to Admin > Products to test product management

## Features Available
- ✅ Authentication (Login/Signup)
- ✅ Admin Product Management (CRUD)
- ✅ Customer Management
- ✅ Subscription Management
- ✅ Delivery Tracking
- ✅ Payment Tracking
- ✅ Mobile-responsive UI with Polaris
- ✅ Protected Routes

## Troubleshooting

### Node.js Version Issues
If you get Node.js version errors:
```bash
nvm use 18
npm run dev
```

### Database Permission Errors
- Make sure you're using the correct SQL schema from `database-schema.sql`
- The schema doesn't modify `auth.users` table, only creates a separate `users` table
- Ensure you have the service role key for admin user creation

### Authentication Issues
- Verify your Supabase URL and keys are correct
- Check that the database schema was applied successfully
- Ensure the admin user was created with the correct role

## Next Steps
1. Add sample products through the admin interface
2. Create test customers
3. Set up subscriptions and deliveries
4. Customize the UI and branding as needed 