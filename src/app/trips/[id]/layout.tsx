'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, CalendarDays, Wallet, Users, ChevronLeft, Image as ImageIcon } from 'lucide-react';
import { use } from 'react';

export default function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const pathname = usePathname();
  const { id } = use(params);

  const navItems = [
    { name: '홈', href: `/trips/${id}`, icon: Home },
    { name: '일정표', href: `/trips/${id}/itinerary`, icon: CalendarDays },
    { name: '예산', href: `/trips/${id}/budget`, icon: Wallet },
    { name: '멤버 관리', href: `/trips/${id}/members`, icon: Users },
    { name: '갤러리', href: `/trips/${id}/gallery`, icon: ImageIcon },
  ];

  return (
    <div className="min-h-screen bg-[#111111] flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#18181b] border-b md:border-b-0 md:border-r border-white/5 flex flex-col shrink-0 sticky top-16 md:top-0 md:h-screen z-40">
        <div className="hidden md:block p-6 border-b border-white/5">
          <Link href="/trips" className="inline-flex items-center text-sm font-medium text-gray-400 hover:text-emerald-400 transition-colors mb-6 group">
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            홈으로 이동
          </Link>
          <h2 className="text-xl font-bold text-white">여행 관리</h2>
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
                className={`flex items-center justify-center md:justify-start px-4 py-3 md:py-3 text-sm font-medium rounded-xl transition-all ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-500 md:border-l-4 md:border-emerald-500'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 md:border-l-4 md:border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 md:mr-3 ${isActive ? 'text-emerald-500' : 'text-gray-500'}`} />
                <span className="hidden md:inline">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="h-full bg-gradient-to-br from-[#18181b] to-[#111111]">
          {children}
        </div>
      </main>
    </div>
  );
}
