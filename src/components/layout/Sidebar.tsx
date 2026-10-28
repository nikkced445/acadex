import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db, formatBytes } from '../../services/db';
import { AcadexLogo } from '../common/AcadexLogo';
import {
  Bell,
  Calendar,
  ChevronDown,
  ChevronRight,
  Database,
  FileCode,
  FileImage,
  FileText,
  FolderOpen,
  HardDrive,
  Home,
  LogOut,
  Megaphone,
  Menu,
  Shield,
  UserCheck,
  Video,
  X,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onNavigate: (tab: string, subCategory?: string) => void;
  selectedCategory?: string;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onNavigate,
  selectedCategory,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const { user, logout } = useAuth();
  const [isFilesExpanded, setIsFilesExpanded] = useState(true);

  if (!user) return null;

  const storage = db.getStorageBreakdown(user.id);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    {
      id: 'files',
      label: 'My Files',
      icon: FolderOpen,
      hasChildren: true,
      children: [
        { id: 'document', label: 'Documents', icon: FileText },
        { id: 'video', label: 'Videos', icon: Video },
        { id: 'image', label: 'Images', icon: FileImage },
        { id: 'other', label: 'Other Files', icon: FileCode },
      ],
    },
    { id: 'events', label: 'My Events', icon: Calendar },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'storage', label: 'Storage Usage', icon: HardDrive },
    { id: 'profile', label: 'Profile & Settings', icon: UserCheck },
  ];

  if (user.role === 'admin') {
    navItems.splice(7, 0, { id: 'admin', label: 'Admin Console', icon: Shield, hasChildren: false, children: [] });
  }

  const handleNavClick = (id: string, subCat?: string) => {
    onNavigate(id, subCat);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Branding */}
        <div>
          <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between">
            <AcadexLogo size="md" />
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-250px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id && (!item.hasChildren || !selectedCategory);

              return (
                <div key={item.id} className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (item.hasChildren) {
                        setIsFilesExpanded(!isFilesExpanded);
                        handleNavClick(item.id, undefined);
                      } else {
                        handleNavClick(item.id);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-sky-50 text-sky-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.hasChildren && (
                      <span className="p-0.5 text-slate-400 hover:text-slate-600">
                        {isFilesExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </span>
                    )}
                  </button>

                  {/* Sub-items for Files */}
                  {item.hasChildren && isFilesExpanded && (
                    <div className="pl-6 pr-1 py-0.5 space-y-0.5 border-l border-slate-100 ml-4">
                      {item.children?.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildActive = currentTab === 'files' && selectedCategory === child.id;

                        return (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => handleNavClick('files', child.id)}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                              isChildActive
                                ? 'bg-sky-100/70 text-sky-800 font-semibold'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                            }`}
                          >
                            <ChildIcon className={`w-3.5 h-3.5 ${isChildActive ? 'text-sky-600' : 'text-slate-400'}`} />
                            <span className="truncate">{child.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Storage Usage Card & Sign Out */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          {/* Storage Meter */}
          <div
            onClick={() => handleNavClick('storage')}
            className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs hover:border-sky-300 transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700 group-hover:text-sky-700 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-sky-500" />
                Storage
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                {storage.percentageUsed}%
              </span>
            </div>

            {/* Storage Progress Bar */}
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  storage.percentageUsed > 90 ? 'bg-red-500' : storage.percentageUsed > 75 ? 'bg-amber-500' : 'bg-sky-500'
                }`}
                style={{ width: `${Math.max(4, storage.percentageUsed)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>{formatBytes(storage.usedBytes)} used</span>
              <span>{formatBytes(storage.totalBytes)}</span>
            </div>
          </div>

          {/* Quick Sign Out */}
          <button
            type="button"
            onClick={logout}
            className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
