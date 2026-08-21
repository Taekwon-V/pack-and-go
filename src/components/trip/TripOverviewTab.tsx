import { CloudSun, Compass, MapPin, Shirt, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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

const GERMANY_HIGHLIGHTS: Array<{ title: string; description: string; icon: LucideIcon }> = [
  {
    title: '동화 속 백조의 고성',
    description: '디즈니 성의 모티브가 된 노이슈반슈타인 성과 알프스 산맥의 웅장한 자연 경관을 감상합니다.',
    icon: Compass,
  },
  {
    title: '중세의 숨결, 로맨틱 가도',
    description: '로텐부르크와 딘켈스뷜 등 성벽과 붉은 지붕이 고스란히 보존된 완벽한 중세 마을을 탐방합니다.',
    icon: MapPin,
  },
  {
    title: '맥주와 와인의 본고장',
    description: '바이에른 정통 학센과 뮌헨 바이스비어, 알테 마인교 위에서 즐기는 낭만적인 프랑켄 와인.',
    icon: Users,
  },
  {
    title: '아우토반 가을 로드트립',
    description: '황금빛 단풍으로 물든 남독일의 아름다운 가도와 유네스코 바로크 궁전을 달리는 힐링 여행.',
    icon: Compass,
  },
];

const PHU_QUOC_HIGHLIGHTS: Array<{ title: string; description: string; icon: LucideIcon }> = [
  {
    title: '세계 최장 해상 케이블카',
    description: '에메랄드빛 바다 위를 날아 혼똔섬으로 향하는 7.9km 세계 최장 해상 케이블카와 아쿠아토피아 워터파크.',
    icon: Compass,
  },
  {
    title: '황금빛 롱비치 선셋 & 비치 바',
    description: '베트남에서 가장 아름다운 일몰을 자랑하는 롱비치 해변과 이국적인 선셋 칵테일 바.',
    icon: MapPin,
  },
  {
    title: '활기 넘치는 즈엉동 야시장',
    description: '갓 잡은 신선한 랍스터와 가리비 해산물 바비큐, 땅콩과 반미 등 풍성한 베트남 스트리트 푸드.',
    icon: Users,
  },
  {
    title: '아시아 최대 오픈 사파리',
    description: '자연 그대로의 숲에서 자유롭게 노니는 야생 동물들과 기린 레스토랑에서의 특별한 교감.',
    icon: Compass,
  },
];

export default function TripOverviewTab({ trip, mapUrl, externalMapUrl }: TripOverviewTabProps) {
  const gallery = trip.gallery && trip.gallery.length > 0 ? trip.gallery : EDITORIAL_GALLERY;
  const highlights = trip.destination.includes('오키나와')
    ? OKINAWA_HIGHLIGHTS
    : trip.destination.includes('독일') || trip.destination.toLowerCase().includes('germany')
    ? GERMANY_HIGHLIGHTS
    : trip.destination.includes('푸꾸옥') || trip.destination.toLowerCase().includes('phu quoc')
    ? PHU_QUOC_HIGHLIGHTS
    : OKINAWA_HIGHLIGHTS.slice(0, 3);

  return (
    <div>
      <section className="editorial-section !pt-0" aria-labelledby="destination-title">
        <div className="editorial-overview-grid mt-0">
          <article className="editorial-article">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 id="destination-title" className="editorial-kicker">The destination</h2>
              <span className="editorial-display text-[1.2rem]">{trip.destination}</span>
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
              <span className="editorial-kicker">{trip.mapQuery || trip.destination} / Map</span>
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
              <span className="ml-3">
                멤버 {Array.from(new Set([trip.ownerId, ...(trip.collaboratorIds || [])])).filter(Boolean).length || 1}명
              </span>
            </div>
          </aside>
        </div>
      </section>

      <section className="editorial-gallery-section" aria-labelledby="gallery-title">
        <div className="flex items-center justify-between gap-4">
          <h2 id="gallery-title" className="editorial-kicker">Field images</h2>
          <span className="hidden text-[0.62rem] font-bold tracking-[0.13em] text-[var(--muted)] sm:inline">A quiet sequence of place</span>
        </div>
        <ImageCarousel images={gallery} />
      </section>
    </div>
  );
}
