'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, CalendarDays, Wallet, Users, ChevronLeft, Image as ImageIcon } from 'lucide-react';
import { use } from 'react';
import { TripProvider } from '@/components/trip/TripContext';

import { useTrip } from '@/components/trip/TripContext';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useEffect, useState } from 'react';

function TripLayoutContent({ children, id }: { children: React.ReactNode; id: string }) {
  const pathname = usePathname();
  const { trip } = useTrip();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const isOwner = trip?.ownerId === user?.uid;

  const navItems = [
    { name: '홈', href: `/trips/${id}`, icon: Home },
    { name: '일정표', href: `/trips/${id}/itinerary`, icon: CalendarDays },
    { name: '예산', href: `/trips/${id}/budget`, icon: Wallet },
    ...(isOwner ? [{ name: '멤버 관리', href: `/trips/${id}/members`, icon: Users }] : []),
    { name: '갤러리', href: `/trips/${id}/gallery`, icon: ImageIcon },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f9] flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shrink-0 sticky top-16 md:top-0 md:h-screen z-40">
        <div className="hidden md:block p-6 border-b border-slate-200">
          <Link href="/trips" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors mb-6 group">
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            홈으로 이동
          </Link>
          <h2 className="text-xl font-bold text-slate-900">여행 관리</h2>
        </div>
        
        <nav className="flex flex-row md:flex-col flex-1 p-2 md:p-4 gap-2 md:gap-0 md:space-y-1 overflow-x-auto md:overflow-y-auto whitespace-nowrap no-scrollbar justify-around md:justify-start">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                title={item.name}
                className={`flex items-center justify-center md:justify-start px-4 py-3 md:py-3 text-sm rounded-xl transition-all ${
                  isActive
                    ? 'text-indigo-600 font-bold'
                    : 'text-slate-500 font-medium hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-5 h-5 md:mr-3 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="hidden md:inline">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full min-w-0 overflow-y-auto">
        <div className="h-full bg-[#f5f5f9] p-4 md:p-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
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
      <TripLayoutContent id={id}>
        {children}
      </TripLayoutContent>
    </TripProvider>
  );
}
