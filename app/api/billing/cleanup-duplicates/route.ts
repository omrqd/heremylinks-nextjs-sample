import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🧹 Starting duplicate cleanup for user:', session.user.email);

    // Step 1: Find all duplicates
    const { data: allTransactions, error: fetchError } = await supabaseAdmin
      .from('billing_transactions')
      .select('id, external_id, created_at, amount')
      .eq('email', session.user.email)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching transactions:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    if (!allTransactions || allTransactions.length === 0) {
      return NextResponse.json({ 
        message: 'No transactions found',
        duplicatesRemoved: 0
      });
    }

    console.log('📊 Found', allTransactions.length, 'total transactions');

    // Step 2: Group by external_id and find duplicates
    const groupedByExternalId = new Map<string, typeof allTransactions>();
    
    allTransactions.forEach(transaction => {
      const externalId = transaction.external_id;
      if (!groupedByExternalId.has(externalId)) {
        groupedByExternalId.set(externalId, []);
      }
      groupedByExternalId.get(externalId)!.push(transaction);
    });

    // Step 3: Identify duplicates to delete (keep oldest one for each external_id)
    const idsToDelete: string[] = [];
    let duplicateCount = 0;

    groupedByExternalId.forEach((transactions, externalId) => {
      if (transactions.length > 1) {
        console.log(`🔍 Found ${transactions.length} duplicates for external_id: ${externalId}`);
        duplicateCount++;
        
        // Sort by created_at (oldest first)
        transactions.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        // Keep the first (oldest), delete the rest
        const toDelete = transactions.slice(1);
        toDelete.forEach(t => {
          console.log(`  ❌ Will delete duplicate: ID ${t.id} created at ${t.created_at}`);
          idsToDelete.push(t.id);
        });
        
        console.log(`  ✅ Will keep: ID ${transactions[0].id} created at ${transactions[0].created_at}`);
      }
    });

    if (idsToDelete.length === 0) {
      console.log('✅ No duplicates found!');
      return NextResponse.json({
        message: 'No duplicates found',
        duplicatesRemoved: 0,
        totalTransactions: allTransactions.length
      });
    }

    console.log(`🗑️ Deleting ${idsToDelete.length} duplicate transactions...`);

    // Step 4: Delete duplicates
    const { error: deleteError } = await supabaseAdmin
      .from('billing_transactions')
      .delete()
      .in('id', idsToDelete);

    if (deleteError) {
      console.error('Error deleting duplicates:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to delete duplicates',
        details: deleteError.message 
      }, { status: 500 });
    }

    console.log('✅ Successfully deleted', idsToDelete.length, 'duplicate transactions');

    // Step 5: Try to add UNIQUE constraint (ignore if already exists)
    try {
      console.log('🔒 Attempting to add UNIQUE constraint...');
      
      // Use raw SQL to add constraint
      const { error: constraintError } = await supabaseAdmin.rpc('exec_sql', {
        sql: `
          ALTER TABLE billing_transactions 
          ADD CONSTRAINT IF NOT EXISTS unique_external_id UNIQUE (external_id);
        `
      });
      
      if (constraintError) {
        console.log('Note: Could not add constraint via RPC (this is okay, add it manually in Supabase SQL Editor)');
      } else {
        console.log('✅ UNIQUE constraint added');
      }
    } catch (e) {
      console.log('Note: Add UNIQUE constraint manually in Supabase SQL Editor if needed');
    }

    return NextResponse.json({
      success: true,
      message: `Successfully cleaned up duplicates`,
      duplicatesRemoved: idsToDelete.length,
      remainingTransactions: allTransactions.length - idsToDelete.length,
      details: {
        totalBefore: allTransactions.length,
        totalAfter: allTransactions.length - idsToDelete.length,
        duplicateGroupsFound: duplicateCount
      }
    });

  } catch (error) {
    console.error('❌ Cleanup error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

