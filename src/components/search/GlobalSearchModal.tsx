import React, { useEffect, useState } from 'react';
import { db, formatBytes } from '../../services/db';
import { Announcement, FileItem, PersonalEvent, SchoolEvent } from '../../types';
import {
  Calendar,
  Clock,
  ExternalLink,
  FileText,
  Folder,
  Image as ImageIcon,
  Megaphone,
  Music,
  Search,
  Video,
  X,
} from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSelectFile?: (file: FileItem) => void;
  onSelectEvent?: (eventId: string, isSchool: boolean) => void;
  onSelectAnnouncement?: (announcementId: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  userId,
  onSelectFile,
  onSelectEvent,
  onSelectAnnouncement,
}) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'files' | 'events' | 'announcements'>('all');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const trimmed = query.trim().toLowerCase();

  // Search Files
  const allFiles = db.getFiles(userId, false);
  const matchingFiles = trimmed
    ? allFiles.filter((f) => f.name.toLowerCase().includes(trimmed) || f.category.toLowerCase().includes(trimmed))
    : allFiles.slice(0, 4);

  // Search Personal Events
  const personalEvents = db.getPersonalEvents(userId);
  const matchingPersonalEvents = trimmed
    ? personalEvents.filter((e) => e.title.toLowerCase().includes(trimmed) || e.description.toLowerCase().includes(trimmed))
    : personalEvents.slice(0, 3);

  // Search School Events
  const schoolEvents = db.getSchoolEvents(true);
  const matchingSchoolEvents = trimmed
    ? schoolEvents.filter((e) => e.title.toLowerCase().includes(trimmed) || e.description.toLowerCase().includes(trimmed))
    : schoolEvents.slice(0, 3);

  // Search Announcements
  const announcements = db.getAnnouncements(true);
  const matchingAnnouncements = trimmed
    ? announcements.filter((a) => a.title.toLowerCase().includes(trimmed) || a.content.toLowerCase().includes(trimmed))
    : announcements.slice(0, 3);

  const getFileIcon = (category: string) => {
    switch (category) {
      case 'video':
        return <Video className="w-4 h-4 text-purple-600" />;
      case 'image':
        return <ImageIcon className="w-4 h-4 text-emerald-600" />;
      case 'audio':
        return <Music className="w-4 h-4 text-amber-600" />;
      default:
        return <FileText className="w-4 h-4 text-sky-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files, folders, personal events, school announcements..."
            className="w-full text-sm text-slate-800 placeholder-slate-400 bg-transparent focus:outline-hidden"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600 rounded-md">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 rounded border border-slate-200">
            ESC
          </kbd>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              activeCategory === 'all' ? 'bg-white text-sky-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Results
          </button>
          <button
            onClick={() => setActiveCategory('files')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              activeCategory === 'files' ? 'bg-white text-sky-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Files ({matchingFiles.length})
          </button>
          <button
            onClick={() => setActiveCategory('events')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              activeCategory === 'events' ? 'bg-white text-sky-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Events ({matchingPersonalEvents.length + matchingSchoolEvents.length})
          </button>
          <button
            onClick={() => setActiveCategory('announcements')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              activeCategory === 'announcements' ? 'bg-white text-sky-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Announcements ({matchingAnnouncements.length})
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-5">
          {/* Files Section */}
          {(activeCategory === 'all' || activeCategory === 'files') && matchingFiles.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
                <Folder className="w-3.5 h-3.5" />
                <span>Files & Documents</span>
              </div>
              <div className="space-y-1">
                {matchingFiles.map((file) => (
                  <div
                    key={file.id}
                    onClick={() => {
                      onSelectFile?.(file);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-sky-50/70 border border-transparent hover:border-sky-100 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-white shrink-0">
                        {getFileIcon(file.category)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-800 truncate group-hover:text-sky-700">{file.name}</p>
                        <p className="text-[11px] text-slate-400">
                          {formatBytes(file.fileSize)} · Uploaded {new Date(file.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-sky-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Open
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Announcements Section */}
          {(activeCategory === 'all' || activeCategory === 'announcements') && matchingAnnouncements.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
                <Megaphone className="w-3.5 h-3.5" />
                <span>School Announcements</span>
              </div>
              <div className="space-y-1">
                {matchingAnnouncements.map((ann) => (
                  <div
                    key={ann.id}
                    onClick={() => {
                      onSelectAnnouncement?.(ann.id);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl hover:bg-sky-50/70 border border-transparent hover:border-sky-100 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-800 group-hover:text-sky-700 truncate">{ann.title}</p>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                        {ann.publishedAt ? new Date(ann.publishedAt).toLocaleDateString() : 'Draft'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{ann.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Events Section */}
          {(activeCategory === 'all' || activeCategory === 'events') &&
            (matchingPersonalEvents.length > 0 || matchingSchoolEvents.length > 0) && (
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Academic Calendar & Events</span>
                </div>
                <div className="space-y-1">
                  {matchingPersonalEvents.map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => {
                        onSelectEvent?.(ev.id, false);
                        onClose();
                      }}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-sky-50/70 border border-transparent hover:border-sky-100 transition-colors cursor-pointer group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-800 group-hover:text-sky-700 truncate">{ev.title}</span>
                          <span className="text-[10px] text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded-md font-medium">
                            Personal
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>
                            {ev.startDate} at {ev.startTime}
                          </span>
                          {ev.location && <span>· {ev.location}</span>}
                        </p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}

                  {matchingSchoolEvents.map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => {
                        onSelectEvent?.(ev.id, true);
                        onClose();
                      }}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-sky-50/70 border border-transparent hover:border-sky-100 transition-colors cursor-pointer group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-800 group-hover:text-sky-700 truncate">{ev.title}</span>
                          <span className="text-[10px] text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded-md font-medium">
                            Official School
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>
                            {ev.startDate} · {ev.location}
                          </span>
                        </p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              </div>
            )}

          {matchingFiles.length === 0 &&
            matchingAnnouncements.length === 0 &&
            matchingPersonalEvents.length === 0 &&
            matchingSchoolEvents.length === 0 && (
              <div className="py-12 text-center">
                <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-600">No matching results found</p>
                <p className="text-xs text-slate-400 mt-1">Try searching with a different filename or keyword.</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
