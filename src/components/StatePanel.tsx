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
  loading: { icon: Loader2, iconClassName: 'text-[var(--olive)]', role: 'status' },
  empty: { icon: Inbox, iconClassName: 'text-[var(--terra)]' },
  error: { icon: AlertCircle, iconClassName: 'text-[var(--terra)]', role: 'alert' },
  'not-found': { icon: MapPin, iconClassName: 'text-[var(--muted)]' },
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
    <section className="editorial-state-panel" role={config.role} aria-live={config.role ? 'polite' : undefined}>
      {isLoading ? (
        <div className="editorial-state-skeleton" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      ) : (
        <span className="editorial-state-mark" aria-hidden="true">
          <Icon className={`h-5 w-5 ${config.iconClassName}`} />
        </span>
      )}
      <h2 className="editorial-state-title">{title}</h2>
      {description && <p className="editorial-state-copy">{description}</p>}

      {actionLabel && actionHref && (
        <div className="editorial-state-action">
          <Link href={actionHref} className="editorial-button editorial-focus" data-variant="quiet">
            {actionLabel}
          </Link>
        </div>
      )}

      {actionLabel && !actionHref && onAction && (
        <div className="editorial-state-action">
          <button type="button" onClick={onAction} className="editorial-button editorial-focus" data-variant="quiet">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {actionLabel}
          </button>
        </div>
      )}
    </section>
  );
}
