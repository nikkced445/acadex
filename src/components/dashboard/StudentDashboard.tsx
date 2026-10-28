import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db, formatBytes } from '../../services/db';
import { Announcement, FileItem, PersonalEvent, SchoolEvent } from '../../types';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  FolderPlus,
  HardDrive,
  MapPin,
  Megaphone,
  MoreVertical,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  Video,
} from 'lucide-react';

interface StudentDashboardProps {
  onNavigate: (tab: string, subCategory?: string) => void;
  onOpenFileModal: (file: FileItem) => void;
  onOpenUploadModal: (category?: string) => void;
  onOpenCreateFolderModal: () => void;
  onOpenCreateEventModal: () => void;
  onOpenAnnouncementDetail: (announcement: Announcement) => void;
  onOpenSchoolEventDetail: (event: SchoolEvent) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onNavigate,
  onOpenFileModal,
  onOpenUploadModal,
  onOpenCreateFolderModal,
  onOpenCreateEventModal,
  onOpenAnnouncementDetail,
  onOpenSchoolEventDetail,
}) => {
  const { user } = useAuth();
  if (!user) return null;

  // Real database queries
  const storage = db.getStorageBreakdown(user.id);
  const allFiles = db.getFiles(user.id, false);
  const recentFiles = allFiles.slice(0, 5);
  const personalEvents = db.getPersonalEvents(user.id);
  const upcomingPersonal = personalEvents.filter((e) => !e.isCompleted).slice(0, 3);
  const publishedAnnouncements = db.getAnnouncements(true).slice(0, 3);
  const publishedSchoolEvents = db.getSchoolEvents(true).slice(0, 3);

  // Dynamic greeting based on current time
  const currentHour = new Date().getHours();
  const timeGreeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = (user.displayName || user.fullName).split(' ')[0];

  // Helper for file type icons
  const renderFileIcon = (file: FileItem) => {
    switch (file.category) {
      case 'video':
        return <Video className="w-5 h-5 text-purple-600" />;
      case 'image':
        return <FileImage className="w-5 h-5 text-emerald-600" />;
      case 'document':
        if (file.extension === 'xlsx' || file.extension === 'xls' || file.extension === 'csv') {
          return <FileSpreadsheet className="w-5 h-5 text-emerald-700" />;
        }
        return <FileText className="w-5 h-5 text-sky-600" />;
      default:
        return <FileCode className="w-5 h-5 text-slate-600" />;
    }
  };

  // Mini calendar generator for current month
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Map of dates with events
  const eventDays = new Set<number>();
  const schoolEventDays = new Set<number>();

  personalEvents.forEach((ev) => {
    const d = new Date(ev.startDate);
    if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
      eventDays.add(d.getDate());
    }
  });

  publishedSchoolEvents.forEach((ev) => {
    const d = new Date(ev.startDate);
    if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
      schoolEventDays.add(d.getDate());
    }
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* SECTION A: Welcome Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 p-6 sm:p-8 text-white shadow-sm overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-sky-100 text-xs font-medium mb-2">
              <Sparkles className="w-3.5 h-3.5 text-sky-200" />
              <span>Fall Semester 2026 Academic Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {timeGreeting}, {firstName}!
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-sky-100/90 max-w-2xl leading-relaxed">
              Your centralized cloud storage has {formatBytes(storage.availableBytes)} available space. You have{' '}
              {upcomingPersonal.length} upcoming tasks and {publishedAnnouncements.length} school advisories today.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onOpenUploadModal()}
              className="flex items-center gap-2 px-4 py-2 bg-white text-sky-700 hover:bg-sky-50 text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Files</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('calendar')}
              className="flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/20 text-white text-xs font-semibold rounded-xl backdrop-blur-xs transition-colors"
            >
              <Calendar className="w-4 h-4" />
              <span>Open Calendar</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION B: Quick Action Cards */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            type="button"
            onClick={() => onOpenUploadModal('document')}
            className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs hover:border-sky-300 hover:shadow-xs transition-all text-left flex flex-col justify-between group"
          >
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-800 group-hover:text-sky-600">Upload File</span>
            <span className="text-[10px] text-slate-400">PDF, Word, Excel</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenUploadModal('video')}
            className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs hover:border-sky-300 hover:shadow-xs transition-all text-left flex flex-col justify-between group"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Video className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-800 group-hover:text-purple-600">Upload Video</span>
            <span className="text-[10px] text-slate-400">MP4, WebM clips</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenUploadModal('image')}
            className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs hover:border-sky-300 hover:shadow-xs transition-all text-left flex flex-col justify-between group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <FileImage className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-600">Upload Image</span>
            <span className="text-[10px] text-slate-400">PNG, JPG, Photos</span>
          </button>

          <button
            type="button"
            onClick={onOpenCreateFolderModal}
            className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs hover:border-sky-300 hover:shadow-xs transition-all text-left flex flex-col justify-between group"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <FolderPlus className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-800 group-hover:text-amber-600">New Folder</span>
            <span className="text-[10px] text-slate-400">Organize subjects</span>
          </button>

          <button
            type="button"
            onClick={onOpenCreateEventModal}
            className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs hover:border-sky-300 hover:shadow-xs transition-all text-left flex flex-col justify-between group"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-800 group-hover:text-rose-600">Create Event</span>
            <span className="text-[10px] text-slate-400">Exams & Deadlines</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('announcements')}
            className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs hover:border-sky-300 hover:shadow-xs transition-all text-left flex flex-col justify-between group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Megaphone className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-600">Announcements</span>
            <span className="text-[10px] text-slate-400">Campus advisories</span>
          </button>
        </div>
      </div>

      {/* 2-COLUMN SPLIT: Left (Storage & Recent Files) / Right (Events & Announcements & Mini-Calendar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Storage & Recent Files (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* SECTION C: Storage Overview */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Student Cloud Storage</h3>
                  <p className="text-[11px] text-slate-400">Quota calculated in real-time from active files</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('storage')}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
              >
                <span>Manage</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Storage Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                  {formatBytes(storage.usedBytes)}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {storage.percentageUsed}% of {formatBytes(storage.totalBytes)} capacity
                </span>
              </div>

              {/* Segmented Breakdown Bar */}
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
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
                  style={{
                    width: `${((storage.audioBytes + storage.archivesBytes + storage.othersBytes) / (storage.totalBytes || 1)) * 100}%`,
                  }}
                  className="bg-amber-500 h-full"
                  title={`Other: ${formatBytes(storage.audioBytes + storage.archivesBytes + storage.othersBytes)}`}
                />
              </div>

              {/* Breakdown Legend (Unboxed, Anti-Slop) */}
              <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
                  <span className="text-slate-600 truncate">Docs:</span>
                  <span className="font-mono text-slate-900 ml-auto font-medium">{formatBytes(storage.documentsBytes)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                  <span className="text-slate-600 truncate">Videos:</span>
                  <span className="font-mono text-slate-900 ml-auto font-medium">{formatBytes(storage.videosBytes)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-slate-600 truncate">Images:</span>
                  <span className="font-mono text-slate-900 ml-auto font-medium">{formatBytes(storage.imagesBytes)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-slate-600 truncate">Other:</span>
                  <span className="font-mono text-slate-900 ml-auto font-medium">
                    {formatBytes(storage.audioBytes + storage.archivesBytes + storage.othersBytes)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION D: Recent Files */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent Files</h3>
                <p className="text-[11px] text-slate-400">Recently uploaded academic documents & lecture recordings</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('files')}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
              >
                <span>View All ({allFiles.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentFiles.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-600">No files uploaded yet</p>
                <button
                  type="button"
                  onClick={() => onOpenUploadModal()}
                  className="mt-2 text-xs text-sky-600 font-semibold hover:underline"
                >
                  Upload your first file
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentFiles.map((file) => (
                  <div
                    key={file.id}
                    onClick={() => onOpenFileModal(file)}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 rounded-xl px-2.5 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-white shrink-0">
                        {renderFileIcon(file)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-sky-700">
                          {file.name}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {formatBytes(file.fileSize)} · {new Date(file.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenFileModal(file);
                        }}
                        className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-white rounded-lg shadow-2xs"
                        title="Preview"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Announcements, Events & Calendar (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* SECTION F: School Announcements */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Megaphone className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">School Announcements</h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('announcements')}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700"
              >
                See All
              </button>
            </div>

            <div className="space-y-2.5">
              {publishedAnnouncements.map((ann) => (
                <div
                  key={ann.id}
                  onClick={() => onOpenAnnouncementDetail(ann)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    ann.priority === 'Urgent'
                      ? 'bg-rose-50/60 border-rose-200 hover:bg-rose-50'
                      : ann.priority === 'Important'
                      ? 'bg-amber-50/60 border-amber-200 hover:bg-amber-50'
                      : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span
                      className={`text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded-sm ${
                        ann.priority === 'Urgent'
                          ? 'bg-rose-100 text-rose-700'
                          : ann.priority === 'Important'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {ann.priority}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {ann.publishedAt ? new Date(ann.publishedAt).toLocaleDateString() : 'Draft'}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900 line-clamp-1">{ann.title}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">{ann.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION E & G: Upcoming Personal & School Events */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Upcoming Schedule</h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('calendar')}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700"
              >
                Calendar
              </button>
            </div>

            <div className="space-y-2.5">
              {/* Personal Events */}
              {upcomingPersonal.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => onNavigate('events')}
                  className="p-3 rounded-xl bg-slate-50/80 hover:bg-sky-50/60 border border-slate-200/80 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-sky-700 font-semibold uppercase tracking-wider">
                      My Event · {ev.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {ev.startDate}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-900 mt-0.5 truncate">{ev.title}</p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1 font-mono">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{ev.startTime} - {ev.endTime}</span>
                    {ev.location && <span className="truncate">· {ev.location}</span>}
                  </p>
                </div>
              ))}

              {/* School Events */}
              {publishedSchoolEvents.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => onOpenSchoolEventDetail(ev)}
                  className="p-3 rounded-xl bg-blue-50/50 hover:bg-blue-50 border border-blue-200/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-blue-800 font-bold uppercase tracking-wider">
                      School Event · {ev.category}
                    </span>
                    <span className="text-[10px] text-blue-600 font-mono">
                      {ev.startDate}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-900 mt-0.5 truncate">{ev.title}</p>
                  <p className="text-[11px] text-slate-600 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-blue-500" />
                    <span className="truncate">{ev.location}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION H: Quick Calendar Preview */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-800">
                {monthNames[currentMonth]} {currentYear}
              </span>
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-sky-500" /> My
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-700" /> School
                </span>
              </div>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-400 mb-1">
              <span>Su</span>
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="h-7" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isToday = day === today.getDate();
                const hasPersonal = eventDays.has(day);
                const hasSchool = schoolEventDays.has(day);

                return (
                  <button
                    key={`day-${day}`}
                    type="button"
                    onClick={() => onNavigate('calendar')}
                    className={`h-7 rounded-lg flex flex-col items-center justify-center relative font-mono transition-colors hover:bg-sky-50 ${
                      isToday
                        ? 'bg-sky-600 text-white font-bold'
                        : 'text-slate-700 hover:text-sky-700'
                    }`}
                  >
                    <span>{day}</span>
                    {/* Event indicators */}
                    <div className="flex gap-0.5 absolute bottom-0.5">
                      {hasPersonal && (
                        <span className={`w-1 h-1 rounded-full ${isToday ? 'bg-white' : 'bg-sky-500'}`} />
                      )}
                      {hasSchool && (
                        <span className={`w-1 h-1 rounded-full ${isToday ? 'bg-sky-200' : 'bg-blue-700'}`} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
