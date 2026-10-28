import React, { useRef, useState } from 'react';
import { db, formatBytes } from '../../services/db';
import { Folder } from '../../types';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Folder as FolderIcon,
  HardDrive,
  Upload,
  X,
} from 'lucide-react';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  folders: Folder[];
  currentFolderId: string | null;
  onUploadComplete: () => void;
  initialCategory?: string;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  userId,
  folders,
  currentFolderId,
  onUploadComplete,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(currentFolderId);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const storage = db.getStorageBreakdown(userId);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelected(Array.from(e.target.files));
    }
  };

  const handleFilesSelected = (files: File[]) => {
    setErrorMessage(null);
    // Validate storage quota
    const totalNewBytes = files.reduce((acc, f) => acc + f.size, 0);
    if (storage.usedBytes + totalNewBytes > storage.totalBytes) {
      setErrorMessage(`Insufficient storage quota. Required: ${formatBytes(totalNewBytes)}, Available: ${formatBytes(storage.availableBytes)}.`);
      return;
    }
    setSelectedFiles(files);
  };

  const handleStartUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(10);

    const stepInterval = setInterval(() => {
      setUploadProgress((p) => Math.min(p + 25, 90));
    }, 150);

    try {
      for (const file of selectedFiles) {
        await db.addFile(userId, {
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          folderId: selectedFolderId,
          blob: file,
        });
      }

      clearInterval(stepInterval);
      setUploadProgress(100);

      setTimeout(() => {
        setIsUploading(false);
        setSelectedFiles([]);
        onUploadComplete();
        onClose();
      }, 400);
    } catch (err) {
      clearInterval(stepInterval);
      setIsUploading(false);
      setErrorMessage('Failed to upload file. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Upload Academic Files</h3>
              <p className="text-[11px] text-slate-400">PDFs, Word, Presentations, Videos, and Archives</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4">
          {/* Target Folder Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <FolderIcon className="w-3.5 h-3.5 text-slate-400" />
              Destination Folder
            </label>
            <select
              value={selectedFolderId || ''}
              onChange={(e) => setSelectedFolderId(e.target.value || null)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            >
              <option value="">📁 Root / All Files</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  📁 {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-sky-500 bg-sky-50/80 scale-[1.01]'
                : 'border-slate-200 hover:border-sky-300 hover:bg-slate-50/60'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              multiple
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-slate-800">
              Drag and drop files here, or <span className="text-sky-600 underline">browse files</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Supports PDF, DOCX, XLSX, PPTX, MP4, MP3, PNG, JPG, ZIP (up to 500MB per file)
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              <span className="text-[11px] font-semibold text-slate-500">
                Selected Files ({selectedFiles.length}):
              </span>
              {selectedFiles.map((f, idx) => (
                <div
                  key={`${f.name}-${idx}`}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span className="font-medium text-slate-800 truncate">{f.name}</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400 shrink-0 ml-2">
                    {formatBytes(f.size)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-sky-700">
                <span>Storing files to private cloud...</span>
                <span className="font-mono">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 transition-all duration-200 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
            <HardDrive className="w-3.5 h-3.5" />
            <span>Available: {formatBytes(storage.availableBytes)}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStartUpload}
              disabled={selectedFiles.length === 0 || isUploading}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-2xs hover:shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isUploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
