// client/src/pages/client/Files.jsx
import { useEffect, useState } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { Files, Download, FileText, Image, Archive, Film } from 'lucide-react'

const FILE_ICON = (type) => {
  if (!type) return FileText
  if (type.startsWith('image/')) return Image
  if (type.includes('pdf'))      return FileText
  if (type.includes('zip'))      return Archive
  if (type.startsWith('video/')) return Film
  return FileText
}

const formatSize = (bytes) => {
  if (!bytes) return '—'
  if (bytes < 1024)       return bytes + ' B'
  if (bytes < 1024*1024)  return (bytes/1024).toFixed(1) + ' KB'
  return (bytes/1024/1024).toFixed(1) + ' MB'
}

export default function ClientFiles() {
  const [files,   setFiles]   = useState([])
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/client/my-project')
      .then(r => {
        if (!r.data.data) return
        setProject(r.data.data)
        return api.get(`/files/project/${r.data.data.id}`)
      })
      .then(r => r && setFiles(r.data.data || []))
      .catch(() => toast.error('Failed to load files.'))
      .finally(() => setLoading(false))
  }, [])

  const handleDownload = async (file) => {
    try {
      const res = await api.get(`/files/${file.id}/download`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data]))
      const a   = document.createElement('a')
      a.href    = url
      a.download = file.original_name
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Download failed.')
    }
  }

  // Group by milestone
  const grouped = files.reduce((acc, f) => {
    const key = f.milestone_title || 'General Files'
    if (!acc[key]) acc[key] = []
    acc[key].push(f)
    return acc
  }, {})

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-oxford border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="page-title">Files</h1>
        <p className="page-sub">
          {files.length} file{files.length !== 1 ? 's' : ''} shared by TechEthix
        </p>
      </div>

      {files.length === 0 ? (
        <div className="card text-center py-16">
          <Files size={36} className="text-muted/30 mx-auto mb-3" />
          <p className="font-syne font-700 text-oxford">No files yet</p>
          <p className="text-muted text-sm mt-1">
            Files will appear here as your project progresses.
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([group, groupFiles]) => (
          <div key={group} className="card">
            <h3 className="font-syne font-700 text-oxford mb-4 pb-3 border-b border-border">
              {group}
              <span className="ml-2 text-sm font-400 text-muted">
                ({groupFiles.length} file{groupFiles.length !== 1 ? 's' : ''})
              </span>
            </h3>
            <div className="space-y-2">
              {groupFiles.map(f => {
                const Icon = FILE_ICON(f.file_type)
                return (
                  <div key={f.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-cream/50 transition-colors">
                    <div className="p-2 bg-oxford/8 rounded-lg flex-shrink-0">
                      <Icon size={18} className="text-oxford" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-oxford truncate">
                        {f.original_name}
                      </p>
                      <p className="text-xs text-muted mt-0.5">
                        {formatSize(f.file_size)} ·{' '}
                        {new Date(f.created_at).toLocaleDateString('en-IN')} ·{' '}
                        Uploaded by {f.uploaded_by_name}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDownload(f)}
                      className="p-2 rounded-lg hover:bg-oxford hover:text-white text-muted
                                 transition-colors flex-shrink-0"
                      title="Download"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
