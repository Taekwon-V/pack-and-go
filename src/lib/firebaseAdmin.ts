import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dummy-project-id',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'dummy@dummy.com',
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '-----BEGIN PRIVATE KEY-----\ndummy\n-----END PRIVATE KEY-----',
    }),
  });
}

export const adminDb = getFirestore();
export const adminAuth = getAuth();
