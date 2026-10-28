import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db, formatBytes } from '../../services/db';
import {
  Bell,
  BookOpen,
  Check,
  CheckCircle,
  GraduationCap,
  Hash,
  Layers,
  LogOut,
  Mail,
  Shield,
  User as UserIcon,
} from 'lucide-react';

export const ProfileSettingsView: React.FC = () => {
  const { user, updateUserProfile, logout } = useAuth();
  if (!user) return null;

  const [displayName, setDisplayName] = useState(user.displayName || user.fullName);
  const [studentId, setStudentId] = useState(user.studentId || '');
  const [course, setCourse] = useState(user.course || '');
  const [yearLevel, setYearLevel] = useState(user.yearLevel || '3rd Year');
  const [section, setSection] = useState(user.section || '');
  const [isSaved, setIsSaved] = useState(false);

  // Notification toggles
  const [notifyUrgent, setNotifyUrgent] = useState(true);
  const [notifyEvents, setNotifyEvents] = useState(true);
  const [notifyStorage, setNotifyStorage] = useState(true);

  const storage = db.getStorageBreakdown(user.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      displayName: displayName.trim(),
      studentId: studentId.trim(),
      course: course.trim(),
      yearLevel,
      section: section.trim(),
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Student Profile & Settings</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage your verified Google identity, student credentials, and academic workspace preferences.
        </p>
      </div>

      {/* Google Account Verified Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <img
          src={user.profilePictureUrl}
          alt={user.fullName}
          className="w-20 h-20 rounded-full object-cover border-4 border-slate-100 shadow-xs shrink-0"
          referrerPolicy="no-referrer"
        />

        <div className="flex-1 text-center sm:text-left min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-lg font-bold text-slate-900">{user.fullName}</h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Google Verified
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
              {user.role}
            </span>
          </div>

          <p className="text-xs text-slate-500 font-mono mt-1">{user.email}</p>

          <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-400">
            <span>Student ID: <strong className="text-slate-700 font-mono">{user.studentId || 'Not assigned'}</strong></span>
            <span>·</span>
            <span>Storage Quota: <strong className="text-slate-700 font-mono">{formatBytes(user.storageQuotaBytes)}</strong></span>
            <span>·</span>
            <span>Registered: <strong className="text-slate-700 font-mono">{new Date(user.createdAt).toLocaleDateString()}</strong></span>
          </div>
        </div>
      </div>

      {/* Academic Information Form */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Academic Credentials</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Display Name (Shown across dashboard & comments)
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-slate-400" /> Student ID Number
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="UM-2023-XXXX"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-slate-400" /> Year Level
              </label>
              <select
                value={yearLevel}
                onChange={(e) => setYearLevel(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Postgraduate">Postgraduate</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" /> Degree / Course Program
              </label>
              <input
                type="text"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="e.g. BS Computer Science"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" /> Section / Class Block
              </label>
              <input
                type="text"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="e.g. CS-3A"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between border-t border-slate-100">
            {isSaved ? (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <Check className="w-4 h-4" /> Profile updated successfully!
              </span>
            ) : (
              <span className="text-xs text-slate-400">Google primary email cannot be altered</span>
            )}

            <button
              type="submit"
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-sky-600" />
          <span>Notification Preferences</span>
        </h3>

        <div className="space-y-3 text-xs text-slate-700">
          <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-150 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyUrgent}
              onChange={(e) => setNotifyUrgent(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
            />
            <div>
              <span className="font-semibold text-slate-900 block">Urgent Campus Advisories</span>
              <span className="text-slate-400">Receive immediate alerts when emergency notices or maintenance schedules are posted.</span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-150 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyEvents}
              onChange={(e) => setNotifyEvents(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
            />
            <div>
              <span className="font-semibold text-slate-900 block">Academic Deadlines & Event Reminders</span>
              <span className="text-slate-400">Notify 24 hours prior to assignment submissions and scheduled examinations.</span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-150 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyStorage}
              onChange={(e) => setNotifyStorage(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
            />
            <div>
              <span className="font-semibold text-slate-900 block">Cloud Storage Sync Alerts</span>
              <span className="text-slate-400">Notify when file uploads complete and if quota approaches 90% capacity.</span>
            </div>
          </label>
        </div>
      </div>

      {/* Sign Out Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-800">Account Session</h4>
          <p className="text-[11px] text-slate-400">Sign out of StudyCloud on this workstation.</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-red-200"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
