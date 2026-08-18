'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Plane, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function InviteAcceptPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  
  const [status, setStatus] = useState<'checking' | 'accepting' | 'success' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        // Redirect to login with invite param to return back after login
        router.push(`/login?invite=${code}`);
        return;
      }

      await acceptInvite(currentUser, code);
    });

    return () => unsubscribe();
  }, [code, router]);

  const acceptInvite = async (user: User, inviteCode: string) => {
    setStatus('accepting');
    try {
      const { doc, getDoc, setDoc, updateDoc, arrayUnion } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');

      // 1. Get invite doc
      const inviteRef = doc(db, 'invites', inviteCode);
      const inviteSnap = await getDoc(inviteRef);

      if (!inviteSnap.exists()) {
        setErrorMessage('유효하지 않은 초대 코드입니다.');
        setStatus('error');
        return;
      }

      const inviteData = inviteSnap.data();
      const tripId = inviteData.tripId;

      // 2. Set user as approved
      await setDoc(doc(db, 'users', user.uid), {
        status: 'approved',
        email: user.email,
      }, { merge: true });

      // 3. Add user to trip collaborators
      await updateDoc(doc(db, 'trips', tripId), {
        collaboratorIds: arrayUnion(user.uid)
      });

      setStatus('success');
      setTimeout(() => {
        router.push(`/trips/${tripId}`);
      }, 2000);

    } catch (error) {
      console.error("Error accepting invite:", error);
      setErrorMessage('네트워크 오류가 발생했습니다.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        
        <div className="mb-8 flex justify-center">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
            <Plane className="w-8 h-8" />
          </div>
        </div>

        {status === 'checking' && (
          <div>
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">계정 확인 중...</h2>
            <p className="text-slate-500">로그인 상태를 확인하고 있습니다.</p>
          </div>
        )}

        {status === 'accepting' && (
          <div>
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">초대 수락 중...</h2>
            <p className="text-slate-500">여행 멤버로 합류하고 있습니다.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="animate-in fade-in zoom-in duration-300">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">환영합니다!</h2>
            <p className="text-slate-500 mb-6">여행 멤버가 되었습니다. 곧 여행 페이지로 이동합니다.</p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-full animate-[shrink_2s_linear_forwards]" style={{ transformOrigin: 'left' }} />
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="animate-in fade-in zoom-in duration-300">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">오류 발생</h2>
            <p className="text-slate-500 mb-8">{errorMessage}</p>
            <button 
              onClick={() => router.push('/trips')}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-semibold transition-colors"
            >
              내 여행으로 가기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
