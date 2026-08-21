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
    <div className="relative mb-6 h-96 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
      {!showFallback && (
        <iframe
          src={embedUrl}
          title={`${title} 지도`}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0"
          onLoad={() => setMapState('loaded')}
          onError={() => setMapState('error')}
        />
      )}

      {mapState === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100/95 p-6 text-center">
          <div>
            <MapPin className="mx-auto mb-3 h-8 w-8 animate-pulse text-indigo-500" aria-hidden="true" />
            <p className="font-semibold text-slate-700">지도를 불러오는 중입니다</p>
            <p className="mt-1 text-sm text-slate-500">{query}</p>
          </div>
        </div>
      )}

      {showFallback && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-slate-100 p-6 text-center">
          <div className="max-w-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm">
              <MapPin className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="text-lg font-bold text-slate-900">지도를 표시하지 못했습니다</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              현재 위치는 <span className="font-semibold text-slate-900">{query}</span>입니다. 외부 지도에서 자세한 위치를 확인할 수 있습니다.
            </p>
            <a
              href={externalUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Google 지도에서 열기
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-slate-900/5" />
    </div>
  );
}
