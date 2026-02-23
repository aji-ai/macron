import { Plus, X, GripVertical } from 'lucide-react'
import type { CopilotMode, PipelineStep } from '../types'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { cn } from '../lib/utils'

interface Props {
  steps: PipelineStep[]
  onChange: (steps: PipelineStep[]) => void
}

const MODE_LABELS: Record<CopilotMode, string> = {
  ask: 'Ask',
  plan: 'Plan',
  safe: 'Safe',
  agent: 'Agent'
}

const MODE_COLORS: Record<CopilotMode, string> = {
  ask: 'bg-blue-500/10 text-blue-700 border-blue-300',
  plan: 'bg-amber-500/10 text-amber-700 border-amber-300',
  safe: 'bg-green-500/10 text-green-700 border-green-300',
  agent: 'bg-purple-500/10 text-purple-700 border-purple-300'
}

export function PipelineBuilder({ steps, onChange }: Props) {
  function addStep() {
    onChange([...steps, { mode: 'ask', prompt: '' }])
  }

  function removeStep(index: number) {
    onChange(steps.filter((_, i) => i !== index))
  }

  function updateStep(index: number, updates: Partial<PipelineStep>) {
    onChange(steps.map((step, i) => (i === index ? { ...step, ...updates } : step)))
  }

  function moveStep(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= steps.length) return
    const newSteps = [...steps]
    const [moved] = newSteps.splice(fromIndex, 1)
    newSteps.splice(toIndex, 0, moved)
    onChange(newSteps)
  }

  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <div
          key={index}
          className="group relative border rounded-lg p-3 bg-card hover:border-primary/30 transition-colors"
        >
          {/* Step header */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1 text-muted-foreground">
              <button
                type="button"
                onClick={() => moveStep(index, index - 1)}
                disabled={index === 0}
                className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
                title="Move up"
              >
                <GripVertical className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-medium w-4 text-center">{index + 1}</span>
            </div>

            {/* Mode selector */}
            <div className="flex gap-1">
              {(['ask', 'plan', 'safe', 'agent'] as CopilotMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => updateStep(index, { mode })}
                  className={cn(
                    'px-2 py-0.5 text-xs rounded-full border transition-colors',
                    step.mode === mode ? MODE_COLORS[mode] : 'bg-muted/50 text-muted-foreground border-transparent hover:border-border'
                  )}
                >
                  {MODE_LABELS[mode]}
                </button>
              ))}
            </div>

            <div className="flex-1" />

            <button
              type="button"
              onClick={() => removeStep(index)}
              className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors opacity-0 group-hover:opacity-100"
              title="Remove step"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Prompt input */}
          <Textarea
            value={step.prompt}
            onChange={(e) => updateStep(index, { prompt: e.target.value })}
            placeholder={`Prompt for step ${index + 1}...`}
            className="min-h-[60px] text-sm resize-y"
          />

          {/* Pipe indicator */}
          {index < steps.length - 1 && (
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-muted border flex items-center justify-center text-xs text-muted-foreground font-mono z-10">
              |
            </div>
          )}
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addStep} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add Pipeline Step
      </Button>

      {steps.length > 1 && (
        <p className="text-xs text-muted-foreground text-center">
          Output of each step is piped to the next: step 1 | step 2 | ...
        </p>
      )}
    </div>
  )
}
