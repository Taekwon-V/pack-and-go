'use client';

import BudgetTab from '@/components/trip/BudgetTab';
import { useTrip } from '@/components/trip/TripContext';

export default function TripBudgetPage() {
  const { trip } = useTrip();

  return <BudgetTab tripId={trip.id} />;
}
