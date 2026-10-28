import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db, formatBytes } from '../../services/db';
import { Announcement, AnnouncementPriority } from '../../types';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  Filter,
  Megaphone,
  Pin,
  Search,
  Shield,
  User,
  X,
} from 'lucide-react';

export const AnnouncementsView: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | AnnouncementPriority>('all');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  const announcements = db.getAnnouncements(true);

  const filteredAnnouncements = announcements.filter((ann) => {
    if (priorityFilter !== 'all' && ann.priority !== priorityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        ann.title.toLowerCase().includes(q) ||
        ann.content.toLowerCase().includes(q) ||
        ann.authorName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleToggleRead = (ann: Announcement) => {
    db.toggleAnnouncementRead(ann.id, user.id);
    setSelectedAnnouncement(null); // refresh
  };

  const handleDownloadAttachment = (ann: Announcement) => {
    if (!ann.attachmentName) return;
    const blob = new Blob(
      [
        `--- University Official Advisory Attachment ---\nTitle: ${ann.title}\nAuthor: ${ann.authorName} (${ann.authorRole})\nPublished: ${ann.publishedAt}\n\n[Official University Document Verified by Academic Directorate]`,
      ],
      { type: 'application/pdf' }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = ann.attachmentName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">School Announcements</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Official</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Institutional advisories, academic schedules, exam protocols, and campus guidelines from the administration.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Priority filter buttons */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <button
              onClick={() => setPriorityFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                priorityFilter === 'all' ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Priorities
            </button>
            <button
              onClick={() => setPriorityFilter('Urgent')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                priorityFilter === 'Urgent'
                  ? 'bg-rose-50 text-rose-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Urgent
            </button>
            <button
              onClick={() => setPriorityFilter('Important')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                priorityFilter === 'Important'
                  ? 'bg-amber-50 text-amber-800 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Important
            </button>
            <button
              onClick={() => setPriorityFilter('Normal')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                priorityFilter === 'Normal'
                  ? 'bg-sky-50 text-sky-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Normal
            </button>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Announcements List */}
      {filteredAnnouncements.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-8">
          <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-800 mb-1">No Announcements Found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            There are currently no active announcements matching your filter criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((ann) => {
            const isRead = ann.readByUserIds?.includes(user.id);

            return (
              <div
                key={ann.id}
                onClick={() => setSelectedAnnouncement(ann)}
                className={`bg-white rounded-2xl p-5 sm:p-6 border shadow-2xs hover:shadow-xs transition-all cursor-pointer group ${
                  ann.isPinned
                    ? 'border-sky-300 bg-gradient-to-r from-sky-50/30 to-white'
                    : 'border-slate-200/80 hover:border-sky-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Badges strip (Unboxed anti-slop) */}
                    <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
                      {ann.isPinned && (
                        <span className="flex items-center gap-1 font-bold text-sky-700 bg-sky-100/80 px-2 py-0.5 rounded-md text-[11px]">
                          <Pin className="w-3 h-3 fill-sky-600 text-sky-600" /> Pinned
                        </span>
                      )}

                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          ann.priority === 'Urgent'
                            ? 'bg-rose-100 text-rose-700'
                            : ann.priority === 'Important'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {ann.priority}
                      </span>

                      <span className="text-slate-400 font-mono text-[11px]">
                        Published {ann.publishedAt ? new Date(ann.publishedAt).toLocaleDateString() : 'Draft'}
                      </span>

                      {isRead ? (
                        <span className="text-slate-400 text-[11px] flex items-center gap-1 ml-auto">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Read
                        </span>
                      ) : (
                        <span className="text-sky-600 text-[11px] font-semibold ml-auto">
                          ● Unread
                        </span>
                      )}
                    </div>

                    {/* Announcement Title */}
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                      {ann.title}
                    </h3>

                    {/* Body preview */}
                    <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed line-clamp-2">
                      {ann.content}
                    </p>

                    {/* Attachment and Author info */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Shield className="w-3.5 h-3.5 text-sky-600" />
                        <span className="font-semibold text-slate-800">{ann.authorName}</span>
                        <span>· {ann.authorRole}</span>
                      </div>

                      {ann.attachmentName && (
                        <div className="flex items-center gap-1.5 text-sky-600 bg-sky-50 px-2.5 py-1 rounded-lg">
                          <FileText className="w-3.5 h-3.5" />
                          <span className="font-medium truncate max-w-xs">{ann.attachmentName}</span>
                          {ann.attachmentSize && (
                            <span className="font-mono text-slate-400 text-[11px]">
                              ({formatBytes(ann.attachmentSize)})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ANNOUNCEMENT DETAIL MODAL */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      selectedAnnouncement.priority === 'Urgent'
                        ? 'bg-rose-100 text-rose-700'
                        : selectedAnnouncement.priority === 'Important'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {selectedAnnouncement.priority} Priority
                  </span>
                  {selectedAnnouncement.isPinned && (
                    <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Pin className="w-3 h-3 fill-sky-600" /> Pinned
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedAnnouncement(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                {selectedAnnouncement.title}
              </h2>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="font-semibold text-slate-800">{selectedAnnouncement.authorName}</span>
                <span>·</span>
                <span>{selectedAnnouncement.authorRole}</span>
                <span>·</span>
                <span className="font-mono">{selectedAnnouncement.publishedAt ? new Date(selectedAnnouncement.publishedAt).toLocaleString() : 'Draft'}</span>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {selectedAnnouncement.content}

              {/* Attachment Download Box */}
              {selectedAnnouncement.attachmentName && (
                <div className="p-4 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-lg bg-white border border-sky-200 text-sky-600 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {selectedAnnouncement.attachmentName}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Official Academic Advisory PDF
                        {selectedAnnouncement.attachmentSize &&
                          ` · ${formatBytes(selectedAnnouncement.attachmentSize)}`}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownloadAttachment(selectedAnnouncement)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleToggleRead(selectedAnnouncement)}
                className="text-xs font-semibold text-slate-600 hover:text-sky-600 transition-colors"
              >
                {selectedAnnouncement.readByUserIds?.includes(user.id)
                  ? 'Mark as unread'
                  : 'Mark as read'}
              </button>

              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
