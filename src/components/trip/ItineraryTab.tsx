import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MapPin, Clock, Loader2, ChevronDown, ChevronUp, Map } from 'lucide-react';

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
  date: any; // Firestore Timestamp
  activities: Activity[];
}

export default function ItineraryTab({ tripId }: { tripId: string }) {
  const [itineraries, setItineraries] = useState<DailyItinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchItineraries = async () => {
      try {
        const q = query(collection(db, 'trips', tripId, 'itineraries'), orderBy('dayNumber', 'asc'));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyItinerary));
        setItineraries(data);
        if (data.length > 0) {
          setSelectedDay(data[0].dayNumber);
        }
      } catch (error) {
        console.error("Error fetching itineraries:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchItineraries();
  }, [tripId]);

  const toggleItem = (index: number) => {
    setExpandedItems(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const openGoogleMaps = (location: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="p-12 flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (itineraries.length === 0) {
    return (
      <div className="p-8 bg-white rounded-3xl shadow-sm text-center border border-slate-200">
        <p className="text-slate-500">등록된 일정이 없습니다.</p>
      </div>
    );
  }

  const currentDayData = itineraries.find(d => d.dayNumber === selectedDay);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      {/* 1단계: 전체 일정 요약 (Horizontal Day Selector) */}
      <div className="bg-slate-50 p-4 border-b border-slate-200 overflow-x-auto hide-scrollbar flex gap-3">
        {itineraries.map((day) => {
          const dDate = day.date?.toDate ? day.date.toDate() : new Date(day.date);
          const dateStr = dDate.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', weekday: 'short' });
          const isSelected = selectedDay === day.dayNumber;

          return (
            <button
              key={day.id}
              onClick={() => setSelectedDay(day.dayNumber)}
              className={`flex-shrink-0 flex flex-col items-center justify-center px-6 py-3 rounded-2xl transition-all ${
                isSelected 
                  ? 'bg-indigo-600 text-white shadow-md scale-105' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'
              }`}
            >
              <span className={`text-xs font-medium mb-1 ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                {dateStr}
              </span>
              <span className="font-bold">DAY {day.dayNumber}</span>
            </button>
          );
        })}
      </div>

      {/* 2단계: 일별 일정 상세 (Timeline View) */}
      <div className="p-6 md:p-8">
        {currentDayData && currentDayData.activities.length > 0 ? (
          <div className="relative border-l-2 border-indigo-100 ml-4 md:ml-6 space-y-8 pb-4">
            {currentDayData.activities.map((activity, index) => {
              const isExpanded = expandedItems[index];
              return (
                <div key={index} className="relative pl-8 md:pl-10">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-indigo-500 border-4 border-white shadow-sm"></div>
                  
                  {/* Content Card */}
                  <div 
                    className={`bg-white rounded-2xl border transition-all cursor-pointer ${
                      isExpanded ? 'border-indigo-200 shadow-md ring-1 ring-indigo-50' : 'border-slate-100 hover:border-indigo-200 hover:shadow-sm'
                    }`}
                    onClick={() => toggleItem(index)}
                  >
                    {/* Header (Always visible) */}
                    <div className="p-4 md:p-5 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center text-indigo-600 font-semibold text-sm mb-1">
                          <Clock className="w-4 h-4 mr-1.5" />
                          {activity.time}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">{activity.title}</h3>
                        <div className="flex items-center text-slate-600 text-sm">
                          <MapPin className="w-4 h-4 mr-1.5 flex-shrink-0" />
                          <span className="truncate">{activity.location}</span>
                        </div>
                      </div>
                      
                      {/* 3단계 토글 화살표 */}
                      <button className="text-slate-400 hover:text-indigo-600 p-2 rounded-full hover:bg-slate-50 transition-colors">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>

                    {/* 3단계: 세부 내용 (Expanded) */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 border-t border-slate-50 animate-in slide-in-from-top-2 fade-in duration-200">
                        <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                          {activity.description && (
                            <p className="text-slate-700 text-sm leading-relaxed">{activity.description}</p>
                          )}
                          
                          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                            {activity.costEstimate !== undefined && activity.costEstimate > 0 ? (
                              <div className="inline-flex items-center bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700">
                                예상 비용: {activity.costEstimate.toLocaleString()}원
                              </div>
                            ) : (
                              <div className="inline-flex items-center bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-500">
                                예상 비용 없음
                              </div>
                            )}

                            {/* 지도 보기 버튼 */}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation(); // Prevents collapsing the accordion
                                openGoogleMaps(activity.mapQuery || activity.location);
                              }}
                              className="inline-flex items-center text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors"
                            >
                              <Map className="w-4 h-4 mr-2" />
                              지도에서 보기
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            해당 일자의 일정이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
