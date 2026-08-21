'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, doc, getDoc, getDocs, or, query, where } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Plane } from 'lucide-react';
import StatePanel from '@/components/StatePanel';
import TripCard from '@/components/trip/TripCard';
import { auth, db } from '@/lib/firebase';
import { getTripStatus, sortTripsByStatus, TRIP_STATUS_SECTIONS } from '@/lib/tripStatus';
import type { TripRecord, TripStatus, UserProfile } from '@/components/trip/types';

export default function TripsPage() {
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const router = useRouter();

  const fetchTrips = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userDocSnap = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDocSnap.data();
      const isAdmin = userData?.role === 'admin' || currentUser.email === 'inchul17.kim@gmail.com';

      const tripsRef = collection(db, 'trips');
      const tripsQuery = isAdmin
        ? query(tripsRef)
        : query(
            tripsRef,
            or(
              where('ownerId', '==', currentUser.uid),
              where('collaboratorIds', 'array-contains', currentUser.uid),
              where('collaboratorEmails', 'array-contains', currentUser.email),
            ),
          );

      const snapshot = await getDocs(tripsQuery);
      const fetchedTrips = snapshot.docs.map((tripDoc) => ({ id: tripDoc.id, ...tripDoc.data() })) as TripRecord[];
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
            if (userSnapshot.exists()) profiles[uid] = userSnapshot.data() as UserProfile;
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
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/login');
        return;
      }

      setUser(currentUser);
      void fetchTrips(currentUser);
    });

    return () => unsubscribe();
  }, [fetchTrips, router]);

  const groupedTrips = useMemo(() => {
    const groups: Record<TripStatus, TripRecord[]> = {
      planned: [],
      'in-progress': [],
      completed: [],
    };

    trips.forEach((trip) => {
      groups[getTripStatus(trip.startDate, trip.endDate)].push(trip);
    });

    TRIP_STATUS_SECTIONS.forEach(({ status }) => {
      groups[status] = sortTripsByStatus(groups[status], status);
    });

    return groups;
  }, [trips]);

  const activeStatusSections = useMemo(
    () => TRIP_STATUS_SECTIONS.filter(({ status }) => groupedTrips[status].length > 0),
    [groupedTrips],
  );

  const imageIndexByTripId = useMemo(
    () => new Map(trips.map((trip, index) => [trip.id, index])),
    [trips],
  );

  if (loading) {
    return (
      <div className="editorial-page">
        <div className="editorial-container editorial-main">
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
      <div className="editorial-page">
        <div className="editorial-container editorial-main">
          <StatePanel
            variant="error"
            title="여행 목록을 불러오지 못했습니다"
            description={error}
            actionLabel="다시 시도"
            onAction={() => void fetchTrips(user)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="editorial-page">
      <div className="editorial-container editorial-main">
        <div className="editorial-rule-label flex items-center justify-between gap-4 py-4">
          <span>Trip index</span>
          <span className="hidden sm:inline">Pack to Go / Field notes in progress</span>
        </div>

        <section className="py-[clamp(3rem,6vw,5rem)]" aria-labelledby="trips-title">
          <div className="mb-[clamp(2.25rem,5vw,4rem)] grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(19rem,0.7fr)] md:items-end">
            <div>
              <p className="editorial-kicker">My trips</p>
              <h1 id="trips-title" className="editorial-trips-hero-title">
                <Image
                  src="/calligraphy-title.jpg"
                  alt="다음 여행을, 더 선명하게."
                  width={640}
                  height={427}
                  priority
                  className="editorial-trips-calligraphy-img"
                />
              </h1>
            </div>
            <dl className="editorial-trip-summary" aria-label="여행 상태 요약">
              <div>
                <dt>All journeys</dt>
                <dd>{trips.length}</dd>
              </div>
              {activeStatusSections.map((section) => (
                <div key={section.status} data-status={section.status}>
                  <dt>{section.label}</dt>
                  <dd>{groupedTrips[section.status].length}</dd>
                </div>
              ))}
            </dl>
          </div>

          {!trips.length ? (
            <StatePanel
              variant="empty"
              icon={Plane}
              title="아직 계획된 여행이 없습니다"
              description="새로운 여행이 게시되거나 초대되면 이곳에 여행 기록이 시작됩니다."
            />
          ) : (
            <div className="editorial-trip-status-list">
              {activeStatusSections.map((section) => {
                const sectionTrips = groupedTrips[section.status];
                const headingId = `trip-status-${section.status}`;

                return (
                  <section
                    key={section.status}
                    className="editorial-trip-status-section"
                    data-status={section.status}
                    aria-labelledby={headingId}
                  >
                    <div className="editorial-trip-status-heading">
                      <div>
                        <p className="editorial-kicker">{section.label}</p>
                        <h2 id={headingId} className="editorial-trip-status-title editorial-display">
                          {section.englishLabel}
                        </h2>
                      </div>
                      <span className="editorial-trip-status-count">
                        {sectionTrips.length} {sectionTrips.length === 1 ? 'record' : 'records'}
                      </span>
                    </div>

                    <div className="editorial-trip-card-grid">
                      {sectionTrips.map((trip, index) => (
                        <TripCard
                          key={trip.id}
                          trip={trip}
                          status={section.status}
                          imageIndex={imageIndexByTripId.get(trip.id) ?? index}
                          noteIndex={index}
                          userProfiles={userProfiles}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </section>

        <footer className="editorial-footer">
          <span>Pack to Go / Travel journal</span>
          <span>Shared plans · softer edges</span>
        </footer>
      </div>
    </div>
  );
}
