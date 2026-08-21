'use client';

import TripOverviewTab from '@/components/trip/TripOverviewTab';
import TripHeader from '@/components/trip/TripHeader';
import { useTrip } from '@/components/trip/TripContext';

export default function TripOverviewPage() {
  const { trip, mapUrl, externalMapUrl } = useTrip();

  return (
    <div className="space-y-8">
      <TripHeader />
      <TripOverviewTab trip={trip} mapUrl={mapUrl || ''} externalMapUrl={externalMapUrl || ''} />
    </div>
  );
}
