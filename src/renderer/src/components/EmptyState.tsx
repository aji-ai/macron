import { Clock, ArrowDownLeft } from 'lucide-react'

export function EmptyState() {
  return (
    <div className="relative flex flex-col items-center justify-center h-full select-none">
      {/* Centered content */}
      <Clock className="w-12 h-12 opacity-20 text-muted-foreground" />
      <div className="text-center mt-4">
        <p className="font-medium text-foreground">No job selected</p>
        <p className="text-sm mt-1 text-muted-foreground">Automate your agent tasks with cron jobs</p>
      </div>

      {/* Arrow pointing toward bottom-left corner (toward the New Job button) */}
      <div className="absolute bottom-8 left-8 flex items-end gap-2 text-muted-foreground/50">
        <ArrowDownLeft className="w-5 h-5 mb-0.5" />
        <span className="text-xs">start a new job</span>
      </div>
    </div>
  )
}
