import type { TripRecord, UserProfile } from '@/components/trip/types';

export function toDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const maybeToDate = (value as { toDate?: unknown }).toDate;
    if (typeof maybeToDate === 'function') {
      const date = (value as { toDate: () => unknown }).toDate();
      return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
    }
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

export function formatTripDate(value: unknown): string {
  const date = toDate(value);
  return date
    ? date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      })
    : '날짜 미정';
}

export function getDaysUntil(value: unknown): number {
  const date = toDate(value);
  if (!date) return 0;

  const diff = date.getTime() - new Date().getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function formatTripDateRange(startDate: unknown, endDate: unknown): string {
  const start = toDate(startDate);
  const end = toDate(endDate);

  if (!start && !end) return '여행 날짜 미정';
  if (!start) return `${formatTripDate(endDate)}부터`;
  if (!end) return `${formatTripDate(startDate)}부터`;

  return `${formatTripDate(startDate)} ~ ${formatTripDate(endDate)}`;
}

export function getProfileLabel(profile?: UserProfile, fallback = '이름 없음'): string {
  return profile?.displayName || profile?.email || fallback;
}

export function getPayerLabel(
  paidBy: string | undefined,
  trip: TripRecord,
  userProfiles: Record<string, UserProfile>,
): string {
  const ownerProfile = trip.ownerId ? userProfiles[trip.ownerId] : undefined;

  if (paidBy === 'owner' || (paidBy && paidBy === trip.ownerId)) {
    return getProfileLabel(ownerProfile, '방장');
  }

  if (!paidBy) return '결제자 정보 없음';

  const normalizedPayer = paidBy.toLowerCase();
  const matchedProfile =
    userProfiles[paidBy] ||
    Object.values(userProfiles).find(
      (profile) => profile.email?.toLowerCase() === normalizedPayer,
    );

  return getProfileLabel(matchedProfile, '결제자 정보 없음');
}
