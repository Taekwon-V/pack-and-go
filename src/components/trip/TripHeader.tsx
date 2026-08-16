'use client';

import { Calendar, MapPin } from 'lucide-react';
import Image from 'next/image';
import { useTrip } from './TripContext';

export default function TripHeader() {
  const { trip, userProfiles } = useTrip();

  const sd = trip.startDate as any;
  const ed = trip.endDate as any;
  const getDayStr = (d: Date) => ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
  const sDate = sd?.toDate ? sd.toDate() : new Date(sd || Date.now());
  const eDate = ed?.toDate ? ed.toDate() : new Date(ed || Date.now());
  
  const sStr = `${sDate.toLocaleDateString()} (${getDayStr(sDate)})`;
  const eStr = `${eDate.toLocaleDateString()} (${getDayStr(eDate)})`;

  const participants = [trip.ownerId, ...(trip.collaboratorIds || [])];
  const uniqueParticipants = Array.from(new Set(participants)).filter(Boolean) as string[];
  const displayUsers = uniqueParticipants.slice(0, 6);
  const extraCount = uniqueParticipants.length - 6;

  return (
    <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-[80px]" />
      
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-3">{trip.title}</h1>
            {trip.concept && (
              <p className="text-indigo-400 font-medium text-lg flex items-center mb-6">
                <span className="w-8 h-[1px] bg-indigo-400 mr-3"></span>
                "{trip.concept}"
              </p>
            )}
          </div>
          
          {/* Avatars */}
          <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
            <span className="text-sm font-medium text-slate-600 pl-2">멤버 ({uniqueParticipants.length}명)</span>
            <div className="flex -space-x-3 pr-2">
              {displayUsers.map((uid, i) => {
                const profile = userProfiles[uid];
                const initial = profile?.displayName?.charAt(0) || profile?.email?.charAt(0) || '?';
                return (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600 z-10 relative overflow-hidden shadow-sm">
                    {profile?.photoURL ? (
                      <Image src={profile.photoURL} alt="Profile" fill className="object-cover" sizes="40px" />
                    ) : (
                      initial.toUpperCase()
                    )}
                  </div>
                );
              })}
              {extraCount > 0 && (
                <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500 z-10 shadow-sm">
                  +{extraCount}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
            <Calendar className="w-5 h-5 mr-3 text-indigo-600" />
            <span className="text-slate-700 font-medium">{sStr} ~ {eStr}</span>
          </div>
          <div className="flex items-center bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
            <MapPin className="w-5 h-5 mr-3 text-indigo-600" />
            <span className="text-slate-700 font-medium">{trip.destination}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
