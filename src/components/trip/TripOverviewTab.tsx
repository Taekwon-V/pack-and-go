import { Navigation, CloudSun, Shirt, ImageIcon, Palmtree, Castle, Coffee, Compass } from 'lucide-react';
import ImageCarousel from '@/components/ImageCarousel';
import DestinationMap from '@/components/DestinationMap';
import type { TripRecord } from './types';

export default function TripOverviewTab({
  trip,
  mapUrl,
  externalMapUrl,
}: {
  trip: TripRecord;
  mapUrl: string;
  externalMapUrl: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-8">
      {/* 여행지 소개 영역 */}
      <section className="space-y-8">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
            <Navigation className="w-6 h-6 mr-3 text-indigo-600" />
            여행지 정보
          </h2>
          
          {/* Map */}
          <DestinationMap
            title={trip.destination}
            query={trip.mapQuery || trip.destination}
            embedUrl={mapUrl}
            externalUrl={externalMapUrl}
          />

          {/* Description */}
          <div className="mb-8">
            {trip.destinationDesc ? (
              <p className="text-slate-700 leading-relaxed">
                {trip.destinationDesc.split('\n').map((line: string, i: number) => (
                  <span key={i}>
                    {line}
                    <br />
                  </span>
                ))}
              </p>
            ) : trip.destination.includes('오키나와') ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 flex gap-4 transition-transform hover:-translate-y-1">
                  <div className="mt-1 bg-white p-2.5 rounded-2xl shadow-sm text-indigo-500 h-fit"><Palmtree size={22} /></div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1.5">에메랄드빛 아열대 낙원</h4>
                    <p className="text-sm text-slate-700 leading-relaxed">일본 최남단에 위치한 아열대 기후의 섬으로, 에메랄드빛 바다와 산호초가 펼쳐진 아름다운 자연 경관을 자랑합니다.</p>
                  </div>
                </div>
                <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 flex gap-4 transition-transform hover:-translate-y-1">
                  <div className="mt-1 bg-white p-2.5 rounded-2xl shadow-sm text-amber-500 h-fit"><Castle size={22} /></div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1.5">독자적인 류큐 왕국의 숨결</h4>
                    <p className="text-sm text-slate-700 leading-relaxed">과거 류큐 왕국 시대의 독자적인 역사와 문화를 간직하고 있어, 일본 본토와는 다른 이국적이고 매력적인 분위기를 느낄 수 있습니다.</p>
                  </div>
                </div>
                <div className="p-5 bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl border border-rose-100 flex gap-4 transition-transform hover:-translate-y-1">
                  <div className="mt-1 bg-white p-2.5 rounded-2xl shadow-sm text-rose-500 h-fit"><Coffee size={22} /></div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1.5">동서양이 만나는 문화 융합</h4>
                    <p className="text-sm text-slate-700 leading-relaxed">미군의 영향으로 형성된 아메리칸 빌리지 등 독특한 사회적 융합 문화가 곳곳에 스며들어 있어 색다른 볼거리를 제공합니다.</p>
                  </div>
                </div>
                <div className="p-5 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl border border-teal-100 flex gap-4 transition-transform hover:-translate-y-1">
                  <div className="mt-1 bg-white p-2.5 rounded-2xl shadow-sm text-teal-500 h-fit"><Compass size={22} /></div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1.5">사계절 내내 완벽한 휴양</h4>
                    <p className="text-sm text-slate-700 leading-relaxed">세계적인 수준의 다이빙 포인트와 따뜻한 날씨 덕분에 해양 스포츠와 휴양을 즐기기에 최적의 조건을 갖추고 있습니다.</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-700 leading-relaxed">
                {`${trip.destination}에 대한 멋진 설명을 기대해 주세요!`}
              </p>
            )}
          </div>

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
            '/gallery/1.jpg',
            '/gallery/2.png',
            '/gallery/3.jpg',
            '/gallery/4.jpg'
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
    </div>
  );
}
