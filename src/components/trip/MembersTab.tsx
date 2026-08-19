import { useState } from 'react';
import { doc, updateDoc, arrayRemove, arrayUnion, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Users, Mail, UserX, Crown, ShieldCheck, Loader2, Plus } from 'lucide-react';
import Image from 'next/image';

interface Trip {
  id: string;
  ownerId: string;
  collaboratorIds?: string[];
  collaboratorEmails?: string[];
  [key: string]: any;
}

export default function MembersTab({ 
  trip, 
  userProfiles, 
  onUpdate 
}: { 
  trip: Trip, 
  userProfiles: Record<string, any>,
  onUpdate: () => void 
}) {
  const [emailInput, setEmailInput] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 이메일로 직접 추가하기
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    
    setErrorMsg('');
    setAddLoading(true);
    try {
      const email = emailInput.trim().toLowerCase();

      if (trip.collaboratorEmails && trip.collaboratorEmails.includes(email)) {
        setErrorMsg('이미 참여 중인 이메일입니다.');
        setAddLoading(false);
        return;
      }

      // Add to trip's collaboratorEmails
      const tripRef = doc(db, 'trips', trip.id);
      await updateDoc(tripRef, {
        collaboratorEmails: arrayUnion(email)
      });

      // Also add to global allowed_emails so they can log in
      const allowedRef = doc(db, 'allowed_emails', email);
      await setDoc(allowedRef, { addedAt: new Date(), source: 'trip_invite' }, { merge: true });

      setEmailInput('');
      onUpdate(); // Trigger parent re-fetch
    } catch (error: any) {
      console.error('Error adding member:', error);
      setErrorMsg('멤버 추가 중 오류가 발생했습니다.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveEmail = async (email: string) => {
    if (!confirm(`${email} 님을 여행에서 제외하시겠습니까?`)) return;
    
    try {
      const tripRef = doc(db, 'trips', trip.id);
      await updateDoc(tripRef, {
        collaboratorEmails: arrayRemove(email)
      });
      onUpdate();
    } catch (error) {
      console.error(error);
      alert('멤버 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleRemoveMember = async (uid: string) => {
    if (!confirm('이 멤버를 여행에서 제외하시겠습니까?')) return;
    
    try {
      const tripRef = doc(db, 'trips', trip.id);
      await updateDoc(tripRef, {
        collaboratorIds: arrayRemove(uid)
      });
      onUpdate();
    } catch (error) {
      console.error(error);
      alert('멤버 삭제 중 오류가 발생했습니다.');
    }
  };

  const participantsUids = [trip.ownerId, ...(trip.collaboratorIds || [])];
  const uniqueUids = Array.from(new Set(participantsUids)).filter(Boolean) as string[];
  const collaboratorEmails = trip.collaboratorEmails || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* 왼쪽: 멤버 리스트 */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 flex items-center">
                <Users className="w-6 h-6 mr-3 text-indigo-600" />
                참여 멤버
              </h2>
              <p className="text-sm text-slate-500 mt-1">이 여행을 함께할 멤버 목록입니다.</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* 가입된 UID 멤버들 (기존 멤버) */}
            {uniqueUids.map((uid) => {
              const profile = userProfiles[uid] || {};
              const isOwner = uid === trip.ownerId;
              const initial = profile.displayName?.charAt(0) || profile.email?.charAt(0) || '?';

              return (
                <div key={uid} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-indigo-100 hover:shadow-sm transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-lg font-bold text-indigo-600 shadow-sm overflow-hidden">
                      {profile.photoURL ? (
                        <Image src={profile.photoURL} alt="Profile" fill className="object-cover" sizes="48px" />
                      ) : (
                        initial.toUpperCase()
                      )}
                      {isOwner && (
                        <div className="absolute -bottom-1 -right-1 bg-amber-400 p-0.5 rounded-full border border-white">
                          <Crown className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900">{profile.displayName || '이름 없음'}</h4>
                        {isOwner ? (
                          <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-md font-bold flex items-center">
                            <ShieldCheck className="w-3 h-3 mr-1" /> 방장
                          </span>
                        ) : (
                          <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-md font-medium">
                            멤버
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{profile.email || '이메일 정보 없음'}</p>
                    </div>
                  </div>
                  
                  {!isOwner && (
                    <button 
                      onClick={() => handleRemoveMember(uid)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                      title="내보내기"
                    >
                      <UserX className="w-5 h-5" />
                    </button>
                  )}
                </div>
              );
            })}

            {/* 이메일로만 추가된 멤버들 (아직 로그인 전이거나 프로필 연결 안 됨) */}
            {collaboratorEmails.map((email) => {
              const alreadyRendered = uniqueUids.some(uid => userProfiles[uid]?.email === email);
              if (alreadyRendered) return null;

              return (
                <div key={email} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-indigo-100 hover:shadow-sm transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-lg font-bold text-slate-500 shadow-sm overflow-hidden">
                      {email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-700">초대된 멤버</h4>
                        <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-md font-medium">
                          가입 대기중
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">{email}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleRemoveEmail(email)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                    title="초대 취소"
                  >
                    <UserX className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 오른쪽: 초대하기 패널 */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-2">이메일로 멤버 추가</h3>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            여행을 함께할 구글 이메일을 입력하세요. 추가된 이메일은 즉시 앱에 로그인하고 여행을 볼 수 있습니다.
          </p>
          
          <form onSubmit={handleAddMember} className="space-y-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="example@gmail.com"
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                required
              />
            </div>
            
            {errorMsg && <p className="text-sm text-rose-500 font-medium">{errorMsg}</p>}
            
            <button 
              type="submit"
              disabled={addLoading || !emailInput}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  멤버 추가하기
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
