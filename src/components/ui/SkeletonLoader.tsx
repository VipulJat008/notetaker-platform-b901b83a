import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
  lines?: number;
  widths?: string[];
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('skeleton', className)} aria-hidden="true" />;
}

export function SkeletonLines({ lines = 3, widths }: SkeletonProps) {
  const defaultWidths = ['w-full', 'w-5/6', 'w-3/4'];
  const w = widths ?? defaultWidths;
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${w[i % w.length]}`} />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div
      className="rounded-[12px] p-6 border border-[rgba(255,255,255,0.06)]"
      style={{ background: 'var(--color-secondary)' }}
      aria-hidden="true"
    >
      <Skeleton className="h-8 w-24 mb-2" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}

export function SkeletonTableRows({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-[rgba(255,255,255,0.04)]" aria-hidden="true">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-4 py-3">
              <Skeleton className="h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
