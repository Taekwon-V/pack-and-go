import { adminDb } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const { inviteCode, uid, email } = await request.json();

    if (!inviteCode || !uid || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const inviteDoc = await adminDb.collection('invites').doc(inviteCode).get();
    
    if (!inviteDoc.exists) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
    }

    const inviteData = inviteDoc.data()!;
    const tripId = inviteData.tripId;

    await adminDb.collection('users').doc(uid).set({
      status: 'approved',
      email: email,
    }, { merge: true });

    await adminDb.collection('trips').doc(tripId).update({
      collaboratorIds: FieldValue.arrayUnion(uid)
    });

    return NextResponse.json({ tripId }, { status: 200 });
  } catch (error) {
    console.error('Error accepting invite:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
