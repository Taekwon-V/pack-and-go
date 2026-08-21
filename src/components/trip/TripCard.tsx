'use client';

import Link from 'next/link';
import { ArrowUpRight, CalendarDays, MapPin, Users } from 'lucide-react';
import EditorialImage from '@/components/EditorialImage';
import { EDITORIAL_HERO_IMAGE } from '@/lib/editorialAssets';
import { formatTripDateRange, getProfileLabel } from '@/lib/tripFormatters';
import { formatTripStatusMeta } from '@/lib/tripStatus';
import type { TripRecord, TripStatus, UserProfile } from '@/components/trip/types';

interface TripCardProps {
  trip: TripRecord;
  status: TripStatus;
  imageIndex: number;
  noteIndex: number;
  userProfiles: Record<string, UserProfile>;
}

function getTripImage(trip: TripRecord, index: number): string {
  if (trip.coverImage) return trip.coverImage;
  if (trip.gallery?.[0]) return trip.gallery[0];
  if (index === 0) return EDITORIAL_HERO_IMAGE;

  return ['/gallery/2.png', '/gallery/3.jpg', '/gallery/4.jpg'][index % 3];
}

function getTripImageAlt(trip: TripRecord): string {
  return trip.coverImage ? `${trip.destination} 여행 대표 이미지` : `${trip.destination} 여행 사진`;
}

function getParticipants(trip: TripRecord): string[] {
  return Array.from(new Set([trip.ownerId, ...(trip.collaboratorIds || [])])).filter(Boolean) as string[];
}

export default function TripCard({ trip, status, imageIndex, noteIndex, userProfiles }: TripCardProps) {
  const participants = getParticipants(trip);
  const participantNames = participants
    .slice(0, 2)
    .map((uid) => getProfileLabel(userProfiles[uid], '멤버'))
    .join(' · ');

  return (
    <Link
      href={`/trips/${trip.id}`}
      className="editorial-trip-card editorial-focus group"
      data-status={status}
      aria-label={`${trip.title} 여행 상세 보기`}
    >
      <div className="editorial-trip-card-media">
        <EditorialImage
          src={getTripImage(trip, imageIndex)}
          alt={getTripImageAlt(trip)}
          priority={imageIndex === 0}
          sizes="(max-width: 640px) 100vw, (max-width: 900px) 50vw, 33vw"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
        <span className="editorial-trip-card-index">FIELD NOTE / {String(noteIndex + 1).padStart(2, '0')}</span>
      </div>

      <div className="editorial-trip-card-body">
        <div className="editorial-trip-card-status-row">
          <span className="editorial-trip-card-status" data-status={status}>
            <span className="editorial-trip-card-status-mark" aria-hidden="true" />
            {status === 'planned' ? '예정' : status === 'in-progress' ? '여행 중' : '완료'}
          </span>
          <ArrowUpRight className="editorial-trip-card-arrow h-4 w-4" aria-hidden="true" />
        </div>

        <h2 className="editorial-trip-card-title">{trip.title || '제목 없는 여행'}</h2>

        <div className="editorial-trip-card-meta">
          <span>
            <MapPin className="h-3.5 w-3.5 text-[var(--terra)]" aria-hidden="true" />
            {trip.destination || '목적지 미정'}
          </span>
          <span>
            <CalendarDays className="h-3.5 w-3.5 text-[var(--terra)]" aria-hidden="true" />
            {formatTripDateRange(trip.startDate, trip.endDate)}
          </span>
          <span>
            <Users className="h-3.5 w-3.5 text-[var(--terra)]" aria-hidden="true" />
            {participantNames || '멤버 미정'}{participants.length > 2 ? ` +${participants.length - 2}` : ''}
          </span>
        </div>

        <div className="editorial-trip-card-footer">
          <span>{formatTripStatusMeta(status, trip.startDate)}</span>
          <span>View journal</span>
        </div>
      </div>
    </Link>
  );
}
