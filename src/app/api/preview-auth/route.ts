import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const PREVIEW_UID = 'pack-to-go-preview';
const PREVIEW_EMAIL = 'preview@pack-to-go.local';
const PREVIEW_DISPLAY_NAME = 'Local Preview';

function isPreviewAuthEnabled(request: Request): boolean {
  if (process.env.NODE_ENV !== 'development' || process.env.ENABLE_PREVIEW_AUTH !== 'true') {
    return false;
  }

  const host = request.headers.get('host')?.split(':')[0].toLowerCase();
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
}

export async function POST(request: Request) {
  if (!isPreviewAuthEnabled(request)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const { adminAuth, adminDb } = await import('@/lib/firebaseAdmin');

    try {
      await adminAuth.getUser(PREVIEW_UID);
    } catch (error: unknown) {
      const errorCode = typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
      if (errorCode !== 'auth/user-not-found') throw error;

      await adminAuth.createUser({
        uid: PREVIEW_UID,
        email: PREVIEW_EMAIL,
        displayName: PREVIEW_DISPLAY_NAME,
        emailVerified: true,
      });
    }

    await adminDb.collection('users').doc(PREVIEW_UID).set(
      {
        email: PREVIEW_EMAIL,
        displayName: PREVIEW_DISPLAY_NAME,
        photoURL: null,
        status: 'approved',
        role: 'admin',
        source: 'local-preview',
        updatedAt: new Date(),
      },
      { merge: true },
    );

    const token = await adminAuth.createCustomToken(PREVIEW_UID, {
      preview: true,
      role: 'admin',
    });

    return NextResponse.json({ token });
  } catch (error: unknown) {
    console.error('Preview auth error:', error);
    return NextResponse.json(
      { error: '개발 미리보기 인증을 준비하지 못했습니다. Firebase Admin 환경 변수를 확인해주세요.' },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
