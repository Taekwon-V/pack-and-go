'use client';

import { useEffect, useState, use } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { Users, UserPlus, Copy, CheckCircle2, Loader2, Link as LinkIcon } from 'lucide-react';

interface Trip {
  id: string;
  title: string;
  ownerId: string;
  collaboratorIds?: string[];
}

export default function TripMembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  
  const [generatingLink, setGeneratingLink] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchTrip();
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchTrip = async () => {
    try {
      const docRef = doc(db, 'trips', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setTrip({ id: docSnap.id, ...docSnap.data() } as Trip);
      }
    } catch (error) {
      console.error("Error fetching trip:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvite = async () => {
    if (!user) return;
    
    setGeneratingLink(true);
    try {
      const response = await fetch('/api/invites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tripId: id,
          createdBy: user.uid,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        // Construct the full invite URL
        const origin = window.location.origin;
        setInviteLink(`${origin}/invite/${data.code}`);
      } else {
        console.error('Failed to generate invite');
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleCopyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 min-h-[80vh] flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!trip) {
    return <div className="p-8 text-center text-slate-500">여행 정보를 찾을 수 없습니다.</div>;
  }

  const memberCount = 1 + (trip.collaboratorIds?.length || 0);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">멤버 관리</h1>
          <p className="text-slate-500">여행을 함께할 멤버들을 초대하고 관리하세요.</p>
        </div>
        <button 
          onClick={handleGenerateInvite}
          disabled={generatingLink}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 shrink-0"
        >
          {generatingLink ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
          초대 링크 생성
        </button>
      </div>

      {inviteLink && (
        <div className="mb-10 bg-indigo-50 border border-indigo-100 rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
          <h3 className="text-lg font-bold text-indigo-900 mb-3 flex items-center gap-2">
            <LinkIcon className="w-5 h-5" />
            초대 링크가 생성되었습니다
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              type="text" 
              readOnly 
              value={inviteLink} 
              className="flex-1 bg-white border border-indigo-200 text-slate-600 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            <button 
              onClick={handleCopyLink}
              className={`px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
                copied 
                  ? 'bg-emerald-500 text-white shadow-emerald-200 hover:bg-emerald-600' 
                  : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50'
              } shadow-sm shrink-0`}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  복사됨
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  링크 복사
                </>
              )}
            </button>
          </div>
          <p className="text-sm text-indigo-600/70 mt-3">이 링크를 친구에게 공유하여 여행에 초대하세요.</p>
        </div>
      )}

      <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Users className="w-6 h-6 text-indigo-500" />
          참여 중인 멤버 ({memberCount})
        </h2>
        
        <div className="space-y-4">
          {/* Owner */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                O
              </div>
              <div>
                <p className="font-semibold text-slate-800">소유자 (나)</p>
                <p className="text-sm text-slate-500">{trip.ownerId}</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">관리자</span>
          </div>
          
          {/* Collaborators */}
          {trip.collaboratorIds?.map((collabId, index) => (
            <div key={index} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold text-lg">
                  C
                </div>
                <div>
                  <p className="font-semibold text-slate-800">멤버 {index + 1}</p>
                  <p className="text-sm text-slate-500">{collabId}</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">멤버</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
