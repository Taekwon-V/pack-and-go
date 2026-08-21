import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { AlertCircle, Inbox, Loader2, MapPin, RefreshCw } from 'lucide-react';

type StatePanelVariant = 'loading' | 'empty' | 'error' | 'not-found';

interface StatePanelProps {
  variant: StatePanelVariant;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: LucideIcon;
}

const variantConfig: Record<
  StatePanelVariant,
  { icon: LucideIcon; iconClassName: string; role?: 'status' | 'alert' }
> = {
  loading: { icon: Loader2, iconClassName: 'text-indigo-500', role: 'status' },
  empty: { icon: Inbox, iconClassName: 'text-slate-400' },
  error: { icon: AlertCircle, iconClassName: 'text-rose-500', role: 'alert' },
  'not-found': { icon: MapPin, iconClassName: 'text-slate-400' },
};

export default function StatePanel({
  variant,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  icon,
}: StatePanelProps) {
  const config = variantConfig[variant];
  const Icon = icon || config.icon;
  const isLoading = variant === 'loading';

  return (
    <div
      className="flex min-h-56 w-full flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm"
      role={config.role}
    >
      <Icon
        className={`mb-4 h-10 w-10 ${config.iconClassName} ${isLoading ? 'animate-spin' : ''}`}
        aria-hidden="true"
      />
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      {description && (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">{description}</p>
      )}

      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          {actionLabel}
        </Link>
      )}

      {actionLabel && !actionHref && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
