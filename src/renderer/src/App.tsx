import { useState, useEffect } from 'react'
import { useJobs } from './hooks/useJobs'
import { Sidebar } from './components/Sidebar'
import { JobEditor } from './components/JobEditor'
import { EmptyState } from './components/EmptyState'

// 'new' sentinel creates a blank editor; a UUID string selects an existing job; null = no selection
type Selection = string | null

export default function App(): React.JSX.Element {
  const { jobs, loading, saveJob, deleteJob } = useJobs()
  const [selectedId, setSelectedId] = useState<Selection>(null)

  // selectedJob is null when creating a new job ('new') or nothing is selected (null)
  const selectedJob = selectedId && selectedId !== 'new' ? (jobs.find((j) => j.id === selectedId) ?? null) : null

  // Listen for TouchBar "New Job" button
  useEffect(() => {
    window.electronAPI.onNewJobRequested(() => {
      setSelectedId('new')
    })
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      <Sidebar
        jobs={jobs}
        loading={loading}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      <main className="flex-1 overflow-hidden bg-background/80 backdrop-blur-sm">
        {selectedId !== null ? (
          <JobEditor
            job={selectedJob}
            onSave={saveJob}
            onDelete={deleteJob}
            onSelect={setSelectedId}
          />
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  )
}
