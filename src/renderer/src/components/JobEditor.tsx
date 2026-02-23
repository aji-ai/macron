import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Save, Trash2, Terminal, Bot, Folder } from 'lucide-react'
import type { CronJobData, CopilotMode, PipelineStep } from '../types'
import { SchedulePicker } from './SchedulePicker'
import { ConfirmDialog } from './ConfirmDialog'
import { CopilotModeSelector } from './CopilotModeSelector'
import { PipelineBuilder } from './PipelineBuilder'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Button } from './ui/button'
import { cn } from '../lib/utils'

interface Props {
  job: CronJobData | null // null = new job
  onSave: (job: CronJobData) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onSelect: (id: string | null) => void
}

type JobType = 'shell' | 'copilot'

export function JobEditor({ job, onSave, onDelete, onSelect }: Props) {
  const [name, setName] = useState('')
  const [command, setCommand] = useState('')
  const [schedule, setSchedule] = useState('0 9 * * *')
  const [saving, setSaving] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  // Copilot-specific state
  const [jobType, setJobType] = useState<JobType>('shell')
  const [copilotMode, setCopilotMode] = useState<CopilotMode>('ask')
  const [prompt, setPrompt] = useState('')
  const [workingDir, setWorkingDir] = useState('')
  const [usePipeline, setUsePipeline] = useState(false)
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([])
  const [logEnabled, setLogEnabled] = useState(true)

  // Sync form when job changes
  useEffect(() => {
    if (job) {
      setName(job.name)
      setCommand(job.command)
      setSchedule(job.schedule)
      setJobType(job.type || 'shell')
      setCopilotMode(job.copilotMode || 'ask')
      setPrompt(job.prompt || '')
      setWorkingDir(job.workingDir || '')
      setLogEnabled(job.logEnabled !== false)

      if (job.pipelineSteps && job.pipelineSteps.length > 0) {
        setUsePipeline(true)
        setPipelineSteps(job.pipelineSteps)
      } else {
        setUsePipeline(false)
        setPipelineSteps([])
      }
    } else {
      // New job defaults
      setName('')
      setCommand('')
      setSchedule('* * * * *')
      setJobType('shell')
      setCopilotMode('ask')
      setPrompt('')
      setWorkingDir('')
      setUsePipeline(false)
      setPipelineSteps([])
      setLogEnabled(true)
    }
  }, [job?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSelectDir() {
    const dir = await window.electronAPI.selectDirectory()
    if (dir) {
      setWorkingDir(dir)
    }
  }

  async function handleSave(): Promise<void> {
    // Validate based on job type
    if (jobType === 'shell' && !command.trim()) return
    if (jobType === 'copilot') {
      if (usePipeline) {
        if (pipelineSteps.length === 0 || pipelineSteps.every((s) => !s.prompt.trim())) return
      } else {
        if (!prompt.trim()) return
      }
    }

    setSaving(true)
    try {
      // For shell jobs, join multi-line input with &&
      const singleLineCommand =
        jobType === 'shell'
          ? command
              .split('\n')
              .map((l) => l.trim())
              .filter(Boolean)
              .join(' && ')
          : '' // Copilot jobs generate command in crontabService

      const data: CronJobData = {
        id: job?.id ?? uuidv4(),
        name: name.trim() || 'Untitled Job',
        command: singleLineCommand,
        schedule,
        type: jobType,
        ...(jobType === 'copilot' && {
          copilotMode: usePipeline ? undefined : copilotMode,
          prompt: usePipeline ? undefined : prompt.trim(),
          workingDir: workingDir.trim() || undefined,
          pipelineSteps: usePipeline ? pipelineSteps.filter((s) => s.prompt.trim()) : undefined,
          logEnabled
        })
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

  // Validation for save button
  const canSave =
    jobType === 'shell'
      ? command.replace(/\s/g, '').length > 0
      : usePipeline
        ? pipelineSteps.some((s) => s.prompt.trim())
        : prompt.trim().length > 0

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
          <Button size="sm" onClick={handleSave} disabled={saving || !canSave}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-auto px-6 py-5 space-y-5">
        {/* Job Type Toggle */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Job Type</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setJobType('shell')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-colors',
                jobType === 'shell'
                  ? 'border-primary bg-primary/5 text-foreground'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <Terminal className="w-4 h-4" />
              <span className="text-sm font-medium">Shell Command</span>
            </button>
            <button
              type="button"
              onClick={() => setJobType('copilot')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-colors',
                jobType === 'copilot'
                  ? 'border-primary bg-primary/5 text-foreground'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <Bot className="w-4 h-4" />
              <span className="text-sm font-medium">Copilot Prompt</span>
            </button>
          </div>
        </div>

        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={jobType === 'copilot' ? 'e.g. Daily summary' : 'e.g. Daily backup'}
          />
        </div>

        {/* Shell-specific: Command */}
        {jobType === 'shell' && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Command</label>
            <Textarea
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder={`echo "$(date): macron ran" >> /tmp/macron-test.log`}
              className="font-mono text-sm min-h-[80px] resize-y"
            />
          </div>
        )}

        {/* Copilot-specific fields */}
        {jobType === 'copilot' && (
          <>
            {/* Pipeline toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="usePipeline"
                checked={usePipeline}
                onChange={(e) => {
                  setUsePipeline(e.target.checked)
                  if (e.target.checked && pipelineSteps.length === 0) {
                    setPipelineSteps([{ mode: 'ask', prompt: '' }])
                  }
                }}
                className="rounded border-border"
              />
              <label htmlFor="usePipeline" className="text-sm">
                Use pipeline (chain multiple prompts)
              </label>
            </div>

            {!usePipeline ? (
              <>
                {/* Single mode selector */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Mode</label>
                  <CopilotModeSelector value={copilotMode} onChange={setCopilotMode} />
                </div>

                {/* Single prompt */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Prompt</label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="What should Copilot do?"
                    className="min-h-[100px] resize-y"
                  />
                </div>
              </>
            ) : (
              /* Pipeline builder */
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Pipeline Steps</label>
                <PipelineBuilder steps={pipelineSteps} onChange={setPipelineSteps} />
              </div>
            )}

            {/* Working directory */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Working Directory</label>
              <p className="text-xs text-muted-foreground">
                Copilot will run in this directory (uses default from Settings if empty)
              </p>
              <div className="flex gap-2">
                <Input
                  value={workingDir}
                  onChange={(e) => setWorkingDir(e.target.value)}
                  placeholder="~/.macron/workspace"
                  className="flex-1 font-mono text-sm"
                />
                <Button variant="outline" size="icon" onClick={handleSelectDir} title="Browse">
                  <Folder className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Log enabled */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="logEnabled"
                checked={logEnabled}
                onChange={(e) => setLogEnabled(e.target.checked)}
                className="rounded border-border"
              />
              <label htmlFor="logEnabled" className="text-sm">
                Log output to ~/.macron/logs/copilot.log
              </label>
            </div>
          </>
        )}

        {/* Schedule */}
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
