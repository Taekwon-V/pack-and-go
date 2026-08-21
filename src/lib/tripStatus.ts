import { getDaysUntil, toDate } from '@/lib/tripFormatters';
import type { TripRecord, TripStatus } from '@/components/trip/types';

export interface TripStatusSectionDefinition {
  status: TripStatus;
  label: string;
  englishLabel: string;
  emptyCopy: string;
}

export const TRIP_STATUS_SECTIONS: readonly TripStatusSectionDefinition[] = [
  { status: 'in-progress', label: '여행 중', englishLabel: 'In progress', emptyCopy: '현재 여행 중인 기록이 없습니다.' },
  { status: 'planned', label: '예정', englishLabel: 'Planned', emptyCopy: '아직 예정된 여행이 없습니다.' },
  { status: 'completed', label: '완료', englishLabel: 'Completed', emptyCopy: '완료된 여행 기록이 없습니다.' },
];

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getTripStatus(startDate: unknown, endDate: unknown, now = new Date()): TripStatus {
  const start = toDate(startDate);
  const end = toDate(endDate);
  const today = startOfDay(now);
  const startDay = start ? startOfDay(start) : null;
  const endDay = end ? startOfDay(end) : null;

  if (endDay && endDay < today) return 'completed';
  if (startDay && startDay > today) return 'planned';
  if (startDay && startDay <= today && (!endDay || endDay >= today)) return 'in-progress';

  return 'planned';
}

export function formatTripStatusMeta(status: TripStatus, startDate: unknown): string {
  if (status === 'completed') return '여행 완료';
  if (status === 'in-progress') return '여행 중';

  return toDate(startDate) ? `D-${getDaysUntil(startDate)}` : '날짜 미정';
}

function compareOptionalDates(first: unknown, second: unknown, descending = false): number {
  const firstTime = toDate(first)?.getTime();
  const secondTime = toDate(second)?.getTime();

  if (firstTime === undefined && secondTime === undefined) return 0;
  if (firstTime === undefined) return 1;
  if (secondTime === undefined) return -1;

  return descending ? secondTime - firstTime : firstTime - secondTime;
}

function compareTripIdentity(first: TripRecord, second: TripRecord): number {
  const titleCompare = first.title.trim().localeCompare(second.title.trim(), 'ko-KR');
  return titleCompare || first.id.localeCompare(second.id);
}

export function sortTripsByStatus(trips: TripRecord[], status: TripStatus): TripRecord[] {
  return [...trips].sort((first, second) => {
    const dateCompare =
      status === 'planned'
        ? compareOptionalDates(first.startDate, second.startDate)
        : status === 'in-progress'
          ? compareOptionalDates(first.endDate, second.endDate)
          : compareOptionalDates(first.endDate, second.endDate, true);

    return dateCompare || compareTripIdentity(first, second);
  });
}
