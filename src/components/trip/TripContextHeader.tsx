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
    <header className="mb-6 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm md:px-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">{sectionLabel}</p>
          <h1 className="mt-1 truncate text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
            {trip.title}
          </h1>
        </div>

        <div className="flex flex-wrap gap-2 text-sm font-medium text-slate-600">
          <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
            <MapPin className="h-4 w-4 text-indigo-600" aria-hidden="true" />
            <span>{trip.destination}</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
            <CalendarDays className="h-4 w-4 text-indigo-600" aria-hidden="true" />
            <span>{formatTripDateRange(trip.startDate, trip.endDate)}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
