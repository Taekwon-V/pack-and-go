'use client';

import { CalendarDays, MapPin, Users } from 'lucide-react';
import { useTrip } from './TripContext';
import { formatTripDateRange, getProfileLabel, getDaysUntil } from '@/lib/tripFormatters';
import EditorialImage from '@/components/EditorialImage';
import { EDITORIAL_HERO_IMAGE } from '@/lib/editorialAssets';

export default function TripHeader() {
  const { trip, userProfiles } = useTrip();
  const imageSource =
    typeof trip.coverImage === 'string' && trip.coverImage
      ? trip.coverImage
      : Array.isArray(trip.gallery) && trip.gallery.length > 0 && typeof trip.gallery[0] === 'string'
      ? trip.gallery[0]
      : EDITORIAL_HERO_IMAGE;
  const imageAlt = trip.coverImage ? `${trip.destination} 여행 대표 이미지` : `${trip.destination} 대표 풍경`;

  const participants = [trip.ownerId, ...(trip.collaboratorIds || [])];
  const uniqueParticipants = Array.from(new Set(participants)).filter(Boolean) as string[];
  const memberNames = uniqueParticipants.length
    ? uniqueParticipants
        .slice(0, 3)
        .map((uid) => getProfileLabel(userProfiles[uid], '멤버'))
        .join(' · ')
    : '멤버 정보 없음';
  const extraCount = uniqueParticipants.length - 3;

  return (
    <section className="editorial-section !pt-0" aria-labelledby="trip-title">
      <figure className="editorial-overview-figure">
        <div className="editorial-overview-media">
          <EditorialImage
            src={imageSource}
            alt={imageAlt}
            priority
            sizes="(max-width: 900px) 100vw, 80rem"
            className="h-full w-full object-cover"
          />
        </div>
        <figcaption className="editorial-overview-caption">
          <div className="mb-3 text-[0.58rem] font-extrabold uppercase tracking-[0.2em] text-[var(--terra)]">
            Pack to Go / {trip.destination}
          </div>
          <h1 id="trip-title" className="editorial-overview-title">
            {trip.title}
          </h1>
          {trip.concept && <p className="editorial-overview-quote">“{trip.concept}”</p>}
        </figcaption>
      </figure>

      <dl className="mt-8 grid grid-cols-1 gap-5 border-y border-[var(--rule)] py-5 sm:grid-cols-3 sm:gap-0">
        <div className="border-b border-[var(--rule)] pb-4 sm:border-b-0 sm:border-r sm:pr-6 sm:pb-0">
          <dt className="editorial-meta-label">
            <CalendarDays className="h-3.5 w-3.5 text-[var(--terra)]" aria-hidden="true" />
            Dates
          </dt>
          <dd className="mt-2 text-sm font-extrabold leading-relaxed">{formatTripDateRange(trip.startDate, trip.endDate)}</dd>
        </div>
        <div className="border-b border-[var(--rule)] pb-4 sm:border-b-0 sm:border-r sm:px-6 sm:pb-0">
          <dt className="editorial-meta-label">
            <MapPin className="h-3.5 w-3.5 text-[var(--terra)]" aria-hidden="true" />
            Destination
          </dt>
          <dd className="mt-2 text-sm font-extrabold leading-relaxed">{trip.destination}</dd>
        </div>
        <div className="flex items-start justify-between gap-4 sm:pl-6">
          <div>
            <dt className="editorial-meta-label">
              <Users className="h-3.5 w-3.5 text-[var(--terra)]" aria-hidden="true" />
              Travellers
            </dt>
            <dd className="mt-2 text-sm font-extrabold leading-relaxed">
              {memberNames}
              {extraCount > 0 ? ` +${extraCount}` : ''}
            </dd>
          </div>
          <div className="editorial-countdown" aria-label={`여행까지 ${getDaysUntil(trip.startDate)}일`}>
            D-{getDaysUntil(trip.startDate)}
          </div>
        </div>
      </dl>
    </section>
  );
}
