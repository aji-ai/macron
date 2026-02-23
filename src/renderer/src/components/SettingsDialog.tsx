import { useState, useEffect } from 'react'
import { Settings, Folder, Save } from 'lucide-react'
import type { MacronConfig } from '../types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: Props) {
  const [config, setConfig] = useState<MacronConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (open) {
      loadConfig()
    }
  }, [open])

  async function loadConfig() {
    try {
      const cfg = await window.electronAPI.getConfig()
      setConfig(cfg)
      setDirty(false)
    } catch (err) {
      console.error('Failed to load config:', err)
    }
  }

  function updateConfig(updates: Partial<MacronConfig>) {
    if (!config) return
    setConfig({ ...config, ...updates })
    setDirty(true)
  }

  function updateModel(mode: keyof MacronConfig['models'], value: string) {
    if (!config) return
    setConfig({
      ...config,
      models: { ...config.models, [mode]: value }
    })
    setDirty(true)
  }

  async function handleSave() {
    if (!config || !dirty) return
    setSaving(true)
    try {
      await window.electronAPI.setConfig(config)
      setDirty(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleSelectDir() {
    const dir = await window.electronAPI.selectDirectory()
    if (dir) {
      updateConfig({ defaultWorkingDir: dir })
    }
  }

  if (!config) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Default Working Directory */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Default Working Directory</label>
            <p className="text-xs text-muted-foreground">
              Copilot jobs will run in this directory by default
            </p>
            <div className="flex gap-2">
              <Input
                value={config.defaultWorkingDir}
                onChange={(e) => updateConfig({ defaultWorkingDir: e.target.value })}
                placeholder="~/.macron/workspace"
                className="flex-1 font-mono text-sm"
              />
              <Button variant="outline" size="icon" onClick={handleSelectDir} title="Browse">
                <Folder className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Log Retention */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Log Retention</label>
            <p className="text-xs text-muted-foreground">
              Automatically delete log entries older than this many days
            </p>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={365}
                value={config.logRetentionDays}
                onChange={(e) =>
                  updateConfig({ logRetentionDays: Math.max(1, parseInt(e.target.value) || 30) })
                }
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">days</span>
            </div>
          </div>

          {/* Model Configuration */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Copilot Models</label>
              <p className="text-xs text-muted-foreground">
                Override the default models for each mode (requires copilot-modes.zsh)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(['ask', 'plan', 'safe', 'agent'] as const).map((mode) => (
                <div key={mode} className="space-y-1">
                  <label className="text-xs font-medium capitalize text-muted-foreground">
                    {mode}
                  </label>
                  <Input
                    value={config.models[mode]}
                    onChange={(e) => updateModel(mode, e.target.value)}
                    placeholder={`Model for ${mode}`}
                    className="font-mono text-xs h-8"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Save button */}
          <div className="flex justify-end pt-2 border-t">
            <Button onClick={handleSave} disabled={!dirty || saving} size="sm">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function SettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-5 h-5 rounded-full flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground transition-colors"
      title="Settings"
    >
      <Settings className="w-4 h-4" />
    </button>
  )
}
