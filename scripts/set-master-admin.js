/**
 * Script to Set First Master Admin User
 * 
 * Usage:
 * node scripts/set-master-admin.js your-email@example.com
 * 
 * This will set the specified user as a master admin.
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setMasterAdmin(email) {
  try {
    console.log('🔧 Setting master admin for:', email);
    
    // First, check if user exists
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, email, name, is_admin')
      .eq('email', email)
      .single();
    
    if (fetchError || !user) {
      console.error('❌ Error: User not found with email:', email);
      console.error('Please make sure the user has logged in at least once.');
      process.exit(1);
    }
    
    if (user.is_admin) {
      console.log('ℹ️  User is already an admin');
    }
    
    // Update user to master admin
    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_admin: true,
        admin_role: 'master_admin',
        admin_permissions: JSON.stringify({
          users: { view: true, create: true, edit: true, delete: true },
          payments: { view: true, refund: true },
          admins: { view: true, create: true, edit: true, delete: true },
          notifications: { view: true, create: true, edit: true, delete: true, send: true },
          emails: { view: true, send: true },
          settings: { view: true, edit: true },
          logs: { view: true }
        }),
        admin_created_at: new Date().toISOString(),
        admin_created_by: 'system'
      })
      .eq('email', email);
    
    if (updateError) {
      console.error('❌ Error updating user:', updateError);
      process.exit(1);
    }
    
    console.log('✅ Success! User is now a MASTER ADMIN');
    console.log('📋 Details:');
    console.log('   Email:', email);
    console.log('   Role: master_admin');
    console.log('   Permissions: All');
    console.log('');
    console.log('🚀 The user can now access the admin dashboard at /admin');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('❌ Error: Please provide an email address');
  console.error('Usage: node scripts/set-master-admin.js your-email@example.com');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error('❌ Error: Invalid email format');
  process.exit(1);
}

setMasterAdmin(email);

