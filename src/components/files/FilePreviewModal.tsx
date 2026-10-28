import React, { useEffect, useState } from 'react';
import { blobStore, formatBytes } from '../../services/db';
import { FileItem } from '../../types';
import {
  Calendar,
  Check,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  HardDrive,
  Maximize2,
  Minimize2,
  Music,
  Share2,
  Tag,
  Video,
  Volume2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface FilePreviewModalProps {
  file: FileItem | null;
  onClose: () => void;
  onDownload: (file: FileItem) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, onClose, onDownload }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let activeUrl: string | null = null;

    if (file) {
      blobStore.getBlob(file.id).then((blob) => {
        if (blob) {
          activeUrl = URL.createObjectURL(blob);
          setBlobUrl(activeUrl);
        } else {
          setBlobUrl(null);
        }
      });
    }

    return () => {
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [file]);

  if (!file) return null;

  const handleCopyDetails = () => {
    navigator.clipboard.writeText(`Filename: ${file.name}\nSize: ${formatBytes(file.fileSize)}\nType: ${file.mimeType}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-white border border-slate-200/80 shadow-2xs shrink-0">
              {file.category === 'video' ? (
                <Video className="w-4 h-4 text-purple-600" />
              ) : file.category === 'image' ? (
                <FileImage className="w-4 h-4 text-emerald-600" />
              ) : file.category === 'audio' ? (
                <Music className="w-4 h-4 text-amber-600" />
              ) : (
                <FileText className="w-4 h-4 text-sky-600" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 truncate">{file.name}</h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {formatBytes(file.fileSize)} · {file.extension.toUpperCase()} · Uploaded{' '}
                {new Date(file.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onDownload(file)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
            <button
              type="button"
              onClick={handleCopyDetails}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Copy metadata"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body / Viewer Canvas */}
        <div className="flex-1 overflow-auto bg-slate-900 flex items-center justify-center min-h-[360px] p-4 relative">
          {/* IMAGE VIEWER */}
          {file.category === 'image' && (
            <div className="flex flex-col items-center justify-center w-full h-full relative">
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-md rounded-lg p-1 text-white z-10">
                <button
                  onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 3))}
                  className="p-1 hover:bg-white/20 rounded"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-mono px-1">{Math.round(zoomLevel * 100)}%</span>
                <button
                  onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.5))}
                  className="p-1 hover:bg-white/20 rounded"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomLevel(1)}
                  className="p-1 hover:bg-white/20 rounded text-[10px]"
                  title="Reset"
                >
                  100%
                </button>
              </div>

              <img
                src={blobUrl || '/src/assets/images/student_study_cloud_workspace_1792551231948.jpg'}
                alt={file.name}
                style={{ transform: `scale(${zoomLevel})` }}
                className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-2xl transition-transform duration-150"
              />
            </div>
          )}

          {/* VIDEO PLAYER */}
          {file.category === 'video' && (
            <div className="w-full max-w-2xl bg-black rounded-xl overflow-hidden shadow-2xl">
              {blobUrl ? (
                <video src={blobUrl} controls autoPlay className="w-full max-h-[60vh] object-contain" />
              ) : (
                <div className="p-8 text-center text-slate-300">
                  <div className="w-16 h-16 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-3">
                    <Video className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-semibold text-white mb-1">{file.name}</h4>
                  <p className="text-xs text-slate-400 mb-4 max-w-md mx-auto">
                    Recorded academic lecture file is safely stored. Download to view the original high-resolution stream.
                  </p>
                  <button
                    onClick={() => onDownload(file)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Video File
                  </button>
                </div>
              )}
            </div>
          )}

          {/* AUDIO PLAYER */}
          {file.category === 'audio' && (
            <div className="w-full max-w-md bg-slate-800 rounded-2xl p-6 text-white text-center shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
                <Music className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-semibold truncate mb-1">{file.name}</h4>
              <p className="text-xs text-slate-400 mb-5 font-mono">{formatBytes(file.fileSize)} · Audio Recording</p>
              {blobUrl ? (
                <audio controls src={blobUrl} className="w-full mb-3" />
              ) : (
                <div className="bg-slate-700/50 rounded-xl p-4 mb-4 text-xs text-slate-300">
                  Audio file ready for playback and offline review.
                </div>
              )}
            </div>
          )}

          {/* PDF VIEWER / DOCUMENT VIEWER */}
          {file.category === 'document' && (
            <div className="w-full h-full min-h-[450px] bg-slate-100 rounded-xl flex flex-col p-4 text-slate-800">
              {blobUrl && file.extension === 'pdf' ? (
                <iframe src={blobUrl} title={file.name} className="w-full h-[55vh] rounded-lg border border-slate-300" />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-white rounded-lg border border-slate-200 shadow-xs">
                  <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">{file.name}</h4>
                  <p className="text-xs text-slate-500 max-w-md mb-5 leading-relaxed">
                    This document is secured in your student storage. You can download the file directly to edit in Microsoft Office, Google Workspace, or your PDF reader.
                  </p>
                  <button
                    onClick={() => onDownload(file)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download File ({formatBytes(file.fileSize)})</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ARCHIVE / OTHER */}
          {(file.category === 'archive' || file.category === 'other') && (
            <div className="w-full max-w-md bg-white rounded-2xl p-6 text-center shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto mb-3">
                <FileCode className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">{file.name}</h4>
              <p className="text-xs text-slate-500 mb-5">
                Compressed academic archive ({formatBytes(file.fileSize)}). Ready for download and extraction.
              </p>
              <button
                onClick={() => onDownload(file)}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Download Archive</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer Metadata Strip */}
        <div className="px-5 py-3 border-t border-slate-100 bg-white flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-mono">
              <HardDrive className="w-3.5 h-3.5 text-slate-400" />
              {formatBytes(file.fileSize)}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              {file.mimeType}
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
            <span>Secure Student Object ID:</span>
            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{file.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
