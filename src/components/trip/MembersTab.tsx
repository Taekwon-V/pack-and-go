import { useState } from 'react';
import { doc, updateDoc, arrayRemove, arrayUnion, getDocs, collection, query, where, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Users, Mail, Link as LinkIcon, UserX, Crown, ShieldCheck, CheckCircle2, Loader2, Plus } from 'lucide-react';
import Image from 'next/image';

interface Trip {
  id: string;
  ownerId: string;
  collaboratorIds?: string[];
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
  const [inviteLoading, setInviteLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [emailInput, setEmailInput] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. 링크로 초대하기 (API 호출)
  const generateInviteLink = async () => {
    try {
      setInviteLoading(true);
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId: trip.id, createdBy: trip.ownerId })
      });
      const data = await res.json();
      
      if (res.ok) {
        const inviteUrl = `${window.location.origin}/join/${data.inviteCode}`;
        await navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } else {
        alert(data.error || '초대 링크 생성 실패');
      }
    } catch (error) {
      console.error(error);
      alert('오류가 발생했습니다.');
    } finally {
      setInviteLoading(false);
    }
  };

  // 2. 이메일로 직접 추가하기 (이메일로 UID 찾아서 업데이트)
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    
    setErrorMsg('');
    setAddLoading(true);
    try {
      // Find user by email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', emailInput.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setErrorMsg('가입되지 않은 이메일입니다. 먼저 서비스를 가입해야 합니다.');
        setAddLoading(false);
        return;
      }

      const newMemberUid = querySnapshot.docs[0].id;

      if (newMemberUid === trip.ownerId || (trip.collaboratorIds && trip.collaboratorIds.includes(newMemberUid))) {
        setErrorMsg('이미 참여 중인 멤버입니다.');
        setAddLoading(false);
        return;
      }

      // Add to collaboratorIds
      const tripRef = doc(db, 'trips', trip.id);
      await updateDoc(tripRef, {
        collaboratorIds: arrayUnion(newMemberUid)
      });

      setEmailInput('');
      onUpdate(); // Trigger parent re-fetch
    } catch (error) {
      console.error(error);
      setErrorMsg('멤버 추가 중 오류가 발생했습니다.');
    } finally {
      setAddLoading(false);
    }
  };

  // 3. 멤버 내보내기
  const handleRemoveMember = async (uidToRemove: string) => {
    if (!confirm('정말 이 멤버를 여행에서 제외하시겠습니까?')) return;
    
    try {
      const tripRef = doc(db, 'trips', trip.id);
      await updateDoc(tripRef, {
        collaboratorIds: arrayRemove(uidToRemove)
      });
      onUpdate(); // Trigger parent re-fetch
    } catch (error) {
      console.error(error);
      alert('멤버 삭제 중 오류가 발생했습니다.');
    }
  };

  const participants = [trip.ownerId, ...(trip.collaboratorIds || [])];
  const uniqueParticipants = Array.from(new Set(participants)).filter(Boolean) as string[];

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
              <p className="text-sm text-slate-500 mt-1">총 {uniqueParticipants.length}명이 이 여행을 함께하고 있습니다.</p>
            </div>
          </div>

          <div className="space-y-4">
            {uniqueParticipants.map((uid) => {
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
          </div>
        </div>
      </div>

      {/* 오른쪽: 초대하기 패널 */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-2">초대 링크 만들기</h3>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            여행을 함께할 친구에게 링크를 전달하세요. 링크를 통해 가입하면 자동으로 여행에 참여됩니다.
          </p>
          
          <button 
            onClick={generateInviteLink}
            disabled={inviteLoading}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold transition-all ${
              copied 
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg'
            }`}
          >
            {inviteLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : copied ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                링크가 복사되었습니다
              </>
            ) : (
              <>
                <LinkIcon className="w-5 h-5" />
                초대 링크 복사하기
              </>
            )}
          </button>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-2">이메일로 직접 추가</h3>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            이미 가입된 회원의 구글 이메일을 입력하여 즉시 여행에 초대할 수 있습니다.
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
