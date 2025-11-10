/**
 * Script to Create Master Admin User
 * 
 * Usage:
 * 1. Set your admin email in the ADMIN_EMAIL variable below
 * 2. Run: npx ts-node scripts/create-master-admin.ts
 * 3. The script will create/update the user with master admin privileges
 * 
 * Note: This user will login through the regular /login page with their email/password
 */

import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function createMasterAdmin() {
  console.log('');
  console.log('🔐 ═══════════════════════════════════════════════');
  console.log('   MASTER ADMIN CREATION SCRIPT');
  console.log('═══════════════════════════════════════════════');
  console.log('');

  try {
    // Get admin email
    const email = await question('Enter admin email: ');
    
    if (!email || !email.includes('@')) {
      console.error('❌ Invalid email address');
      rl.close();
      return;
    }

    // Check if user exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('id, email, username, is_admin, admin_role, admin_created_at')
        .eq('email', email)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Error checking user:', fetchError);
      rl.close();
      return;
    }

    const now = new Date().toISOString();

    if (existingUser) {
      // User exists - upgrade to master admin
      console.log('');
      console.log('👤 User found:', existingUser.email);
      console.log('');
      
      if (existingUser.is_admin && existingUser.admin_role === 'master_admin') {
        console.log('⚠️  This user is already a Master Admin!');
        const confirm = await question('Do you want to refresh their admin privileges? (yes/no): ');
        
        if (confirm.toLowerCase() !== 'yes') {
          console.log('Operation cancelled.');
          rl.close();
          return;
        }
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({
          is_admin: true,
          admin_role: 'master_admin',
          admin_permissions: JSON.stringify(['*']), // Full access
          admin_created_at: existingUser.admin_created_at || now,
          admin_created_by: null, // Master admin is self-created
        })
        .eq('email', email);

      if (updateError) {
        console.error('❌ Error updating user:', updateError);
        rl.close();
        return;
      }

      console.log('');
      console.log('✅ User upgraded to Master Admin successfully!');
    } else {
      // User doesn't exist - create new user
      console.log('');
      console.log('👤 User not found. Creating new Master Admin user...');
      console.log('');

      const username = await question('Enter username (default: admin): ') || 'admin';
      const name = await question('Enter display name (default: Administrator): ') || 'Administrator';

      // Create user account
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: email,
          username: username.toLowerCase(),
          name: name,
          is_admin: true,
          admin_role: 'master_admin',
          admin_permissions: JSON.stringify(['*']),
          admin_created_at: now,
          admin_created_by: null,
          is_verified: true,
          is_published: false,
          provider: 'credentials',
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating user:', createError);
        rl.close();
        return;
      }

      console.log('✅ Master Admin user created successfully!');
    }

    console.log('');
    console.log('═══════════════════════════════════════════════');
    console.log('   SETUP COMPLETE');
    console.log('═══════════════════════════════════════════════');
    console.log('');
    console.log('📧 Admin Email:', email);
    console.log('🔑 Role: Master Admin');
    console.log('⚡ Permissions: Full Access (*)');
    console.log('');
    console.log('🔐 IMPORTANT: Set a password for this user:');
    console.log('   1. Go to: https://app.supabase.com');
    console.log('   2. Navigate to: Authentication → Users');
    console.log(`   3. Find user: ${email}`);
    console.log('   4. Click "..." → Reset Password');
    console.log('   5. Send reset password email');
    console.log('');
    console.log('🚀 Login at: https://heremylinks.com/login');
    console.log('   → Master Admins will be redirected to /admin');
    console.log('');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  } finally {
    rl.close();
  }
}

// Run the script
createMasterAdmin();

