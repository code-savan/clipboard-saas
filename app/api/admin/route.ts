import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserByEmail } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get the session from the request
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || !session.user) {
      return NextResponse.json({
        isAdmin: false,
        authenticated: false,
        message: 'Not authenticated'
      }, { status: 401 });
    }

    // Check if the user is an admin
    const userDetails = await getUserByEmail(session.user.email!);
    const isAdmin = userDetails?.is_admin || false;

    return NextResponse.json({
      isAdmin,
      authenticated: true,
      email: session.user.email
    });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json({
      error: 'Failed to check admin status',
      isAdmin: false,
      authenticated: false
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || !session.user) {
      return NextResponse.json({
        success: false,
        message: 'Not authenticated'
      }, { status: 401 });
    }

    // Check if the user is an admin
    const userDetails = await getUserByEmail(session.user.email!);

    if (!userDetails?.is_admin) {
      return NextResponse.json({
        success: false,
        message: 'Not authorized'
      }, { status: 403 });
    }

    // Process admin request
    const data = await request.json();

    // This is where you would implement admin-specific API actions
    // For now, just return success
    return NextResponse.json({
      success: true,
      message: 'Admin API access successful',
      receivedData: data
    });
  } catch (error) {
    console.error('Error in admin API:', error);
    return NextResponse.json({
      success: false,
      message: 'Server error'
    }, { status: 500 });
  }
}
