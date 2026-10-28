import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AcadexLogo } from '../common/AcadexLogo';
import { ArrowRight, BookOpen, CheckCircle, GraduationCap, Hash, Layers } from 'lucide-react';

export const ProfileSetupModal: React.FC = () => {
  const { user, completeProfileSetup } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || user?.fullName || '');
  const [studentId, setStudentId] = useState(user?.studentId || '');
  const [course, setCourse] = useState(user?.course || 'BS in Computer Science');
  const [yearLevel, setYearLevel] = useState(user?.yearLevel || '3rd Year');
  const [section, setSection] = useState(user?.section || 'Section A');

  if (!user || user.isSetupComplete) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    completeProfileSetup({
      displayName: displayName.trim() || user.fullName,
      studentId: studentId.trim(),
      course: course.trim(),
      yearLevel,
      section: section.trim(),
    });
  };

  const handleSkip = () => {
    completeProfileSetup({
      displayName: user.displayName || user.fullName,
      studentId: user.studentId || '',
      course: user.course || '',
      yearLevel: user.yearLevel || '',
      section: user.section || '',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 to-blue-600 px-6 py-6 text-white text-center relative">
          <div className="flex justify-center mb-2">
            <AcadexLogo size="sm" textColor="text-white" />
          </div>
          <h2 className="text-xl font-bold">Welcome to StudyCloud!</h2>
          <p className="text-xs text-sky-100 mt-1 max-w-sm mx-auto">
            Your Google account is connected. Customize your student workspace profile below or continue directly.
          </p>
        </div>

        {/* Profile Card Summary from Google */}
        <div className="p-6">
          <div className="flex items-center gap-4 p-3.5 bg-sky-50/70 border border-sky-100 rounded-xl mb-5">
            <img
              src={user.profilePictureUrl}
              alt={user.fullName}
              className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-900 text-sm truncate">{user.fullName}</span>
                <CheckCircle className="w-4 h-4 text-sky-600 shrink-0" />
              </div>
              <span className="text-xs text-slate-500 font-mono truncate block">{user.email}</span>
              <span className="text-[11px] text-sky-700 bg-sky-100/80 px-2 py-0.5 rounded-md font-medium inline-block mt-1">
                Verified via Google OAuth
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Display Name (how you appear on Acadex)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-slate-400" />
                  Student ID <span className="text-slate-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="UM-2023-XXXX"
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                  Year Level <span className="text-slate-400">(optional)</span>
                </label>
                <select
                  value={yearLevel}
                  onChange={(e) => setYearLevel(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Postgraduate">Postgraduate</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  Course / Degree <span className="text-slate-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder="e.g. BS Computer Science"
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  Section / Block <span className="text-slate-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="e.g. Section 3A"
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSkip}
                className="text-xs text-slate-500 hover:text-slate-700 font-medium py-2 px-3 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Complete Later
              </button>

              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs rounded-xl shadow-xs hover:shadow-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              >
                <span>Continue to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
