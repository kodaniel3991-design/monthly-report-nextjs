import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  className?: string;
}

export default function MetricCard({ label, value, unit, delta, className }: MetricCardProps) {
  return (
    <div className={cn('bg-white rounded-xl border border-stone-200 p-5', className)}>
      <p className="text-xs text-stone-500 mb-1">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-stone-800">{value}</span>
        {unit && <span className="text-sm text-stone-400">{unit}</span>}
      </div>
      {delta && (
        <p className="text-xs text-stone-500 mt-1">{delta}</p>
      )}
    </div>
  );
}
