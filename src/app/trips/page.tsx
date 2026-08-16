'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, or, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import Link from 'next/link';
import { Plane, Calendar, MapPin, Loader2 } from 'lucide-react';

interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  coverImage?: string;
}

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">내 여행</h1>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-full font-medium transition-all shadow-lg shadow-indigo-200 flex items-center gap-2">
            <Plane className="w-4 h-4" />
            새 여행 만들기
          </button>
        </div>

        {trips.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <Plane className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600">아직 계획된 여행이 없습니다</h3>
            <p className="text-slate-400 mt-2">새로운 여행을 만들어 친구들을 초대해보세요!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map(trip => (
              <Link href={`/trips/${trip.id}`} key={trip.id}>
                <div className="group relative bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <div className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-slate-600 shadow-sm border border-slate-100">
                        D-{Math.max(0, Math.ceil((new Date(trip.startDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)))}
                      </div>
                    </div>
                    
                    <h2 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">{trip.title}</h2>
                    <p className="text-slate-500 font-medium mb-6 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      {trip.destination}
                    </p>
                    
                    <div className="flex items-center text-sm text-slate-500 bg-slate-50/80 rounded-xl p-3 border border-slate-100/50">
                      <Calendar className="w-4 h-4 mr-2 text-indigo-400" />
                      {trip.startDate} ~ {trip.endDate}
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
