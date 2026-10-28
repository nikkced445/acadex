import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db, formatBytes } from '../../services/db';
import { FileItem } from '../../types';
import {
  Archive,
  ArrowRight,
  CheckCircle,
  Database,
  Download,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  Folder,
  HardDrive,
  Info,
  Music,
  PieChart,
  Sparkles,
  Trash2,
  Upload,
  Video,
} from 'lucide-react';

interface StorageUsageViewProps {
  onNavigateToFiles: () => void;
  onOpenUpload: () => void;
}

export const StorageUsageView: React.FC<StorageUsageViewProps> = ({ onNavigateToFiles, onOpenUpload }) => {
  const { user } = useAuth();
  if (!user) return null;

  const [refresher, setRefresher] = useState(0);

  const storage = db.getStorageBreakdown(user.id);
  const allFiles = db.getFiles(user.id, false);
  const trashFiles = db.getFiles(user.id, true).filter((f) => f.isDeleted);
  const trashTotalBytes = trashFiles.reduce((acc, f) => acc + f.fileSize, 0);

  // Largest files
  const largestFiles = [...allFiles].sort((a, b) => b.fileSize - a.fileSize).slice(0, 6);

  // Folders breakdown
  const folders = db.getFolders(user.id);
  const folderUsage = folders.map((folder) => {
    const filesInFolder = allFiles.filter((f) => f.folderId === folder.id);
    const bytes = filesInFolder.reduce((acc, f) => acc + f.fileSize, 0);
    return {
      id: folder.id,
      name: folder.name,
      color: folder.color,
      count: filesInFolder.length,
      bytes,
      percentage: storage.usedBytes > 0 ? Math.round((bytes / storage.usedBytes) * 100) : 0,
    };
  });

  const handleEmptyTrash = async () => {
    if (confirm('Permanently delete all files currently in Trash to reclaim space?')) {
      await db.emptyTrash(user.id);
      setRefresher((r) => r + 1);
    }
  };

  const handleDeleteFile = (fileId: string) => {
    db.moveToTrash(fileId);
    setRefresher((r) => r + 1);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Cloud Storage Analytics</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time storage quota usage calculated from your stored coursework, lecture media, and research files.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenUpload}
          className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-2xs hover:shadow-xs transition-all shrink-0"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Files</span>
        </button>
      </div>

      {/* Main Storage Gauge Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Total Consumption</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 tabular-nums">
                {formatBytes(storage.usedBytes)}
              </span>
              <span className="text-sm text-slate-400 font-mono">
                used of {formatBytes(storage.totalBytes)} ({storage.percentageUsed}%)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              You still have <span className="font-semibold text-emerald-600 font-mono">{formatBytes(storage.availableBytes)}</span> of free cloud storage remaining.
            </p>
          </div>

          {/* Trash Reclaim Callout */}
          {trashTotalBytes > 0 && (
            <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-amber-600 shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-amber-900">
                  {formatBytes(trashTotalBytes)} in Trash
                </p>
                <p className="text-amber-700">Reclaim space by emptying your trash bin.</p>
              </div>
              <button
                type="button"
                onClick={handleEmptyTrash}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shrink-0 ml-auto"
              >
                Empty
              </button>
            </div>
          )}
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="space-y-2">
          <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${(storage.documentsBytes / (storage.totalBytes || 1)) * 100}%` }}
              className="bg-sky-500 h-full"
              title={`Documents: ${formatBytes(storage.documentsBytes)}`}
            />
            <div
              style={{ width: `${(storage.videosBytes / (storage.totalBytes || 1)) * 100}%` }}
              className="bg-purple-500 h-full"
              title={`Videos: ${formatBytes(storage.videosBytes)}`}
            />
            <div
              style={{ width: `${(storage.imagesBytes / (storage.totalBytes || 1)) * 100}%` }}
              className="bg-emerald-500 h-full"
              title={`Images: ${formatBytes(storage.imagesBytes)}`}
            />
            <div
              style={{ width: `${(storage.audioBytes / (storage.totalBytes || 1)) * 100}%` }}
              className="bg-amber-500 h-full"
              title={`Audio: ${formatBytes(storage.audioBytes)}`}
            />
            <div
              style={{ width: `${(storage.archivesBytes / (storage.totalBytes || 1)) * 100}%` }}
              className="bg-indigo-500 h-full"
              title={`Archives: ${formatBytes(storage.archivesBytes)}`}
            />
          </div>

          {/* File Type Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
              <div className="flex items-center gap-1.5 text-xs text-sky-700 font-semibold mb-1">
                <FileText className="w-4 h-4 text-sky-500" />
                <span>Documents</span>
              </div>
              <p className="text-base font-bold font-mono text-slate-800 tabular-nums">
                {formatBytes(storage.documentsBytes)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">PDFs, Word, PPT</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
              <div className="flex items-center gap-1.5 text-xs text-purple-700 font-semibold mb-1">
                <Video className="w-4 h-4 text-purple-500" />
                <span>Videos</span>
              </div>
              <p className="text-base font-bold font-mono text-slate-800 tabular-nums">
                {formatBytes(storage.videosBytes)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">MP4, WebM lectures</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold mb-1">
                <FileImage className="w-4 h-4 text-emerald-500" />
                <span>Images</span>
              </div>
              <p className="text-base font-bold font-mono text-slate-800 tabular-nums">
                {formatBytes(storage.imagesBytes)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Photos & diagrams</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
              <div className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold mb-1">
                <Music className="w-4 h-4 text-amber-500" />
                <span>Audio</span>
              </div>
              <p className="text-base font-bold font-mono text-slate-800 tabular-nums">
                {formatBytes(storage.audioBytes)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Recordings & podcasts</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
              <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-semibold mb-1">
                <Archive className="w-4 h-4 text-indigo-500" />
                <span>Archives & Other</span>
              </div>
              <p className="text-base font-bold font-mono text-slate-800 tabular-nums">
                {formatBytes(storage.archivesBytes + storage.othersBytes)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">ZIP, code bundles</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column: Folder Distribution & Largest Files */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Folder Usage Distribution */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Folder Storage Usage</h3>
            <button
              onClick={onNavigateToFiles}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              <span>View Folders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {folderUsage.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No folders created yet</p>
            ) : (
              folderUsage.map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-slate-50 border border-slate-150">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <Folder className="w-4 h-4 shrink-0" style={{ color: item.color || '#0284c7' }} />
                      <span className="text-xs font-semibold text-slate-800 truncate">{item.name}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-700">
                      {formatBytes(item.bytes)}
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-1">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(3, item.percentage)}%`,
                        backgroundColor: item.color || '#0284c7',
                      }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{item.count} files</span>
                    <span>{item.percentage}% of used storage</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Largest Files Table */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Largest Stored Files</h3>
            <span className="text-[11px] text-slate-400 font-mono">Sorted by size</span>
          </div>

          <div className="space-y-2">
            {largestFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 hover:bg-slate-50 border border-slate-150 text-xs transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate max-w-xs">{file.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {file.category} · {new Date(file.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono font-bold text-slate-700">
                    {formatBytes(file.fileSize)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteFile(file.id)}
                    className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                    title="Move to trash"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
