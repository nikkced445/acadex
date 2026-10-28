import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AcadexLogo } from '../common/AcadexLogo';
import { CheckCircle2, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginWithGoogle, isLoading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'student' | 'admin'>('student');
  const [customEmail, setCustomEmail] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  const handleSignIn = async () => {
    if (isCustomMode && customEmail.trim()) {
      const email = customEmail.trim();
      const name = email.split('@')[0].replace(/[._-]/g, ' ');
      await loginWithGoogle({
        email,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        role: selectedRole,
      });
      return;
    }

    if (selectedRole === 'admin') {
      await loginWithGoogle({
        email: 'dean.vance@university.edu',
        name: 'Dean Eleanor Vance',
        picture: '/src/assets/images/admin_avatar_portrait_1792551232986.jpg',
        role: 'admin',
      });
    } else {
      await loginWithGoogle({
        email: 'n.roferos.566703@umindanao.edu.ph',
        name: 'Alex Morgan',
        picture: '/src/assets/images/student_avatar_portrait_1792551232666.jpg',
        role: 'student',
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F8FAFC]">
      {/* LEFT SECTION: Welcome and System Introduction */}
      <div className="w-full lg:w-7/12 bg-gradient-to-br from-sky-600 via-sky-500 to-blue-700 text-white p-8 lg:p-14 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative background shapes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-sky-300/20 blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10">
          <AcadexLogo size="lg" textColor="text-white" />
        </div>

        {/* Center Content */}
        <div className="relative z-10 my-8 lg:my-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-sky-100 text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5 text-sky-200" />
            <span>Centralized Academic Cloud Storage & Dashboard</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
            Your Academic Life, <br />
            <span className="text-sky-200">All in One Place.</span>
          </h1>

          <p className="mt-4 text-base lg:text-lg text-sky-100/90 leading-relaxed">
            Store lecture slides, lab reports, and multimedia notes in personal cloud storage. Track exam dates, manage academic schedules, and stay updated with official school announcements seamlessly.
          </p>

          {/* Educational Illustration */}
          <div className="mt-6 rounded-2xl overflow-hidden border border-white/20 shadow-xl bg-white/10 backdrop-blur-xs group">
            <img
              src="/src/assets/images/student_study_cloud_workspace_1792551231948.jpg"
              alt="Students collaborating with StudyCloud academic storage"
              className="w-full h-48 sm:h-56 lg:h-64 object-cover object-center group-hover:scale-[1.02] transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Core Pillars */}
          <div className="mt-6 grid grid-cols-3 gap-3 text-center sm:text-left">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <span className="block text-xs uppercase tracking-wider text-sky-200 font-semibold">Store</span>
              <span className="text-xs text-white/90">5GB+ Free Storage</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <span className="block text-xs uppercase tracking-wider text-sky-200 font-semibold">Organize</span>
              <span className="text-xs text-white/90">Folders & Previews</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <span className="block text-xs uppercase tracking-wider text-sky-200 font-semibold">Learn</span>
              <span className="text-xs text-white/90">Calendar & Events</span>
            </div>
          </div>
        </div>

        {/* Bottom Tagline & Trust */}
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-white/15 text-xs text-sky-100">
          <p className="font-semibold tracking-wider uppercase text-white">Store. Organize. Learn.</p>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-sky-200" />
            <span>Encrypted academic storage with Google Workspace</span>
          </div>
        </div>
      </div>

      {/* RIGHT SECTION: Google Sign-In Card */}
      <div className="w-full lg:w-5/12 bg-white flex flex-col justify-center items-center p-6 sm:p-10 lg:p-14">
        <div className="w-full max-w-md">
          {/* Card Header */}
          <div className="text-center sm:text-left mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Welcome Back!
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Sign in with your Google account to access your student workspace and cloud storage.
            </p>
          </div>

          {/* Account Role & Demo Identity Selector */}
          <div className="mb-5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">Select Sign-In Profile</span>
              <button
                type="button"
                onClick={() => setIsCustomMode(!isCustomMode)}
                className="text-xs font-medium text-sky-600 hover:text-sky-700 underline"
              >
                {isCustomMode ? 'Use Quick Profiles' : 'Enter Custom Email'}
              </button>
            </div>

            {!isCustomMode ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('student')}
                  className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all ${
                    selectedRole === 'student'
                      ? 'bg-sky-50/80 border-sky-400 ring-2 ring-sky-400/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 w-full">
                    <span className="text-xs font-semibold text-slate-900">Student Account</span>
                    {selectedRole === 'student' && <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 ml-auto" />}
                  </div>
                  <span className="text-xs text-slate-500 truncate w-full mt-0.5">Alex Morgan</span>
                  <span className="text-[11px] text-sky-600 font-mono mt-0.5 truncate w-full">
                    n.roferos.566703@umindanao.edu.ph
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('admin')}
                  className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all ${
                    selectedRole === 'admin'
                      ? 'bg-sky-50/80 border-sky-400 ring-2 ring-sky-400/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 w-full">
                    <span className="text-xs font-semibold text-slate-900">Administrator</span>
                    {selectedRole === 'admin' && <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 ml-auto" />}
                  </div>
                  <span className="text-xs text-slate-500 truncate w-full mt-0.5">Dean Eleanor Vance</span>
                  <span className="text-[11px] text-sky-600 font-mono mt-0.5 truncate w-full">
                    dean.vance@university.edu
                  </span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Google Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="student.id@university.edu"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>
                <div className="flex gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-slate-700">
                    <input
                      type="radio"
                      name="role"
                      checked={selectedRole === 'student'}
                      onChange={() => setSelectedRole('student')}
                      className="text-sky-600 focus:ring-sky-500"
                    />
                    Student
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 ml-2">
                    <input
                      type="radio"
                      name="role"
                      checked={selectedRole === 'admin'}
                      onChange={() => setSelectedRole('admin')}
                      className="text-sky-600 focus:ring-sky-500"
                    />
                    Administrator
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Primary Action Button: Continue with Google */}
          <button
            type="button"
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-xl border border-slate-300 shadow-xs hover:shadow-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-60 disabled:cursor-not-allowed group"
          >
            {/* Official Google Icon */}
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="font-semibold text-slate-800 group-hover:text-slate-900">
              {isLoading ? 'Connecting to Google...' : 'Continue with Google'}
            </span>
          </button>

          {/* Institutional note */}
          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Institutional & Personal Google accounts supported</span>
          </div>

          {/* Privacy and Terms Notice */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 leading-relaxed">
              By continuing, you agree to Acadex StudyCloud's{' '}
              <a href="#terms" className="text-sky-600 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#privacy" className="text-sky-600 hover:underline">
                Privacy Policy
              </a>
              . Your academic data is safeguarded in private cloud containers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
