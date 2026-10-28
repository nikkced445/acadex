import React from 'react';
import { db } from '../../services/db';
import { Announcement } from '../../types';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  UserCheck,
  Users,
  X,
} from 'lucide-react';

interface AnnouncementAnalyticsModalProps {
  announcement: Announcement | null;
  onClose: () => void;
}

export const AnnouncementAnalyticsModal: React.FC<AnnouncementAnalyticsModalProps> = ({
  announcement,
  onClose,
}) => {
  if (!announcement) return null;

  const analytics = db.getAnnouncementAnalytics(announcement.id);
  if (!analytics) return null;

  const readPercent =
    analytics.totalEligible > 0 ? Math.round((analytics.readCount / analytics.totalEligible) * 100) : 0;
  const ackPercent =
    analytics.totalEligible > 0 ? Math.round((analytics.acknowledgedCount / analytics.totalEligible) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Readership & Acknowledgment Audit</h3>
              <p className="text-[11px] text-slate-400 truncate max-w-md">{announcement.title}</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* KPI Strip */}
        <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-slate-100 bg-white">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Target Audience
            </span>
            <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
              {analytics.totalEligible}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5 capitalize">
              {announcement.targetType}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Read by Students
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-sky-600 tabular-nums">
                {analytics.readCount}
              </span>
              <span className="text-xs text-slate-400 font-mono">({readPercent}%)</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">Verified view</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Acknowledged
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-emerald-600 tabular-nums">
                {analytics.acknowledgedCount}
              </span>
              <span className="text-xs text-slate-400 font-mono">({ackPercent}%)</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">Signed confirmation</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Dismissed Pop-up
            </span>
            <span className="text-xl font-bold font-mono text-slate-700 tabular-nums">
              {analytics.dismissedCount}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Dismissed or read</span>
          </div>
        </div>

        {/* Recipients Table */}
        <div className="flex-1 overflow-y-auto p-6">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
            Individual Student Delivery Status
          </h4>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Student</th>
                  <th className="py-2.5 px-3">Course & ID</th>
                  <th className="py-2.5 px-3 text-center">Read State</th>
                  <th className="py-2.5 px-3 text-center">Acknowledged</th>
                  <th className="py-2.5 px-3 font-mono text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {analytics.recipients.map((rec) => (
                  <tr key={rec.student.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={rec.student.profilePictureUrl}
                          alt={rec.student.fullName}
                          className="w-6 h-6 rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{rec.student.fullName}</p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">{rec.student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">
                      {rec.student.course || 'Undergraduate'} ({rec.student.studentId || 'No ID'})
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {rec.isRead ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3" /> Read
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Unread</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {rec.isAcknowledged ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3 text-sky-600" /> Confirmed
                        </span>
                      ) : announcement.requireAcknowledgment ? (
                        <span className="text-[11px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-md">
                          Pending
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">N/A</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400 text-right">
                      {rec.readAt
                        ? new Date(rec.readAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
