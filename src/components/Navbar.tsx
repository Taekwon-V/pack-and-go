"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const isDev = process.env.NODE_ENV === 'development';
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else if (isDev) {
        setUser({ displayName: 'Dev User', email: 'dev@localhost' } as any);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };
  
  const navLinks = [
    { name: '내 여행', href: '/trips' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link 
              href="/" 
              className="flex items-center gap-3 text-xl font-bold tracking-tighter text-slate-900 transition-colors hover:text-slate-600"
            >
              Pack to GO
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            {!loading && (
              user ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-900/50 text-sm font-bold text-indigo-400">
                      {(user.displayName || user.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden text-sm font-medium text-slate-700 sm:block">
                      {user.displayName || user.email?.split('@')[0]}
                    </span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    로그아웃
                  </button>
                </div>
              ) : (
                <Link href="/login" className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                  로그인
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
