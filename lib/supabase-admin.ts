// Supabase Admin Client - Uses Service Role Key to Bypass RLS
// This client has full admin access - ONLY use in server-side API routes
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase Service Role Key!');
  console.error('Make sure SUPABASE_SERVICE_ROLE_KEY is set in .env.local');
  throw new Error('Supabase Service Role Key is required for admin operations');
}

// Admin client - bypasses ALL RLS policies
// Security is enforced at the API route level via NextAuth
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

// Helper function to verify connection
export async function checkAdminConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin.from('users').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Supabase Admin connected successfully (Service Role)');
    return true;
  } catch (error) {
    console.error('❌ Supabase Admin connection error:', error);
    return false;
  }
}

export default supabaseAdmin;

