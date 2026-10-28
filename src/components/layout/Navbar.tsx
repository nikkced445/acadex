import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import {
  Bell,
  Check,
  ChevronDown,
  LogOut,
  Plus,
  Search,
  Settings,
  Shield,
  Upload,
  User as UserIcon,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onOpenSearch: () => void;
  onOpenUpload: () => void;
  onOpenNotifications: () => void;
  onNavigate: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onOpenSearch,
  onOpenUpload,
  onOpenNotifications,
  onNavigate,
}) => {
  const { user, logout, switchUserRole } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  if (!user) return null;

  const notifications = db.getNotifications(user.id);
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  // Format current date: e.g. "Tuesday, Oct 20, 2026"
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const getBreadcrumbTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Dashboard';
      case 'files':
        return 'My Files';
      case 'events':
        return 'My Events';
      case 'announcements':
        return 'Announcements';
      case 'calendar':
        return 'Academic Calendar';
      case 'storage':
        return 'Storage Usage';
      case 'profile':
        return 'Profile & Settings';
      case 'admin':
        return 'Admin Console';
      default:
        return 'Workspace';
    }
  };

  return (
    <header className="h-16 px-4 lg:px-8 bg-white border-b border-slate-200/80 flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Zone 1: Breadcrumb Trail */}
      <div className="flex items-center gap-2 min-w-0 shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 hidden sm:inline">
          Acadex
        </span>
        <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
          /
        </span>
        <span className="text-sm font-bold text-slate-900 truncate">
          {getBreadcrumbTitle()}
        </span>
        <span className="hidden xl:inline text-xs text-slate-400 ml-2 font-mono">
          · {formattedDate}
        </span>
      </div>

      {/* Zone 2: Live Search Trigger */}
      <div className="flex-1 max-w-md mx-2">
        <button
          type="button"
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl text-xs text-slate-500 transition-colors shadow-2xs group cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 transition-colors" />
            <span className="truncate">Search files, events, announcements...</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white rounded border border-slate-200">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Zone 3: Actions & Profile Menu */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Quick Upload Action */}
        <button
          type="button"
          onClick={onOpenUpload}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold rounded-lg shadow-2xs hover:shadow-xs transition-all whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Upload</span>
        </button>

        {/* Notification Bell */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="View notifications"
          aria-label="View notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none font-mono">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Quick Role Toggle (For Testing & Switch between Student / Administrator) */}
        <div className="hidden md:flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => switchUserRole('student')}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
              user.role === 'student' ? 'bg-white text-sky-700 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => switchUserRole('admin')}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
              user.role === 'admin' ? 'bg-white text-sky-700 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Admin
          </button>
        </div>

        {/* Profile Avatar Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <img
              src={user.profilePictureUrl}
              alt={user.displayName}
              className="w-8 h-8 rounded-full object-cover border border-slate-200"
              referrerPolicy="no-referrer"
            />
            <div className="hidden lg:flex flex-col items-start leading-tight">
              <span className="text-xs font-semibold text-slate-900 max-w-[120px] truncate">
                {user.displayName || user.fullName}
              </span>
              <span className="text-[10px] text-slate-400 capitalize">
                {user.role}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:inline" />
          </button>

          {/* Dropdown Menu */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900 truncate">{user.fullName}</p>
                <p className="text-[11px] text-slate-400 font-mono truncate">{user.email}</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="inline-block text-[10px] px-2 py-0.5 rounded-md font-medium capitalize bg-sky-50 text-sky-700">
                    {user.role === 'admin' ? 'Faculty Admin' : 'Student'}
                  </span>
                  {user.studentId && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      · {user.studentId}
                    </span>
                  )}
                </div>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onNavigate('profile');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left"
                >
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Profile & Academic Info</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onNavigate('storage');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>Storage Preferences</span>
                </button>

                {user.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onNavigate('admin');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-sky-700 hover:bg-sky-50 transition-colors text-left font-medium"
                  >
                    <Shield className="w-3.5 h-3.5 text-sky-600" />
                    <span>Admin Console</span>
                  </button>
                )}
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
