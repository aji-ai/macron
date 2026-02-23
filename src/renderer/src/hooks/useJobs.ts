import { useState, useEffect, useCallback } from 'react'
import type { CronJobData } from '../types'

export function useJobs() {
  const [jobs, setJobs] = useState<CronJobData[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const j = await window.electronAPI.getJobs()
      setJobs(j)
    } catch (err) {
      console.error('Failed to load cron jobs:', err)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const saveJob = useCallback(
    async (job: CronJobData) => {
      await window.electronAPI.saveJob(job)
      await load()
    },
    [load]
  )

  const deleteJob = useCallback(
    async (id: string) => {
      await window.electronAPI.deleteJob(id)
      await load()
    },
    [load]
  )

  return { jobs, loading, saveJob, deleteJob, reload: load }
}
