'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MapPin, Calendar, Loader2 } from 'lucide-react';
import Image from 'next/image';
import TripOverviewTab from '@/components/trip/TripOverviewTab';
import ItineraryTab from '@/components/trip/ItineraryTab';
import BudgetTab from '@/components/trip/BudgetTab';
import MembersTab from '@/components/trip/MembersTab';

interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  ownerId: string;
  collaboratorIds?: string[];
  concept?: string;
  destinationDesc?: string;
  weatherDesc?: string;
  clothingDesc?: string;
  mapQuery?: string;
  gallery?: string[];
}

type TabType = 'overview' | 'itinerary' | 'budget' | 'members';

export default function TripOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const fetchTripData = useCallback(async () => {
    try {
      const docRef = doc(db, 'trips', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const fetchedTrip = { id: docSnap.id, ...docSnap.data() } as Trip;
        setTrip(fetchedTrip);

        const uids = new Set<string>();
        if (fetchedTrip.ownerId) uids.add(fetchedTrip.ownerId);
        if (fetchedTrip.collaboratorIds) {
          fetchedTrip.collaboratorIds.forEach(uid => uids.add(uid));
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
  }, [id]);

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
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="bg-white p-8 rounded-3xl shadow-sm text-center max-w-md w-full border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-2">여행 정보를 찾을 수 없습니다</h2>
          <p className="text-slate-500">삭제되었거나 접근 권한이 없습니다.</p>
        </div>
      </div>
    );
  }

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

  let mapQueryStr = trip.mapQuery || trip.destination;
  if (mapQueryStr.includes('오키나와')) {
    mapQueryStr = '26.4941, 127.9902'; // Exact center of Okinawa island
  }
  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(mapQueryStr)}&z=9&output=embed`;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* 1. 여행 요약 헤더 */}
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

      {/* 2. 탭 네비게이션 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 flex overflow-x-auto hide-scrollbar">
        {[
          { id: 'overview', label: '개요' },
          { id: 'itinerary', label: '일정표' },
          { id: 'budget', label: '예산' },
          { id: 'members', label: '멤버 관리' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex-1 min-w-[100px] py-3 px-4 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. 탭 컨텐츠 */}
      <div className="mt-8">
        {activeTab === 'overview' && <TripOverviewTab trip={trip} mapUrl={mapUrl} />}
        {activeTab === 'itinerary' && <ItineraryTab tripId={trip.id} />}
        {activeTab === 'budget' && <BudgetTab tripId={trip.id} />}
        {activeTab === 'members' && <MembersTab trip={trip} userProfiles={userProfiles} onUpdate={fetchTripData} />}
      </div>
    </div>
  );
}
