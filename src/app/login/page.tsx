'use client';

import { auth, db } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get('invite');

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      let isNewUser = false;

      if (!userSnap.exists()) {
        isNewUser = true;
        const isAdmin = user.email === 'inchul17.kim@gmail.com';
        const initialStatus = isAdmin ? 'approved' : 'pending';
        const role = isAdmin ? 'admin' : 'user';

        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          status: initialStatus,
          role: role,
          createdAt: new Date(),
        });

        if (!isAdmin && !inviteCode) {
          // Request approval if no invite
          await fetch('/api/request-approval', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              uid: user.uid,
              email: user.email,
            }),
          });
        }
      }

      // Read user data to determine routing
      const updatedSnap = await getDoc(userRef);
      if (updatedSnap.exists()) {
        const userData = updatedSnap.data();
        const finalUserData = userData;
        
        if (inviteCode && (isNewUser || userData.status === 'pending')) {
          try {
            const { arrayUnion, updateDoc } = await import('firebase/firestore');
            
            // 1. Get invite doc
            const inviteRef = doc(db, 'invites', inviteCode);
            const inviteSnap = await getDoc(inviteRef);

            if (inviteSnap.exists()) {
              const inviteData = inviteSnap.data();
              const tripId = inviteData.tripId;

              // 2. Set user as approved
              await setDoc(userRef, {
                status: 'approved',
                email: user.email,
              }, { merge: true });

              // 3. Add user to trip collaborators
              await updateDoc(doc(db, 'trips', tripId), {
                collaboratorIds: arrayUnion(user.uid)
              });

              router.push(`/trips/${tripId}`);
              return;
            }
          } catch (err) {
            console.error('Error accepting invite during login:', err);
          }
        }

        // Fallback routing if invite processing fails or no invite
        const finalSnap = await getDoc(userRef);
        const finalStatus = finalSnap.exists() ? finalSnap.data().status : 'pending';
        
        if (finalStatus === 'pending') {
          router.push('/pending');
        } else {
          router.push('/');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Failed to login. Check console for details.');
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-6">투어 앱에 오신 것을 환영합니다</h1>
        <button
          onClick={handleGoogleLogin}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Google 계정으로 로그인
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-gray-100">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
