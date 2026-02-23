import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Save, Trash2 } from 'lucide-react'
import type { CronJobData } from '../types'
import { SchedulePicker } from './SchedulePicker'
import { ConfirmDialog } from './ConfirmDialog'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Button } from './ui/button'

interface Props {
  job: CronJobData | null // null = new job
  onSave: (job: CronJobData) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onSelect: (id: string | null) => void
}

export function JobEditor({ job, onSave, onDelete, onSelect }: Props) {
  const [name, setName] = useState('')
  const [command, setCommand] = useState('')
  const [schedule, setSchedule] = useState('0 9 * * *')
  const [saving, setSaving] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  // Sync form when job changes
  useEffect(() => {
    if (job) {
      setName(job.name)
      setCommand(job.command)
      setSchedule(job.schedule)
    } else {
      setName('')
      setCommand('')
      setSchedule('0 9 * * *')
    }
  }, [job?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave(): Promise<void> {
    if (!command.trim()) return
    setSaving(true)
    try {
      // Crontab requires a single line — join multi-line input with &&
      const singleLineCommand = command
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .join(' && ')

      const data: CronJobData = {
        id: job?.id ?? uuidv4(),
        name: name.trim() || 'Untitled Job',
        command: singleLineCommand,
        schedule
      }
      await onSave(data)
      onSelect(data.id)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(): Promise<void> {
    if (!job) return
    try {
      await onDelete(job.id)
      onSelect(null)
    } finally {
      setShowDelete(false)
    }
  }

  const isNew = !job

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 drag-region">
        <h2 className="font-semibold text-sm">{isNew ? 'New Job' : 'Edit Job'}</h2>
        <div className="flex gap-2">
          {!isNew && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDelete(true)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <Button size="sm" onClick={handleSave} disabled={saving || !command.replace(/\s/g, '')}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-auto px-6 py-5 space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Daily backup"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Command</label>
          <Textarea
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder={`echo "$(date): macron ran" >> /tmp/macron-test.log`}
            className="font-mono text-sm min-h-[80px] resize-y"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Schedule</label>
          <SchedulePicker value={schedule} onChange={setSchedule} />
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        title="Delete Job"
        description={`Are you sure you want to delete "${job?.name ?? 'this job'}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  )
}
