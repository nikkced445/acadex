import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { blobStore, db, formatBytes } from '../../services/db';
import { FileCategory, FileItem, Folder } from '../../types';
import { FilePreviewModal } from './FilePreviewModal';
import { FileUploadModal } from './FileUploadModal';
import { FolderModal } from './FolderModal';
import {
  Archive,
  ArrowUpDown,
  ChevronRight,
  Download,
  Edit2,
  Eye,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  Filter,
  Folder as FolderIcon,
  FolderOpen,
  FolderPlus,
  Grid,
  Heart,
  LayoutGrid,
  List,
  MoreVertical,
  MoveRight,
  Music,
  Plus,
  RotateCcw,
  Search,
  Star,
  Trash2,
  Upload,
  Video,
} from 'lucide-react';

interface FileManagerProps {
  initialCategory?: string;
}

export const FileManager: React.FC<FileManagerProps> = ({ initialCategory }) => {
  const { user } = useAuth();
  if (!user) return null;

  // Navigation & Filter state
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modals state
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [movingFile, setMovingFile] = useState<FileItem | null>(null);
  const [renamingFile, setRenamingFile] = useState<FileItem | null>(null);
  const [newFileName, setNewFileName] = useState('');

  // Fetch data
  const isTrashView = selectedCategory === 'trash';
  const isFavoritesView = selectedCategory === 'favorites';

  const allFolders = db.getFolders(user.id);
  const currentFolder = allFolders.find((f) => f.id === currentFolderId) || null;
  const rawFiles = db.getFiles(user.id, isTrashView);

  // Filter files
  let filteredFiles = rawFiles.filter((f) => {
    if (isTrashView) return f.isDeleted;
    if (f.isDeleted) return false;

    if (isFavoritesView) {
      if (!f.isFavorite) return false;
    } else if (currentFolderId) {
      if (f.folderId !== currentFolderId) return false;
    } else if (selectedCategory !== 'all') {
      if (f.category !== selectedCategory) return false;
    }

    if (searchQuery.trim()) {
      return f.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
    }

    return true;
  });

  // Sort files
  filteredFiles.sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === 'size') {
      comparison = a.fileSize - b.fileSize;
    } else {
      comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Action handlers
  const handleToggleFavorite = (file: FileItem) => {
    db.updateFile(file.id, { isFavorite: !file.isFavorite });
    setNewFileName(''); // trigger re-render
  };

  const handleDownloadFile = async (file: FileItem) => {
    const blob = await blobStore.getBlob(file.id);
    const link = document.createElement('a');

    if (blob) {
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // Mock text content download for pre-seeded demonstration items
      const sampleBlob = new Blob(
        [
          `--- Acadex StudyCloud Academic Document ---\nFilename: ${file.name}\nCategory: ${file.category}\nOwner: ${user.fullName}\nID: ${file.id}\nTimestamp: ${file.createdAt}\n\n[Content verified and encrypted in student cloud storage]`,
        ],
        { type: file.mimeType || 'text/plain' }
      );
      const url = URL.createObjectURL(sampleBlob);
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleMoveToTrash = (file: FileItem) => {
    db.moveToTrash(file.id);
    setNewFileName('');
  };

  const handleRestoreFile = (file: FileItem) => {
    db.restoreFromTrash(file.id);
    setNewFileName('');
  };

  const handlePermanentDelete = async (file: FileItem) => {
    if (confirm(`Are you sure you want to permanently delete "${file.name}"? This action cannot be undone.`)) {
      await db.permanentDeleteFile(file.id);
      setNewFileName('');
    }
  };

  const handleEmptyTrash = async () => {
    if (confirm('Are you sure you want to permanently delete all items in the Trash?')) {
      await db.emptyTrash(user.id);
      setNewFileName('');
    }
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingFile || !newFileName.trim()) return;
    db.updateFile(renamingFile.id, { name: newFileName.trim() });
    setRenamingFile(null);
    setNewFileName('');
  };

  const handleMoveFileSubmit = (targetFolderId: string | null) => {
    if (!movingFile) return;
    db.updateFile(movingFile.id, { folderId: targetFolderId });
    setMovingFile(null);
  };

  const handleFolderSubmit = (name: string, color?: string) => {
    if (editingFolder) {
      db.renameFolder(editingFolder.id, name);
    } else {
      db.createFolder(user.id, name, currentFolderId, color);
    }
    setEditingFolder(null);
  };

  const handleDeleteFolder = (folderId: string, folderName: string) => {
    if (confirm(`Delete folder "${folderName}"? Contained files will be preserved in your root storage.`)) {
      db.deleteFolder(folderId);
      if (currentFolderId === folderId) {
        setCurrentFolderId(null);
      }
    }
  };

  const renderFileIcon = (file: FileItem) => {
    switch (file.category) {
      case 'video':
        return <Video className="w-5 h-5 text-purple-600" />;
      case 'image':
        return <FileImage className="w-5 h-5 text-emerald-600" />;
      case 'audio':
        return <Music className="w-5 h-5 text-amber-600" />;
      case 'archive':
        return <Archive className="w-5 h-5 text-indigo-600" />;
      case 'document':
        if (['xlsx', 'xls', 'csv'].includes(file.extension)) {
          return <FileSpreadsheet className="w-5 h-5 text-emerald-700" />;
        }
        return <FileText className="w-5 h-5 text-sky-600" />;
      default:
        return <FileCode className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Controls Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 overflow-x-auto py-1">
          <button
            type="button"
            onClick={() => {
              setCurrentFolderId(null);
              setSelectedCategory('all');
            }}
            className={`hover:text-sky-600 transition-colors whitespace-nowrap ${
              !currentFolderId && selectedCategory === 'all' ? 'text-sky-700 font-bold' : ''
            }`}
          >
            My Files
          </button>

          {currentFolder && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-900 font-bold truncate max-w-xs">{currentFolder.name}</span>
            </>
          )}

          {isFavoritesView && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-rose-600 font-bold">Starred / Favorites</span>
            </>
          )}

          {isTrashView && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-red-600 font-bold">Trash Bin</span>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {!isTrashView ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setEditingFolder(null);
                  setIsFolderModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
              >
                <FolderPlus className="w-3.5 h-3.5 text-sky-600" />
                <span>New Folder</span>
              </button>

              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Files</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleEmptyTrash}
              disabled={filteredFiles.length === 0}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Empty Trash</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and View Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Category Filter Buttons (Functional Tabs) */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setCurrentFolderId(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'all' && !currentFolderId
                  ? 'bg-sky-50 text-sky-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Files
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('document');
                setCurrentFolderId(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'document'
                  ? 'bg-sky-50 text-sky-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Documents
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('video');
                setCurrentFolderId(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'video'
                  ? 'bg-sky-50 text-sky-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Videos
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('image');
                setCurrentFolderId(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'image'
                  ? 'bg-sky-50 text-sky-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Images
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('favorites');
                setCurrentFolderId(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                selectedCategory === 'favorites'
                  ? 'bg-rose-50 text-rose-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Starred</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('trash');
                setCurrentFolderId(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                selectedCategory === 'trash'
                  ? 'bg-red-50 text-red-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Trash</span>
            </button>
          </div>

          {/* Search, Sort, and Grid/List Toggles */}
          <div className="flex items-center gap-2">
            {/* Inline search */}
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Filter files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden"
            >
              <option value="date">Date</option>
              <option value="name">Name</option>
              <option value="size">Size</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-sky-600 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Grid view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-white text-sky-600 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="List view"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FOLDERS GRID (Only shown when not in Trash or Category views) */}
      {!currentFolderId && selectedCategory === 'all' && allFolders.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Folders</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {allFolders.map((folder) => {
              const fileCount = rawFiles.filter((f) => f.folderId === folder.id && !f.isDeleted).length;

              return (
                <div
                  key={folder.id}
                  onClick={() => setCurrentFolderId(folder.id)}
                  className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs hover:border-sky-300 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs"
                      style={{ backgroundColor: folder.color || '#0284c7' }}
                    >
                      <FolderIcon className="w-5 h-5 fill-white/20" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-sky-700">
                        {folder.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">{fileCount} files</p>
                    </div>
                  </div>

                  {/* Folder action controls */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingFolder(folder);
                        setIsFolderModalOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-sky-600 rounded"
                      title="Rename folder"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFolder(folder.id, folder.name);
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 rounded"
                      title="Delete folder"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FILES SECTION */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {isTrashView ? 'Trash Items' : currentFolder ? `Files in ${currentFolder.name}` : 'Files'} (
            {filteredFiles.length})
          </h3>
        </div>

        {filteredFiles.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-8">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-3">
              <FolderOpen className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800 mb-1">
              {isTrashView ? 'Trash is Empty' : 'No Files Found'}
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              {isTrashView
                ? 'Deleted files will appear here before permanent removal.'
                : 'Upload lecture notes, slides, assignments, and study materials into this workspace.'}
            </p>
            {!isTrashView && (
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload First File</span>
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                onClick={() => setPreviewFile(file)}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs hover:border-sky-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group relative"
              >
                {/* Top Strip */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="p-2.5 rounded-xl bg-slate-50 group-hover:bg-sky-50 transition-colors">
                    {renderFileIcon(file)}
                  </div>

                  {/* Quick Favorite or Restore Button */}
                  <div className="flex items-center gap-1">
                    {!isTrashView ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(file);
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${
                          file.isFavorite ? 'text-amber-500 hover:text-slate-400' : 'text-slate-300 hover:text-amber-500'
                        }`}
                        title={file.isFavorite ? 'Remove star' : 'Star file'}
                      >
                        <Star className={`w-4 h-4 ${file.isFavorite ? 'fill-amber-400' : ''}`} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestoreFile(file);
                        }}
                        className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                        title="Restore file"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* File Details */}
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-2 group-hover:text-sky-700 leading-snug">
                    {file.name}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-2">
                    <span>{formatBytes(file.fileSize)}</span>
                    <span>·</span>
                    <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Bottom Actions Row */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span className="uppercase text-[10px] font-mono tracking-wider text-slate-500 font-semibold">
                    {file.extension}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadFile(file);
                      }}
                      className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    {!isTrashView ? (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMovingFile(file);
                          }}
                          className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Move to folder"
                        >
                          <MoveRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenamingFile(file);
                            setNewFileName(file.name);
                          }}
                          className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Rename"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveToTrash(file);
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Move to trash"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePermanentDelete(file);
                        }}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* LIST VIEW */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4 hidden sm:table-cell">Category</th>
                  <th className="py-3 px-4 font-mono">Size</th>
                  <th className="py-3 px-4 hidden md:table-cell font-mono">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredFiles.map((file) => (
                  <tr
                    key={file.id}
                    onClick={() => setPreviewFile(file)}
                    className="hover:bg-slate-50/70 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-1.5 rounded-lg bg-slate-50 group-hover:bg-white shrink-0">
                          {renderFileIcon(file)}
                        </div>
                        <span className="font-semibold text-slate-800 truncate group-hover:text-sky-700 max-w-xs sm:max-w-md">
                          {file.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell capitalize text-slate-500">
                      {file.category}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-600">
                      {formatBytes(file.fileSize)}
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell font-mono text-slate-400">
                      {new Date(file.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleDownloadFile(file)}
                          className="p-1.5 text-slate-400 hover:text-sky-600 rounded-lg hover:bg-slate-100"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        {!isTrashView ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setRenamingFile(file);
                                setNewFileName(file.name);
                              }}
                              className="p-1.5 text-slate-400 hover:text-sky-600 rounded-lg hover:bg-slate-100"
                              title="Rename"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveToTrash(file)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                              title="Move to trash"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRestoreFile(file)}
                            className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg"
                            title="Restore"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RENAME FILE MODAL */}
      {renamingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Rename File</h3>
            <form onSubmit={handleRenameSubmit}>
              <input
                type="text"
                autoFocus
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 mb-4"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRenamingFile(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newFileName.trim()}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOVE FILE MODAL */}
      {movingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Move "{movingFile.name}"</h3>
            <p className="text-xs text-slate-400 mb-4">Choose a target destination folder</p>
            <div className="space-y-1.5 max-h-56 overflow-y-auto mb-4">
              <button
                type="button"
                onClick={() => handleMoveFileSubmit(null)}
                className={`w-full flex items-center gap-2 p-2.5 rounded-xl border text-xs text-left transition-colors ${
                  movingFile.folderId === null
                    ? 'bg-sky-50 border-sky-400 font-semibold text-sky-700'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <FolderOpen className="w-4 h-4 text-sky-600" />
                <span>📁 Root Folder (All Files)</span>
              </button>
              {allFolders.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleMoveFileSubmit(f.id)}
                  className={`w-full flex items-center gap-2 p-2.5 rounded-xl border text-xs text-left transition-colors ${
                    movingFile.folderId === f.id
                      ? 'bg-sky-50 border-sky-400 font-semibold text-sky-700'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <FolderIcon className="w-4 h-4 text-sky-600" />
                  <span>📁 {f.name}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setMovingFile(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onDownload={handleDownloadFile}
      />

      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        userId={user.id}
        folders={allFolders}
        currentFolderId={currentFolderId}
        onUploadComplete={() => setNewFileName('')}
      />

      <FolderModal
        isOpen={isFolderModalOpen}
        onClose={() => {
          setIsFolderModalOpen(false);
          setEditingFolder(null);
        }}
        folderToEdit={editingFolder}
        onSubmit={handleFolderSubmit}
      />
    </div>
  );
};
