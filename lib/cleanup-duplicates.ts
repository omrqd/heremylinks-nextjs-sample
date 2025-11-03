import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * Removes duplicate transactions for a given user email
 * Keeps the oldest transaction for each external_id
 * @param email User's email address
 * @returns Object with cleanup results
 */
export async function cleanupDuplicateTransactions(email: string) {
  console.log('🧹 Auto-cleanup: Starting duplicate cleanup for:', email);

  try {
    // Step 1: Find all transactions for this user
    const { data: allTransactions, error: fetchError } = await supabaseAdmin
      .from('billing_transactions')
      .select('id, external_id, created_at, amount')
      .eq('email', email)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('❌ Auto-cleanup: Error fetching transactions:', fetchError);
      return { success: false, error: fetchError.message, duplicatesRemoved: 0 };
    }

    if (!allTransactions || allTransactions.length === 0) {
      console.log('ℹ️ Auto-cleanup: No transactions found');
      return { success: true, duplicatesRemoved: 0, remainingTransactions: 0 };
    }

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

    groupedByExternalId.forEach((transactions, externalId) => {
      if (transactions.length > 1) {
        console.log(`🔍 Auto-cleanup: Found ${transactions.length} duplicates for external_id: ${externalId}`);
        
        // Sort by created_at (oldest first)
        transactions.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        // Keep the first (oldest), delete the rest
        const toDelete = transactions.slice(1);
        toDelete.forEach(t => {
          console.log(`  ❌ Auto-cleanup: Will delete duplicate: ID ${t.id}`);
          idsToDelete.push(t.id);
        });
        
        console.log(`  ✅ Auto-cleanup: Keeping: ID ${transactions[0].id}`);
      }
    });

    if (idsToDelete.length === 0) {
      console.log('✅ Auto-cleanup: No duplicates found');
      return { 
        success: true, 
        duplicatesRemoved: 0, 
        remainingTransactions: allTransactions.length 
      };
    }

    // Step 4: Delete duplicates
    console.log(`🗑️ Auto-cleanup: Deleting ${idsToDelete.length} duplicate transactions...`);

    const { error: deleteError } = await supabaseAdmin
      .from('billing_transactions')
      .delete()
      .in('id', idsToDelete);

    if (deleteError) {
      console.error('❌ Auto-cleanup: Error deleting duplicates:', deleteError);
      return { 
        success: false, 
        error: deleteError.message, 
        duplicatesRemoved: 0 
      };
    }

    console.log(`✅ Auto-cleanup: Successfully deleted ${idsToDelete.length} duplicates`);

    return {
      success: true,
      duplicatesRemoved: idsToDelete.length,
      remainingTransactions: allTransactions.length - idsToDelete.length
    };

  } catch (error) {
    console.error('❌ Auto-cleanup: Unexpected error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      duplicatesRemoved: 0
    };
  }
}

