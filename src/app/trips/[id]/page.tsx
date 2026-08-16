'use client';

import TripOverviewTab from '@/components/trip/TripOverviewTab';
import { useTrip } from '@/components/trip/TripContext';

export default function TripOverviewPage() {
  const { trip, mapUrl } = useTrip();

  return <TripOverviewTab trip={trip} mapUrl={mapUrl} />;
}
