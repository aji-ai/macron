import { Plus } from 'lucide-react'
import type { CronJobData } from '../types'
import { JobList } from './JobList'
import { HelpDialog } from './HelpDialog'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'

interface Props {
  jobs: CronJobData[]
  loading: boolean
  selectedId: string | null
  onSelect: (id: string | null) => void
}

export function Sidebar({ jobs, loading, selectedId, onSelect }: Props) {
  return (
    <div className="w-[220px] flex-shrink-0 flex flex-col h-full sidebar-vibrancy border-r border-black/[0.06]">
      {/* Traffic light spacer — drag region */}
      <div className="traffic-light-spacer" />

      {/* App title */}
      <div className="px-4 pb-2 drag-region flex items-center justify-between">
        <h1 className="text-xs font-semibold text-foreground/50 tracking-widest uppercase">
          Macroni
        </h1>
        <HelpDialog />
      </div>

      {/* Job list */}
      <ScrollArea className="flex-1 min-h-0">
        {loading ? (
          <div className="p-4 text-sm text-muted-foreground">Loading…</div>
        ) : jobs.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">No jobs yet</div>
        ) : (
          <JobList jobs={jobs} selectedId={selectedId} onSelect={onSelect} />
        )}
      </ScrollArea>

      {/* New Job button */}
      <div className="p-3 border-t border-black/[0.06]">
        <Button
          variant="outline"
          size="sm"
          className="w-full bg-white/50 hover:bg-white/70 border-black/10"
          onClick={() => onSelect('new')}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Job
        </Button>
      </div>
    </div>
  )
}
