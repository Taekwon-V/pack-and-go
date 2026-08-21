import { CloudSun, Compass, MapPin, MessageCircle, Shirt, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import GeminiChatWidget from '@/components/GeminiChatWidget';
import ImageCarousel from '@/components/ImageCarousel';
import DestinationMap from '@/components/DestinationMap';
import type { TripRecord } from './types';
import { EDITORIAL_GALLERY } from '@/lib/editorialAssets';

interface TripOverviewTabProps {
  trip: TripRecord;
  mapUrl: string;
  externalMapUrl: string;
}

const OKINAWA_HIGHLIGHTS: Array<{ title: string; description: string; icon: LucideIcon }> = [
  {
    title: '에메랄드빛 아열대 낙원',
    description: '일본 최남단에 위치한 아열대 기후의 섬으로, 에메랄드빛 바다와 산호초가 펼쳐진 아름다운 자연 경관을 자랑합니다.',
    icon: Compass,
  },
  {
    title: '독자적인 류큐 왕국의 숨결',
    description: '과거 류큐 왕국 시대의 독자적인 역사와 문화를 간직하고 있어, 일본 본토와는 다른 이국적인 분위기를 느낄 수 있습니다.',
    icon: MapPin,
  },
  {
    title: '동서양이 만나는 문화 융합',
    description: '아메리칸 빌리지처럼 서로 다른 문화가 포개진 장소에서 오키나와만의 색다른 장면을 만날 수 있습니다.',
    icon: Users,
  },
  {
    title: '사계절 내내 완벽한 휴양',
    description: '따뜻한 날씨와 세계적인 다이빙 포인트 덕분에 해양 스포츠와 휴양을 함께 즐기기 좋은 여행지입니다.',
    icon: Compass,
  },
];

export default function TripOverviewTab({ trip, mapUrl, externalMapUrl }: TripOverviewTabProps) {
  const gallery = trip.gallery && trip.gallery.length > 0 ? trip.gallery : EDITORIAL_GALLERY;
  const highlights = trip.destination.includes('오키나와') ? OKINAWA_HIGHLIGHTS : OKINAWA_HIGHLIGHTS.slice(0, 3);

  return (
    <div>
      <section className="editorial-section !pt-0" aria-labelledby="destination-title">
        <div className="editorial-overview-grid mt-0">
          <article className="editorial-article">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 id="destination-title" className="editorial-kicker">The destination / 01</h2>
              <span className="editorial-display text-[1.2rem]">Naha — Chatan</span>
            </div>

            <p className="editorial-article-lede">
              {trip.destinationDesc || '섬의 결을 따라 걷고, 바다의 색을 오래 바라보며 함께 계획한 여행의 장면을 채워보세요.'}
            </p>

            <div className="editorial-highlight-list">
              {highlights.map(({ title, description, icon: Icon }, index) => (
                <div key={title} className="editorial-highlight-row">
                  <span className="editorial-highlight-index">{String(index + 1).padStart(2, '0')}</span>
                  <Icon className="h-4 w-4 text-[var(--olive)]" aria-hidden="true" />
                  <h3 className="editorial-highlight-title">{title}</h3>
                  <p className="editorial-highlight-description">{description}</p>
                </div>
              ))}
            </div>

            <div className="editorial-details-row">
              <div>
                <h3 className="editorial-detail-label"><CloudSun className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" /> Weather</h3>
                <p className="editorial-detail-value">{trip.weatherDesc || '평균 기온 20도, 맑고 화창한 봄 날씨 (가끔 흐림)'}</p>
              </div>
              <div>
                <h3 className="editorial-detail-label"><Shirt className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" /> Packing note</h3>
                <p className="editorial-detail-value">{trip.clothingDesc || '초가을의 선선한 바람이 부는 날씨. 반팔 위주의 가벼운 옷차림과 저녁을 위한 겉옷'}</p>
              </div>
            </div>
          </article>

          <aside className="editorial-map-column" aria-label="여행지 지도와 사진">
            <div className="mb-5 flex items-center justify-between gap-4">
              <span className="editorial-kicker">Chatan, Okinawa / Map</span>
              <MapPin className="h-4 w-4 text-[var(--terra)]" aria-hidden="true" />
            </div>
            <DestinationMap
              title={trip.destination}
              query={trip.mapQuery || trip.destination}
              embedUrl={mapUrl}
              externalUrl={externalMapUrl}
            />
            <div className="mt-7 border-t border-[var(--rule)] pt-4 text-[0.68rem] font-bold text-[var(--muted)]">
              <span className="text-[var(--olive)]">TRAVELLING WITH</span>
              <span className="ml-3">멤버 {trip.collaboratorIds?.length ? trip.collaboratorIds.length + 1 : 1}명</span>
            </div>
          </aside>
        </div>
      </section>

      <section className="editorial-gallery-section" aria-labelledby="gallery-title">
        <div className="flex items-center justify-between gap-4">
          <h2 id="gallery-title" className="editorial-kicker">Field images / 04 fragments</h2>
          <span className="hidden text-[0.62rem] font-bold tracking-[0.13em] text-[var(--muted)] sm:inline">A quiet sequence of place</span>
        </div>
        <ImageCarousel images={gallery} />
      </section>

      <section className="editorial-chat-section" aria-labelledby="travel-assistant-title">
        <div className="editorial-section-heading">
          <div>
            <p className="editorial-kicker">07 / Travel assistant</p>
            <h2 id="travel-assistant-title" className="editorial-display mt-4 text-[clamp(2rem,4vw,3.35rem)] leading-[1.03]">
              여행을 물어보는 시간.
            </h2>
          </div>
          <p className="hidden max-w-[18ch] text-right text-[0.62rem] font-bold uppercase leading-[1.7] tracking-[0.15em] text-[var(--muted)] sm:block">
            Gemini travel guide<br />Ask the next question
          </p>
        </div>

        <div className="editorial-chat-layout">
          <div className="editorial-chat-intro">
            <p className="editorial-chat-intro-copy">
              함께 만든 일정의 빈칸을 채우거나, 지금 눈앞에 있는 장소의 다음 장면을 물어보세요. Gemini가 {trip.destination}에 맞춰 짧고 실용적인 답을 정리해드립니다.
            </p>
            <div className="editorial-chat-prompts" aria-label="질문 예시">
              <p className="editorial-chat-prompt"><MessageCircle className="h-4 w-4 text-[var(--terra)]" aria-hidden="true" />현지에서 꼭 먹어봐야 할 메뉴는?</p>
              <p className="editorial-chat-prompt"><MessageCircle className="h-4 w-4 text-[var(--terra)]" aria-hidden="true" />비 오는 날 바꿀 수 있는 일정은?</p>
              <p className="editorial-chat-prompt"><MessageCircle className="h-4 w-4 text-[var(--terra)]" aria-hidden="true" />공항에서 숙소까지 가장 편한 방법은?</p>
            </div>
            <p className="editorial-chat-note">PRIVATE FIELD NOTE / GOOGLE AI</p>
          </div>

          <GeminiChatWidget destination={trip.destination} />
        </div>
      </section>
    </div>
  );
}
