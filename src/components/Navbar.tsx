'use client';

import Image from 'next/image';
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
          <Image
            src="/pack-to-go-logo.png"
            alt="Pack to Go"
            width={587}
            height={185}
            priority
            className="editorial-brand-logo-img"
          />
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
