'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
      setAuthorized(true);
      setLoading(false);
      // Optional: still listen to auth state in background, but immediately authorize
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!isDev) {
          if (pathname !== '/login') {
            router.push('/login');
          } else {
            setLoading(false);
          }
        }
        return;
      }

      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          
          if (userData.status === 'pending') {
            if (pathname !== '/pending') {
              router.push('/pending');
            } else {
              setAuthorized(true);
            }
          } else if (userData.status === 'approved') {
            if (pathname === '/login' || pathname === '/pending') {
              router.push('/');
            } else {
              setAuthorized(true);
            }
          } else {
            // Unknown status
            router.push('/login');
          }
        } else {
          // Document might not be written yet, or error occurred during login
          if (pathname !== '/login') {
            router.push('/login');
          }
        }
      } catch (error) {
        console.error('Error fetching user status:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, pathname]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Allow rendering of public routes without full authorization check
  if (pathname === '/login' || pathname === '/pending' || pathname.startsWith('/api/') || pathname.startsWith('/invite/')) {
    return <>{children}</>;
  }

  return authorized ? <>{children}</> : null;
}
