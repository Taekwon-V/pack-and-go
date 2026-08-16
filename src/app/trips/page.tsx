'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, or, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import Link from 'next/link';
import Image from 'next/image';
import { Plane, Calendar, MapPin, Loader2 } from 'lucide-react';

interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  coverImage?: string;
  ownerId?: string;
  collaboratorIds?: string[];
}

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({});
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        const userData = userDocSnap.data();
        const isAdmin = userData?.role === 'admin' || currentUser.email === 'inchul17.kim@gmail.com';

        const tripsRef = collection(db, 'trips');
        let q;
        
        if (isAdmin) {
          // 관리자는 모든 여행을 조회할 수 있음
          q = query(tripsRef);
        } else {
          // 일반 사용자는 자신이 소유자이거나 참여자인 여행만 조회
          q = query(
            tripsRef,
            or(
              where('ownerId', '==', currentUser.uid),
              where('collaboratorIds', 'array-contains', currentUser.uid)
            )
          );
        }

        const snapshot = await getDocs(q);
        const fetchedTrips = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Trip[];
        
        setTrips(fetchedTrips);

        // Fetch participant profiles
        const uids = new Set<string>();
        fetchedTrips.forEach(t => {
          if (t.ownerId) uids.add(t.ownerId);
          if (t.collaboratorIds) t.collaboratorIds.forEach(id => uids.add(id));
        });
        
        const profiles: Record<string, any> = {};
        await Promise.all(Array.from(uids).map(async (uid) => {
          try {
            const uSnap = await getDoc(doc(db, 'users', uid));
            if (uSnap.exists()) {
              profiles[uid] = uSnap.data();
            }
          } catch(e) {
            console.error("Failed to fetch user profile", uid);
          }
        }));
        setUserProfiles(profiles);
        
      } catch (error) {
        console.error("Error fetching trips:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f9]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f9] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center justify-center py-8 mb-8">
          <Image src="/banner.jpg" alt="Pack to GO" width={800} height={450} className="w-full max-w-4xl object-cover rounded-[2rem] shadow-2xl shadow-indigo-500/10 mb-8 border border-white/5" priority />
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Pack to GO</h2>
          <p className="text-slate-600 mt-3 font-medium">세상을 탐험하고, 여정을 공유하세요.</p>
        </div>

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">내 여행 탐색</h1>
        </div>

        {trips.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <Plane className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800">아직 계획된 여행이 없습니다</h3>
            <p className="text-slate-500 mt-2">새로운 여행이 게시되기를 기다려주세요!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                        D-{(() => {
                          const sd = trip.startDate as any;
                          const dateObj = sd?.toDate ? sd.toDate() : new Date(sd || Date.now());
                          const diff = dateObj.getTime() - new Date().getTime();
                          return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24))) || 0;
                        })()}
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
                        {(() => {
                          const sd = trip.startDate as any;
                          const ed = trip.endDate as any;
                          const sStr = sd?.toDate ? sd.toDate().toLocaleDateString() : (sd || '');
                          const eStr = ed?.toDate ? ed.toDate().toLocaleDateString() : (ed || '');
                          return `${sStr} ~ ${eStr}`;
                        })()}
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
