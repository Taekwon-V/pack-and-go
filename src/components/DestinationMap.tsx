'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, MapPin } from 'lucide-react';

type MapState = 'loading' | 'loaded' | 'error';

interface DestinationMapProps {
  title: string;
  query: string;
  embedUrl: string;
  externalUrl: string;
}

export default function DestinationMap({
  title,
  query,
  embedUrl,
  externalUrl,
}: DestinationMapProps) {
  const [mapState, setMapState] = useState<MapState>('loading');

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setMapState('error'), 6000);

    return () => window.clearTimeout(timeoutId);
  }, [embedUrl]);

  const showFallback = mapState === 'error';

  return (
    <div className="editorial-map-frame" aria-label={`${title} 지도`}>
      {!showFallback && (
        <iframe
          src={embedUrl}
          title={`${title} 지도`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          onLoad={() => setMapState('loaded')}
          onError={() => setMapState('error')}
        />
      )}

      {mapState === 'loading' && (
        <div className="editorial-map-state" role="status">
          <div>
            <MapPin className="mx-auto mb-3 h-7 w-7 text-[var(--olive)]" aria-hidden="true" />
            <p className="editorial-map-state-title">지도를 불러오는 중입니다</p>
            <p className="editorial-map-state-copy">{query}</p>
          </div>
        </div>
      )}

      {showFallback && (
        <div className="editorial-map-fallback" role="status">
          <div>
            <MapPin className="mx-auto mb-3 h-7 w-7 text-[var(--terra)]" aria-hidden="true" />
            <p className="editorial-map-fallback-title">지도를 표시하지 못했습니다</p>
            <p className="editorial-map-fallback-copy">
              현재 위치는 <strong>{query}</strong>입니다. 외부 지도에서 자세한 위치를 확인할 수 있습니다.
            </p>
            <a
              href={externalUrl}
              target="_blank"
              rel="noreferrer"
              className="editorial-link-button editorial-focus mt-5 inline-flex items-center gap-2"
            >
              Google 지도에서 열기
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      )}

      {mapState === 'loaded' && (
        <div className="editorial-map-caption" aria-hidden="true">
          <span>CHatan, Okinawa / Map</span>
          <span>N / 01</span>
        </div>
      )}
    </div>
  );
}
