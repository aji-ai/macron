import { useState, useEffect, useCallback } from 'react'
import { ScrollText, RefreshCw, Trash2, Copy, Check, AlertCircle, CheckCircle } from 'lucide-react'
import type { LogEntry, CopilotMode } from '../types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { Badge } from './ui/badge'
import { ConfirmDialog } from './ConfirmDialog'
import { cn } from '../lib/utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const MODE_COLORS: Record<CopilotMode | 'shell', string> = {
  ask: 'bg-blue-500/10 text-blue-700 border-blue-300',
  plan: 'bg-amber-500/10 text-amber-700 border-amber-300',
  safe: 'bg-green-500/10 text-green-700 border-green-300',
  agent: 'bg-purple-500/10 text-purple-700 border-purple-300',
  shell: 'bg-gray-500/10 text-gray-700 border-gray-300'
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function LogEntryCard({ entry }: { entry: LogEntry }) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(entry.output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const isError = entry.exitCode !== 0 || entry.error

  return (
    <div
      className={cn(
        'border rounded-lg p-3 bg-card hover:border-primary/20 transition-colors',
        isError && 'border-destructive/30 bg-destructive/5'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="outline" className={cn('text-xs', MODE_COLORS[entry.mode])}>
          {entry.mode}
        </Badge>
        <span className="font-medium text-sm truncate flex-1">{entry.jobName}</span>
        <span className="text-xs text-muted-foreground">{formatTimestamp(entry.timestamp)}</span>
        {isError ? (
          <AlertCircle className="w-4 h-4 text-destructive" />
        ) : (
          <CheckCircle className="w-4 h-4 text-green-600" />
        )}
      </div>

      {/* Command preview */}
      <div className="text-xs text-muted-foreground font-mono break-words mb-2">{entry.command}</div>

      {/* Output */}
      {entry.output && (
        <div className="relative group">
          <pre
            onClick={() => setExpanded(!expanded)}
            className={cn(
              'bg-muted rounded-md px-3 py-2 font-mono text-xs cursor-pointer select-text whitespace-pre-wrap break-words overflow-hidden',
              !expanded && 'line-clamp-3'
            )}
          >
            {entry.output}
          </pre>
          <button
            onClick={handleCopy}
            className="absolute top-1.5 right-1.5 p-1 rounded text-muted-foreground/30 hover:text-muted-foreground transition-colors opacity-0 group-hover:opacity-100"
            title="Copy output"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      )}

      {/* Error message */}
      {entry.error && (
        <div className="mt-2 text-xs text-destructive bg-destructive/10 rounded px-2 py-1">
          {entry.error}
        </div>
      )}

      {/* Exit code */}
      {entry.exitCode !== 0 && (
        <div className="mt-2 text-xs text-muted-foreground">Exit code: {entry.exitCode}</div>
      )}
    </div>
  )
}

export function LogViewer({ open, onOpenChange }: Props) {
  const [entries, setEntries] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [showClear, setShowClear] = useState(false)

  const loadLogs = useCallback(async () => {
    setLoading(true)
    try {
      const logs = await window.electronAPI.readLog(100)
      setEntries(logs)
    } catch (err) {
      console.error('Failed to load logs:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      loadLogs()
    }
  }, [open, loadLogs])

  useEffect(() => {
    if (!open || !autoRefresh) return
    const interval = setInterval(loadLogs, 5000)
    return () => clearInterval(interval)
  }, [open, autoRefresh, loadLogs])

  async function handleClear() {
    try {
      await window.electronAPI.clearLog()
      setEntries([])
    } finally {
      setShowClear(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Copilot Logs</DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadLogs}
                  disabled={loading}
                  className="h-7 px-2"
                >
                  <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
                </Button>
                <Button
                  variant={autoRefresh ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className="h-7 text-xs"
                >
                  Auto
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowClear(true)}
                  disabled={entries.length === 0}
                  className="h-7 px-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
            {loading && entries.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">Loading...</div>
            ) : entries.length === 0 ? (
              <div className="py-8 text-center">
                <ScrollText className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-muted-foreground text-sm">No log entries yet</p>
                <p className="text-muted-foreground/70 text-xs mt-1">
                  Copilot job outputs will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3 pb-4">
                {entries.map((entry, i) => (
                  <LogEntryCard key={`${entry.timestamp}-${i}`} entry={entry} />
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showClear}
        title="Clear Logs"
        description="Are you sure you want to clear all log entries? This cannot be undone."
        onConfirm={handleClear}
        onCancel={() => setShowClear(false)}
      />
    </>
  )
}

export function LogViewerButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-5 h-5 rounded-full flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground transition-colors"
      title="View Logs"
    >
      <ScrollText className="w-4 h-4" />
    </button>
  )
}
