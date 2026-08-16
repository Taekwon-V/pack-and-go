import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, PieChart, Wallet, CreditCard, ArrowRightLeft, ArrowUpRight, ArrowDownRight, CircleDollarSign } from 'lucide-react';

interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: any;
  paidBy: string;
}

interface BudgetDoc {
  id: string;
  totalBudget: number;
  currency: string;
  expenses: Expense[];
}

const CATEGORY_COLORS: Record<string, string> = {
  flight: 'bg-blue-500',
  accommodation: 'bg-indigo-500',
  transport: 'bg-emerald-500',
  food: 'bg-orange-500',
  activity: 'bg-rose-500',
  shopping: 'bg-purple-500',
  other: 'bg-slate-500'
};

const CATEGORY_LABELS: Record<string, string> = {
  flight: '항공',
  accommodation: '숙박',
  transport: '교통',
  food: '식비',
  activity: '액티비티',
  shopping: '쇼핑',
  other: '기타'
};

export default function BudgetTab({ tripId }: { tripId: string }) {
  const [budget, setBudget] = useState<BudgetDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBudget = async () => {
      try {
        const q = query(collection(db, 'trips', tripId, 'budgets'));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          // Assuming one master budget document for now
          const doc = querySnapshot.docs[0];
          setBudget({ id: doc.id, ...doc.data() } as BudgetDoc);
        }
      } catch (error) {
        console.error("Error fetching budget:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBudget();
  }, [tripId]);

  if (loading) {
    return (
      <div className="p-12 flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="p-8 bg-white rounded-3xl shadow-sm text-center border border-slate-200">
        <p className="text-slate-500">예산 정보가 없습니다. (테스트 데이터 시딩 필요)</p>
      </div>
    );
  }

  // Calculate totals
  const totalSpent = budget.expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const remaining = budget.totalBudget - totalSpent;
  const spendPercent = Math.min(100, Math.round((totalSpent / budget.totalBudget) * 100));

  // Calculate by category
  const categoryTotals = budget.expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  // Sort categories by amount
  const sortedCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .map(([category, amount]) => ({ category, amount, percent: Math.round((amount / totalSpent) * 100) }));

  // Sort expenses by date
  const sortedExpenses = [...budget.expenses].sort((a, b) => {
    const dA = a.date?.toDate ? a.date.toDate().getTime() : new Date(a.date).getTime();
    const dB = b.date?.toDate ? b.date.toDate().getTime() : new Date(b.date).getTime();
    return dB - dA; // Descending
  });

  const formatCurrency = (val: number) => {
    return `${val.toLocaleString()} ${budget.currency === 'JPY' ? '엔' : '원'}`;
  };

  return (
    <div className="space-y-6">
      {/* 1. 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center text-slate-500 mb-2 font-medium">
            <Wallet className="w-5 h-5 mr-2 text-indigo-500" /> 총 예산
          </div>
          <div className="text-3xl font-bold text-slate-900">{formatCurrency(budget.totalBudget)}</div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center text-slate-500 mb-2 font-medium">
            <ArrowUpRight className="w-5 h-5 mr-2 text-rose-500" /> 총 지출
          </div>
          <div className="text-3xl font-bold text-slate-900">{formatCurrency(totalSpent)}</div>
          <div className="mt-2 text-sm text-slate-500">
            예산의 <span className="font-bold text-rose-500">{spendPercent}%</span> 사용
          </div>
        </div>

        <div className={`p-6 rounded-3xl border shadow-sm flex flex-col justify-center ${remaining < 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <div className="flex items-center text-slate-600 mb-2 font-medium">
            <ArrowDownRight className={`w-5 h-5 mr-2 ${remaining < 0 ? 'text-rose-600' : 'text-emerald-600'}`} /> 남은 금액
          </div>
          <div className={`text-3xl font-bold ${remaining < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
            {formatCurrency(remaining)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. 항목별 지출 요약 */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:col-span-1">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
            <PieChart className="w-5 h-5 mr-2 text-indigo-500" /> 항목별 지출
          </h3>
          
          {/* Progress Bar Chart */}
          <div className="flex w-full h-4 rounded-full overflow-hidden mb-6 bg-slate-100">
            {sortedCategories.map((item) => (
              <div 
                key={item.category} 
                className={`h-full ${CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other}`}
                style={{ width: `${item.percent}%` }}
                title={`${CATEGORY_LABELS[item.category] || '기타'}: ${item.percent}%`}
              />
            ))}
          </div>

          {/* Category List */}
          <div className="space-y-4">
            {sortedCategories.map((item) => (
              <div key={item.category} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other}`}></div>
                  <span className="text-sm font-medium text-slate-700">{CATEGORY_LABELS[item.category] || item.category}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900">{formatCurrency(item.amount)}</div>
                  <div className="text-xs text-slate-400">{item.percent}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. 지출 상세 내역 */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center">
              <ArrowRightLeft className="w-5 h-5 mr-2 text-indigo-500" /> 상세 지출 내역
            </h3>
            <button className="text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-colors">
              + 내역 추가
            </button>
          </div>

          <div className="space-y-3">
            {sortedExpenses.map((exp) => {
              const eDate = exp.date?.toDate ? exp.date.toDate() : new Date(exp.date);
              const dateStr = eDate.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', weekday: 'short' });
              
              return (
                <div key={exp.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:shadow-sm transition-all bg-slate-50 hover:bg-white">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${CATEGORY_COLORS[exp.category] || CATEGORY_COLORS.other}`}>
                      <CircleDollarSign className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{exp.description}</h4>
                      <div className="flex gap-2 text-xs text-slate-500 font-medium mt-1">
                        <span>{dateStr}</span>
                        <span>•</span>
                        <span className="text-indigo-600">{CATEGORY_LABELS[exp.category] || exp.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">{formatCurrency(exp.amount)}</div>
                    <div className="text-xs text-slate-400 mt-1">결제: {exp.paidBy === 'owner' ? '방장' : '멤버'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
