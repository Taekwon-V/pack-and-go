import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }

    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await userRef.update({
      status: 'approved',
    });

    return NextResponse.json({ success: true, message: 'User approved successfully. You can now close this tab.' });
  } catch (error) {
    console.error('Error approving user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
