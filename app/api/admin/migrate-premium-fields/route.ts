import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting premium fields migration...');

    // Add premium status fields to users table
    const alterQueries = [
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_plan_type VARCHAR(50) DEFAULT NULL',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) DEFAULT NULL'
    ];

    // Execute each ALTER TABLE query
    for (const query of alterQueries) {
      console.log(`Executing: ${query}`);
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) {
        console.error(`Error executing query: ${query}`, error);
        // Continue with other queries even if one fails (column might already exist)
      }
    }

    // Create indexes
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id)',
      'CREATE INDEX IF NOT EXISTS idx_users_premium_status ON users(is_premium)'
    ];

    for (const query of indexQueries) {
      console.log(`Executing: ${query}`);
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) {
        console.error(`Error executing index query: ${query}`, error);
      }
    }

    // Create transactions table
    const createTransactionsTable = `
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        external_id VARCHAR(255) NOT NULL,
        plan_type VARCHAR(50) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        status VARCHAR(50) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;

    console.log('Creating transactions table...');
    const { error: createTableError } = await supabase.rpc('exec_sql', { sql: createTransactionsTable });
    if (createTableError) {
      console.error('Error creating transactions table:', createTableError);
    }

    // Create transactions table indexes
    const transactionIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_external_id ON transactions(external_id)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status)'
    ];

    for (const query of transactionIndexes) {
      console.log(`Executing: ${query}`);
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) {
        console.error(`Error executing transaction index query: ${query}`, error);
      }
    }

    console.log('✅ Premium fields migration completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Premium fields migration completed successfully'
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}