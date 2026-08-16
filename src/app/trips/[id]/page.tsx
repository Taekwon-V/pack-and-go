'use client';

import { useEffect, useState, use } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MapPin, Calendar, Loader2, Users, CloudSun, Shirt, Navigation, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import ImageCarousel from '@/components/ImageCarousel';
import GeminiChatWidget from '@/components/GeminiChatWidget';

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
    mapQueryStr = 'Okinawa Island, Japan';
  }
  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(mapQueryStr)}&z=9&output=embed`;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
      {/* 1. 여행 개요 영역 */}
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

      <div className="grid grid-cols-1 gap-8">
        {/* 2. 여행지 소개 영역 */}
        <section className="space-y-8">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
              <Navigation className="w-6 h-6 mr-3 text-indigo-600" />
              여행지 정보
            </h2>
            
            {/* Map */}
            <div className="w-full h-96 rounded-2xl overflow-hidden mb-6 border border-slate-200 relative">
              <iframe 
                src={mapUrl}
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0"
              />
              <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-slate-900/5 rounded-2xl"></div>
            </div>

            {/* Description */}
            <p className="text-slate-700 leading-relaxed mb-8">
              {trip.destinationDesc ? (
                trip.destinationDesc.split('\n').map((line, i) => (
                  <span key={i}>
                    {line}
                    <br />
                  </span>
                ))
              ) : trip.destination.includes('오키나와') ? (
                <>
                  오키나와는 일본 최남단에 위치한 아열대 기후의 섬으로, 에메랄드빛 바다와 산호초가 펼쳐진 아름다운 자연 경관을 자랑합니다.<br />
                  과거 류큐 왕국 시대의 독자적인 역사와 문화를 간직하고 있어, 일본 본토와는 다른 이국적이고 매력적인 분위기를 느낄 수 있습니다.<br />
                  미군의 영향으로 형성된 아메리칸 빌리지 등 독특한 사회적 융합 문화가 곳곳에 스며들어 있어 색다른 볼거리를 제공합니다.<br />
                  세계적인 수준의 다이빙 포인트와 따뜻한 날씨 덕분에 사계절 내내 해양 스포츠와 휴양을 즐기기에 최적의 조건을 갖추고 있습니다.<br />
                  슈리성 같은 역사 유적 탐방부터, 아름다운 해변 휴양, 그리고 츄라우미 수족관 같은 명소까지 가족 단위 여행객에게 완벽한 여행지입니다.
                </>
              ) : (
                `${trip.destination}에 대한 멋진 설명을 기대해 주세요!`
              )}
            </p>

            {/* Weather & Clothing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <div className="flex items-center mb-3">
                  <CloudSun className="w-5 h-5 text-amber-500 mr-2" />
                  <h3 className="font-semibold text-slate-900">예상 날씨</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {trip.weatherDesc || '평균 기온 20도, 맑고 화창한 봄 날씨 (가끔 흐림)'}
                </p>
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <div className="flex items-center mb-3">
                  <Shirt className="w-5 h-5 text-indigo-500 mr-2" />
                  <h3 className="font-semibold text-slate-900">추천 복장</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {trip.clothingDesc || '따뜻한 봄 날씨에 맞는 가벼운 긴팔, 아침저녁을 대비한 얇은 외투'}
                </p>
              </div>
            </div>
          </div>

          {/* Gallery Carousel */}
          {(() => {
            const gallery = trip.gallery && trip.gallery.length > 0 ? trip.gallery : [
              'https://images.unsplash.com/photo-1598134493179-51332e56807f?q=80&w=800&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1510619888924-11e2f4a56a64?q=80&w=800&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1590219660855-6cb3ee33b2fc?q=80&w=800&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1616766432415-68ffbbff8cb7?q=80&w=800&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1629806443493-27eb6ba92bf1?q=80&w=800&auto=format&fit=crop'
            ];
            return (
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4 px-2">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center">
                    <ImageIcon className="w-5 h-5 mr-2 text-indigo-600" />
                    주요 명소
                  </h2>
                </div>
                <ImageCarousel images={gallery} />
              </div>
            );
          })()}
        </section>

        {/* 3. Gemini Q&A 영역 (삭제됨) */}
        {/*
        <section>
          <div className="sticky top-24">
            <GeminiChatWidget destination={trip.destination} />
          </div>
        </section>
        */}
      </div>
    </div>
  );
}
