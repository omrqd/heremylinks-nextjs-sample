// Supabase Client Configuration (Database Only)
// Note: We use NextAuth for authentication, not Supabase Auth
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
}

// Create Supabase client for database operations only
// Auth is handled by NextAuth (not Supabase Auth)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

// Database types (auto-generated from Supabase)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          email: string;
          email_verified: string | null;
          name: string | null;
          image: string | null;
          bio: string | null;
          password: string | null;
          provider: string | null;
          provider_id: string | null;
          profile_image: string | null;
          hero_image: string | null;
          hero_height: number | null;
          hide_profile_picture: boolean | null;
          theme_color: string | null;
          background_color: string | null;
          template: string | null;
          background_image: string | null;
          background_video: string | null;
          card_background_color: string | null;
          card_background_image: string | null;
          card_background_video: string | null;
          custom_text: string | null;
          username_color: string | null;
          bio_color: string | null;
          custom_text_color: string | null;
          is_published: boolean | null;
          custom_domain: string | null;
          created_at: string | null;
          updated_at: string | null;
          verification_code: string | null;
          verification_code_expires: string | null;
          is_verified: boolean | null;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      accounts: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          provider: string;
          provider_account_id: string;
          refresh_token: string | null;
          access_token: string | null;
          expires_at: number | null;
          token_type: string | null;
          scope: string | null;
          id_token: string | null;
          session_state: string | null;
          created_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['accounts']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['accounts']['Insert']>;
      };
      bio_links: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          url: string;
          icon: string | null;
          image: string | null;
          layout: string | null;
          background_color: string | null;
          text_color: string | null;
          is_transparent: boolean | null;
          order: number | null;
          is_visible: boolean | null;
          click_count: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['bio_links']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['bio_links']['Insert']>;
      };
      social_links: {
        Row: {
          id: string;
          user_id: string;
          platform: string;
          url: string;
          icon: string;
          created_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['social_links']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['social_links']['Insert']>;
      };
    };
  };
}

// Helper function to check connection
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Supabase connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection error:', error);
    return false;
  }
}

export default supabase;

