'use client';

import { Calendar, MapPin } from 'lucide-react';
import Image from 'next/image';
import { useTrip } from './TripContext';
import { toDate } from '@/lib/tripFormatters';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function formatDateWithDay(value: unknown): string {
  const date = toDate(value);
  if (!date) return '날짜 미정';
  return `${date.toLocaleDateString('ko-KR')} (${WEEKDAYS[date.getDay()]})`;
}

export default function TripHeader() {
  const { trip, userProfiles } = useTrip();
  const sStr = formatDateWithDay(trip.startDate);
  const eStr = formatDateWithDay(trip.endDate);

  const participants = [trip.ownerId, ...(trip.collaboratorIds || [])];
  const uniqueParticipants = Array.from(new Set(participants)).filter(Boolean) as string[];
  const displayUsers = uniqueParticipants.slice(0, 6);
  const extraCount = uniqueParticipants.length - 6;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-indigo-50 blur-[80px]" />

      <div className="relative z-10">
        <div className="mb-6 flex flex-col justify-between gap-6 md:flex-row md:items-start">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">{trip.title}</h1>
            {trip.concept && (
              <p className="mb-6 mt-3 flex items-center text-lg font-medium text-indigo-400">
                <span className="mr-3 h-px w-8 bg-indigo-400" />
                <span>“{trip.concept}”</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-2.5">
            <span className="pl-2 text-sm font-medium text-slate-600">멤버 ({uniqueParticipants.length}명)</span>
            <div className="flex -space-x-3 pr-2">
              {displayUsers.map((uid, index) => {
                const profile = userProfiles[uid];
                const initial = profile?.displayName?.charAt(0) || profile?.email?.charAt(0) || '?';
                return (
                  <div
                    key={uid || index}
                    className="relative z-10 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-indigo-100 text-sm font-bold text-indigo-600 shadow-sm"
                  >
                    {profile?.photoURL ? (
                      <Image src={profile.photoURL} alt="프로필" fill className="object-cover" sizes="40px" />
                    ) : (
                      initial.toUpperCase()
                    )}
                  </div>
                );
              })}
              {extraCount > 0 && (
                <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-sm font-bold text-slate-500 shadow-sm">
                  +{extraCount}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5">
            <Calendar className="mr-3 h-5 w-5 text-indigo-600" aria-hidden="true" />
            <span className="font-medium text-slate-700">{sStr} ~ {eStr}</span>
          </div>
          <div className="flex items-center rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5">
            <MapPin className="mr-3 h-5 w-5 text-indigo-600" aria-hidden="true" />
            <span className="font-medium text-slate-700">{trip.destination}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
