import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// DELETE - Delete promo code
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('users')
      .select('id, is_admin, admin_role')
      .eq('email', session.user.email)
      .single();

    if (adminError || !adminUser?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const promoCodeId = params.id;

    // Get promo code info before deleting
    const { data: promoCode } = await supabaseAdmin
      .from('promo_codes')
      .select('code, current_redemptions')
      .eq('id', promoCodeId)
      .single();

    if (!promoCode) {
      return NextResponse.json({ error: 'Promo code not found' }, { status: 404 });
    }

    // Delete promo code (will cascade delete redemptions)
    const { error: deleteError } = await supabaseAdmin
      .from('promo_codes')
      .delete()
      .eq('id', promoCodeId);

    if (deleteError) {
      console.error('Error deleting promo code:', deleteError);
      return NextResponse.json({ error: 'Failed to delete promo code' }, { status: 500 });
    }

    // Log admin action
    await supabaseAdmin
      .from('admin_logs')
      .insert({
        admin_id: adminUser.id,
        action: 'delete_promo_code',
        target_type: 'promo_code',
        target_id: promoCodeId,
        details: {
          code: promoCode.code,
          redemptions: promoCode.current_redemptions
        }
      });

    console.log('✅ Promo code deleted:', promoCode.code);

    return NextResponse.json({
      success: true,
      message: 'Promo code deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /api/admin/promos/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

