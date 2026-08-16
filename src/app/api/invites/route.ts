import { adminDb } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { tripId, createdBy } = await request.json();

    if (!tripId || !createdBy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const inviteCode = crypto.randomBytes(4).toString('hex');

    await adminDb.collection('invites').doc(inviteCode).set({
      tripId,
      createdBy,
      createdAt: new Date(),
    });

    return NextResponse.json({ inviteCode }, { status: 200 });
  } catch (error) {
    console.error('Error creating invite:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
