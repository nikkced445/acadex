import React, { useState } from 'react';
import { db, formatBytes } from '../../services/db';
import {
  Announcement,
  AnnouncementCategory,
  AnnouncementDisplayMethod,
  AnnouncementPriority,
  AnnouncementTargetType,
  PublicationStatus,
  User,
} from '../../types';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bold,
  Check,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Heading,
  Image as ImageIcon,
  Info,
  Link,
  List,
  Pin,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  Users,
  X,
} from 'lucide-react';

interface AnnouncementEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcementToEdit?: Announcement | null;
  onSaved: () => void;
  currentAdmin: User;
}

const CATEGORIES: AnnouncementCategory[] = [
  'Academic Advisory',
  'Campus Maintenance',
  'Exam Clearance',
  'Event & Activity',
  'Emergency Notice',
  'General Info',
];

const AVAILABLE_GROUPS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  'BS in Computer Science',
  'BS in Information Technology',
  'BS in Computer Engineering',
];

export const AnnouncementEditorModal: React.FC<AnnouncementEditorModalProps> = ({
  isOpen,
  onClose,
  announcementToEdit,
  onSaved,
  currentAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  // Form Fields
  const [title, setTitle] = useState(announcementToEdit?.title || '');
  const [content, setContent] = useState(announcementToEdit?.content || '');
  const [category, setCategory] = useState<AnnouncementCategory>(announcementToEdit?.category || 'Academic Advisory');
  const [priority, setPriority] = useState<AnnouncementPriority>(announcementToEdit?.priority || 'Normal');
  const [displayMethod, setDisplayMethod] = useState<AnnouncementDisplayMethod>(announcementToEdit?.displayMethod || 'card');
  const [targetType, setTargetType] = useState<AnnouncementTargetType>(announcementToEdit?.targetType || 'everyone');
  const [targetUserIds, setTargetUserIds] = useState<string[]>(announcementToEdit?.targetUserIds || []);
  const [targetGroups, setTargetGroups] = useState<string[]>(announcementToEdit?.targetGroups || []);
  const [publicationStatus, setPublicationStatus] = useState<PublicationStatus>(announcementToEdit?.publicationStatus || 'published');
  const [scheduledAt, setScheduledAt] = useState<string>(announcementToEdit?.scheduledAt || '');
  const [expiresAt, setExpiresAt] = useState<string>(announcementToEdit?.expiresAt || '');
  const [isPinned, setIsPinned] = useState(announcementToEdit?.isPinned || false);
  const [requireAcknowledgment, setRequireAcknowledgment] = useState(announcementToEdit?.requireAcknowledgment || false);
  const [notifyOnUpdate, setNotifyOnUpdate] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState(announcementToEdit?.coverImageUrl || '');
  const [actionButtonLabel, setActionButtonLabel] = useState(announcementToEdit?.actionButtonLabel || '');
  const [actionButtonUrl, setActionButtonUrl] = useState(announcementToEdit?.actionButtonUrl || '');
  const [attachmentName, setAttachmentName] = useState(announcementToEdit?.attachmentName || '');

  // User search for targeted recipients
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const allStudents = db.getUsers().filter((u) => u.role === 'student');

  if (!isOpen) return null;

  const filteredStudents = allStudents.filter(
    (s) =>
      s.fullName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      (s.studentId && s.studentId.toLowerCase().includes(userSearchQuery.toLowerCase()))
  );

  const toggleTargetUser = (id: string) => {
    if (targetUserIds.includes(id)) {
      setTargetUserIds(targetUserIds.filter((uid) => uid !== id));
    } else {
      setTargetUserIds([...targetUserIds, id]);
    }
  };

  const toggleTargetGroup = (group: string) => {
    if (targetGroups.includes(group)) {
      setTargetGroups(targetGroups.filter((g) => g !== group));
    } else {
      setTargetGroups([...targetGroups, group]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const now = new Date().toISOString();
    let computedStatus = publicationStatus;
    if (scheduledAt && new Date(scheduledAt) > new Date()) {
      computedStatus = 'scheduled';
    }

    if (announcementToEdit) {
      db.updateAnnouncement(
        announcementToEdit.id,
        {
          title: title.trim(),
          content: content.trim(),
          category,
          priority,
          displayMethod,
          targetType,
          targetUserIds: targetType === 'users' ? targetUserIds : undefined,
          targetGroups: targetType === 'groups' ? targetGroups : undefined,
          publicationStatus: computedStatus,
          scheduledAt: scheduledAt || null,
          expiresAt: expiresAt || null,
          isPinned,
          requireAcknowledgment,
          notifyOnUpdate,
          coverImageUrl: coverImageUrl.trim() || null,
          actionButtonLabel: actionButtonLabel.trim() || null,
          actionButtonUrl: actionButtonUrl.trim() || null,
          attachmentName: attachmentName.trim() || null,
          attachmentUrl: attachmentName.trim() ? '#' : null,
          attachmentSize: attachmentName.trim() ? 850000 : null,
        },
        currentAdmin.fullName
      );
    } else {
      db.addAnnouncement(
        {
          title: title.trim(),
          content: content.trim(),
          category,
          authorName: currentAdmin.fullName,
          authorAdminId: currentAdmin.id,
          authorRole: currentAdmin.course || 'Academic Administrator',
          priority,
          displayMethod,
          targetType,
          targetUserIds: targetType === 'users' ? targetUserIds : undefined,
          targetGroups: targetType === 'groups' ? targetGroups : undefined,
          publicationStatus: computedStatus,
          publishedAt: computedStatus === 'published' ? now : null,
          scheduledAt: scheduledAt || null,
          expiresAt: expiresAt || null,
          isPinned,
          requireAcknowledgment,
          notifyOnUpdate,
          versionNumber: 1,
          coverImageUrl: coverImageUrl.trim() || null,
          actionButtonLabel: actionButtonLabel.trim() || null,
          actionButtonUrl: actionButtonUrl.trim() || null,
          attachmentName: attachmentName.trim() || null,
          attachmentUrl: attachmentName.trim() ? '#' : null,
          attachmentSize: attachmentName.trim() ? 850000 : null,
        },
        currentAdmin.fullName
      );
    }

    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with Mode Tabs */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {announcementToEdit ? 'Edit & Update Announcement' : 'Create Official School Announcement'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Author: {currentAdmin.fullName} ({currentAdmin.email})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab: Editor vs Preview */}
            <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  activeTab === 'editor' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Editor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1 ${
                  activeTab === 'preview' ? 'bg-white text-sky-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Student Preview</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {activeTab === 'editor' ? (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-700">
            {/* Title & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Announcement Title *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Schedule of University Midterm Examinations & Room Clearances"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Advisory Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as AnnouncementCategory)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Rich Content Area */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">Announcement Body & Notice *</label>
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <span>Supports paragraphs, lists, and links</span>
                </div>
              </div>
              <textarea
                rows={5}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write detailed institutional notice, exam room schedules, guidelines, instructions, or maintenance schedule..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 leading-relaxed font-sans"
              />
            </div>

            {/* Priority & Display Method & Publication Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as AnnouncementPriority)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="Normal">Normal</option>
                  <option value="Important">Important</option>
                  <option value="Urgent">Urgent (Red Alert)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Urgent notices appear with emergency indicators.</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Display Method</label>
                <select
                  value={displayMethod}
                  onChange={(e) => setDisplayMethod(e.target.value as AnnouncementDisplayMethod)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="card">Dashboard Card</option>
                  <option value="popup">Pop-up Dialog on Login</option>
                  <option value="banner">Important Header Banner</option>
                  <option value="bell">Notification Bell Only</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Controls how students encounter this notice.</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Publication Status</label>
                <select
                  value={publicationStatus}
                  onChange={(e) => setPublicationStatus(e.target.value as PublicationStatus)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="published">Published (Live to Students)</option>
                  <option value="draft">Draft (Admin Only)</option>
                  <option value="scheduled">Scheduled for Later</option>
                  <option value="unpublished">Unpublished</option>
                  <option value="archived">Archived</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Status determines student visibility.</p>
              </div>
            </div>

            {/* Target Audience Targeting Section */}
            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3">
              <label className="block font-semibold text-slate-700 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-sky-600" />
                <span>Target Audience *</span>
              </label>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="targetType"
                    checked={targetType === 'everyone'}
                    onChange={() => setTargetType('everyone')}
                    className="text-sky-600"
                  />
                  <span>Everyone (All Registered Students)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="targetType"
                    checked={targetType === 'groups'}
                    onChange={() => setTargetType('groups')}
                    className="text-sky-600"
                  />
                  <span>Selected Groups / Courses</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="targetType"
                    checked={targetType === 'users'}
                    onChange={() => setTargetType('users')}
                    className="text-sky-600"
                  />
                  <span>Selected Individual Students ({targetUserIds.length})</span>
                </label>
              </div>

              {/* Group Selector */}
              {targetType === 'groups' && (
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <p className="text-[11px] text-slate-500">
                    Select target cohorts and academic programs:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_GROUPS.map((grp) => {
                      const isSelected = targetGroups.includes(grp);
                      return (
                        <button
                          key={grp}
                          type="button"
                          onClick={() => toggleTargetGroup(grp)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                            isSelected
                              ? 'bg-sky-600 text-white border-sky-600'
                              : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                          }`}
                        >
                          {isSelected && '✓ '}
                          {grp}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Individual Student Search Selector */}
              {targetType === 'users' && (
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search students by name, email, or student ID..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
                    />
                  </div>

                  <div className="max-h-36 overflow-y-auto space-y-1 bg-white p-2 rounded-xl border border-slate-200">
                    {filteredStudents.map((st) => {
                      const isChecked = targetUserIds.includes(st.id);
                      return (
                        <label
                          key={st.id}
                          className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleTargetUser(st.id)}
                              className="text-sky-600 rounded"
                            />
                            <span className="font-semibold text-slate-800 truncate">{st.fullName}</span>
                            <span className="text-[11px] text-slate-400 font-mono truncate">{st.email}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            {st.studentId || st.course}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Dates & Scheduling */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Schedule Future Publication Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Expiration Cutoff Date (Optional)
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono"
                />
              </div>
            </div>

            {/* Attachment & Action Button */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Downloadable Document Attachment (Filename)
                </label>
                <input
                  type="text"
                  value={attachmentName}
                  onChange={(e) => setAttachmentName(e.target.value)}
                  placeholder="e.g. Final_Room_Assignments_Fall2026.pdf"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Action Button Label</label>
                  <input
                    type="text"
                    value={actionButtonLabel}
                    onChange={(e) => setActionButtonLabel(e.target.value)}
                    placeholder="e.g. View Portal"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Button Destination URL</label>
                  <input
                    type="url"
                    value={actionButtonUrl}
                    onChange={(e) => setActionButtonUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>
            </div>

            {/* Special Policy Flags */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded"
                />
                <span className="font-semibold text-slate-800">Pin to top of student announcement feeds</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireAcknowledgment}
                  onChange={(e) => setRequireAcknowledgment(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded"
                />
                <span className="font-semibold text-slate-800">
                  Require student acknowledgment signature ("I Acknowledge and Understand")
                </span>
              </label>

              {announcementToEdit && (
                <label className="flex items-center gap-2 cursor-pointer bg-sky-50 p-2.5 rounded-xl border border-sky-200">
                  <input
                    type="checkbox"
                    checked={notifyOnUpdate}
                    onChange={(e) => setNotifyOnUpdate(e.target.checked)}
                    className="w-4 h-4 text-sky-600 rounded"
                  />
                  <div>
                    <span className="font-bold text-sky-900 block">
                      Notify users about this update and show pop-up again
                    </span>
                    <span className="text-[11px] text-sky-700">
                      Increments version to v{(announcementToEdit.versionNumber || 1) + 1} so previously dismissed
                      students are alerted to important changes.
                    </span>
                  </div>
                </label>
              )}
            </div>

            {/* Form Action Controls */}
            <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || !content.trim()}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl shadow-xs disabled:opacity-50"
              >
                {announcementToEdit ? 'Save Changes' : 'Publish Announcement'}
              </button>
            </div>
          </form>
        ) : (
          /* PREVIEW TAB: Exact Student Perspective */
          <div className="p-6 overflow-y-auto space-y-4 bg-slate-100/70 flex-1">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2">
              <Eye className="w-4 h-4 shrink-0 text-blue-600" />
              <span>
                <strong>Live Simulation:</strong> Below is how eligible students will see this announcement on their
                dashboards.
              </span>
            </div>

            {/* Render Dashboard Card Preview */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm max-w-xl mx-auto space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {isPinned && (
                    <span className="font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md text-[10px]">
                      Pinned
                    </span>
                  )}
                  <span
                    className={`font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-md ${
                      priority === 'Urgent'
                        ? 'bg-rose-100 text-rose-700'
                        : priority === 'Important'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {priority} Priority
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">{category}</span>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">Today</span>
              </div>

              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {title || 'Announcement Title Preview'}
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {content || 'Announcement content will appear here...'}
              </p>

              {attachmentName && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-sky-600" />
                    <span className="font-medium text-slate-800">{attachmentName}</span>
                  </div>
                  <span className="text-sky-600 font-semibold flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" /> Download
                  </span>
                </div>
              )}

              {requireAcknowledgment && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800">
                  <span className="font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" /> Requires Student Acknowledgment
                  </span>
                  <button type="button" className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold text-[11px]">
                    I Acknowledge
                  </button>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>By {currentAdmin.fullName} ({currentAdmin.course})</span>
                <span>Target: {targetType.toUpperCase()}</span>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className="text-xs text-sky-600 font-semibold hover:underline"
              >
                ← Back to Editor
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
