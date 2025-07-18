const { createClient } = require('@supabase/supabase-js');

// Replace with your Supabase URL and service_role key (not anon key)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need to add this to your .env.local

if (!supabaseServiceKey) {
  console.error('Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local file');
  console.log('You can find this in your Supabase dashboard under Settings > API');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || 'Admin User';

  if (!email || !password) {
    console.log('Usage: node create-admin.js <email> <password> [name]');
    console.log('Example: node create-admin.js admin@example.com password123 "John Admin"');
    process.exit(1);
  }

  try {
    // Create user in auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });

    if (authError) {
      console.error('Error creating user:', authError);
      return;
    }

    // Update user role to admin
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('id', authData.user.id);

    if (updateError) {
      console.error('Error updating user role:', updateError);
      return;
    }

    console.log('✅ Admin user created successfully!');
    console.log('Email:', email);
    console.log('User ID:', authData.user.id);
    console.log('Role: admin');
    console.log('\nYou can now log in to the app with these credentials.');

  } catch (error) {
    console.error('Error:', error);
  }
}

createAdminUser(); 