import type { CronJobData } from '../types'
import { cronToHuman } from '../lib/nlSchedule'
import { getNextRunTime } from '../lib/cronUtils'

interface Props {
  jobs: CronJobData[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function JobList({ jobs, selectedId, onSelect }: Props) {
  return (
    <div className="flex flex-col gap-0.5 p-2">
      {jobs.map((job) => {
        const isSelected = job.id === selectedId
        return (
          <button
            key={job.id}
            onClick={() => onSelect(job.id)}
            className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-100 ${
              isSelected
                ? 'bg-white/70 shadow-sm ring-1 ring-black/5'
                : 'hover:bg-white/40'
            }`}
          >
            <div className="font-medium text-sm text-foreground truncate leading-snug">
              {job.name || 'Unnamed Job'}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 truncate">
              {cronToHuman(job.schedule)}
            </div>
            <div className="text-xs text-muted-foreground/60 mt-0.5">
              {getNextRunTime(job.schedule)}
            </div>
          </button>
        )
      })}
    </div>
  )
}
