import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// DELETE - Delete sent email record
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

    const emailId = params.id;

    // Get email info for logging
    const { data: email } = await supabaseAdmin
      .from('sent_emails')
      .select('subject, from_email')
      .eq('id', emailId)
      .single();

    // Delete email record (recipients will be cascade deleted)
    const { error: deleteError } = await supabaseAdmin
      .from('sent_emails')
      .delete()
      .eq('id', emailId);

    if (deleteError) {
      console.error('Error deleting email:', deleteError);
      return NextResponse.json({ error: 'Failed to delete email' }, { status: 500 });
    }

    // Log the action
    if (email) {
      await supabaseAdmin.from('admin_logs').insert({
        admin_email: session.user.email,
        action: 'delete_sent_email',
        details: `Deleted sent email "${email.subject}" from ${email.from_email}`,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Email record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting email:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

