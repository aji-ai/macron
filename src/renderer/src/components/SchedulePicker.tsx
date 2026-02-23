import { useState, useEffect } from 'react'
import { SCHEDULE_PRESETS } from '../types'
import { parseNLSchedule, cronToHuman } from '../lib/nlSchedule'
import { Input } from './ui/input'
import { Badge } from './ui/badge'

interface Props {
  value: string
  onChange: (cron: string) => void
}

type Tab = 'presets' | 'natural' | 'raw'

interface RawFields {
  min: string
  hour: string
  dom: string
  month: string
  dow: string
}

function parseCronFields(expr: string): RawFields {
  const parts = expr.trim().split(/\s+/)
  return {
    min: parts[0] ?? '*',
    hour: parts[1] ?? '*',
    dom: parts[2] ?? '*',
    month: parts[3] ?? '*',
    dow: parts[4] ?? '*'
  }
}

function fieldsToExpr(f: RawFields): string {
  return `${f.min} ${f.hour} ${f.dom} ${f.month} ${f.dow}`
}

export function SchedulePicker({ value, onChange }: Props) {
  const [tab, setTab] = useState<Tab>('presets')
  const [nlInput, setNlInput] = useState('')
  const [nlError, setNlError] = useState('')
  const [rawFields, setRawFields] = useState<RawFields>(() => parseCronFields(value))

  useEffect(() => {
    setRawFields(parseCronFields(value))
  }, [value])

  function handleNlChange(input: string): void {
    setNlInput(input)
    if (!input.trim()) {
      setNlError('')
      return
    }
    const cron = parseNLSchedule(input)
    if (cron) {
      setNlError('')
      onChange(cron)
    } else {
      setNlError('Could not parse — try "daily at 9am" or "every weekday at 8:30am"')
    }
  }

  function handleRawField(field: keyof RawFields, val: string): void {
    const updated = { ...rawFields, [field]: val }
    setRawFields(updated)
    onChange(fieldsToExpr(updated))
  }

  const humanReadable = (() => {
    try {
      return cronToHuman(value)
    } catch {
      return ''
    }
  })()

  const tabLabels: Record<Tab, string> = {
    presets: 'Presets',
    natural: 'Natural Language',
    raw: 'Raw'
  }

  return (
    <div className="space-y-3">
      {/* Tab bar */}
      <div className="flex gap-0.5 p-1 bg-muted rounded-md w-fit text-xs">
        {(['presets', 'natural', 'raw'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              tab === t
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tabLabels[t]}
          </button>
        ))}
      </div>

      {tab === 'presets' && (
        <div className="grid grid-cols-2 gap-2">
          {SCHEDULE_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => onChange(preset.value)}
              className={`text-left p-2.5 rounded-md border text-sm transition-all ${
                value === preset.value
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:border-primary/40 hover:bg-muted/50'
              }`}
            >
              <div className="font-medium text-xs">{preset.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{preset.description}</div>
            </button>
          ))}
        </div>
      )}

      {tab === 'natural' && (
        <div className="space-y-2">
          <Input
            value={nlInput}
            onChange={(e) => handleNlChange(e.target.value)}
            placeholder='e.g. "every weekday at 8:30am"'
          />
          {nlError && <p className="text-xs text-destructive">{nlError}</p>}
          {!nlError && nlInput && (
            <p className="text-xs text-muted-foreground">
              Parsed to: <code className="font-mono">{value}</code>
            </p>
          )}
        </div>
      )}

      {tab === 'raw' && (
        <div className="space-y-2">
          <div className="grid grid-cols-5 gap-2">
            {(
              [
                ['min', 'Min'],
                ['hour', 'Hour'],
                ['dom', 'Day'],
                ['month', 'Mon'],
                ['dow', 'Wday']
              ] as [keyof RawFields, string][]
            ).map(([field, label]) => (
              <div key={field} className="space-y-1">
                <label className="text-xs text-muted-foreground block text-center">{label}</label>
                <Input
                  value={rawFields[field]}
                  onChange={(e) => handleRawField(field, e.target.value)}
                  className="text-center font-mono text-sm px-1"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live preview */}
      {humanReadable && (
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="font-mono text-xs">
            {value}
          </Badge>
          <span className="text-xs text-muted-foreground">{humanReadable}</span>
        </div>
      )}
    </div>
  )
}
