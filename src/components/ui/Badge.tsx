import { clsx } from 'clsx';

type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral';

const BADGE_CLASSES: Record<BadgeVariant, string> = {
  success: 'bg-[rgba(34,197,94,0.15)]  text-[#22C55E]',
  error:   'bg-[rgba(239,68,68,0.15)]  text-[#EF4444]',
  warning: 'bg-[rgba(245,158,11,0.15)] text-[#F59E0B]',
  info:    'bg-[rgba(59,130,246,0.15)] text-[#3B82F6]',
  neutral: 'bg-[rgba(255,255,255,0.08)] text-[rgba(248,250,252,0.7)]',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  pill?: boolean;
}

export function Badge({ variant = 'neutral', children, className, pill }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2 py-0.5 text-[12px] font-sans font-medium leading-tight whitespace-nowrap',
        pill ? 'rounded-full' : 'rounded',
        BADGE_CLASSES[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function statusVariant(status: string): BadgeVariant {
  const s = status.toLowerCase();
  if (s === 'processed' || s === 'success' || s === 'successful' || s === 'live' || s === 'active' || s === 'healthy' || s === 'enforced') return 'success';
  if (s === 'failed' || s === 'error' || s === 'blocked' || s === 'suspended') return 'error';
  if (s === 'pending' || s === 'retrying' || s === 'degraded' || s === 'inactive') return 'warning';
  return 'info';
}
