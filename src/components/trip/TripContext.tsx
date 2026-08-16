'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import TripHeader from './TripHeader';

interface TripContextType {
  trip: any;
  userProfiles: Record<string, any>;
  loading: boolean;
  refetch: () => Promise<void>;
  mapUrl: string;
}

const TripContext = createContext<TripContextType | null>(null);

export function useTrip() {
  const context = useContext(TripContext);
  if (!context) throw new Error('useTrip must be used within TripProvider');
  return context;
}

export function TripProvider({ tripId, children }: { tripId: string, children: ReactNode }) {
  const [trip, setTrip] = useState<any | null>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const fetchTripData = useCallback(async () => {
    try {
      const docRef = doc(db, 'trips', tripId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const fetchedTrip = { id: docSnap.id, ...docSnap.data() } as any;
        setTrip(fetchedTrip);

        const uids = new Set<string>();
        if (fetchedTrip.ownerId) uids.add(fetchedTrip.ownerId);
        if (fetchedTrip.collaboratorIds) {
          fetchedTrip.collaboratorIds.forEach((uid: string) => uids.add(uid));
        }

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
      }
    } catch (error) {
      console.error("Error fetching trip:", error);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchTripData();
  }, [fetchTripData]);

  if (loading) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center p-8 bg-transparent">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center h-full">
        <div className="bg-white p-8 rounded-3xl shadow-sm text-center max-w-md w-full border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-2">여행 정보를 찾을 수 없습니다</h2>
          <p className="text-slate-500">삭제되었거나 접근 권한이 없습니다.</p>
        </div>
      </div>
    );
  }

  let mapQueryStr = trip.mapQuery || trip.destination;
  if (mapQueryStr.includes('오키나와')) {
    mapQueryStr = '26.4941, 127.9902'; // Exact center of Okinawa island
  }
  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(mapQueryStr)}&z=9&output=embed`;

  return (
    <TripContext.Provider value={{ trip, userProfiles, loading, refetch: fetchTripData, mapUrl }}>
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 h-full">
        <TripHeader />
        <div className="mt-8">
          {children}
        </div>
      </div>
    </TripContext.Provider>
  );
}
