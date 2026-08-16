'use client';

import { auth, db } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Automatically approve admin
        const isAdmin = user.email === 'inchul17.kim@gmail.com';
        const initialStatus = isAdmin ? 'approved' : 'pending';
        const role = isAdmin ? 'admin' : 'user';

        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName,
          status: initialStatus,
          role: role,
          createdAt: new Date(),
        });

        if (!isAdmin) {
          // Request approval
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
        if (userData.status === 'pending') {
          router.push('/pending');
        } else if (userData.status === 'approved') {
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
        <h1 className="text-2xl font-bold mb-6">Welcome to Tour App</h1>
        <button
          onClick={handleGoogleLogin}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
