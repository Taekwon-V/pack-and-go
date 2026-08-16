'use client';

import { useEffect, useState, use } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MapPin, Calendar, Users, Loader2 } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const docRef = doc(db, 'trips', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setTrip({ id: docSnap.id, ...docSnap.data() } as Trip);
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching trip:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrip();
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="bg-white p-8 rounded-3xl shadow-sm text-center max-w-md w-full border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-2">여행 정보를 찾을 수 없습니다</h2>
          <p className="text-slate-500">삭제되었거나 접근 권한이 없습니다.</p>
        </div>
      </div>
    );
  }

  const memberCount = 1 + (trip.collaboratorIds?.length || 0);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">{trip.title}</h1>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full font-medium">
            <MapPin className="w-4 h-4 mr-2" />
            {trip.destination}
          </div>
          <div className="flex items-center px-4 py-2 bg-purple-50 text-purple-700 rounded-full font-medium">
            <Calendar className="w-4 h-4 mr-2" />
            {trip.startDate} ~ {trip.endDate}
          </div>
          <div className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-full font-medium">
            <Users className="w-4 h-4 mr-2" />
            멤버 {memberCount}명
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-4">여행 소개</h2>
            <p className="text-slate-600 leading-relaxed">
              {trip.description || "이 여행에 대한 설명이 아직 작성되지 않았습니다. 동행자들과 함께 채워보세요!"}
            </p>
          </section>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-3xl p-6 text-white shadow-lg shadow-indigo-200">
              <h3 className="font-semibold mb-1 opacity-90">다가오는 일정</h3>
              <p className="text-2xl font-bold">일정표를 확인하세요</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-6 text-white shadow-lg shadow-purple-200">
              <h3 className="font-semibold mb-1 opacity-90">예산 현황</h3>
              <p className="text-2xl font-bold">₩ 0 남음</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">빠른 액션</h3>
            <div className="space-y-3">
              <button className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-medium transition-colors text-left flex items-center justify-between">
                <span>새 일정 추가</span>
                <Calendar className="w-4 h-4 text-slate-400" />
              </button>
              <button className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-medium transition-colors text-left flex items-center justify-between">
                <span>지출 내역 기록</span>
                <MapPin className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
