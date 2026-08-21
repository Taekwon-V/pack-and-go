import { useCallback, useEffect, useState } from 'react';
import { Wallet } from 'lucide-react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import StatePanel from '@/components/StatePanel';
import { getPayerLabel, toDate } from '@/lib/tripFormatters';
import type { TripRecord, UserProfile } from './types';

interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: unknown;
  paidBy: string;
}

interface BudgetDoc {
  id: string;
  totalBudget: number;
  currency: string;
  expenses: Expense[];
}

const CATEGORY_LABELS: Record<string, string> = {
  flight: '항공',
  accommodation: '숙박',
  transport: '교통',
  food: '식비',
  activity: '액티비티',
  shopping: '쇼핑',
  other: '기타',
};

interface BudgetTabProps {
  tripId: string;
  trip: TripRecord;
  userProfiles: Record<string, UserProfile>;
}

export default function BudgetTab({ tripId, trip, userProfiles }: BudgetTabProps) {
  const [budget, setBudget] = useState<BudgetDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudget = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const budgetsQuery = query(collection(db, 'trips', tripId, 'budgets'));
      const querySnapshot = await getDocs(budgetsQuery);
      if (!querySnapshot.empty) {
        const budgetDoc = querySnapshot.docs[0];
        setBudget({ id: budgetDoc.id, ...budgetDoc.data() } as BudgetDoc);
      } else {
        setBudget(null);
      }
    } catch (fetchError) {
      console.error('Error fetching budget:', fetchError);
      setError('예산 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    // The request owns the loading/error transitions for this data panel.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchBudget();
  }, [fetchBudget]);

  if (loading) {
    return <StatePanel variant="loading" title="예산 정보를 불러오는 중입니다" description="여행 비용과 지출 내역을 준비하고 있습니다." />;
  }

  if (error) {
    return (
      <StatePanel
        variant="error"
        title="예산 정보를 불러오지 못했습니다"
        description={error}
        actionLabel="다시 시도"
        onAction={() => void fetchBudget()}
      />
    );
  }

  if (!budget) {
    return (
      <StatePanel
        variant="empty"
        icon={Wallet}
        title="아직 예산 정보가 없습니다"
        description="여행 관리자가 예산을 등록하면 이곳에서 전체 지출과 항목별 내역을 확인할 수 있습니다."
      />
    );
  }

  const expenses = budget.expenses || [];
  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const remaining = budget.totalBudget - totalSpent;
  const spendPercent = budget.totalBudget > 0 ? Math.min(100, Math.round((totalSpent / budget.totalBudget) * 100)) : 0;
  const categoryTotals = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);
  const sortedCategories = Object.entries(categoryTotals)
    .sort(([, amountA], [, amountB]) => amountB - amountA)
    .map(([category, amount]) => ({
      category,
      amount,
      percent: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
    }));
  const sortedExpenses = [...expenses].sort((a, b) => (toDate(b.date)?.getTime() || 0) - (toDate(a.date)?.getTime() || 0));
  const formatCurrency = (value: number) => `${value.toLocaleString('ko-KR')} ${budget.currency === 'JPY' ? '엔' : '원'}`;

  return (
    <section className="editorial-section !pt-0" aria-labelledby="budget-title">
      <div className="editorial-section-heading">
        <div>
          <p className="editorial-kicker">Budget ledger</p>
          <h2 id="budget-title" className="editorial-display mt-4 text-[clamp(1.95rem,4vw,3.35rem)] leading-[1.03]">
            숫자를 맞추는 여행.
          </h2>
        </div>
        <span className="hidden text-right text-[0.62rem] font-bold uppercase tracking-[0.15em] text-[var(--muted)] sm:block">
          {formatCurrency(totalSpent)} committed<br />Shared trip / {budget.currency}
        </span>
      </div>

      <div className="editorial-budget-grid">
        <div className="editorial-itinerary-column">
          <div className="flex items-center justify-between gap-4">
            <span className="editorial-kicker">Category distribution</span>
            <span className="text-[0.62rem] font-bold text-[var(--muted)]">{spendPercent}% used</span>
          </div>
          <div className="editorial-budget-progress mt-6">
            <div className="editorial-budget-progress-track" aria-label={`예산 ${spendPercent}% 사용`}>
              <div className="editorial-budget-progress-fill" style={{ width: `${spendPercent}%` }} />
            </div>
          </div>
          <div className="mt-6">
            {sortedCategories.map((item) => (
              <div key={item.category} className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-[var(--rule)] py-4 text-[0.78rem]">
                <span><span className="editorial-ledger-dot" aria-hidden="true" />{CATEGORY_LABELS[item.category] || item.category}</span>
                <span className="font-extrabold">{formatCurrency(item.amount)}</span>
                <span className="text-[var(--muted)]">{item.percent}%</span>
              </div>
            ))}
          </div>
        </div>

        <aside className="editorial-budget-column" aria-label="Budget summary">
          <div className="flex items-center justify-between gap-4">
            <span className="editorial-kicker">Budget ledger</span>
            <Wallet className="h-4 w-4 text-[var(--terra)]" aria-hidden="true" />
          </div>
          <div className="editorial-budget-stats mt-6">
            <div>
              <div className="editorial-budget-stat-label">Total</div>
              <div className="editorial-budget-stat-value">{formatCurrency(budget.totalBudget)}</div>
            </div>
            <div>
              <div className="editorial-budget-stat-label">Spent</div>
              <div className="editorial-budget-stat-value">{formatCurrency(totalSpent)}</div>
            </div>
            <div>
              <div className="editorial-budget-stat-label">Remaining</div>
              <div className="editorial-budget-stat-value" data-tone={remaining < 0 ? 'negative' : 'positive'}>{formatCurrency(remaining)}</div>
            </div>
          </div>
          <div className="editorial-budget-progress">
            <div className="editorial-budget-progress-meta">
              <span>{spendPercent}% committed</span>
              <strong>{formatCurrency(Math.max(0, remaining))} left</strong>
            </div>
            <div className="editorial-budget-progress-track">
              <div className="editorial-budget-progress-fill" style={{ width: `${spendPercent}%` }} />
            </div>
          </div>
        </aside>
      </div>

      <section className="editorial-ledger-section" aria-labelledby="expense-ledger-title">
        <div className="editorial-ledger-heading">
          <h3 id="expense-ledger-title">Expense ledger</h3>
          <strong>Payer / {getPayerLabel(expenses[0]?.paidBy, trip, userProfiles)}</strong>
        </div>
        <table className="editorial-ledger-table">
          <thead>
            <tr><th>Expense</th><th>Category</th><th>Amount</th></tr>
          </thead>
          <tbody>
            {sortedExpenses.map((expense) => {
              const date = toDate(expense.date);
              const dateString = date ? date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', weekday: 'short' }) : '날짜 미정';
              return (
                <tr key={expense.id}>
                  <td>
                    <div className="editorial-ledger-name"><span className="editorial-ledger-dot" aria-hidden="true" />{expense.description}</div>
                    <div className="editorial-ledger-meta">{dateString} · 결제: {getPayerLabel(expense.paidBy, trip, userProfiles)}</div>
                  </td>
                  <td data-label="Category">{CATEGORY_LABELS[expense.category] || expense.category}</td>
                  <td data-label="Amount" className="editorial-ledger-amount">{formatCurrency(expense.amount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {sortedExpenses.length === 0 && <p className="editorial-state-copy mt-5">아직 기록된 지출이 없습니다.</p>}
      </section>
    </section>
  );
}
