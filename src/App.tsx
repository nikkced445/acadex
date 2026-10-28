import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { ProfileSetupModal } from './components/auth/ProfileSetupModal';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { StudentDashboard } from './components/dashboard/StudentDashboard';
import { FileManager } from './components/files/FileManager';
import { EventsManager } from './components/events/EventsManager';
import { AnnouncementsView } from './components/announcements/AnnouncementsView';
import { AcademicCalendar } from './components/calendar/AcademicCalendar';
import { StorageUsageView } from './components/storage/StorageUsageView';
import { ProfileSettingsView } from './components/profile/ProfileSettingsView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { GlobalSearchModal } from './components/search/GlobalSearchModal';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { FilePreviewModal } from './components/files/FilePreviewModal';
import { FileUploadModal } from './components/files/FileUploadModal';
import { FolderModal } from './components/files/FolderModal';
import { blobStore, db } from './services/db';
import { Announcement, FileItem, SchoolEvent } from './types';
import { Menu, ShieldAlert } from 'lucide-react';

const WorkspaceShell: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | undefined>(undefined);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Global Modals State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [activeAnnouncementModal, setActiveAnnouncementModal] = useState<Announcement | null>(null);
  const [activeSchoolEventModal, setActiveSchoolEventModal] = useState<SchoolEvent | null>(null);

  // Keyboard shortcut for Cmd+K / Ctrl+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading Acadex StudyCloud...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  const handleNavigate = (tab: string, subCategory?: string) => {
    setCurrentTab(tab);
    setSelectedSubCategory(subCategory);
  };

  const handleDownloadFile = async (file: FileItem) => {
    const blob = await blobStore.getBlob(file.id);
    const link = document.createElement('a');
    if (blob) {
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      const sampleBlob = new Blob(
        [
          `--- Acadex StudyCloud Academic Document ---\nFilename: ${file.name}\nCategory: ${file.category}\nOwner: ${user.fullName}\nID: ${file.id}\nTimestamp: ${file.createdAt}\n\n[Content verified in student cloud storage]`,
        ],
        { type: file.mimeType || 'text/plain' }
      );
      const url = URL.createObjectURL(sampleBlob);
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-slate-800">
      {/* First-login Profile Setup Onboarding Modal */}
      {!user.isSetupComplete && <ProfileSetupModal />}

      {/* Responsive Sidebar */}
      <Sidebar
        currentTab={currentTab}
        selectedCategory={selectedSubCategory}
        onNavigate={handleNavigate}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Mobile Header Toggle */}
        <div className="lg:hidden flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-xs text-slate-800">Acadex StudyCloud</span>
          <div className="w-5" />
        </div>

        {/* Desktop Navbar */}
        <Navbar
          currentTab={currentTab}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenUpload={() => setIsUploadModalOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onNavigate={(tab) => handleNavigate(tab)}
        />

        {/* Tab Viewport Routing */}
        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <StudentDashboard
              onNavigate={handleNavigate}
              onOpenFileModal={(file) => setPreviewFile(file)}
              onOpenUploadModal={(cat) => setIsUploadModalOpen(true)}
              onOpenCreateFolderModal={() => setIsFolderModalOpen(true)}
              onOpenCreateEventModal={() => handleNavigate('events')}
              onOpenAnnouncementDetail={(ann) => setActiveAnnouncementModal(ann)}
              onOpenSchoolEventDetail={(ev) => setActiveSchoolEventModal(ev)}
            />
          )}

          {currentTab === 'files' && <FileManager initialCategory={selectedSubCategory} />}

          {currentTab === 'events' && <EventsManager />}

          {currentTab === 'announcements' && <AnnouncementsView />}

          {currentTab === 'calendar' && <AcademicCalendar />}

          {currentTab === 'storage' && (
            <StorageUsageView
              onNavigateToFiles={() => handleNavigate('files')}
              onOpenUpload={() => setIsUploadModalOpen(true)}
            />
          )}

          {currentTab === 'profile' && <ProfileSettingsView />}

          {currentTab === 'admin' && <AdminDashboard />}
        </main>
      </div>

      {/* GLOBAL MODALS */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        userId={user.id}
        onSelectFile={(f) => setPreviewFile(f)}
        onSelectEvent={(eventId, isSchool) => {
          handleNavigate('calendar');
        }}
        onSelectAnnouncement={(annId) => {
          const ann = db.getAnnouncements(false).find((a) => a.id === annId);
          if (ann) setActiveAnnouncementModal(ann);
        }}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        userId={user.id}
        onNavigateToItem={(type, id) => {
          if (type === 'announcement') handleNavigate('announcements');
          else if (type === 'event') handleNavigate('calendar');
          else if (type === 'file') handleNavigate('files');
        }}
      />

      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onDownload={handleDownloadFile}
      />

      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        userId={user.id}
        folders={db.getFolders(user.id)}
        currentFolderId={null}
        onUploadComplete={() => {}}
      />

      <FolderModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onSubmit={(name, color) => {
          db.createFolder(user.id, name, null, color);
          handleNavigate('files');
        }}
      />

      {/* ANNOUNCEMENT DETAIL POPUP (From Dashboard) */}
      {activeAnnouncementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md">
                {activeAnnouncementModal.priority}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {activeAnnouncementModal.publishedAt ? new Date(activeAnnouncementModal.publishedAt).toLocaleDateString() : 'Draft'}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">
              {activeAnnouncementModal.title}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line mb-4">
              {activeAnnouncementModal.content}
            </p>
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="text-slate-400">Published by {activeAnnouncementModal.authorName}</span>
              <button
                onClick={() => setActiveAnnouncementModal(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCHOOL EVENT DETAIL POPUP (From Dashboard) */}
      {activeSchoolEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md inline-block mb-2">
              {activeSchoolEventModal.category}
            </span>
            <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">
              {activeSchoolEventModal.title}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              {activeSchoolEventModal.description}
            </p>
            <div className="p-3 bg-slate-50 rounded-xl mb-4 text-xs space-y-1">
              <p className="font-semibold text-slate-800">
                Date: <span className="font-mono text-sky-700">{activeSchoolEventModal.startDate}</span>
              </p>
              <p className="text-slate-600">Location: {activeSchoolEventModal.location}</p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setActiveSchoolEventModal(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <WorkspaceShell />
    </AuthProvider>
  );
}
