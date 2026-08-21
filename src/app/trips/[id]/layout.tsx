'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { TripProvider, useTrip } from '@/components/trip/TripContext';

function TripLayoutContent({ children, id }: { children: React.ReactNode; id: string }) {
  const pathname = usePathname();
  const { trip } = useTrip();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const isOwner = trip?.ownerId === user?.uid;
  const navItems = [
    { name: '개요', href: `/trips/${id}` },
    { name: '일정', href: `/trips/${id}/itinerary` },
    { name: '예산', href: `/trips/${id}/budget` },
    { name: '갤러리', href: `/trips/${id}/gallery` },
    ...(isOwner ? [{ name: '멤버', href: `/trips/${id}/members` }] : []),
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
            return (
              <Link
                key={item.href}
                href={item.href}
                className="editorial-trip-tab editorial-focus"
                data-active={isActive}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        <main className="editorial-main !pt-8">{children}</main>

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
