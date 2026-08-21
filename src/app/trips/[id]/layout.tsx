'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { CalendarDays, ChevronLeft, Image as ImageIcon, Home, Users, Wallet } from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { TripProvider, useTrip } from '@/components/trip/TripContext';
import TripContextHeader from '@/components/trip/TripContextHeader';

function TripLayoutContent({ children, id }: { children: React.ReactNode; id: string }) {
  const pathname = usePathname();
  const { trip } = useTrip();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const isOwner = trip?.ownerId === user?.uid;
  const sectionLabels: Record<string, string> = {
    itinerary: 'Itinerary / 일정표',
    budget: 'Budget / 예산',
    gallery: 'Gallery / 갤러리',
    members: 'Members / 멤버 관리',
  };
  const sectionKey = pathname.split('/').filter(Boolean).at(-1) || '';
  const sectionLabel = sectionLabels[sectionKey];
  const navItems = [
    { name: 'Overview', shortName: '홈', href: `/trips/${id}`, icon: Home },
    { name: 'Itinerary', shortName: '일정', href: `/trips/${id}/itinerary`, icon: CalendarDays },
    { name: 'Budget', shortName: '예산', href: `/trips/${id}/budget`, icon: Wallet },
    ...(isOwner ? [{ name: 'Members', shortName: '멤버', href: `/trips/${id}/members`, icon: Users }] : []),
    { name: 'Gallery', shortName: '갤러리', href: `/trips/${id}/gallery`, icon: ImageIcon },
  ];

  return (
    <div className="editorial-page">
      <div className="editorial-container">
        <div className="editorial-trip-nav">
          <Link href="/trips" className="editorial-trip-nav-back editorial-focus inline-flex items-center gap-1">
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
            My trips
          </Link>
          <div className="editorial-trip-nav-meta">
            <span className="hidden sm:inline">{trip?.destination}</span>
            <span className="hidden sm:inline"> · </span>
            <span>{trip?.title}</span>
          </div>
        </div>

        <nav className="editorial-trip-tabs" aria-label="여행 메뉴">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="editorial-trip-tab editorial-focus"
                data-active={isActive}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="mr-1 inline-block h-3.5 w-3.5 text-[var(--terra)] sm:hidden" aria-hidden="true" />
                <span className="hidden sm:inline">{item.name}</span>
                <span className="sm:hidden">{item.shortName}</span>
              </Link>
            );
          })}
        </nav>

        {sectionLabel && <TripContextHeader sectionLabel={sectionLabel} />}
        <main className="editorial-main !pt-0">{children}</main>

        <footer className="editorial-footer">
          <span>Pack to Go / {trip?.destination || 'Travel journal'}</span>
          <span>Shared plans · softer edges</span>
        </footer>
      </div>
    </div>
  );
}

export default function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <TripProvider tripId={id}>
      <TripLayoutContent id={id}>{children}</TripLayoutContent>
    </TripProvider>
  );
}
