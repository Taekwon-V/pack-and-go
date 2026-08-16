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
  
  const navLinks = [
    { name: '내 여행', href: '/trips' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#18181b]/90 backdrop-blur-xl">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link 
              href="/" 
              className="flex items-center gap-3 text-xl font-bold tracking-tighter text-white transition-colors hover:text-gray-300"
            >
              Pack to GO
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            {!loading && (
              user ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-900/50 text-sm font-bold text-emerald-400">
                      {(user.displayName || user.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden text-sm font-medium text-gray-300 sm:block">
                      {user.displayName || user.email?.split('@')[0]}
                    </span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
                  >
                    로그아웃
                  </button>
                </div>
              ) : (
                <Link href="/login" className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
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
