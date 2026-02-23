import { useState } from 'react'
import { HelpCircle, Terminal, CheckCircle, Copy, Check, Bot } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from './ui/dialog'

function CopyBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="relative group">
      <pre className="bg-muted rounded-md px-3 py-2 font-mono text-xs select-text cursor-text whitespace-pre-wrap break-all">
        {code}
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-1.5 right-1.5 p-1 rounded text-muted-foreground/30 hover:text-muted-foreground transition-colors"
        title="Copy"
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      </button>
    </div>
  )
}

export function HelpDialog() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-5 h-5 rounded-full flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        title="Help"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Getting started</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 font-medium">
                <Terminal className="w-4 h-4 text-muted-foreground" />
                Verify your jobs in the terminal
              </div>
              <p className="text-muted-foreground text-xs">
                Run this to see all active cron entries:
              </p>
              <CopyBlock code="crontab -l" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle className="w-4 h-4 text-muted-foreground" />
                Test that a job is actually running
              </div>
              <p className="text-muted-foreground text-xs">
                Create a job with this command (set to "Every minute"), then watch the file grow:
              </p>
              <CopyBlock code={`echo "$(date): macron ran" >> /tmp/macron-test.log`} />
              <CopyBlock code="tail -f /tmp/macron-test.log" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 font-medium">
                <Bot className="w-4 h-4 text-muted-foreground" />
                Set up Copilot for scheduled jobs
              </div>
              <p className="text-muted-foreground text-xs">
                Cron can't access your keychain. First, make sure you've logged in to the
                Copilot CLI at least once:
              </p>
              <CopyBlock code="copilot login" />
              <p className="text-muted-foreground text-xs">
                Then export the OAuth token from keychain for cron to use:
              </p>
              <CopyBlock code="security find-generic-password -s copilot-cli -w | tr -d '\n' > ~/.macron/github-token" />
              <p className="text-muted-foreground text-xs">
                Run this again after re-authenticating with <code className="font-mono bg-muted px-1 rounded">copilot login</code>.
              </p>
              <p className="text-muted-foreground text-xs mt-2">
                If you use <strong>WorkIQ</strong> (Microsoft 365 queries), also export its token cache:
              </p>
              <CopyBlock code={`security find-generic-password -s work-iq-cli -a MSALCache -w > ~/.work-iq-cli/msal_token_cache.dat`} />
              <p className="text-muted-foreground text-xs">
                Run <code className="font-mono bg-muted px-1 rounded">npx -y @microsoft/workiq ask -q "ping"</code> first if you haven't logged in to WorkIQ yet.
              </p>
            </div>

            <p className="text-xs text-muted-foreground border-t pt-3">
              Jobs writing to <code className="font-mono bg-muted px-1 rounded">~/Documents</code> or{' '}
              <code className="font-mono bg-muted px-1 rounded">~/Desktop</code> require Full Disk Access
              for <code className="font-mono bg-muted px-1 rounded">/usr/sbin/cron</code> in{' '}
              System Settings → Privacy & Security.
            </p>

            <p className="text-xs text-muted-foreground/50 border-t pt-3">
              Macroni is a fork of{' '}
              <span className="font-medium">Macron</span> by{' '}
              <span className="font-medium">Owen Melbourne</span>{' '}
              (<a
                href="https://github.com/OwenMelbz/macron"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2 hover:text-muted-foreground"
              >
                github.com/OwenMelbz/macron
              </a>).
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
