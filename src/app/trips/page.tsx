'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, or, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import Link from 'next/link';
import Image from 'next/image';
import { Plane, Calendar, MapPin } from 'lucide-react';
import StatePanel from '@/components/StatePanel';
import { formatTripDateRange, getDaysUntil } from '@/lib/tripFormatters';
import type { UserProfile } from '@/components/trip/types';

interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate?: unknown;
  endDate?: unknown;
  coverImage?: string;
  ownerId?: string;
  collaboratorIds?: string[];
}

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const router = useRouter();

  const fetchTrips = useCallback(async (currentUser: User | null, isDev: boolean) => {
    setLoading(true);
    setError(null);

    try {
      let isAdmin = isDev;
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        const userData = userDocSnap.data();
        isAdmin = isAdmin || userData?.role === 'admin' || currentUser.email === 'inchul17.kim@gmail.com';
      }

      const tripsRef = collection(db, 'trips');
      const tripsQuery = isAdmin
        ? query(tripsRef)
        : query(
            tripsRef,
            or(
              where('ownerId', '==', currentUser!.uid),
              where('collaboratorIds', 'array-contains', currentUser!.uid),
              where('collaboratorEmails', 'array-contains', currentUser!.email),
            ),
          );

      const snapshot = await getDocs(tripsQuery);
      const fetchedTrips = snapshot.docs.map((tripDoc) => ({
        id: tripDoc.id,
        ...tripDoc.data(),
      })) as Trip[];
      setTrips(fetchedTrips);

      const uids = new Set<string>();
      fetchedTrips.forEach((trip) => {
        if (trip.ownerId) uids.add(trip.ownerId);
        trip.collaboratorIds?.forEach((id) => uids.add(id));
      });

      const profiles: Record<string, UserProfile> = {};
      await Promise.all(
        Array.from(uids).map(async (uid) => {
          try {
            const userSnapshot = await getDoc(doc(db, 'users', uid));
            if (userSnapshot.exists()) profiles[uid] = userSnapshot.data();
          } catch (profileError) {
            console.error('Failed to fetch user profile', uid, profileError);
          }
        }),
      );
      setUserProfiles(profiles);
    } catch (fetchError) {
      console.error('Error fetching trips:', fetchError);
      setError('여행 목록을 불러오지 못했습니다. 네트워크 상태를 확인한 뒤 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const isDev = process.env.NODE_ENV === 'development';
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser && !isDev) {
        router.push('/login');
        return;
      }

      setUser(currentUser);
      void fetchTrips(currentUser, isDev);
    });

    return () => unsubscribe();
  }, [fetchTrips, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f9] p-8">
        <div className="mx-auto flex min-h-[28rem] max-w-4xl items-center justify-center">
          <StatePanel
            variant="loading"
            title="여행 목록을 불러오는 중입니다"
            description="참여 중인 여행과 멤버 정보를 준비하고 있습니다."
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f5f5f9] p-8">
        <div className="mx-auto flex min-h-[28rem] max-w-4xl items-center justify-center">
          <StatePanel
            variant="error"
            title="여행 목록을 불러오지 못했습니다"
            description={error}
            actionLabel="다시 시도"
            onAction={() => void fetchTrips(user, process.env.NODE_ENV === 'development')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f9] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col items-center justify-center py-8 mb-8">
          <Image src="/banner.jpg" alt="Pack to Go 여행 안내 이미지" width={800} height={450} className="w-full object-cover rounded-[2rem] shadow-2xl shadow-indigo-500/10 border border-white/5" priority />
        </div>

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">내 여행 탐색</h1>
        </div>

        {trips.length === 0 ? (
          <StatePanel
            variant="empty"
            icon={Plane}
            title="아직 계획된 여행이 없습니다"
            description="새로운 여행이 게시되거나 초대되면 여기에 표시됩니다."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {trips.map(trip => (
              <Link href={`/trips/${trip.id}`} key={trip.id}>
                <div className="group relative bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-violet-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-indigo-500/20 text-indigo-500 rounded-2xl flex items-center justify-center shrink-0">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <div className="bg-slate-50 px-3 py-1 rounded-full text-xs font-semibold text-slate-700 shadow-sm border border-slate-200">
                        D-{getDaysUntil(trip.startDate)}
                      </div>
                    </div>
                    
                    <h2 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">{trip.title}</h2>
                    <p className="text-slate-500 font-medium mb-6 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      {trip.destination}
                    </p>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center text-sm text-slate-600 bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <Calendar className="w-4 h-4 mr-2 text-indigo-500" />
                        {formatTripDateRange(trip.startDate, trip.endDate)}
                      </div>
                      
                      <div className="flex -space-x-2">
                        {(() => {
                          const participants = [trip.ownerId, ...(trip.collaboratorIds || [])];
                          const uniqueParticipants = Array.from(new Set(participants)).filter(Boolean) as string[];
                          const displayUsers = uniqueParticipants.slice(0, 6);
                          const extraCount = uniqueParticipants.length - 6;

                          return (
                            <>
                              {displayUsers.map((uid, i) => {
                                const profile = userProfiles[uid];
                                const initial = profile?.displayName?.charAt(0) || profile?.email?.charAt(0) || '?';
                                return (
                                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 z-10 relative overflow-hidden shadow-sm" title={profile?.displayName || profile?.email || 'Unknown User'}>
                                    {profile?.photoURL ? (
                                      <Image src={profile.photoURL} alt="Profile" fill className="object-cover" sizes="32px" />
                                    ) : (
                                      initial.toUpperCase()
                                    )}
                                  </div>
                                );
                              })}
                              {extraCount > 0 && (
                                <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 z-10 shadow-sm" title={`${extraCount} more participants`}>
                                  +{extraCount}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
