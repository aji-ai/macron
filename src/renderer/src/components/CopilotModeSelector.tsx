import { cn } from '../lib/utils'
import type { CopilotMode } from '../types'

interface Props {
  value: CopilotMode
  onChange: (mode: CopilotMode) => void
}

const MODES: { value: CopilotMode; label: string; description: string }[] = [
  { value: 'ask', label: 'Ask', description: 'Advisory only — no file changes' },
  { value: 'plan', label: 'Plan', description: 'Structured planning mode' },
  { value: 'safe', label: 'Safe', description: 'Can edit files, no shell' },
  { value: 'agent', label: 'Agent', description: 'Full agentic capabilities' }
]

export function CopilotModeSelector({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {MODES.map((mode) => (
        <button
          key={mode.value}
          type="button"
          onClick={() => onChange(mode.value)}
          className={cn(
            'flex flex-col items-start p-3 rounded-lg border text-left transition-colors',
            value === mode.value
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
          )}
        >
          <span className="font-medium text-sm">{mode.label}</span>
          <span className="text-xs text-muted-foreground mt-0.5">{mode.description}</span>
        </button>
      ))}
    </div>
  )
}
