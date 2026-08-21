'use client';

import BudgetTab from '@/components/trip/BudgetTab';
import { useTrip } from '@/components/trip/TripContext';

export default function TripBudgetPage() {
  const { trip, userProfiles } = useTrip();

  return <BudgetTab tripId={trip.id} trip={trip} userProfiles={userProfiles} />;
}
