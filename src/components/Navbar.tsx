'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const isLoginPage = pathname === '/login';
  const profileLabel = user?.displayName || user?.email?.split('@')[0] || '여행자';
  const profileInitial = profileLabel.charAt(0).toUpperCase();

  return (
    <header className="editorial-nav">
      <div className="editorial-container editorial-nav-inner">
        <Link href="/" className="editorial-brand editorial-focus" aria-label="Pack to Go 홈">
          <span className="editorial-brand-name">Pack to Go</span>
          <svg
            className="editorial-brand-badge"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9.5" strokeDasharray="2 2" opacity="0.75" />
            <path d="M12 18V8" strokeWidth="1.5" />
            <path d="M12 8c-2-2-4-1-6 0 1.5 2 3.5 1.5 6 0z" fill="currentColor" fillOpacity="0.25" />
            <path d="M12 8c2-2 4-1 6 0-1.5 2-3.5 1.5-6 0z" fill="currentColor" fillOpacity="0.25" />
            <path d="M12 11c-1.5-1.5-3-0.5-4.5 0.5 1 1.5 2.5 1 4.5-0.5z" fill="currentColor" fillOpacity="0.2" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          </svg>
          <span className="editorial-brand-note">Travel / Shared / Remembered</span>
        </Link>

        <div className="editorial-nav-links">
          {!loading && user && !isLoginPage && (
            <div className="editorial-nav-user">
              <span className="editorial-avatar" aria-hidden="true">
                {profileInitial}
              </span>
              <span className="editorial-nav-username">{profileLabel}</span>
              <span className="editorial-nav-divider" aria-hidden="true" />
              <button
                type="button"
                onClick={handleLogout}
                className="editorial-nav-action editorial-focus"
              >
                Log Out
              </button>
            </div>
          )}

          {!loading && !user && !isLoginPage && (
            <Link href="/login" className="editorial-nav-link editorial-focus">
              Log In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
