'use client';

import TripOverviewTab from '@/components/trip/TripOverviewTab';
import TripHeader from '@/components/trip/TripHeader';
import { useTrip } from '@/components/trip/TripContext';

export default function TripOverviewPage() {
  const { trip, mapUrl } = useTrip();

  return (
    <>
      <TripHeader />
      <TripOverviewTab trip={trip} mapUrl={mapUrl} />
    </>
  );
}
