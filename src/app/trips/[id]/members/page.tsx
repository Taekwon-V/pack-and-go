'use client';

import MembersTab from '@/components/trip/MembersTab';
import { useTrip } from '@/components/trip/TripContext';

export default function TripMembersPage() {
  const { trip, userProfiles, refetch } = useTrip();

  return <MembersTab trip={trip} userProfiles={userProfiles} onUpdate={refetch} />;
}
