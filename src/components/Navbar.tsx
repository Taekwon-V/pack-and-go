"use client";

import Link from 'next/link';
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
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/50 bg-white/60 backdrop-blur-xl dark:border-gray-800/50 dark:bg-zinc-950/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-xl font-bold tracking-tighter text-indigo-600 dark:text-indigo-400 transition-colors hover:text-indigo-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12 4.75a7.25 7.25 0 110 14.5 7.25 7.25 0 010-14.5zM12 7a.75.75 0 00-.75.75v3.5L8.72 13.78a.75.75 0 001.06 1.06l2.97-2.97V7.75A.75.75 0 0012 7z" />
              </svg>
              Tour
            </Link>
            <nav className="hidden md:flex gap-6">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link 
                    key={link.name}
                    href={link.href} 
                    className={`text-sm font-medium transition-all duration-200 ease-in-out relative py-1 ${
                      isActive 
                        ? 'text-indigo-600 dark:text-indigo-400' 
                        : 'text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-300'
                    }`}
                  >
                    {link.name}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            {!loading && (
              user ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                      {(user.displayName || user.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden text-sm font-medium text-gray-700 dark:text-gray-300 sm:block">
                      {user.displayName || user.email?.split('@')[0]}
                    </span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
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
