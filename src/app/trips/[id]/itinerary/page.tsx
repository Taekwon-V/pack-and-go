'use client';

import ItineraryTab from '@/components/trip/ItineraryTab';
import { useTrip } from '@/components/trip/TripContext';

export default function TripItineraryPage() {
  const { trip } = useTrip();

  return <ItineraryTab tripId={trip.id} />;
}
