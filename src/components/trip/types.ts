export type TripLoadState = 'loading' | 'ready' | 'not-found' | 'error';

export interface TripRecord {
  id: string;
  title: string;
  destination: string;
  startDate?: unknown;
  endDate?: unknown;
  ownerId?: string;
  collaboratorIds?: string[];
  collaboratorEmails?: string[];
  mapQuery?: string;
  destinationDesc?: string;
  weatherDesc?: string;
  clothingDesc?: string;
  gallery?: string[];
  concept?: string;
  [key: string]: unknown;
}

export interface UserProfile {
  displayName?: string;
  email?: string;
  photoURL?: string;
  role?: string;
  [key: string]: unknown;
}

export interface TripContextValue {
  trip: TripRecord;
  userProfiles: Record<string, UserProfile>;
  loading: boolean;
  state: TripLoadState;
  error: string | null;
  refetch: () => Promise<void>;
  mapQuery: string | null;
  mapUrl: string | null;
  externalMapUrl: string | null;
}
