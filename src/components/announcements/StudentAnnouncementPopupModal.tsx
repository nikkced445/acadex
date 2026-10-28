import React, { useState } from 'react';
import { db, formatBytes } from '../../services/db';
import { Announcement } from '../../types';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Info,
  Pin,
  Shield,
  ShieldAlert,
  X,
} from 'lucide-react';

interface StudentAnnouncementPopupModalProps {
  queue: Announcement[];
  userId: string;
  onClose: () => void;
  onActionComplete: () => void;
}

export const StudentAnnouncementPopupModal: React.FC<StudentAnnouncementPopupModalProps> = ({
  queue,
  userId,
  onClose,
  onActionComplete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!queue || queue.length === 0) return null;

  const currentAnnouncement = queue[Math.min(currentIndex, queue.length - 1)];
  if (!currentAnnouncement) return null;

  const isUrgent = currentAnnouncement.priority === 'Urgent';
  const requiresAck = currentAnnouncement.requireAcknowledgment;
  const isAcknowledged = currentAnnouncement.acknowledgedByUserIds?.includes(userId);
  const isRead = currentAnnouncement.readByUserIds?.includes(userId);

  const handleDismiss = () => {
    db.dismissAnnouncement(currentAnnouncement.id, userId);
    onActionComplete();
    if (currentIndex < queue.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handleAcknowledge = () => {
    db.acknowledgeAnnouncement(currentAnnouncement.id, userId);
    onActionComplete();
    if (currentIndex < queue.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handleMarkAsRead = () => {
    db.toggleAnnouncementRead(currentAnnouncement.id, userId);
    onActionComplete();
  };

  const handleDownloadAttachment = () => {
    if (!currentAnnouncement.attachmentName) return;
    const sampleBlob = new Blob(
      [
        `--- University Official Advisory Attachment ---\nTitle: ${currentAnnouncement.title}\nCategory: ${currentAnnouncement.category}\nPriority: ${currentAnnouncement.priority}\nAuthor: ${currentAnnouncement.authorName} (${currentAnnouncement.authorRole})\nPublished: ${currentAnnouncement.publishedAt}\n\n[Official University Document Verified by Academic Directorate]`,
      ],
      { type: 'application/pdf' }
    );
    const url = URL.createObjectURL(sampleBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentAnnouncement.attachmentName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-xl bg-white rounded-3xl shadow-2xl border overflow-hidden flex flex-col max-h-[90vh] transition-all ${
          isUrgent ? 'border-rose-300 ring-4 ring-rose-500/10' : 'border-slate-200'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="announcement-modal-title"
      >
        {/* Header Ribbon / Banner */}
        <div
          className={`px-6 py-5 text-white flex items-center justify-between gap-3 ${
            isUrgent
              ? 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700'
              : 'bg-gradient-to-r from-sky-600 via-sky-500 to-blue-600'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-white/15 backdrop-blur-xs text-white shrink-0">
              {isUrgent ? <ShieldAlert className="w-5 h-5 text-white" /> : <Info className="w-5 h-5 text-white" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-md">
                  {currentAnnouncement.priority} Priority
                </span>
                <span className="text-[11px] text-white/80 font-medium">
                  {currentAnnouncement.category}
                </span>
              </div>
              <p className="text-xs text-white/90 mt-0.5 truncate">
                Official Campus Notification
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Multi-queue indicator */}
            {queue.length > 1 && (
              <span className="text-xs font-mono font-bold bg-white/20 px-2 py-1 rounded-lg text-white">
                {currentIndex + 1} of {queue.length}
              </span>
            )}

            {!requiresAck && (
              <button
                type="button"
                onClick={handleDismiss}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                title="Dismiss"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-slate-700">
          {/* Optional Cover Image */}
          {currentAnnouncement.coverImageUrl && (
            <div className="rounded-2xl overflow-hidden border border-slate-100 max-h-48 bg-slate-50">
              <img
                src={currentAnnouncement.coverImageUrl}
                alt={currentAnnouncement.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div>
            <h2
              id="announcement-modal-title"
              className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug tracking-tight"
            >
              {currentAnnouncement.title}
            </h2>

            {/* Author and Date Meta */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-2 font-mono">
              <span className="font-semibold text-slate-700">{currentAnnouncement.authorName}</span>
              <span>·</span>
              <span>{currentAnnouncement.authorRole}</span>
              <span>·</span>
              <span>
                {currentAnnouncement.publishedAt
                  ? new Date(currentAnnouncement.publishedAt).toLocaleDateString()
                  : 'Recent'}
              </span>
            </div>
          </div>

          {/* Announcement Prose */}
          <div className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line space-y-2">
            <p className={!isExpanded && currentAnnouncement.content.length > 280 ? 'line-clamp-4' : ''}>
              {currentAnnouncement.content}
            </p>
            {currentAnnouncement.content.length > 280 && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 mt-1"
              >
                {isExpanded ? 'Show less' : 'Read full advisory...'}
              </button>
            )}
          </div>

          {/* Attachment Box */}
          {currentAnnouncement.attachmentName && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 bg-white text-sky-600 border border-slate-200 rounded-xl shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{currentAnnouncement.attachmentName}</p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {currentAnnouncement.attachmentSize ? formatBytes(currentAnnouncement.attachmentSize) : 'Official Attachment'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadAttachment}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition-colors shrink-0"
              >
                <Download className="w-3.5 h-3.5 text-sky-600" />
                <span>Download</span>
              </button>
            </div>
          )}

          {/* Action Button Link (if configured) */}
          {currentAnnouncement.actionButtonLabel && (
            <div className="pt-1">
              <a
                href={currentAnnouncement.actionButtonUrl || '#'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-semibold transition-colors"
              >
                <span>{currentAnnouncement.actionButtonLabel}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Target Audience Privacy Disclaimer */}
          <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <Shield className="w-3 h-3 text-slate-400" />
            <span>Targeted to: {currentAnnouncement.targetType === 'everyone' ? 'All Students' : currentAnnouncement.targetType === 'groups' ? currentAnnouncement.targetGroups?.join(', ') : 'Selected Students'}</span>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Queue Navigation for Multiple Popups */}
          {queue.length > 1 ? (
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={currentIndex >= queue.length - 1}
                onClick={() => setCurrentIndex((prev) => Math.min(queue.length - 1, prev + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-[11px] text-slate-400 font-mono ml-1">
                Advisory {currentIndex + 1} of {queue.length}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleMarkAsRead}
              className="text-xs font-semibold text-slate-500 hover:text-sky-600 transition-colors flex items-center gap-1"
            >
              {isRead ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Marked as read</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Mark as read</span>
                </>
              )}
            </button>
          )}

          {/* Primary Action Button */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {!requiresAck && (
              <button
                type="button"
                onClick={handleDismiss}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition-colors"
              >
                Dismiss
              </button>
            )}

            {requiresAck ? (
              <button
                type="button"
                onClick={handleAcknowledge}
                className={`flex items-center gap-2 px-5 py-2.5 text-white text-xs font-bold rounded-xl shadow-xs transition-all ${
                  isUrgent ? 'bg-rose-600 hover:bg-rose-700' : 'bg-sky-600 hover:bg-sky-700'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>I Acknowledge and Understand</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDismiss}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                Got It
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
