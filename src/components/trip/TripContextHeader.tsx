'use client';

import { CalendarDays, MapPin } from 'lucide-react';
import { useTrip } from './TripContext';
import { formatTripDateRange } from '@/lib/tripFormatters';

interface TripContextHeaderProps {
  sectionLabel: string;
}

export default function TripContextHeader({ sectionLabel }: TripContextHeaderProps) {
  const { trip } = useTrip();

  if (!trip) return null;

  return (
    <header className="editorial-context-header">
      <div className="min-w-0">
        <p className="editorial-kicker">{sectionLabel}</p>
        <h1 className="editorial-context-title">{trip.title}</h1>
      </div>

      <div className="editorial-context-facts">
        <span className="editorial-context-fact">
          <MapPin className="h-3.5 w-3.5 text-[var(--terra)]" aria-hidden="true" />
          {trip.destination}
        </span>
        <span className="editorial-context-fact">
          <CalendarDays className="h-3.5 w-3.5 text-[var(--terra)]" aria-hidden="true" />
          {formatTripDateRange(trip.startDate, trip.endDate)}
        </span>
      </div>
    </header>
  );
}
