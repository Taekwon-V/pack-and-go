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
        const email = user.email;
        if (!email) {
          await auth.signOut();
          router.push('/login');
          return;
        }

        let isApproved = false;
        
        // 1. Check if admin
        if (email === 'inchul17.kim@gmail.com') {
          isApproved = true;
        } else {
          // 2. Check if email is explicitly allowed globally
          const { doc, getDoc, collection, query, where, getDocs, setDoc } = await import('firebase/firestore');
          const allowedDoc = await getDoc(doc(db, 'allowed_emails', email));
          
          if (allowedDoc.exists()) {
            isApproved = true;
          } else {
            // 3. Check if they are a collaborator in ANY trip via collaboratorEmails
            const tripsQuery = query(collection(db, 'trips'), where('collaboratorEmails', 'array-contains', email));
            const tripsSnap = await getDocs(tripsQuery);
            if (!tripsSnap.empty) {
              isApproved = true;
              // Auto-add to allowed_emails for performance
              await setDoc(doc(db, 'allowed_emails', email), { addedAt: new Date(), source: 'trip_collaborator' });
            } else {
              // Backward compatibility: check if they are in collaboratorIds
              const oldTripsQuery = query(collection(db, 'trips'), where('collaboratorIds', 'array-contains', user.uid));
              const oldTripsSnap = await getDocs(oldTripsQuery);
              if (!oldTripsSnap.empty) {
                isApproved = true;
                await setDoc(doc(db, 'allowed_emails', email), { addedAt: new Date(), source: 'legacy_collaboratorId' });
              }
            }
          }
        }

        if (isApproved) {
          // Ensure user document exists and is marked approved
          const { doc, getDoc, setDoc } = await import('firebase/firestore');
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              status: 'approved',
              role: email === 'inchul17.kim@gmail.com' ? 'admin' : 'user',
              createdAt: new Date()
            });
          } else if (userSnap.data().status !== 'approved') {
            await setDoc(userRef, { status: 'approved' }, { merge: true });
          }

          if (pathname === '/login') {
            router.push('/');
          } else {
            setAuthorized(true);
          }
        } else {
          // Not approved
          await auth.signOut();
          alert("접근 권한이 없습니다. 관리자에게 이메일 등록을 요청하세요.");
          if (pathname !== '/login') router.push('/login');
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
  if (pathname === '/login' || pathname.startsWith('/api/')) {
    return <>{children}</>;
  }

  return authorized ? <>{children}</> : null;
}
