import { useEffect, useState } from 'react';
import { arrayRemove, arrayUnion, collection, doc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { Check, Crown, Loader2, Mail, Plus, Search, ShieldCheck, UserPlus, UserX, Users } from 'lucide-react';
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

  // App users state
  const [appUsers, setAppUsers] = useState<(UserProfile & { uid: string })[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [addingUid, setAddingUid] = useState<string | null>(null);
  const [showManualInvite, setShowManualInvite] = useState(false);

  const participantsUids = [trip.ownerId, ...(trip.collaboratorIds || [])];
  const uniqueUids = Array.from(new Set(participantsUids)).filter(Boolean) as string[];
  const rawCollaboratorEmails = trip.collaboratorEmails || [];

  // Filter out any emails that already belong to a joined member
  const pendingEmails = rawCollaboratorEmails.filter(
    (email) =>
      !uniqueUids.some(
        (uid) => userProfiles[uid]?.email?.toLowerCase().trim() === email.toLowerCase().trim(),
      ),
  );

  // Fetch all registered users in the app
  useEffect(() => {
    async function fetchAppUsers() {
      try {
        setLoadingUsers(true);
        const usersSnap = await getDocs(collection(db, 'users'));
        const usersList: (UserProfile & { uid: string })[] = [];
        usersSnap.forEach((docSnap) => {
          const data = docSnap.data();
          if (docSnap.id === 'pack-to-go-preview') return;
          usersList.push({
            uid: docSnap.id,
            email: data.email || '',
            displayName: data.displayName || '이름 없음',
            photoURL: data.photoURL || '',
            role: data.role,
          });
        });
        setAppUsers(usersList);
      } catch (err) {
        console.error('Failed to fetch app users:', err);
      } finally {
        setLoadingUsers(false);
      }
    }
    fetchAppUsers();
  }, []);

  const handleAddAppUser = async (user: UserProfile & { uid: string }) => {
    if (!user.email || !user.uid) return;
    setAddingUid(user.uid);
    setErrorMsg('');
    try {
      const email = user.email.toLowerCase().trim();
      const updates = {
        collaboratorEmails: arrayUnion(email),
        collaboratorIds: arrayUnion(user.uid),
      };

      await updateDoc(doc(db, 'trips', trip.id), updates);
      await setDoc(doc(db, 'allowed_emails', email), { addedAt: new Date(), source: 'trip_invite' }, { merge: true });
      onUpdate();
    } catch (error) {
      console.error('Error adding user:', error);
      setErrorMsg('멤버 추가 중 오류가 발생했습니다.');
    } finally {
      setAddingUid(null);
    }
  };

  const handleAddMember = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!emailInput.trim()) return;

    setErrorMsg('');
    setAddLoading(true);
    try {
      const email = emailInput.trim().toLowerCase();

      // Check if already in trip (by email in collaboratorEmails or in userProfiles)
      const isAlreadyInTrip =
        rawCollaboratorEmails.some((e) => e.toLowerCase() === email) ||
        uniqueUids.some((uid) => userProfiles[uid]?.email?.toLowerCase() === email);

      if (isAlreadyInTrip) {
        setErrorMsg('이미 여행 멤버이거나 초대가 완료된 이메일입니다.');
        return;
      }

      // Check if user already registered in the app
      const usersQuery = query(collection(db, 'users'), where('email', '==', email));
      const usersSnap = await getDocs(usersQuery);

      const updates: { collaboratorEmails: ReturnType<typeof arrayUnion>; collaboratorIds?: ReturnType<typeof arrayUnion> } = {
        collaboratorEmails: arrayUnion(email),
      };

      if (!usersSnap.empty) {
        // User already has an account! Add directly to collaboratorIds for instant membership!
        const existingUid = usersSnap.docs[0].id;
        updates.collaboratorIds = arrayUnion(existingUid);
      }

      await updateDoc(doc(db, 'trips', trip.id), updates);
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
      const emailLower = email.toLowerCase().trim();
      const matchedUid = uniqueUids.find((uid) => userProfiles[uid]?.email?.toLowerCase().trim() === emailLower);
      const updates: Record<string, ReturnType<typeof arrayRemove>> = {
        collaboratorEmails: arrayRemove(email),
      };
      if (matchedUid && matchedUid !== trip.ownerId) {
        updates.collaboratorIds = arrayRemove(matchedUid);
      }
      await updateDoc(doc(db, 'trips', trip.id), updates);
      onUpdate();
    } catch (error) {
      console.error(error);
      alert('초대 취소 중 오류가 발생했습니다.');
    }
  };

  const handleRemoveMember = async (uid: string) => {
    if (!confirm('이 멤버를 여행에서 제외하시겠습니까?')) return;
    try {
      const email = userProfiles[uid]?.email;
      const updates: Record<string, ReturnType<typeof arrayRemove>> = {
        collaboratorIds: arrayRemove(uid),
      };
      if (email) {
        updates.collaboratorEmails = arrayRemove(email);
      }
      await updateDoc(doc(db, 'trips', trip.id), updates);
      onUpdate();
    } catch (error) {
      console.error(error);
      alert('멤버 삭제 중 오류가 발생했습니다.');
    }
  };

  const filteredAppUsers = appUsers.filter((user) => {
    const q = userSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      user.displayName?.toLowerCase().includes(q) ||
      user.email?.toLowerCase().includes(q)
    );
  });

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
          {uniqueUids.length + pendingEmails.length} travellers<br />Shared access / invite
        </span>
      </div>

      <div className="editorial-member-layout mt-10">
        {/* Left column: current joined and invited members */}
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

          {pendingEmails.map((email) => {
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

        {/* Right column: app user quick add list & manual invite */}
        <aside className="editorial-invite-panel">
          <p className="editorial-kicker">Invite a traveller</p>
          <h3 className="editorial-display mt-4 text-[2rem] leading-none">새로운 장면을<br />함께 채워보세요.</h3>
          
          {/* Quick-add app users section */}
          <div className="mt-8 border-t border-[var(--rule)] pt-6">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h4 className="editorial-kicker text-[0.72rem] font-bold text-[var(--ink)]">
                <UserPlus className="inline mr-1.5 h-3.5 w-3.5 text-[var(--terra)]" />
                사용자 목록에서 클릭 추가
              </h4>
              <span className="text-[0.62rem] text-[var(--muted)] font-mono">{filteredAppUsers.length}명</span>
            </div>

            {/* Search filter if app users > 2 */}
            {appUsers.length > 2 && (
              <div className="relative mb-3">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="이름 또는 이메일 검색..."
                  className="editorial-input pl-9 !py-2 text-[0.76rem]"
                />
              </div>
            )}

            {/* User cards list */}
            {loadingUsers ? (
              <div className="py-6 text-center text-[var(--muted)] text-[0.76rem]">
                <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                사용자 목록을 불러오는 중...
              </div>
            ) : filteredAppUsers.length === 0 ? (
              <p className="py-4 text-center text-[0.74rem] text-[var(--muted)]">검색된 사용자가 없습니다.</p>
            ) : (
              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {filteredAppUsers.map((user) => {
                  const isOwner = user.uid === trip.ownerId;
                  const isJoined =
                    uniqueUids.includes(user.uid) ||
                    (user.email && rawCollaboratorEmails.some((e) => e.toLowerCase() === user.email?.toLowerCase()));
                  const isAdding = addingUid === user.uid;
                  const initial = user.displayName?.charAt(0) || user.email?.charAt(0) || '?';

                  return (
                    <div
                      key={user.uid}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-[var(--rule)] bg-[var(--paper)] transition-all hover:border-[var(--terra)]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="editorial-member-avatar !w-8 !h-8 !text-[0.75rem]">
                          {user.photoURL ? (
                            <Image src={user.photoURL} alt={`${user.displayName} 프로필`} fill sizes="32px" className="object-cover" />
                          ) : (
                            initial.toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="editorial-member-name text-[0.8rem] truncate">{user.displayName || '이름 없음'}</p>
                          <p className="editorial-member-email text-[0.66rem] truncate">{user.email}</p>
                        </div>
                      </div>

                      {isOwner ? (
                        <span className="flex-shrink-0 text-[0.65rem] font-bold text-[var(--terra)] px-2 py-1 rounded bg-[color-mix(in_srgb,var(--terra)_12%,transparent)]">
                          <Crown className="inline h-3 w-3 mr-1" /> 방장
                        </span>
                      ) : isJoined ? (
                        <span className="flex-shrink-0 text-[0.65rem] font-bold text-[var(--olive)] px-2 py-1 rounded bg-[color-mix(in_srgb,var(--olive)_12%,transparent)]">
                          <Check className="inline h-3 w-3 mr-1" /> 참여 중
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddAppUser(user)}
                          disabled={isAdding}
                          className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded text-[0.72rem] font-bold bg-[var(--soft-terra)] text-[var(--terra)] hover:bg-[var(--terra)] hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {isAdding ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Plus className="h-3.5 w-3.5" />
                          )}
                          <span>추가</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Collapsible Direct Email Invitation */}
          <div className="mt-6 border-t border-[var(--rule)] pt-4">
            <button
              type="button"
              onClick={() => setShowManualInvite(!showManualInvite)}
              className="text-[0.74rem] font-bold text-[var(--muted)] hover:text-[var(--ink)] flex items-center justify-between w-full text-left py-1 cursor-pointer"
            >
              <span>목록에 없는 사용자 이메일로 직접 초대</span>
              <span className="text-[0.7rem]">{showManualInvite ? '▲ 닫기' : '▼ 열기'}</span>
            </button>

            {showManualInvite && (
              <form onSubmit={handleAddMember} className="mt-3">
                <label htmlFor="member-email" className="editorial-form-label text-[0.72rem]">Google 이메일 주소</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--terra)]" aria-hidden="true" />
                  <input
                    id="member-email"
                    type="email"
                    value={emailInput}
                    onChange={(event) => setEmailInput(event.target.value)}
                    placeholder="example@gmail.com"
                    className="editorial-input pl-10 text-[0.78rem]"
                    required
                    aria-describedby={errorMsg ? 'member-email-error' : undefined}
                  />
                </div>
                {errorMsg && <p id="member-email-error" className="mt-2 text-[0.72rem] font-bold text-[var(--terra)]" role="alert">{errorMsg}</p>}
                <button type="submit" disabled={addLoading || !emailInput} className="editorial-button editorial-focus mt-3 w-full text-[0.78rem] !py-2.5 disabled:cursor-not-allowed disabled:opacity-45">
                  {addLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
                  {addLoading ? '초대장 발송 중...' : '이메일로 초대하기'}
                </button>
              </form>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
