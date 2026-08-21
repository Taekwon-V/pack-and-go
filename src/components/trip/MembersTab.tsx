import { useState } from 'react';
import { arrayRemove, arrayUnion, doc, setDoc, updateDoc } from 'firebase/firestore';
import { Crown, Loader2, Mail, Plus, ShieldCheck, UserX, Users } from 'lucide-react';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import type { UserProfile } from './types';

interface Trip {
  id: string;
  ownerId?: string;
  collaboratorIds?: string[];
  collaboratorEmails?: string[];
}

export default function MembersTab({
  trip,
  userProfiles,
  onUpdate,
}: {
  trip: Trip;
  userProfiles: Record<string, UserProfile>;
  onUpdate: () => void;
}) {
  const [emailInput, setEmailInput] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddMember = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!emailInput.trim()) return;

    setErrorMsg('');
    setAddLoading(true);
    try {
      const email = emailInput.trim().toLowerCase();
      if (trip.collaboratorEmails?.includes(email)) {
        setErrorMsg('이미 참여 중인 이메일입니다.');
        return;
      }

      await updateDoc(doc(db, 'trips', trip.id), { collaboratorEmails: arrayUnion(email) });
      await setDoc(doc(db, 'allowed_emails', email), { addedAt: new Date(), source: 'trip_invite' }, { merge: true });
      setEmailInput('');
      onUpdate();
    } catch (error) {
      console.error('Error adding member:', error);
      setErrorMsg('멤버 추가 중 오류가 발생했습니다.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveEmail = async (email: string) => {
    if (!confirm(`${email} 님을 여행에서 제외하시겠습니까?`)) return;
    try {
      await updateDoc(doc(db, 'trips', trip.id), { collaboratorEmails: arrayRemove(email) });
      onUpdate();
    } catch (error) {
      console.error(error);
      alert('초대 취소 중 오류가 발생했습니다.');
    }
  };

  const handleRemoveMember = async (uid: string) => {
    if (!confirm('이 멤버를 여행에서 제외하시겠습니까?')) return;
    try {
      await updateDoc(doc(db, 'trips', trip.id), { collaboratorIds: arrayRemove(uid) });
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
    <section className="editorial-section !pt-0" aria-labelledby="members-title">
      <div className="editorial-section-heading">
        <div>
          <p className="editorial-kicker">Members</p>
          <h2 id="members-title" className="editorial-display mt-4 text-[clamp(1.95rem,4vw,3.35rem)] leading-[1.03]">
            함께 쓰는 여정.
          </h2>
        </div>
        <span className="hidden text-right text-[0.62rem] font-bold uppercase tracking-[0.15em] text-[var(--muted)] sm:block">
          {uniqueUids.length + collaboratorEmails.length} travellers<br />Shared access / invite
        </span>
      </div>

      <div className="editorial-member-layout mt-10">
        <div className="editorial-member-list">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h3 className="editorial-kicker"><Users className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" /> Travellers</h3>
            <span className="text-[0.62rem] font-bold text-[var(--muted)]">{uniqueUids.length} joined</span>
          </div>

          {uniqueUids.map((uid) => {
            const profile = userProfiles[uid] || {};
            const isOwner = uid === trip.ownerId;
            const initial = profile.displayName?.charAt(0) || profile.email?.charAt(0) || '?';
            return (
              <div key={uid} className="editorial-member-row">
                <div className="editorial-member-identity">
                  <div className="editorial-member-avatar">
                    {profile.photoURL ? (
                      <Image src={profile.photoURL} alt={`${profile.displayName || '멤버'} 프로필`} fill sizes="44px" className="object-cover" />
                    ) : (
                      initial.toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <h4 className="editorial-member-name">{profile.displayName || '이름 없음'}</h4>
                      <span className="editorial-member-role">
                        {isOwner ? <><Crown className="mr-1 inline h-3 w-3" aria-hidden="true" /> 방장</> : <><ShieldCheck className="mr-1 inline h-3 w-3" aria-hidden="true" /> 멤버</>}
                      </span>
                    </div>
                    <p className="editorial-member-email">{profile.email || '이메일 정보 없음'}</p>
                  </div>
                </div>
                {!isOwner && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(uid)}
                    className="editorial-icon-button editorial-focus"
                    title="멤버 내보내기"
                    aria-label={`${profile.displayName || '멤버'} 내보내기`}
                  >
                    <UserX className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            );
          })}

          {collaboratorEmails.map((email) => {
            const alreadyRendered = uniqueUids.some((uid) => userProfiles[uid]?.email === email);
            if (alreadyRendered) return null;
            return (
              <div key={email} className="editorial-member-row">
                <div className="editorial-member-identity">
                  <span className="editorial-member-avatar">{email.charAt(0).toUpperCase()}</span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <h4 className="editorial-member-name">초대된 멤버</h4>
                      <span className="editorial-member-role">가입 대기중</span>
                    </div>
                    <p className="editorial-member-email">{email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveEmail(email)}
                  className="editorial-icon-button editorial-focus"
                  title="초대 취소"
                  aria-label={`${email} 초대 취소`}
                >
                  <UserX className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>

        <aside className="editorial-invite-panel">
          <p className="editorial-kicker">Invite a traveller</p>
          <h3 className="editorial-display mt-4 text-[2rem] leading-none">새로운 장면을<br />함께 채워보세요.</h3>
          <p className="mt-5 text-[0.78rem] leading-[1.8] text-[var(--muted)]">
            함께할 Google 이메일을 입력하면 바로 여행 기록에 초대할 수 있습니다.
          </p>
          <form onSubmit={handleAddMember} className="mt-8">
            <label htmlFor="member-email" className="editorial-form-label">Google email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--terra)]" aria-hidden="true" />
              <input
                id="member-email"
                type="email"
                value={emailInput}
                onChange={(event) => setEmailInput(event.target.value)}
                placeholder="example@gmail.com"
                className="editorial-input pl-10"
                required
                aria-describedby={errorMsg ? 'member-email-error' : undefined}
              />
            </div>
            {errorMsg && <p id="member-email-error" className="mt-3 text-[0.72rem] font-bold text-[var(--terra)]" role="alert">{errorMsg}</p>}
            <button type="submit" disabled={addLoading || !emailInput} className="editorial-button editorial-focus mt-4 w-full disabled:cursor-not-allowed disabled:opacity-45">
              {addLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
              {addLoading ? 'Sending invite' : 'Add traveller'}
            </button>
          </form>
        </aside>
      </div>
    </section>
  );
}
