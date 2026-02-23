import { createRequire } from 'module'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CronTab: any = createRequire(import.meta.url)('crontab')

export interface CronJobData {
  id: string
  name: string
  command: string
  schedule: string
}

function parseComment(comment: string): { name: string; id: string } | null {
  const idx = comment.lastIndexOf('||')
  if (idx === -1) return null
  const name = comment.slice(0, idx)
  const id = comment.slice(idx + 2)
  // Basic UUID validation
  if (!/^[0-9a-f-]{36}$/.test(id)) return null
  return { name, id }
}

function serializeComment(name: string, id: string): string {
  return `${name}||${id}`
}

function loadTab(): Promise<any> {
  return new Promise((resolve, reject) => {
    CronTab.load((err: Error | null, tab: any) => {
      if (err) reject(err)
      else resolve(tab)
    })
  })
}

function saveTab(tab: any): Promise<void> {
  return new Promise((resolve, reject) => {
    tab.save((err: Error | null) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

export async function getJobs(): Promise<CronJobData[]> {
  const tab = await loadTab()
  const jobs: CronJobData[] = []
  for (const job of tab.jobs()) {
    const comment = String(job.comment() ?? '')
    const parsed = parseComment(comment)
    if (!parsed) continue
    jobs.push({
      id: parsed.id,
      name: parsed.name,
      command: String(job.command()),
      schedule: `${job.minute()} ${job.hour()} ${job.dom()} ${job.month()} ${job.dow()}`
    })
  }
  return jobs
}

export async function saveJob(data: CronJobData): Promise<void> {
  const tab = await loadTab()
  const comment = serializeComment(data.name, data.id)

  // Remove any existing job with the same UUID
  const existing = tab.jobs().find((j: any) => {
    const c = String(j.comment() ?? '')
    const p = parseComment(c)
    return p?.id === data.id
  })
  if (existing) {
    tab.remove(existing)
  }

  // Create the (new or updated) job
  tab.create(data.command, data.schedule, comment)

  await saveTab(tab)
}

export async function deleteJob(id: string): Promise<void> {
  const tab = await loadTab()
  const job = tab.jobs().find((j: any) => {
    const c = String(j.comment() ?? '')
    const p = parseComment(c)
    return p?.id === id
  })
  if (job) {
    tab.remove(job)
    await saveTab(tab)
  }
}
