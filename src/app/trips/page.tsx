'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, doc, getDoc, getDocs, or, query, where } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { CalendarDays, MapPin, Plane, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import StatePanel from '@/components/StatePanel';
import EditorialImage from '@/components/EditorialImage';
import { auth, db } from '@/lib/firebase';
import { formatTripDateRange, getDaysUntil, getProfileLabel } from '@/lib/tripFormatters';
import { EDITORIAL_HERO_ALT, EDITORIAL_HERO_IMAGE } from '@/lib/editorialAssets';
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

function getTripImage(trip: Trip, index: number) {
  if (trip.coverImage) return trip.coverImage;
  if (index === 0) return EDITORIAL_HERO_IMAGE;
  return ['/gallery/2.png', '/gallery/3.jpg', '/gallery/4.jpg'][index % 3];
}

function getTripImageAlt(trip: Trip, index: number) {
  return trip.coverImage ? `${trip.destination} 여행 대표 이미지` : index === 0 ? EDITORIAL_HERO_ALT : `${trip.destination} 여행 사진`;
}

function TripMetaLine({ trip, userProfiles }: { trip: Trip; userProfiles: Record<string, UserProfile> }) {
  const participants = [trip.ownerId, ...(trip.collaboratorIds || [])];
  const uniqueParticipants = Array.from(new Set(participants)).filter(Boolean) as string[];
  const names = uniqueParticipants
    .slice(0, 3)
    .map((uid) => getProfileLabel(userProfiles[uid], '멤버'))
    .join(' · ');

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.68rem] font-bold leading-relaxed text-[var(--muted)]">
      <span className="inline-flex items-center gap-1.5">
        <MapPin className="h-3.5 w-3.5 text-[var(--terra)]" aria-hidden="true" />
        {trip.destination}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <CalendarDays className="h-3.5 w-3.5 text-[var(--terra)]" aria-hidden="true" />
        {formatTripDateRange(trip.startDate, trip.endDate)}
      </span>
      {names && <span>{names}{uniqueParticipants.length > 3 ? ` +${uniqueParticipants.length - 3}` : ''}</span>}
    </div>
  );
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
        const userDocSnap = await getDoc(doc(db, 'users', currentUser.uid));
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
      const fetchedTrips = snapshot.docs.map((tripDoc) => ({ id: tripDoc.id, ...tripDoc.data() })) as Trip[];
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

  const activeTrip = trips[0];
  const otherTrips = useMemo(() => trips.slice(1), [trips]);

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
            onAction={() => void fetchTrips(user, process.env.NODE_ENV === 'development')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="editorial-page">
      <div className="editorial-container editorial-main">
        <div className="editorial-rule-label flex items-center justify-between gap-4 py-4">
          <span><strong>01</strong> / Trip index</span>
          <span className="hidden sm:inline">Pack to Go / Field notes in progress</span>
        </div>

        <section className="py-[clamp(3rem,6vw,5rem)]" aria-labelledby="trips-title">
          <div className="mb-12 flex items-end justify-between gap-6">
            <div>
              <p className="editorial-kicker">My trips</p>
              <h1 id="trips-title" className="editorial-display mt-5 max-w-[13ch] text-[clamp(3rem,6vw,5rem)] leading-[0.96]">
                다음 여행을,<br />더 선명하게.
              </h1>
            </div>
            <p className="hidden max-w-[16ch] pb-1 text-right text-[0.62rem] font-bold uppercase leading-[1.7] tracking-[0.17em] text-[var(--muted)] md:block">
              {trips.length ? `${trips.length} active journey${trips.length > 1 ? 's' : ''}` : 'No active journey'}
              <br />A field note in progress
            </p>
          </div>

          {!activeTrip ? (
            <StatePanel
              variant="empty"
              icon={Plane}
              title="아직 계획된 여행이 없습니다"
              description="새로운 여행이 게시되거나 초대되면 이곳에 여행 기록이 시작됩니다."
            />
          ) : (
            <>
              <div className="editorial-feature-grid">
                <Link href={`/trips/${activeTrip.id}`} className="editorial-feature-link editorial-focus block min-w-0 no-underline">
                  <figure className="editorial-feature-figure">
                    <div className="editorial-feature-media">
                      <EditorialImage
                        src={getTripImage(activeTrip, 0)}
                        alt={getTripImageAlt(activeTrip, 0)}
                        priority
                        sizes="(max-width: 900px) 100vw, 66vw"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <figcaption className="editorial-feature-caption">
                      <h2 className="editorial-feature-title line-clamp-2">{activeTrip.title}</h2>
                      <span className="editorial-feature-tag">Active journey / 01</span>
                    </figcaption>
                  </figure>
                </Link>

                <aside className="editorial-meta-column" aria-label="현재 여행 정보">
                  <div className="editorial-meta-heading">
                    <span>Current journey</span>
                    <ArrowUpRight className="h-4 w-4 text-[var(--terra)]" aria-hidden="true" />
                  </div>
                  <dl className="editorial-meta-list">
                    <div className="editorial-meta-item">
                      <dt className="editorial-meta-label"><MapPin className="h-3.5 w-3.5 text-[var(--terra)]" aria-hidden="true" /> Destination</dt>
                      <dd className="editorial-meta-value">{activeTrip.destination}</dd>
                    </div>
                    <div className="editorial-meta-item">
                      <dt className="editorial-meta-label"><CalendarDays className="h-3.5 w-3.5 text-[var(--terra)]" aria-hidden="true" /> Dates</dt>
                      <dd className="editorial-meta-value">{formatTripDateRange(activeTrip.startDate, activeTrip.endDate)}</dd>
                    </div>
                    <div className="flex items-end justify-between gap-4 border-t border-[var(--rule)] pt-5">
                      <div className="editorial-meta-item">
                        <dt className="editorial-meta-label">Members</dt>
                        <dd className="editorial-meta-value">
                          {[activeTrip.ownerId, ...(activeTrip.collaboratorIds || [])].filter(Boolean).length}명
                        </dd>
                      </div>
                      <div className="editorial-countdown">D-{getDaysUntil(activeTrip.startDate)}</div>
                    </div>
                  </dl>
                  <p className="mt-12 border-t border-[var(--rule)] pt-4 text-[0.62rem] font-bold tracking-[0.12em] text-[var(--muted)]">
                    현재 진행 중인 여행 {trips.length}개
                  </p>
                </aside>
              </div>

              {otherTrips.length > 0 && (
                <section className="mt-20 border-t border-[var(--rule)] pt-6" aria-labelledby="other-trips-title">
                  <div className="mb-6 flex items-center justify-between gap-4">
                    <h2 id="other-trips-title" className="editorial-kicker">More field notes</h2>
                    <span className="text-[0.62rem] font-bold text-[var(--muted)]">{otherTrips.length} records</span>
                  </div>
                  <div className="divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
                    {otherTrips.map((trip, index) => (
                      <Link
                        key={trip.id}
                        href={`/trips/${trip.id}`}
                        className="editorial-focus group grid gap-5 py-5 no-underline sm:grid-cols-[8rem_minmax(0,1fr)_auto] sm:items-center"
                      >
                        <div className="relative h-28 overflow-hidden bg-[var(--sand)] sm:h-20">
                          <EditorialImage
                            src={getTripImage(trip, index + 1)}
                            alt={getTripImageAlt(trip, index + 1)}
                            sizes="(max-width: 640px) 100vw, 8rem"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                          />
                        </div>
                        <div className="min-w-0">
                          <h3 className="editorial-display truncate text-[1.4rem] leading-tight group-hover:text-[var(--terra)]">{trip.title}</h3>
                          <div className="mt-3"><TripMetaLine trip={trip} userProfiles={userProfiles} /></div>
                        </div>
                        <span className="inline-flex items-center gap-2 text-[0.62rem] font-extrabold uppercase tracking-[0.13em] text-[var(--terra)]">
                          D-{getDaysUntil(trip.startDate)}
                          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </>
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
