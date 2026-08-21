'use client';

import { useCallback, useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { CalendarDays, ChevronDown, ChevronUp, Clock3, Map, MapPin } from 'lucide-react';
import { db } from '@/lib/firebase';
import StatePanel from '@/components/StatePanel';
import { toDate } from '@/lib/tripFormatters';

interface Activity {
  time: string;
  title: string;
  location: string;
  description?: string;
  costEstimate?: number;
  mapQuery?: string;
}

interface DailyItinerary {
  id: string;
  dayNumber: number;
  date: unknown;
  activities: Activity[];
}

export default function ItineraryTab({ tripId }: { tripId: string }) {
  const [itineraries, setItineraries] = useState<DailyItinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});

  const fetchItineraries = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const itinerariesQuery = query(
        collection(db, 'trips', tripId, 'itineraries'),
        orderBy('dayNumber', 'asc'),
      );
      const querySnapshot = await getDocs(itinerariesQuery);
      const data = querySnapshot.docs.map((itineraryDoc) => ({
        id: itineraryDoc.id,
        ...itineraryDoc.data(),
      } as DailyItinerary));
      setItineraries(data);
      if (data.length > 0) setSelectedDay(data[0].dayNumber);
    } catch (fetchError) {
      console.error('Error fetching itineraries:', fetchError);
      setError('일정을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    // The request owns the loading/error transitions for this data panel.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchItineraries();
  }, [fetchItineraries]);

  const toggleItem = (index: number) => {
    setExpandedItems((previous) => ({ ...previous, [index]: !previous[index] }));
  };

  const openGoogleMaps = (location: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return <StatePanel variant="loading" title="일정을 불러오는 중입니다" description="여행 날짜별 계획을 준비하고 있습니다." />;
  }

  if (error) {
    return (
      <StatePanel
        variant="error"
        title="일정을 불러오지 못했습니다"
        description={error}
        actionLabel="다시 시도"
        onAction={() => void fetchItineraries()}
      />
    );
  }

  if (itineraries.length === 0) {
    return (
      <StatePanel
        variant="empty"
        icon={CalendarDays}
        title="아직 등록된 일정이 없습니다"
        description="여행 관리자가 일정을 추가하면 날짜별 계획이 여기에 표시됩니다."
      />
    );
  }

  const currentDayData = itineraries.find((day) => day.dayNumber === selectedDay);

  return (
    <section className="editorial-section !pt-0" aria-labelledby="itinerary-title">
      <div className="editorial-section-heading">
        <div>
          <p className="editorial-kicker">03 / Itinerary</p>
          <h2 id="itinerary-title" className="editorial-display mt-4 text-[clamp(1.95rem,4vw,3.35rem)] leading-[1.03]">
            하루의 결을 따라.
          </h2>
        </div>
        <span className="hidden text-right text-[0.62rem] font-bold uppercase tracking-[0.15em] text-[var(--muted)] sm:block">
          {currentDayData ? `${currentDayData.activities.length} stops` : 'No stops'}<br />Okinawa / field route
        </span>
      </div>

      <div className="editorial-day-tabs" aria-label="여행 날짜 선택">
        {itineraries.map((day) => {
          const date = toDate(day.date);
          const dateString = date
            ? date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', weekday: 'short' })
            : '날짜 미정';
          const isSelected = selectedDay === day.dayNumber;

          return (
            <button
              key={day.id}
              type="button"
              className="editorial-day-tab editorial-focus"
              data-active={isSelected}
              onClick={() => setSelectedDay(day.dayNumber)}
              aria-pressed={isSelected}
            >
              <span>{dateString}</span>
              <span>Day {String(day.dayNumber).padStart(2, '0')}</span>
            </button>
          );
        })}
      </div>

      {currentDayData && currentDayData.activities.length > 0 ? (
        <div className="editorial-timeline">
          {currentDayData.activities.map((activity, index) => {
            const isExpanded = expandedItems[index];
            const detailsId = `activity-details-${currentDayData.id}-${index}`;

            return (
              <article key={`${currentDayData.id}-${index}`} className="editorial-timeline-entry">
                <span className="editorial-timeline-node" aria-hidden="true" />
                <button
                  type="button"
                  className="editorial-timeline-header editorial-focus"
                  onClick={() => toggleItem(index)}
                  aria-expanded={isExpanded}
                  aria-controls={detailsId}
                >
                  <span className="editorial-timeline-time">
                    <Clock3 className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
                    {activity.time}
                  </span>
                  <span>
                    <span className="editorial-timeline-title block">{activity.title}</span>
                    <span className="editorial-timeline-location">
                      <MapPin className="h-3.5 w-3.5 text-[var(--terra)]" aria-hidden="true" />
                      {activity.location}
                    </span>
                  </span>
                  <span className="editorial-timeline-toggle" aria-hidden="true">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </span>
                </button>

                {isExpanded && (
                  <div id={detailsId} className="editorial-timeline-detail">
                    <span className="text-[0.58rem] font-extrabold uppercase tracking-[0.14em] text-[var(--muted)]">Field note</span>
                    <div>
                      <p className="editorial-timeline-detail-copy">{activity.description || '이 일정에 대한 세부 기록을 준비하고 있습니다.'}</p>
                      <div className="editorial-timeline-detail-actions">
                        <span className="editorial-timeline-cost">
                          {activity.costEstimate && activity.costEstimate > 0
                            ? `예상 비용 ${activity.costEstimate.toLocaleString()}원`
                            : '예상 비용 없음'}
                        </span>
                        <button
                          type="button"
                          onClick={() => openGoogleMaps(activity.mapQuery || activity.location)}
                          className="editorial-link-button editorial-focus inline-flex items-center gap-1.5"
                        >
                          <Map className="h-3.5 w-3.5" aria-hidden="true" />
                          지도에서 보기
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="editorial-state-panel mt-5">
          <p className="editorial-state-title">해당 일자의 일정이 없습니다</p>
          <p className="editorial-state-copy">다른 날짜를 선택해 여행의 다음 장면을 확인해보세요.</p>
        </div>
      )}
    </section>
  );
}
