import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db, formatBytes } from '../../services/db';
import {
  Announcement,
  AnnouncementPriority,
  PublicationStatus,
  SchoolEvent,
  SchoolEventCategory,
  User,
} from '../../types';
import { AnnouncementAnalyticsModal } from './AnnouncementAnalyticsModal';
import { AnnouncementEditorModal } from './AnnouncementEditorModal';
import {
  AlertCircle,
  AlertTriangle,
  Archive,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Database,
  Edit2,
  Eye,
  FileText,
  GraduationCap,
  HardDrive,
  Layers,
  Lock,
  Megaphone,
  Pin,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';

const SCHOOL_EVENT_CATEGORIES: SchoolEventCategory[] = [
  'Academic Deadline',
  'Examination Schedule',
  'School Activity',
  'Seminar & Workshop',
  'Holiday',
];

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  if (!user || user.role !== 'admin') {
    return (
      <div className="p-8 text-center max-w-md mx-auto my-12 bg-white rounded-2xl border border-rose-200 p-6 shadow-sm">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          The Administrator Console is restricted to authorized faculty and academic directors.
        </p>
      </div>
    );
  }

  // Active sub-tab in Admin Console: 'overview' | 'announcements' | 'events' | 'students' | 'settings' | 'logs'
  const [adminTab, setAdminTab] = useState<'overview' | 'announcements' | 'events' | 'students' | 'settings' | 'logs'>('overview');
  const [refresher, setRefresher] = useState(0);

  // Announcement Filters
  const [annSearchQuery, setAnnSearchQuery] = useState('');
  const [annStatusFilter, setAnnStatusFilter] = useState<'all' | PublicationStatus>('all');
  const [annPriorityFilter, setAnnPriorityFilter] = useState<'all' | AnnouncementPriority>('all');

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [analyticsAnnouncement, setAnalyticsAnnouncement] = useState<Announcement | null>(null);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);

  // School Event Modal State
  const [isSchoolEvModalOpen, setIsSchoolEvModalOpen] = useState(false);
  const [editingSchoolEv, setEditingSchoolEv] = useState<SchoolEvent | null>(null);
  const [evTitle, setEvTitle] = useState('');
  const [evDescription, setEvDescription] = useState('');
  const [evCategory, setEvCategory] = useState<SchoolEventCategory>('Academic Deadline');
  const [evStartDate, setEvStartDate] = useState('');
  const [evStartTime, setEvStartTime] = useState('08:00');
  const [evEndDate, setEvEndDate] = useState('');
  const [evEndTime, setEvEndTime] = useState('17:00');
  const [evLocation, setEvLocation] = useState('');
  const [evRegistrationLink, setEvRegistrationLink] = useState('');

  // Edit Quota Modal
  const [editingUserQuota, setEditingUserQuota] = useState<User | null>(null);
  const [newQuotaGB, setNewQuotaGB] = useState(5);

  // Queries
  const allUsers = db.getUsers();
  const students = allUsers.filter((u) => u.role === 'student');
  const announcements = db.getAnnouncements(false);
  const schoolEvents = db.getSchoolEvents(false);
  const { count: totalFilesCount, totalBytes: totalFilesBytes } = db.getAllFilesCountAndSize();
  const auditLogs = db.getAuditLogs();
  const config = db.getConfig();

  // Metrics calculation
  const publishedCount = announcements.filter((a) => a.publicationStatus === 'published').length;
  const draftCount = announcements.filter((a) => a.publicationStatus === 'draft').length;
  const scheduledCount = announcements.filter((a) => a.publicationStatus === 'scheduled').length;
  const archivedCount = announcements.filter((a) => a.publicationStatus === 'archived').length;
  const totalReads = announcements.reduce((acc, a) => acc + (a.readByUserIds?.length || 0), 0);
  const totalAcks = announcements.reduce((acc, a) => acc + (a.acknowledgedByUserIds?.length || 0), 0);

  // Filtered Announcements
  const filteredAnnouncements = announcements.filter((ann) => {
    if (annStatusFilter !== 'all' && ann.publicationStatus !== annStatusFilter) return false;
    if (annPriorityFilter !== 'all' && ann.priority !== annPriorityFilter) return false;
    if (annSearchQuery.trim()) {
      const q = annSearchQuery.toLowerCase();
      return (
        ann.title.toLowerCase().includes(q) ||
        ann.content.toLowerCase().includes(q) ||
        ann.category.toLowerCase().includes(q) ||
        ann.authorName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Action Handlers
  const handleTogglePublish = (ann: Announcement) => {
    if (ann.publicationStatus === 'published') {
      db.unpublishAnnouncement(ann.id, user.fullName);
    } else {
      db.updateAnnouncement(ann.id, { publicationStatus: 'published', publishedAt: new Date().toISOString() }, user.fullName);
    }
    setRefresher((r) => r + 1);
  };

  const handleToggleArchive = (ann: Announcement) => {
    if (ann.publicationStatus === 'archived') {
      db.restoreAnnouncement(ann.id, user.fullName);
    } else {
      db.archiveAnnouncement(ann.id, user.fullName);
    }
    setRefresher((r) => r + 1);
  };

  const confirmDeleteAnnouncement = () => {
    if (!announcementToDelete) return;
    db.deleteAnnouncement(announcementToDelete.id, user.fullName);
    setAnnouncementToDelete(null);
    setRefresher((r) => r + 1);
  };

  // School Events Handlers
  const handleOpenAddSchoolEv = () => {
    setEditingSchoolEv(null);
    setEvTitle('');
    setEvDescription('');
    setEvCategory('Academic Deadline');
    const today = new Date().toISOString().split('T')[0];
    setEvStartDate(today);
    setEvEndDate(today);
    setEvStartTime('08:00');
    setEvEndTime('17:00');
    setEvLocation('Main Campus');
    setEvRegistrationLink('');
    setIsSchoolEvModalOpen(true);
  };

  const handleOpenEditSchoolEv = (ev: SchoolEvent) => {
    setEditingSchoolEv(ev);
    setEvTitle(ev.title);
    setEvDescription(ev.description);
    setEvCategory(ev.category);
    setEvStartDate(ev.startDate);
    setEvEndDate(ev.endDate);
    setEvStartTime(ev.startTime);
    setEvEndTime(ev.endTime);
    setEvLocation(ev.location);
    setEvRegistrationLink(ev.registrationLink || '');
    setIsSchoolEvModalOpen(true);
  };

  const handleSaveSchoolEv = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evTitle.trim() || !evStartDate) return;

    if (editingSchoolEv) {
      db.updateSchoolEvent(
        editingSchoolEv.id,
        {
          title: evTitle.trim(),
          description: evDescription.trim(),
          category: evCategory,
          startDate: evStartDate,
          startTime: evStartTime,
          endDate: evEndDate || evStartDate,
          endTime: evEndTime,
          location: evLocation.trim(),
          registrationLink: evRegistrationLink.trim() || null,
        },
        user.fullName
      );
    } else {
      db.addSchoolEvent(
        {
          title: evTitle.trim(),
          description: evDescription.trim(),
          category: evCategory,
          startDate: evStartDate,
          startTime: evStartTime,
          endDate: evEndDate || evStartDate,
          endTime: evEndTime,
          location: evLocation.trim(),
          publicationStatus: 'published',
          authorAdminId: user.id,
          registrationLink: evRegistrationLink.trim() || null,
        },
        user.fullName
      );
    }

    setIsSchoolEvModalOpen(false);
    setRefresher((r) => r + 1);
  };

  const handleDeleteSchoolEv = (id: string, titleStr: string) => {
    if (confirm(`Delete official school event "${titleStr}"?`)) {
      db.deleteSchoolEvent(id, user.fullName);
      setRefresher((r) => r + 1);
    }
  };

  const handleSaveQuota = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserQuota) return;
    const bytes = newQuotaGB * 1024 * 1024 * 1024;
    db.updateUser(editingUserQuota.id, { storageQuotaBytes: bytes });
    db.addAuditLog(user.fullName, 'Adjusted Student Quota', `${editingUserQuota.fullName} to ${newQuotaGB} GB`);
    setEditingUserQuota(null);
    setRefresher((r) => r + 1);
  };

  const handleToggleStudentStatus = (student: User) => {
    const nextStatus = student.status === 'active' ? 'suspended' : 'active';
    db.updateUser(student.id, { status: nextStatus });
    db.addAuditLog(user.fullName, `${nextStatus === 'active' ? 'Activated' : 'Suspended'} Student Account`, student.fullName);
    setRefresher((r) => r + 1);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Administrator Console</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 flex items-center gap-1">
              <Shield className="w-3 h-3 text-sky-600" /> Academic Director Access
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Centralized notification hub, campus advisory broadcasting, student cohort targeting, and university event management.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingAnnouncement(null);
            setIsEditorOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-2xs hover:shadow-xs transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Announcement</span>
        </button>
      </div>

      {/* Admin Sub Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs text-xs">
        <button
          onClick={() => setAdminTab('overview')}
          className={`px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
            adminTab === 'overview' ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Overview & Metrics
        </button>
        <button
          onClick={() => setAdminTab('announcements')}
          className={`px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
            adminTab === 'announcements' ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Announcement Management ({announcements.length})
        </button>
        <button
          onClick={() => setAdminTab('events')}
          className={`px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
            adminTab === 'events' ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          School Events ({schoolEvents.length})
        </button>
        <button
          onClick={() => setAdminTab('students')}
          className={`px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
            adminTab === 'students' ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Student Directory ({students.length})
        </button>
        <button
          onClick={() => setAdminTab('settings')}
          className={`px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
            adminTab === 'settings' ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Storage Quotas & Policy
        </button>
        <button
          onClick={() => setAdminTab('logs')}
          className={`px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
            adminTab === 'logs' ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* SECTION A: OVERVIEW */}
      {adminTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Registered Students
              </span>
              <p className="text-2xl font-extrabold font-mono text-slate-900 tabular-nums mt-1">
                {students.length}
              </p>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Verified accounts</span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Published Notices
              </span>
              <p className="text-2xl font-extrabold font-mono text-emerald-600 tabular-nums mt-1">
                {publishedCount}
              </p>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Active on feeds</span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Drafts
              </span>
              <p className="text-2xl font-extrabold font-mono text-slate-600 tabular-nums mt-1">
                {draftCount}
              </p>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">In review</span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Scheduled
              </span>
              <p className="text-2xl font-extrabold font-mono text-sky-600 tabular-nums mt-1">
                {scheduledCount}
              </p>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Upcoming broadcast</span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Archived
              </span>
              <p className="text-2xl font-extrabold font-mono text-amber-600 tabular-nums mt-1">
                {archivedCount}
              </p>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Archived history</span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Total Reads
              </span>
              <p className="text-2xl font-extrabold font-mono text-purple-600 tabular-nums mt-1">
                {totalReads}
              </p>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{totalAcks} acknowledged</span>
            </div>
          </div>

          {/* Quick Actions Strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Broadcast New Announcement</h3>
                <p className="text-xs text-slate-400">Target whole campus, specific cohorts, or individual students.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingAnnouncement(null);
                  setIsEditorOpen(true);
                }}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-2xs"
              >
                + Create Notice
              </button>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Schedule School Event</h3>
                <p className="text-xs text-slate-400">Publish exam dates, seminar workshops, and campus holidays.</p>
              </div>
              <button
                type="button"
                onClick={handleOpenAddSchoolEv}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-2xs"
              >
                + Schedule Event
              </button>
            </div>
          </div>

          {/* Recent Administrative Activity Log */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Recent Administrative Activity</h3>
              <button
                type="button"
                onClick={() => setAdminTab('logs')}
                className="text-xs font-semibold text-sky-600 hover:underline"
              >
                View all logs
              </button>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {auditLogs.slice(0, 6).map((log) => (
                <div key={log.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-800">{log.adminName}</span>
                    <span className="text-slate-400 mx-1.5">·</span>
                    <span className="text-slate-600 font-medium">{log.action}:</span>{' '}
                    <span className="text-slate-500 truncate">{log.target}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ·{' '}
                    {new Date(log.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION B: ANNOUNCEMENT MANAGEMENT TABLE */}
      {adminTab === 'announcements' && (
        <div className="space-y-4">
          {/* Controls: Search, Status Filter, Priority Filter */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
                {(['all', 'published', 'draft', 'scheduled', 'unpublished', 'archived'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setAnnStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors capitalize ${
                      annStatusFilter === st
                        ? 'bg-sky-50 text-sky-700 font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st === 'all' ? 'All Status' : st}
                  </button>
                ))}
              </div>

              {/* Priority Filter & Search */}
              <div className="flex items-center gap-2">
                <select
                  value={annPriorityFilter}
                  onChange={(e) => setAnnPriorityFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden"
                >
                  <option value="all">All Priorities</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Important">Important</option>
                  <option value="Normal">Normal</option>
                </select>

                <div className="relative flex-1 sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search announcements..."
                    value={annSearchQuery}
                    onChange={(e) => setAnnSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Announcements Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            {filteredAnnouncements.length === 0 ? (
              <div className="py-16 text-center p-6 text-slate-400">
                <Megaphone className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-semibold text-slate-700">No announcements match filter criteria</p>
                <p className="text-xs text-slate-400 mt-1">Try clearing filters or create a new announcement.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Title & Category</th>
                    <th className="py-3 px-4 hidden md:table-cell">Target Audience</th>
                    <th className="py-3 px-4">Priority & Delivery</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Read / Confirmed</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredAnnouncements.map((ann) => (
                    <tr key={ann.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Title & Category */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {ann.isPinned && (
                              <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                <Pin className="w-2.5 h-2.5 fill-sky-600" /> Pinned
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-medium">
                              {ann.category}
                            </span>
                            {ann.versionNumber > 1 && (
                              <span className="text-[10px] text-slate-400 font-mono">v{ann.versionNumber}</span>
                            )}
                          </div>
                          <p className="font-bold text-slate-900 truncate leading-snug">{ann.title}</p>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">
                            By {ann.authorName} · {ann.publishedAt ? new Date(ann.publishedAt).toLocaleDateString() : 'Unpublished'}
                          </p>
                        </div>
                      </td>

                      {/* Target Audience */}
                      <td className="py-3 px-4 hidden md:table-cell">
                        <span className="text-slate-800 font-medium capitalize block">
                          {ann.targetType}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate block max-w-xs font-mono">
                          {ann.targetType === 'everyone'
                            ? 'All Registered Students'
                            : ann.targetType === 'groups'
                            ? ann.targetGroups?.join(', ')
                            : `${ann.targetUserIds?.length || 0} Individual Student(s)`}
                        </span>
                      </td>

                      {/* Priority & Delivery */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md inline-block ${
                              ann.priority === 'Urgent'
                                ? 'bg-rose-100 text-rose-700'
                                : ann.priority === 'Important'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {ann.priority}
                          </span>
                          <span className="text-[10px] text-slate-400 block capitalize font-mono">
                            Method: {ann.displayMethod}
                          </span>
                        </div>
                      </td>

                      {/* Publication Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md inline-block ${
                            ann.publicationStatus === 'published'
                              ? 'bg-emerald-50 text-emerald-700'
                              : ann.publicationStatus === 'scheduled'
                              ? 'bg-sky-50 text-sky-700'
                              : ann.publicationStatus === 'draft'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {ann.publicationStatus}
                        </span>
                        {ann.scheduledAt && ann.publicationStatus === 'scheduled' && (
                          <span className="text-[10px] text-sky-600 block font-mono mt-0.5">
                            {new Date(ann.scheduledAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        )}
                      </td>

                      {/* Read & Acknowledged Count */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setAnalyticsAnnouncement(ann)}
                          className="group inline-flex flex-col items-center cursor-pointer p-1 rounded-lg hover:bg-slate-100"
                          title="View readership details"
                        >
                          <span className="font-mono font-bold text-slate-800 group-hover:text-sky-600 tabular-nums">
                            {ann.readByUserIds?.length || 0} read
                          </span>
                          {ann.requireAcknowledgment && (
                            <span className="text-[10px] text-emerald-600 font-mono">
                              {ann.acknowledgedByUserIds?.length || 0} signed
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setAnalyticsAnnouncement(ann)}
                            className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Readership & Acknowledgment Audit"
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingAnnouncement(ann);
                              setIsEditorOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit & Update"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Publish / Unpublish Toggle */}
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(ann)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              ann.publicationStatus === 'published'
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={ann.publicationStatus === 'published' ? 'Unpublish from students' : 'Publish to students'}
                          >
                            {ann.publicationStatus === 'published' ? (
                              <RotateCcw className="w-3.5 h-3.5" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Archive / Restore Toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleArchive(ann)}
                            className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                            title={ann.publicationStatus === 'archived' ? 'Restore archived notice' : 'Archive notice'}
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>

                          {/* Permanent Delete */}
                          <button
                            type="button"
                            onClick={() => setAnnouncementToDelete(ann)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Permanently Delete Announcement"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SCHOOL EVENTS MANAGEMENT */}
      {adminTab === 'events' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Official School Events & Academic Dates</h2>
            <button
              onClick={handleOpenAddSchoolEv}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule School Event</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs divide-y divide-slate-100 overflow-hidden">
            {schoolEvents.map((ev) => (
              <div key={ev.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                      {ev.category}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {ev.startDate} · {ev.startTime} - {ev.endTime}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 truncate">{ev.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{ev.description}</p>
                  <p className="text-[11px] text-slate-400 mt-1">📍 {ev.location}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenEditSchoolEv(ev)}
                    className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteSchoolEv(ev.id, ev.title)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: STUDENT DIRECTORY */}
      {adminTab === 'students' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Enrolled Students Directory</h2>
            <p className="text-xs text-slate-400">
              Manage student quotas and account statuses. Student private files remain confidential.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Program & ID</th>
                  <th className="py-3 px-4 font-mono">Quota</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={student.profilePictureUrl}
                          alt={student.fullName}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="font-semibold text-slate-900">{student.fullName}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-slate-800 font-medium">{student.course || 'Undergraduate'}</p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {student.studentId || 'No ID'} · {student.yearLevel || '1st Year'}
                      </p>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums font-semibold text-slate-700">
                      {formatBytes(student.storageQuotaBytes)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          student.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingUserQuota(student);
                            setNewQuotaGB(Math.round(student.storageQuotaBytes / (1024 * 1024 * 1024)));
                          }}
                          className="px-2.5 py-1 text-xs text-sky-700 hover:bg-sky-50 rounded-lg font-medium border border-sky-200"
                        >
                          Edit Quota
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStudentStatus(student)}
                          className={`px-2.5 py-1 text-xs rounded-lg font-medium border ${
                            student.status === 'active'
                              ? 'text-red-600 hover:bg-red-50 border-red-200'
                              : 'text-emerald-700 hover:bg-emerald-50 border-emerald-200'
                          }`}
                        >
                          {student.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: STORAGE QUOTAS & POLICY */}
      {adminTab === 'settings' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-5 max-w-2xl">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Institution Default Storage Quota</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Set the default cloud capacity assigned to new student Google account registrations.
            </p>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-3">
              {[5, 10, 15, 25].map((gb) => {
                const bytes = gb * 1024 * 1024 * 1024;
                const isCurrent = config.defaultQuotaBytes === bytes;

                return (
                  <button
                    key={gb}
                    type="button"
                    onClick={() => {
                      db.updateConfig({ defaultQuotaBytes: bytes }, user.fullName);
                      setRefresher((r) => r + 1);
                    }}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      isCurrent
                        ? 'bg-sky-50 border-sky-500 ring-2 ring-sky-500/20 font-bold text-sky-800'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <span className="text-base font-mono">{gb} GB</span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">Per Student</span>
                  </button>
                );
              })}
            </div>

            <div className="p-3.5 bg-sky-50/70 border border-sky-100 rounded-xl text-xs text-sky-900 leading-relaxed">
              <strong>Current Policy:</strong> New students receive{' '}
              <span className="font-mono font-bold">{formatBytes(config.defaultQuotaBytes)}</span> free cloud storage
              for lecture documents, video submissions, and research materials.
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT LOGS */}
      {adminTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs divide-y divide-slate-100 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Administrative Audit Trail</h3>
            <span className="text-[11px] text-slate-400 font-mono">Immutable Log Ledger</span>
          </div>
          {auditLogs.map((log) => (
            <div key={log.id} className="p-4 flex items-center justify-between gap-4 text-xs">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{log.adminName}</span>
                  <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">
                    {log.action}
                  </span>
                </div>
                <p className="text-slate-600 mt-0.5 truncate">{log.target}</p>
              </div>
              <span className="font-mono text-[11px] text-slate-400 whitespace-nowrap">
                {new Date(log.timestamp).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ANNOUNCEMENT EDITOR MODAL */}
      <AnnouncementEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingAnnouncement(null);
        }}
        announcementToEdit={editingAnnouncement}
        onSaved={() => setRefresher((r) => r + 1)}
        currentAdmin={user}
      />

      {/* ANNOUNCEMENT ANALYTICS & READERSHIP MODAL */}
      <AnnouncementAnalyticsModal
        announcement={analyticsAnnouncement}
        onClose={() => setAnalyticsAnnouncement(null)}
      />

      {/* DESTRUCTIVE CONFIRMATION MODAL */}
      {announcementToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Permanently Delete Announcement?</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              This will permanently remove "<strong>{announcementToDelete.title}</strong>" from all student dashboards,
              notification feeds, and pop-up queues. Related delivery audit records will be retained.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAnnouncementToDelete(null)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteAnnouncement}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs shadow-xs"
              >
                Yes, Delete Notice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCHOOL EVENT CREATE / EDIT MODAL */}
      {isSchoolEvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingSchoolEv ? 'Edit School Event' : 'Schedule School-Wide Academic Event'}
              </h3>
              <button onClick={() => setIsSchoolEvModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSchoolEv} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={evTitle}
                  onChange={(e) => setEvTitle(e.target.value)}
                  placeholder="e.g. University Midterm Examination Week"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={evDescription}
                  onChange={(e) => setEvDescription(e.target.value)}
                  placeholder="Institutional guidelines, room details, participant qualifications..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Event Category</label>
                  <select
                    value={evCategory}
                    onChange={(e) => setEvCategory(e.target.value as SchoolEventCategory)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white"
                  >
                    {SCHOOL_EVENT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Venue / Location</label>
                  <input
                    type="text"
                    value={evLocation}
                    onChange={(e) => setEvLocation(e.target.value)}
                    placeholder="e.g. Main Auditorium Magna"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={evStartDate}
                    onChange={(e) => {
                      setEvStartDate(e.target.value);
                      if (!evEndDate) setEvEndDate(e.target.value);
                    }}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={evEndDate}
                    onChange={(e) => setEvEndDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Registration Portal Link (Optional)</label>
                <input
                  type="url"
                  value={evRegistrationLink}
                  onChange={(e) => setEvRegistrationLink(e.target.value)}
                  placeholder="https://university.edu/events/register"
                  className="w-full px-3.5 py-1.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSchoolEvModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!evTitle.trim() || !evStartDate}
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-xl shadow-xs disabled:opacity-50"
                >
                  {editingSchoolEv ? 'Save Changes' : 'Schedule Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STUDENT QUOTA MODAL */}
      {editingUserQuota && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Adjust Storage Quota for {editingUserQuota.fullName}
            </h3>
            <p className="text-xs text-slate-400 mb-4 font-mono">{editingUserQuota.email}</p>

            <form onSubmit={handleSaveQuota} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Capacity (in GB)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newQuotaGB}
                  onChange={(e) => setNewQuotaGB(parseInt(e.target.value) || 5)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUserQuota(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl shadow-xs"
                >
                  Update Quota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
