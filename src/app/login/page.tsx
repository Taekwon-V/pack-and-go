'use client';

import { Suspense } from 'react';
import { GoogleAuthProvider, signInWithCustomToken, signInWithPopup } from 'firebase/auth';
import EditorialImage from '@/components/EditorialImage';
import { EDITORIAL_HERO_ALT, EDITORIAL_HERO_IMAGE } from '@/lib/editorialAssets';
import { auth } from '@/lib/firebase';

const previewAuthEnabled = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ENABLE_PREVIEW_AUTH === 'true';

function LoginContent() {
  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (error: unknown) {
      console.error('Login error details:', error);
      const err = error as { code?: string; message?: string };
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        return;
      }
      if (err.code === 'auth/unauthorized-domain') {
        alert('로그인 실패 (auth/unauthorized-domain):\nFirebase 콘솔 > Authentication > Settings > Authorized domains(승인된 도메인)에 localhost를 추가해야 합니다.');
        return;
      }
      alert(`로그인 중 오류가 발생했습니다: ${err.code || err.message || '알 수 없는 오류'}`);
    }
  };

  const handlePreviewLogin = async () => {
    try {
      const response = await fetch('/api/preview-auth', { method: 'POST' });
      const payload = (await response.json()) as { token?: string; error?: string };

      if (!response.ok || !payload.token) {
        throw new Error(payload.error || '개발 미리보기 인증을 준비하지 못했습니다.');
      }

      await signInWithCustomToken(auth, payload.token);
    } catch (error: unknown) {
      console.error('Preview login error:', error);
      alert(error instanceof Error ? error.message : '개발 미리보기 인증에 실패했습니다.');
    }
  };

  return (
    <div className="editorial-page">
      <div className="editorial-login">
        <section className="editorial-login-image" aria-labelledby="login-visual-title">
          <EditorialImage
            src={EDITORIAL_HERO_IMAGE}
            alt={EDITORIAL_HERO_ALT}
            sizes="(max-width: 900px) 100vw, 60vw"
            priority
            className="h-full w-full object-cover"
          />
          <div className="editorial-login-caption">
            <p className="editorial-kicker !text-[var(--surface)]">A shared travel journal</p>
            <h1 id="login-visual-title" className="editorial-login-title">여행을<br />기록하는 방식.</h1>
            <p className="editorial-login-copy">계획부터 사진과 예산까지, 함께 만든 여정의 모든 장면을 한 곳에 남겨보세요.</p>
          </div>
        </section>

        <section className="editorial-login-panel" aria-labelledby="login-title">
          <p className="editorial-kicker">Pack to Go / Welcome</p>
          <h2 id="login-title" className="editorial-login-panel-title">다음 장면을<br />열어보세요.</h2>
          <p className="mt-5 max-w-[30ch] text-[0.8rem] leading-[1.8] text-[var(--muted)]">
            여행 기록을 확인하려면 Google 계정으로 계속해 주세요.
          </p>
          <button type="button" onClick={handleGoogleLogin} className="editorial-google-button editorial-focus mt-10">
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google 계정으로 계속하기
          </button>
          {previewAuthEnabled && (
            <div className="mt-5 border-t border-[var(--rule)] pt-5">
              <button
                type="button"
                onClick={handlePreviewLogin}
                className="editorial-button editorial-focus w-full"
              >
                로컬 미리보기로 열기
              </button>
              <p className="mt-3 text-center text-[0.6rem] leading-[1.7] text-[var(--muted)]">
                개발 환경에서만 표시되는 테스트 로그인입니다.
              </p>
            </div>
          )}
          <p className="mt-5 text-[0.62rem] leading-[1.7] text-[var(--muted)]">초대받은 멤버만 여행 기록에 접근할 수 있습니다.</p>
        </section>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="editorial-page editorial-main">
          <div className="editorial-container">
            <StateFallback />
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

function StateFallback() {
  return (
    <section className="editorial-state-panel" role="status" aria-live="polite">
      <div className="editorial-state-skeleton" aria-hidden="true"><span /><span /><span /></div>
      <p className="editorial-state-title">Pack to Go를 여는 중입니다</p>
    </section>
  );
}
