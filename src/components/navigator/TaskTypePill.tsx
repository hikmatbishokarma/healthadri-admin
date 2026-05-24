import { Pill, FlaskConical, Calendar, Stethoscope } from 'lucide-react';
import { cn } from '@/lib/utils';

type TaskType = 'MEDICATION' | 'LAB_TEST' | 'APPOINTMENT' | 'PROCEDURE';

interface TaskTypePillProps {
  name: string;
  taskType: TaskType | string;
  className?: string;
}

const CONFIG: Record<string, { icon: React.ElementType; pill: string }> = {
  MEDICATION:  { icon: Pill,         pill: 'bg-purple-50 text-purple-700 border-purple-200' },
  LAB_TEST:    { icon: FlaskConical, pill: 'bg-blue-50 text-blue-700 border-blue-200' },
  APPOINTMENT: { icon: Calendar,     pill: 'bg-green-50 text-green-700 border-green-200' },
  PROCEDURE:   { icon: Stethoscope,  pill: 'bg-slate-50 text-slate-700 border-slate-200' },
};

export function TaskTypePill({ name, taskType, className }: TaskTypePillProps) {
  const { icon: Icon, pill } = CONFIG[taskType] ?? CONFIG.PROCEDURE;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium max-w-[200px]',
        pill,
        className,
      )}
    >
      <Icon className="w-3 h-3 flex-shrink-0" />
      <span className="truncate">{name}</span>
    </span>
  );
}
