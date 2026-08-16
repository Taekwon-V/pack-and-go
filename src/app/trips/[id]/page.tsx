'use client';

import { useEffect, useState, use } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MapPin, Calendar, Loader2, ArrowRight, Wallet, ImageIcon, CalendarDays } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  description?: string;
  ownerId: string;
  collaboratorIds?: string[];
}

export default function TripOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTripData = async () => {
      try {
        const docRef = doc(db, 'trips', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const fetchedTrip = { id: docSnap.id, ...docSnap.data() } as Trip;
          setTrip(fetchedTrip);

          // Fetch participant profiles
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
    };

    fetchTripData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center p-8 bg-transparent">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="bg-[#18181b] p-8 rounded-3xl shadow-sm text-center max-w-md w-full border border-white/5">
          <h2 className="text-xl font-bold text-gray-200 mb-2">여행 정보를 찾을 수 없습니다</h2>
          <p className="text-gray-500">삭제되었거나 접근 권한이 없습니다.</p>
        </div>
      </div>
    );
  }

  // Calculate D-Day securely (handling Timestamp or string)
  const sd = trip.startDate as any;
  const ed = trip.endDate as any;
  const dateObj = sd?.toDate ? sd.toDate() : new Date(sd || Date.now());
  const diff = dateObj.getTime() - new Date().getTime();
  const dDay = Math.max(0, Math.ceil(diff / (1000 * 3600 * 24))) || 0;
  
  const sStr = sd?.toDate ? sd.toDate().toLocaleDateString() : (sd || '');
  const eStr = ed?.toDate ? ed.toDate().toLocaleDateString() : (ed || '');

  // Participant Avatar Logic
  const participants = [trip.ownerId, ...(trip.collaboratorIds || [])];
  const uniqueParticipants = Array.from(new Set(participants)).filter(Boolean) as string[];
  const displayUsers = uniqueParticipants.slice(0, 6);
  const extraCount = uniqueParticipants.length - 6;

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-semibold text-gray-200 mb-4 border border-white/5 shadow-sm">
            D-{dDay}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">{trip.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-gray-400">
            <div className="flex items-center bg-black/20 px-3 py-1.5 rounded-xl border border-white/5">
              <MapPin className="w-4 h-4 mr-2 text-emerald-500" />
              {trip.destination}
            </div>
            <div className="flex items-center bg-black/20 px-3 py-1.5 rounded-xl border border-white/5">
              <Calendar className="w-4 h-4 mr-2 text-emerald-500" />
              {sStr} ~ {eStr}
            </div>
          </div>
        </div>

        {/* Avatars */}
        <div className="flex items-center gap-4 bg-black/20 p-3 rounded-2xl border border-white/5">
          <span className="text-sm font-medium text-gray-400 pl-2">참여자</span>
          <div className="flex -space-x-3 pr-2">
            {displayUsers.map((uid, i) => {
              const profile = userProfiles[uid];
              const initial = profile?.displayName?.charAt(0) || profile?.email?.charAt(0) || '?';
              return (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-[#18181b] bg-emerald-900/50 flex items-center justify-center text-sm font-bold text-emerald-400 z-10 relative overflow-hidden shadow-sm" title={profile?.displayName || profile?.email || 'Unknown'}>
                  {profile?.photoURL ? (
                    <Image src={profile.photoURL} alt="Profile" fill className="object-cover" sizes="40px" />
                  ) : (
                    initial.toUpperCase()
                  )}
                </div>
              );
            })}
            {extraCount > 0 && (
              <div className="w-10 h-10 rounded-full border-2 border-[#18181b] bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-400 z-10 shadow-sm">
                +{extraCount}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Details) */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <span className="w-1.5 h-6 bg-emerald-500 rounded-full mr-3"></span>
              여행 소개
            </h2>
            <p className="text-gray-400 leading-relaxed min-h-[4rem]">
              {trip.description || "아직 여행 소개가 작성되지 않았습니다. 멋진 여행 계획을 채워보세요!"}
            </p>
          </section>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Quick Link Cards */}
            <Link href={`/trips/${trip.id}/itinerary`} className="group relative bg-gradient-to-br from-[#18181b] to-black rounded-3xl p-6 border border-emerald-500/20 hover:border-emerald-500/50 transition-all duration-300 overflow-hidden shadow-lg cursor-pointer">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-colors" />
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6">
                  <CalendarDays className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">일정표 확인</h3>
                  <p className="text-sm text-gray-400">여행 스케줄을 관리하세요</p>
                </div>
              </div>
            </Link>

            <Link href={`/trips/${trip.id}/budget`} className="group relative bg-gradient-to-br from-[#18181b] to-black rounded-3xl p-6 border border-emerald-500/20 hover:border-emerald-500/50 transition-all duration-300 overflow-hidden shadow-lg cursor-pointer">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-colors" />
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6">
                  <Wallet className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">예산 현황</h3>
                  <p className="text-sm text-gray-400">지출 내역을 기록하세요</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
        
        {/* Right Column (Actions / Summary) */}
        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
            <h3 className="text-lg font-bold text-white mb-5">빠른 이동</h3>
            <div className="space-y-3">
              <Link href={`/trips/${trip.id}/itinerary`} className="w-full p-4 bg-black/40 hover:bg-black/60 border border-white/5 hover:border-emerald-500/30 text-gray-300 rounded-2xl font-medium transition-all flex items-center justify-between group">
                <div className="flex items-center">
                  <CalendarDays className="w-5 h-5 mr-3 text-gray-400 group-hover:text-emerald-400 transition-colors" />
                  <span>세부 일정 보기</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-emerald-400 transition-colors group-hover:translate-x-1" />
              </Link>
              
              <Link href={`/trips/${trip.id}/gallery`} className="w-full p-4 bg-black/40 hover:bg-black/60 border border-white/5 hover:border-emerald-500/30 text-gray-300 rounded-2xl font-medium transition-all flex items-center justify-between group">
                <div className="flex items-center">
                  <ImageIcon className="w-5 h-5 mr-3 text-gray-400 group-hover:text-emerald-400 transition-colors" />
                  <span>추억 갤러리</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-emerald-400 transition-colors group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
