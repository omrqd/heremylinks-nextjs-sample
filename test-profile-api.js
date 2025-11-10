/**
 * Test script to simulate what the /api/user/profile endpoint does
 * Run with: node test-profile-api.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testProfileQuery() {
  const email = 'mora.dxbuae@gmail.com';
  
  console.log('🔍 Testing profile query for:', email);
  console.log('');
  
  // This mimics what db.query does with Supabase
  const { data: rows, error } = await supabaseAdmin
    .from('users')
    .select(`
      id, username, email, name, bio, profile_image, hero_image, hero_height, hide_profile_picture,
      theme_color, background_color, template, background_image, background_video, 
      card_background_color, card_background_image, card_background_video, custom_text, 
      username_color, bio_color, custom_text_color, is_published,
      is_premium, premium_plan_type, premium_started_at, premium_expires_at,
      stripe_customer_id, stripe_subscription_id,
      is_admin, admin_role, admin_permissions
    `)
    .eq('email', email)
    .limit(1);
  
  if (error) {
    console.error('❌ Query error:', error);
    return;
  }
  
  if (!rows || rows.length === 0) {
    console.error('❌ No user found');
    return;
  }
  
  const userProfile = rows[0];
  
  console.log('✅ Query successful!');
  console.log('');
  console.log('📋 Admin fields from database:');
  console.log('   is_admin:', userProfile.is_admin);
  console.log('   admin_role:', userProfile.admin_role);
  console.log('   admin_permissions:', userProfile.admin_permissions ? 'SET' : 'NULL');
  console.log('');
  console.log('📦 What would be returned to frontend:');
  console.log('   isAdmin:', userProfile.is_admin || false);
  console.log('   adminRole:', userProfile.admin_role);
  console.log('   adminPermissions:', userProfile.admin_permissions);
  console.log('');
  
  // Check the value
  if (userProfile.is_admin) {
    console.log('✅ User IS an admin - should redirect to /admin');
  } else {
    console.log('⚠️ User is NOT an admin - would redirect to /dashboard');
    console.log('');
    console.log('💡 Possible reasons:');
    console.log('   1. Admin script didn\'t run successfully');
    console.log('   2. Wrong email was set as admin');
    console.log('   3. Database column doesn\'t exist');
    console.log('   4. is_admin is NULL or FALSE');
  }
}

testProfileQuery();

