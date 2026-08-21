'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import StatePanel from '@/components/StatePanel';
import type { TripContextValue, TripLoadState, TripRecord, UserProfile } from './types';

const TripContext = createContext<TripContextValue | null>(null);

export function useTrip() {
  const context = useContext(TripContext);
  if (!context) throw new Error('useTrip must be used within TripProvider');
  return context;
}

export function TripProvider({ tripId, children }: { tripId: string; children: ReactNode }) {
  const [trip, setTrip] = useState<TripRecord | null>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<TripLoadState>('loading');
  const [error, setError] = useState<string | null>(null);

  const fetchTripData = useCallback(async () => {
    setLoading(true);
    setState('loading');
    setError(null);
    setTrip(null);
    setUserProfiles({});

    try {
      const docRef = doc(db, 'trips', tripId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setState('not-found');
        return;
      }

      const fetchedTrip = { id: docSnap.id, ...docSnap.data() } as TripRecord;
      setTrip(fetchedTrip);

      const uids = new Set<string>();
      if (fetchedTrip.ownerId) uids.add(fetchedTrip.ownerId);
      fetchedTrip.collaboratorIds?.forEach((uid) => uids.add(uid));

      const profiles: Record<string, UserProfile> = {};
      await Promise.all(
        Array.from(uids).map(async (uid) => {
          try {
            const userSnapshot = await getDoc(doc(db, 'users', uid));
            if (userSnapshot.exists()) {
              profiles[uid] = userSnapshot.data() as UserProfile;
            }
          } catch (profileError) {
            console.error('Failed to fetch user profile', uid, profileError);
          }
        }),
      );
      setUserProfiles(profiles);
      setState('ready');
    } catch (fetchError) {
      console.error('Error fetching trip:', fetchError);
      setError('여행 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
      setState('error');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    // The provider owns the initial Firebase request and its loading/error transitions.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchTripData();
  }, [fetchTripData]);

  if (loading || state === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f9] p-8">
        <StatePanel
          variant="loading"
          title="여행 정보를 불러오는 중입니다"
          description="잠시만 기다려주세요. 여행 일정과 멤버 정보를 준비하고 있습니다."
        />
      </div>
    );
  }

  if (state === 'not-found') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f9] p-8">
        <StatePanel
          variant="not-found"
          title="여행 정보를 찾을 수 없습니다"
          description="삭제되었거나 접근 권한이 없는 여행일 수 있습니다. 내 여행 목록에서 다른 여행을 선택해주세요."
          actionLabel="내 여행으로 돌아가기"
          actionHref="/trips"
        />
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f9] p-8">
        <StatePanel
          variant="error"
          title="여행 정보를 불러오지 못했습니다"
          description={error || '네트워크 상태를 확인한 뒤 다시 시도해주세요.'}
          actionLabel="다시 시도"
          onAction={() => void fetchTripData()}
        />
      </div>
    );
  }

  if (!trip) return null;

  const mapQuery = trip.mapQuery || trip.destination;
  const embedQuery = mapQuery.includes('오키나와') ? '26.4941, 127.9902' : mapQuery;
  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(embedQuery)}&z=9&output=embed`;
  const externalMapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;

  return (
    <TripContext.Provider
      value={{
        trip,
        userProfiles,
        loading,
        state,
        error,
        refetch: fetchTripData,
        mapQuery,
        mapUrl,
        externalMapUrl,
      }}
    >
      {children}
    </TripContext.Provider>
  );
}
