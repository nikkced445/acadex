import {
  Announcement,
  AuditLog,
  FileCategory,
  FileItem,
  Folder,
  NotificationItem,
  PersonalEvent,
  SchoolEvent,
  StorageBreakdown,
  User,
  UserAnnouncementState,
} from '../types';

const DB_PREFIX = 'acadex_studycloud_';
const USERS_KEY = `${DB_PREFIX}users`;
const CURRENT_USER_KEY = `${DB_PREFIX}current_user_id`;
const FOLDERS_KEY = `${DB_PREFIX}folders`;
const FILES_KEY = `${DB_PREFIX}files`;
const PERSONAL_EVENTS_KEY = `${DB_PREFIX}personal_events`;
const ANNOUNCEMENTS_KEY = `${DB_PREFIX}announcements`;
const USER_ANNOUNCEMENT_STATES_KEY = `${DB_PREFIX}user_announcement_states`;
const SCHOOL_EVENTS_KEY = `${DB_PREFIX}school_events`;
const NOTIFICATIONS_KEY = `${DB_PREFIX}notifications`;
const AUDIT_LOGS_KEY = `${DB_PREFIX}audit_logs`;
const CONFIG_KEY = `${DB_PREFIX}system_config`;

export interface SystemConfig {
  defaultQuotaBytes: number;
  allowedGoogleDomains: string; // empty means any, or e.g. umindanao.edu.ph
  appName: string;
}

const DEFAULT_CONFIG: SystemConfig = {
  defaultQuotaBytes: 5 * 1024 * 1024 * 1024, // 5 GB default
  allowedGoogleDomains: '',
  appName: 'StudyCloud',
};

// IndexedDB Helper for Binary Blobs
class BlobStore {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open('StudyCloud_BlobsDB', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('blobs')) {
          db.createObjectStore('blobs', { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  async saveBlob(id: string, blob: Blob): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('blobs', 'readwrite');
        const store = tx.objectStore('blobs');
        const req = store.put({ id, blob });
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('Could not save blob to IndexedDB:', e);
    }
  }

  async getBlob(id: string): Promise<Blob | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('blobs', 'readonly');
        const store = tx.objectStore('blobs');
        const req = store.get(id);
        req.onsuccess = () => {
          resolve(req.result ? req.result.blob : null);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  }

  async deleteBlob(id: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('blobs', 'readwrite');
        const store = tx.objectStore('blobs');
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('Could not delete blob:', e);
    }
  }
}

export const blobStore = new BlobStore();

// Category detector from extension/mime
export function detectFileCategory(filename: string, mimeType?: string): { category: FileCategory; extension: string } {
  const parts = filename.split('.');
  const extension = parts.length > 1 ? parts.pop()!.toLowerCase() : '';
  const lowerMime = (mimeType || '').toLowerCase();

  if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'ppt', 'pptx', 'xls', 'xlsx', 'csv', 'md'].includes(extension) || lowerMime.includes('pdf') || lowerMime.includes('document') || lowerMime.includes('text/')) {
    return { category: 'document', extension };
  }
  if (['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(extension) || lowerMime.startsWith('video/')) {
    return { category: 'video', extension };
  }
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp'].includes(extension) || lowerMime.startsWith('image/')) {
    return { category: 'image', extension };
  }
  if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(extension) || lowerMime.startsWith('audio/')) {
    return { category: 'audio', extension };
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension) || lowerMime.includes('zip') || lowerMime.includes('compressed')) {
    return { category: 'archive', extension };
  }
  return { category: 'other', extension };
}

// Format bytes helper
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Initial default users
const INITIAL_USERS: User[] = [
  {
    id: 'user_alex_morgan',
    providerId: 'google_108234901823901',
    fullName: 'Alex Morgan',
    displayName: 'Alex Morgan',
    email: 'n.roferos.566703@umindanao.edu.ph',
    profilePictureUrl: '/src/assets/images/student_avatar_portrait_1792551232666.jpg',
    role: 'student',
    studentId: 'UM-2023-8849',
    course: 'BS in Computer Science',
    yearLevel: '3rd Year',
    section: 'CS-3A',
    storageQuotaBytes: 5 * 1024 * 1024 * 1024,
    isSetupComplete: true,
    status: 'active',
    createdAt: '2026-08-15T08:00:00.000Z',
    updatedAt: '2026-10-18T14:22:00.000Z',
  },
  {
    id: 'user_admin_eleanor',
    providerId: 'google_992384729183921',
    fullName: 'Dean Eleanor Vance',
    displayName: 'Dean Vance',
    email: 'dean.vance@university.edu',
    profilePictureUrl: '/src/assets/images/admin_avatar_portrait_1792551232986.jpg',
    role: 'admin',
    studentId: 'FACULTY-001',
    course: 'College of Information & Computing',
    yearLevel: 'Faculty Dean',
    section: 'Admin Office',
    storageQuotaBytes: 50 * 1024 * 1024 * 1024,
    isSetupComplete: true,
    status: 'active',
    createdAt: '2026-01-10T09:00:00.000Z',
    updatedAt: '2026-10-20T10:00:00.000Z',
  },
  {
    id: 'user_liam_chen',
    providerId: 'google_442384729183922',
    fullName: 'Liam Chen',
    displayName: 'Liam',
    email: 'l.chen@umindanao.edu.ph',
    profilePictureUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    role: 'student',
    studentId: 'UM-2023-4120',
    course: 'BS in Information Technology',
    yearLevel: '3rd Year',
    section: 'IT-3B',
    storageQuotaBytes: 5 * 1024 * 1024 * 1024,
    isSetupComplete: true,
    status: 'active',
    createdAt: '2026-08-20T11:00:00.000Z',
    updatedAt: '2026-10-15T09:15:00.000Z',
  },
  {
    id: 'user_sophia_rodriguez',
    providerId: 'google_552384729183923',
    fullName: 'Sophia Rodriguez',
    displayName: 'Sophia R.',
    email: 's.rodriguez@umindanao.edu.ph',
    profilePictureUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    role: 'student',
    studentId: 'UM-2024-1902',
    course: 'BS in Computer Engineering',
    yearLevel: '2nd Year',
    section: 'CpE-2A',
    storageQuotaBytes: 5 * 1024 * 1024 * 1024,
    isSetupComplete: true,
    status: 'active',
    createdAt: '2026-09-01T10:30:00.000Z',
    updatedAt: '2026-10-12T16:40:00.000Z',
  },
];

// Initial folders for default student
const INITIAL_FOLDERS: Folder[] = [
  {
    id: 'folder_cs301',
    ownerUserId: 'user_alex_morgan',
    parentFolderId: null,
    name: 'CS301 - Data Structures & Algorithms',
    color: '#0284c7',
    createdAt: '2026-08-25T10:00:00.000Z',
    updatedAt: '2026-08-25T10:00:00.000Z',
  },
  {
    id: 'folder_research',
    ownerUserId: 'user_alex_morgan',
    parentFolderId: null,
    name: 'Research & Thesis Materials',
    color: '#059669',
    createdAt: '2026-08-26T11:00:00.000Z',
    updatedAt: '2026-08-26T11:00:00.000Z',
  },
  {
    id: 'folder_lectures',
    ownerUserId: 'user_alex_morgan',
    parentFolderId: null,
    name: 'Recorded Lectures & Seminars',
    color: '#7c3aed',
    createdAt: '2026-09-02T14:30:00.000Z',
    updatedAt: '2026-09-02T14:30:00.000Z',
  },
  {
    id: 'folder_lab_reports',
    ownerUserId: 'user_alex_morgan',
    parentFolderId: null,
    name: 'Lab Reports & Experiments',
    color: '#ea580c',
    createdAt: '2026-09-05T09:15:00.000Z',
    updatedAt: '2026-09-05T09:15:00.000Z',
  },
];

// Pre-seeded files for student
const INITIAL_FILES: FileItem[] = [
  {
    id: 'file_cs301_syllabus',
    ownerUserId: 'user_alex_morgan',
    folderId: 'folder_cs301',
    name: 'CS301_Course_Syllabus_2026.pdf',
    mimeType: 'application/pdf',
    fileSize: 1420000, // 1.42 MB
    category: 'document',
    extension: 'pdf',
    isFavorite: true,
    isDeleted: false,
    deletedAt: null,
    createdAt: '2026-08-26T10:15:00.000Z',
    updatedAt: '2026-08-26T10:15:00.000Z',
  },
  {
    id: 'file_dsa_guide',
    ownerUserId: 'user_alex_morgan',
    folderId: 'folder_cs301',
    name: 'Data_Structures_Cheatsheet_v3.pdf',
    mimeType: 'application/pdf',
    fileSize: 2850000, // 2.85 MB
    category: 'document',
    extension: 'pdf',
    isFavorite: true,
    isDeleted: false,
    deletedAt: null,
    createdAt: '2026-09-01T15:20:00.000Z',
    updatedAt: '2026-09-01T15:20:00.000Z',
  },
  {
    id: 'file_lecture_trees',
    ownerUserId: 'user_alex_morgan',
    folderId: 'folder_lectures',
    name: 'Lecture04_BinarySearchTrees_Traversal.mp4',
    mimeType: 'video/mp4',
    fileSize: 84500000, // 84.5 MB
    category: 'video',
    extension: 'mp4',
    isFavorite: false,
    isDeleted: false,
    deletedAt: null,
    createdAt: '2026-09-10T16:00:00.000Z',
    updatedAt: '2026-09-10T16:00:00.000Z',
  },
  {
    id: 'file_db_notes',
    ownerUserId: 'user_alex_morgan',
    folderId: 'folder_cs301',
    name: 'Database_Normalization_Study_Notes.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileSize: 640000, // 640 KB
    category: 'document',
    extension: 'docx',
    isFavorite: false,
    isDeleted: false,
    deletedAt: null,
    createdAt: '2026-09-15T11:45:00.000Z',
    updatedAt: '2026-09-15T11:45:00.000Z',
  },
  {
    id: 'file_physics_sheet',
    ownerUserId: 'user_alex_morgan',
    folderId: 'folder_lab_reports',
    name: 'Lab3_Oscillation_Harmonic_Data.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileSize: 1120000, // 1.12 MB
    category: 'document',
    extension: 'xlsx',
    isFavorite: true,
    isDeleted: false,
    deletedAt: null,
    createdAt: '2026-09-22T13:30:00.000Z',
    updatedAt: '2026-09-22T13:30:00.000Z',
  },
  {
    id: 'file_ml_slides',
    ownerUserId: 'user_alex_morgan',
    folderId: 'folder_research',
    name: 'MachineLearning_Thesis_Proposal.pptx',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    fileSize: 14200000, // 14.2 MB
    category: 'document',
    extension: 'pptx',
    isFavorite: false,
    isDeleted: false,
    deletedAt: null,
    createdAt: '2026-10-02T14:10:00.000Z',
    updatedAt: '2026-10-02T14:10:00.000Z',
  },
  {
    id: 'file_id_scan',
    ownerUserId: 'user_alex_morgan',
    folderId: null,
    name: 'University_Student_Identification_Scan.png',
    mimeType: 'image/png',
    fileSize: 3200000, // 3.2 MB
    category: 'image',
    extension: 'png',
    isFavorite: false,
    isDeleted: false,
    deletedAt: null,
    createdAt: '2026-08-20T09:00:00.000Z',
    updatedAt: '2026-08-20T09:00:00.000Z',
  },
  {
    id: 'file_project_code',
    ownerUserId: 'user_alex_morgan',
    folderId: 'folder_research',
    name: 'Distributed_Cache_Simulator_Code.zip',
    mimeType: 'application/zip',
    fileSize: 24800000, // 24.8 MB
    category: 'archive',
    extension: 'zip',
    isFavorite: true,
    isDeleted: false,
    deletedAt: null,
    createdAt: '2026-10-14T17:50:00.000Z',
    updatedAt: '2026-10-14T17:50:00.000Z',
  },
  {
    id: 'file_audio_recap',
    ownerUserId: 'user_alex_morgan',
    folderId: 'folder_lectures',
    name: 'Algorithms_BigO_Quick_Review.mp3',
    mimeType: 'audio/mpeg',
    fileSize: 8900000, // 8.9 MB
    category: 'audio',
    extension: 'mp3',
    isFavorite: false,
    isDeleted: false,
    deletedAt: null,
    createdAt: '2026-10-16T12:00:00.000Z',
    updatedAt: '2026-10-16T12:00:00.000Z',
  },
];

// Pre-seeded personal events for student
const INITIAL_PERSONAL_EVENTS: PersonalEvent[] = [
  {
    id: 'event_p1',
    ownerUserId: 'user_alex_morgan',
    title: 'CS301 Data Structures Midterm Review',
    description: 'Review binary search trees, graph traversals (BFS/DFS), and dynamic programming memoization with study group.',
    startDate: '2026-10-23',
    startTime: '14:00',
    endDate: '2026-10-23',
    endTime: '17:00',
    location: 'Science & Tech Library, Room 402',
    category: 'Examination',
    reminder: true,
    color: '#0284c7', // Sky Blue
    isCompleted: false,
    createdAt: '2026-10-15T08:00:00.000Z',
    updatedAt: '2026-10-15T08:00:00.000Z',
  },
  {
    id: 'event_p2',
    ownerUserId: 'user_alex_morgan',
    title: 'Algorithm Analysis Problem Set 4 Submission',
    description: 'Submit proof of correctness and worst-case recurrence relations on the portal.',
    startDate: '2026-10-25',
    startTime: '23:59',
    endDate: '2026-10-25',
    endTime: '23:59',
    location: 'Acadex Submission Portal',
    category: 'Assignment',
    reminder: true,
    color: '#ea580c', // Orange
    isCompleted: false,
    createdAt: '2026-10-16T09:30:00.000Z',
    updatedAt: '2026-10-16T09:30:00.000Z',
  },
  {
    id: 'event_p3',
    ownerUserId: 'user_alex_morgan',
    title: 'Senior Thesis Capstone Sprint Meeting',
    description: 'Meet with thesis adviser Prof. Martinez to present system architecture diagrams and prototype API benchmark.',
    startDate: '2026-10-27',
    startTime: '10:00',
    endDate: '2026-10-27',
    endTime: '11:30',
    location: 'Faculty Consultation Hall 3B',
    category: 'Project',
    reminder: true,
    color: '#7c3aed', // Purple
    isCompleted: false,
    createdAt: '2026-10-17T11:00:00.000Z',
    updatedAt: '2026-10-17T11:00:00.000Z',
  },
  {
    id: 'event_p4',
    ownerUserId: 'user_alex_morgan',
    title: 'Campus Debate Society Weekly Practice',
    description: 'Parliamentary debate practice on modern cloud infrastructure and AI governance.',
    startDate: '2026-10-28',
    startTime: '17:30',
    endDate: '2026-10-28',
    endTime: '19:00',
    location: 'Student Activity Center',
    category: 'Personal',
    reminder: false,
    color: '#059669', // Emerald
    isCompleted: false,
    createdAt: '2026-10-18T14:00:00.000Z',
    updatedAt: '2026-10-18T14:00:00.000Z',
  },
];

// Pre-seeded Administrator Announcements
const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann_1',
    title: 'Campus High-Speed Backbone & Cloud Storage Storage Node Maintenance',
    content: 'Please be advised that the Department of Information Technology will perform scheduled maintenance and capacity expansion on the student storage SAN and campus fiber backbone this coming Saturday from 12:00 AM to 04:00 AM UTC. File syncing and upload services may experience intermittent brief pauses. All stored files are fully secured and redundant.',
    category: 'Campus Maintenance',
    authorName: 'Dean Eleanor Vance',
    authorAdminId: 'user_admin_eleanor',
    authorRole: 'Dean, College of Information & Computing',
    priority: 'Urgent',
    displayMethod: 'popup',
    targetType: 'everyone',
    publicationStatus: 'published',
    publishedAt: '2026-10-19T08:00:00.000Z',
    scheduledAt: null,
    expiresAt: '2026-10-28T23:59:59.000Z',
    isPinned: true,
    requireAcknowledgment: true,
    notifyOnUpdate: true,
    versionNumber: 1,
    coverImageUrl: null,
    actionButtonLabel: 'View Server Status',
    actionButtonUrl: 'https://status.university.edu',
    attachmentName: 'Infrastructure_Maintenance_Advisory_Oct2026.pdf',
    attachmentUrl: '#',
    attachmentSize: 450000,
    readByUserIds: [],
    acknowledgedByUserIds: [],
    dismissedByUserIds: [],
    createdAt: '2026-10-19T08:00:00.000Z',
    updatedAt: '2026-10-19T08:00:00.000Z',
  },
  {
    id: 'ann_2',
    title: '1st Semester Midterm Examination Schedule, Guidelines & Room Assignments',
    content: 'Official exam clearance forms and room assignments for the Midterm Examination period are now available. Students are requested to bring their physical University ID and examination pass. Mobile phones and unauthorized smart devices must remain in personal lockers throughout testing blocks.',
    category: 'Exam Clearance',
    authorName: 'Dean Eleanor Vance',
    authorAdminId: 'user_admin_eleanor',
    authorRole: 'Dean, College of Information & Computing',
    priority: 'Important',
    displayMethod: 'banner',
    targetType: 'groups',
    targetGroups: ['3rd Year', '2nd Year', 'BS in Computer Science'],
    publicationStatus: 'published',
    publishedAt: '2026-10-18T10:30:00.000Z',
    scheduledAt: null,
    expiresAt: '2026-11-05T23:59:59.000Z',
    isPinned: true,
    requireAcknowledgment: false,
    notifyOnUpdate: false,
    versionNumber: 1,
    actionButtonLabel: 'Exam Seat Matrix',
    actionButtonUrl: '#',
    attachmentName: 'Midterm_Exam_Room_Assignments_2026.pdf',
    attachmentUrl: '#',
    attachmentSize: 1250000,
    readByUserIds: ['user_alex_morgan'],
    acknowledgedByUserIds: ['user_alex_morgan'],
    dismissedByUserIds: [],
    createdAt: '2026-10-18T10:30:00.000Z',
    updatedAt: '2026-10-18T10:30:00.000Z',
  },
  {
    id: 'ann_3',
    title: 'Call for Entries: University Tech & Innovation Hackathon 2026',
    content: 'Registration is now open for the Annual University Innovation Hackathon! Teams of 3-5 students from all colleges can build software or hardware solutions addressing Education, Sustainability, and Healthcare. Prizes include cloud developer credits, incubation grants, and industry mentorship.',
    category: 'Event & Activity',
    authorName: 'Office of Student Affairs',
    authorAdminId: 'user_admin_eleanor',
    authorRole: 'Academic Programs Directorate',
    priority: 'Normal',
    displayMethod: 'card',
    targetType: 'everyone',
    publicationStatus: 'published',
    publishedAt: '2026-10-14T14:00:00.000Z',
    scheduledAt: null,
    expiresAt: '2026-11-15T23:59:59.000Z',
    isPinned: false,
    requireAcknowledgment: false,
    notifyOnUpdate: false,
    versionNumber: 1,
    actionButtonLabel: 'Register Hackathon Team',
    actionButtonUrl: 'https://hackathon.university.edu',
    attachmentName: 'Hackathon_Rules_and_Prizes.pdf',
    attachmentUrl: '#',
    attachmentSize: 890000,
    readByUserIds: ['user_alex_morgan'],
    acknowledgedByUserIds: [],
    dismissedByUserIds: [],
    createdAt: '2026-10-14T14:00:00.000Z',
    updatedAt: '2026-10-14T14:00:00.000Z',
  },
  {
    id: 'ann_4',
    title: 'Senior Capstone Thesis Draft Defense Advisement Notice',
    content: 'Special notice for BS in Computer Science 3rd Year and 4th Year thesis groups: Review panels will conduct architecture checks next Tuesday. Ensure your distributed project simulator files are updated in StudyCloud folders before Monday 5:00 PM.',
    category: 'Academic Advisory',
    authorName: 'Dean Eleanor Vance',
    authorAdminId: 'user_admin_eleanor',
    authorRole: 'Dean, College of Information & Computing',
    priority: 'Important',
    displayMethod: 'popup',
    targetType: 'users',
    targetUserIds: ['user_alex_morgan', 'user_liam_chen'],
    publicationStatus: 'published',
    publishedAt: '2026-10-17T09:00:00.000Z',
    scheduledAt: null,
    expiresAt: '2026-11-01T23:59:59.000Z',
    isPinned: false,
    requireAcknowledgment: false,
    notifyOnUpdate: false,
    versionNumber: 1,
    readByUserIds: [],
    acknowledgedByUserIds: [],
    dismissedByUserIds: [],
    createdAt: '2026-10-17T09:00:00.000Z',
    updatedAt: '2026-10-17T09:00:00.000Z',
  },
  {
    id: 'ann_5',
    title: 'University Main Library 24/7 Study Hall Access During Finals Week',
    content: 'In response to student council recommendations, the 2nd and 3rd floors of the University Central Library will remain open 24/7 starting November 1. Complimentary coffee and ergonomic study stations will be provided in the North Wing.',
    category: 'General Info',
    authorName: 'University Library Council',
    authorAdminId: 'user_admin_eleanor',
    authorRole: 'Chief University Librarian',
    priority: 'Normal',
    displayMethod: 'bell',
    targetType: 'everyone',
    publicationStatus: 'published',
    publishedAt: '2026-10-10T09:00:00.000Z',
    scheduledAt: null,
    expiresAt: null,
    isPinned: false,
    requireAcknowledgment: false,
    notifyOnUpdate: false,
    versionNumber: 1,
    readByUserIds: [],
    acknowledgedByUserIds: [],
    dismissedByUserIds: [],
    createdAt: '2026-10-10T09:00:00.000Z',
    updatedAt: '2026-10-10T09:00:00.000Z',
  },
  {
    id: 'ann_6',
    title: 'Upcoming Registration Window: Spring Semester 2027 Electives Preview',
    content: 'Draft schedule of advanced technical electives including Cloud Distributed Systems, AI Agent Frameworks, and Embedded IoT Security will open for early advising next month.',
    category: 'Academic Advisory',
    authorName: 'Dean Eleanor Vance',
    authorAdminId: 'user_admin_eleanor',
    authorRole: 'Dean, College of Information & Computing',
    priority: 'Normal',
    displayMethod: 'card',
    targetType: 'everyone',
    publicationStatus: 'draft',
    publishedAt: null,
    scheduledAt: null,
    expiresAt: null,
    isPinned: false,
    requireAcknowledgment: false,
    notifyOnUpdate: false,
    versionNumber: 1,
    readByUserIds: [],
    acknowledgedByUserIds: [],
    dismissedByUserIds: [],
    createdAt: '2026-10-18T16:00:00.000Z',
    updatedAt: '2026-10-18T16:00:00.000Z',
  },
];

const INITIAL_USER_ANNOUNCEMENT_STATES: UserAnnouncementState[] = [
  {
    id: 'state_1_alex',
    announcementId: 'ann_2',
    userId: 'user_alex_morgan',
    deliveredAt: '2026-10-18T10:30:00.000Z',
    firstViewedAt: '2026-10-18T11:00:00.000Z',
    readAt: '2026-10-18T11:05:00.000Z',
    dismissedAt: '2026-10-18T11:05:00.000Z',
    acknowledgedAt: '2026-10-18T11:05:00.000Z',
    lastNotifiedVersion: 1,
  },
  {
    id: 'state_2_alex',
    announcementId: 'ann_3',
    userId: 'user_alex_morgan',
    deliveredAt: '2026-10-14T14:00:00.000Z',
    firstViewedAt: '2026-10-15T09:00:00.000Z',
    readAt: '2026-10-15T09:05:00.000Z',
    dismissedAt: null,
    acknowledgedAt: null,
    lastNotifiedVersion: 1,
  },
];

// Pre-seeded School Events
const INITIAL_SCHOOL_EVENTS: SchoolEvent[] = [
  {
    id: 'school_ev_1',
    title: 'University Midterm Examination Week',
    description: 'Formal exam testing window across all undergraduate colleges and departments.',
    startDate: '2026-10-26',
    startTime: '08:00',
    endDate: '2026-10-31',
    endTime: '18:00',
    location: 'Main Academic Pavilions A, B, & C',
    category: 'Examination Schedule',
    publicationStatus: 'published',
    authorAdminId: 'user_admin_eleanor',
    registrationLink: 'https://university.edu/exams/clearance',
    attachmentName: 'Exam_Guidelines_Fall2026.pdf',
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'school_ev_2',
    title: 'Thesis Capstone Proposal Submission Deadline',
    description: 'Final institutional cutoff date for uploading thesis proposals and committee sign-off sheets.',
    startDate: '2026-10-30',
    startTime: '17:00',
    endDate: '2026-10-30',
    endTime: '17:00',
    location: 'Online Research Portal',
    category: 'Academic Deadline',
    publicationStatus: 'published',
    authorAdminId: 'user_admin_eleanor',
    registrationLink: null,
    createdAt: '2026-10-05T09:00:00.000Z',
    updatedAt: '2026-10-05T09:00:00.000Z',
  },
  {
    id: 'school_ev_3',
    title: 'National University Day Holiday (No Classes)',
    description: 'Official non-working holiday celebrating the university charter anniversary.',
    startDate: '2026-11-02',
    startTime: '00:00',
    endDate: '2026-11-02',
    endTime: '23:59',
    location: 'All Campuses',
    category: 'Holiday',
    publicationStatus: 'published',
    authorAdminId: 'user_admin_eleanor',
    registrationLink: null,
    createdAt: '2026-10-05T10:00:00.000Z',
    updatedAt: '2026-10-05T10:00:00.000Z',
  },
  {
    id: 'school_ev_4',
    title: 'Artificial Intelligence & Distributed Cloud Architecture Seminar',
    description: 'Keynote and panel workshop presented by visiting industry leaders from top research labs.',
    startDate: '2026-11-06',
    startTime: '13:30',
    endDate: '2026-11-06',
    endTime: '16:30',
    location: 'Auditorium Magna & Live Stream',
    category: 'Seminar & Workshop',
    publicationStatus: 'published',
    authorAdminId: 'user_admin_eleanor',
    registrationLink: 'https://university.edu/events/cloud-ai-seminar',
    createdAt: '2026-10-12T14:00:00.000Z',
    updatedAt: '2026-10-12T14:00:00.000Z',
  },
];

// Pre-seeded Notifications for default student
const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_1',
    recipientUserId: 'user_alex_morgan',
    type: 'announcement',
    title: 'Urgent: Campus Storage Maintenance',
    message: 'Scheduled storage node maintenance on Saturday 12:00 AM UTC. Intermittent sync pauses may occur.',
    priority: 'urgent',
    relatedEntityType: 'announcement',
    relatedEntityId: 'ann_1',
    readAt: null,
    createdAt: '2026-10-19T08:05:00.000Z',
  },
  {
    id: 'notif_2',
    recipientUserId: 'user_alex_morgan',
    type: 'event',
    title: 'Upcoming Academic Deadline',
    message: 'Thesis Capstone Proposal Submission cutoff is approaching on Oct 30.',
    priority: 'normal',
    relatedEntityType: 'event',
    relatedEntityId: 'school_ev_2',
    readAt: null,
    createdAt: '2026-10-18T09:00:00.000Z',
  },
  {
    id: 'notif_3',
    recipientUserId: 'user_alex_morgan',
    type: 'storage',
    title: 'Files Synced to StudyCloud',
    message: 'Distributed_Cache_Simulator_Code.zip was successfully stored in Research & Thesis Materials.',
    priority: 'normal',
    relatedEntityType: 'file',
    relatedEntityId: 'file_project_code',
    readAt: '2026-10-15T10:00:00.000Z',
    createdAt: '2026-10-14T17:51:00.000Z',
  },
];

// Pre-seeded Audit Logs
const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log_1',
    adminName: 'Dean Eleanor Vance',
    action: 'Published Announcement',
    target: 'Campus High-Speed Backbone & Cloud Storage Storage Node Maintenance',
    timestamp: '2026-10-19T08:00:00.000Z',
  },
  {
    id: 'log_2',
    adminName: 'Dean Eleanor Vance',
    action: 'Updated School Event',
    target: 'University Midterm Examination Week (Added Room Assignment Attachment)',
    timestamp: '2026-10-18T10:35:00.000Z',
  },
  {
    id: 'log_3',
    adminName: 'Dean Eleanor Vance',
    action: 'System Quota Policy Update',
    target: 'Configured default student storage quota: 5.0 GB',
    timestamp: '2026-10-15T14:20:00.000Z',
  },
];

class DatabaseService {
  constructor() {
    this.ensureInitialized();
  }

  private ensureInitialized() {
    if (!localStorage.getItem(USERS_KEY)) {
      localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem(CURRENT_USER_KEY)) {
      localStorage.setItem(CURRENT_USER_KEY, INITIAL_USERS[0].id);
    }
    if (!localStorage.getItem(FOLDERS_KEY)) {
      localStorage.setItem(FOLDERS_KEY, JSON.stringify(INITIAL_FOLDERS));
    }
    if (!localStorage.getItem(FILES_KEY)) {
      localStorage.setItem(FILES_KEY, JSON.stringify(INITIAL_FILES));
    }
    if (!localStorage.getItem(PERSONAL_EVENTS_KEY)) {
      localStorage.setItem(PERSONAL_EVENTS_KEY, JSON.stringify(INITIAL_PERSONAL_EVENTS));
    }
    if (!localStorage.getItem(ANNOUNCEMENTS_KEY)) {
      localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(INITIAL_ANNOUNCEMENTS));
    }
    if (!localStorage.getItem(USER_ANNOUNCEMENT_STATES_KEY)) {
      localStorage.setItem(USER_ANNOUNCEMENT_STATES_KEY, JSON.stringify(INITIAL_USER_ANNOUNCEMENT_STATES));
    }
    if (!localStorage.getItem(SCHOOL_EVENTS_KEY)) {
      localStorage.setItem(SCHOOL_EVENTS_KEY, JSON.stringify(INITIAL_SCHOOL_EVENTS));
    }
    if (!localStorage.getItem(NOTIFICATIONS_KEY)) {
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
    }
    if (!localStorage.getItem(AUDIT_LOGS_KEY)) {
      localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
    }
    if (!localStorage.getItem(CONFIG_KEY)) {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(DEFAULT_CONFIG));
    }
  }

  // Configuration
  getConfig(): SystemConfig {
    const raw = localStorage.getItem(CONFIG_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_CONFIG;
  }

  updateConfig(updates: Partial<SystemConfig>, adminName = 'Dean Eleanor Vance'): SystemConfig {
    const current = this.getConfig();
    const updated = { ...current, ...updates };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(updated));
    this.addAuditLog(adminName, 'Updated System Settings', JSON.stringify(updates));
    return updated;
  }

  // Users
  getUsers(): User[] {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : INITIAL_USERS;
  }

  getUserById(id: string): User | null {
    const users = this.getUsers();
    return users.find((u) => u.id === id) || null;
  }

  getUserByEmail(email: string): User | null {
    const users = this.getUsers();
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  getCurrentUser(): User | null {
    const currentId = localStorage.getItem(CURRENT_USER_KEY);
    if (!currentId) return null;
    return this.getUserById(currentId);
  }

  setCurrentUser(userId: string | null) {
    if (userId) {
      localStorage.setItem(CURRENT_USER_KEY, userId);
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }

  upsertUser(userData: Partial<User> & { email: string }): User {
    const users = this.getUsers();
    const existingIndex = users.findIndex((u) => u.email.toLowerCase() === userData.email.toLowerCase());
    const now = new Date().toISOString();
    const config = this.getConfig();

    if (existingIndex >= 0) {
      const updatedUser: User = {
        ...users[existingIndex],
        ...userData,
        updatedAt: now,
      };
      users[existingIndex] = updatedUser;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      return updatedUser;
    } else {
      const newUser: User = {
        id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        providerId: userData.providerId || `google_${Date.now()}`,
        fullName: userData.fullName || 'New Student',
        displayName: userData.displayName || userData.fullName || 'Student',
        email: userData.email,
        profilePictureUrl: userData.profilePictureUrl || '/src/assets/images/student_avatar_portrait_1792551232666.jpg',
        role: userData.role || 'student',
        studentId: userData.studentId || `UM-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        course: userData.course || 'Undergraduate Degree',
        yearLevel: userData.yearLevel || '1st Year',
        section: userData.section || 'A',
        storageQuotaBytes: config.defaultQuotaBytes,
        isSetupComplete: false,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };
      users.push(newUser);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      return newUser;
    }
  }

  updateUser(id: string, updates: Partial<User>): User | null {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx < 0) return null;
    users[idx] = { ...users[idx], ...updates, updatedAt: new Date().toISOString() };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return users[idx];
  }

  // Folders
  getFolders(userId: string): Folder[] {
    const raw = localStorage.getItem(FOLDERS_KEY);
    const allFolders: Folder[] = raw ? JSON.parse(raw) : [];
    return allFolders.filter((f) => f.ownerUserId === userId);
  }

  createFolder(ownerUserId: string, name: string, parentFolderId: string | null = null, color = '#0284c7'): Folder {
    const raw = localStorage.getItem(FOLDERS_KEY);
    const allFolders: Folder[] = raw ? JSON.parse(raw) : [];
    const now = new Date().toISOString();
    const newFolder: Folder = {
      id: `folder_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ownerUserId,
      parentFolderId,
      name: name.trim(),
      color,
      createdAt: now,
      updatedAt: now,
    };
    allFolders.push(newFolder);
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(allFolders));
    return newFolder;
  }

  renameFolder(folderId: string, newName: string): Folder | null {
    const raw = localStorage.getItem(FOLDERS_KEY);
    const allFolders: Folder[] = raw ? JSON.parse(raw) : [];
    const idx = allFolders.findIndex((f) => f.id === folderId);
    if (idx < 0) return null;
    allFolders[idx].name = newName.trim();
    allFolders[idx].updatedAt = new Date().toISOString();
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(allFolders));
    return allFolders[idx];
  }

  deleteFolder(folderId: string): boolean {
    const raw = localStorage.getItem(FOLDERS_KEY);
    const allFolders: Folder[] = raw ? JSON.parse(raw) : [];
    const filtered = allFolders.filter((f) => f.id !== folderId && f.parentFolderId !== folderId);
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(filtered));

    // Also move files inside this folder to root or soft delete
    const filesRaw = localStorage.getItem(FILES_KEY);
    if (filesRaw) {
      const files: FileItem[] = JSON.parse(filesRaw);
      const updatedFiles = files.map((file) => {
        if (file.folderId === folderId) {
          return { ...file, folderId: null, updatedAt: new Date().toISOString() };
        }
        return file;
      });
      localStorage.setItem(FILES_KEY, JSON.stringify(updatedFiles));
    }
    return true;
  }

  // Files
  getFiles(userId: string, includeTrash = false): FileItem[] {
    const raw = localStorage.getItem(FILES_KEY);
    const allFiles: FileItem[] = raw ? JSON.parse(raw) : [];
    return allFiles.filter((f) => f.ownerUserId === userId && (includeTrash ? true : !f.isDeleted));
  }

  getAllFilesCountAndSize(): { count: number; totalBytes: number } {
    const raw = localStorage.getItem(FILES_KEY);
    const allFiles: FileItem[] = raw ? JSON.parse(raw) : [];
    const active = allFiles.filter((f) => !f.isDeleted);
    const totalBytes = active.reduce((acc, f) => acc + f.fileSize, 0);
    return { count: active.length, totalBytes };
  }

  async addFile(
    ownerUserId: string,
    fileObj: {
      name: string;
      size: number;
      type: string;
      folderId?: string | null;
      blob?: Blob;
    }
  ): Promise<FileItem> {
    const raw = localStorage.getItem(FILES_KEY);
    const allFiles: FileItem[] = raw ? JSON.parse(raw) : [];
    const now = new Date().toISOString();
    const id = `file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const { category, extension } = detectFileCategory(fileObj.name, fileObj.type);

    if (fileObj.blob) {
      await blobStore.saveBlob(id, fileObj.blob);
    }

    // Check for duplicate name in same folder
    let finalName = fileObj.name;
    const existingSameName = allFiles.filter(
      (f) => f.ownerUserId === ownerUserId && f.folderId === (fileObj.folderId || null) && !f.isDeleted && f.name === finalName
    );
    if (existingSameName.length > 0) {
      const nameParts = fileObj.name.split('.');
      const ext = nameParts.length > 1 ? `.${nameParts.pop()}` : '';
      const base = nameParts.join('.');
      finalName = `${base} (${existingSameName.length})${ext}`;
    }

    const newFile: FileItem = {
      id,
      ownerUserId,
      folderId: fileObj.folderId || null,
      name: finalName,
      mimeType: fileObj.type || 'application/octet-stream',
      fileSize: fileObj.size,
      category,
      extension,
      isFavorite: false,
      isDeleted: false,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    allFiles.unshift(newFile);
    localStorage.setItem(FILES_KEY, JSON.stringify(allFiles));

    // Send a notification
    this.addNotification({
      recipientUserId: ownerUserId,
      type: 'storage',
      title: 'File Uploaded Successfully',
      message: `${finalName} (${formatBytes(fileObj.size)}) is safely stored in Acadex.`,
      priority: 'normal',
      relatedEntityType: 'file',
      relatedEntityId: id,
    });

    return newFile;
  }

  updateFile(fileId: string, updates: Partial<FileItem>): FileItem | null {
    const raw = localStorage.getItem(FILES_KEY);
    const allFiles: FileItem[] = raw ? JSON.parse(raw) : [];
    const idx = allFiles.findIndex((f) => f.id === fileId);
    if (idx < 0) return null;
    allFiles[idx] = { ...allFiles[idx], ...updates, updatedAt: new Date().toISOString() };
    localStorage.setItem(FILES_KEY, JSON.stringify(allFiles));
    return allFiles[idx];
  }

  moveToTrash(fileId: string): boolean {
    const raw = localStorage.getItem(FILES_KEY);
    const allFiles: FileItem[] = raw ? JSON.parse(raw) : [];
    const idx = allFiles.findIndex((f) => f.id === fileId);
    if (idx < 0) return false;
    allFiles[idx].isDeleted = true;
    allFiles[idx].deletedAt = new Date().toISOString();
    allFiles[idx].updatedAt = new Date().toISOString();
    localStorage.setItem(FILES_KEY, JSON.stringify(allFiles));
    return true;
  }

  restoreFromTrash(fileId: string): boolean {
    const raw = localStorage.getItem(FILES_KEY);
    const allFiles: FileItem[] = raw ? JSON.parse(raw) : [];
    const idx = allFiles.findIndex((f) => f.id === fileId);
    if (idx < 0) return false;
    allFiles[idx].isDeleted = false;
    allFiles[idx].deletedAt = null;
    allFiles[idx].updatedAt = new Date().toISOString();
    localStorage.setItem(FILES_KEY, JSON.stringify(allFiles));
    return true;
  }

  async permanentDeleteFile(fileId: string): Promise<boolean> {
    const raw = localStorage.getItem(FILES_KEY);
    const allFiles: FileItem[] = raw ? JSON.parse(raw) : [];
    const filtered = allFiles.filter((f) => f.id !== fileId);
    localStorage.setItem(FILES_KEY, JSON.stringify(filtered));
    await blobStore.deleteBlob(fileId);
    return true;
  }

  async emptyTrash(userId: string): Promise<number> {
    const raw = localStorage.getItem(FILES_KEY);
    const allFiles: FileItem[] = raw ? JSON.parse(raw) : [];
    const toDelete = allFiles.filter((f) => f.ownerUserId === userId && f.isDeleted);
    const remaining = allFiles.filter((f) => !(f.ownerUserId === userId && f.isDeleted));
    localStorage.setItem(FILES_KEY, JSON.stringify(remaining));

    for (const file of toDelete) {
      await blobStore.deleteBlob(file.id);
    }
    return toDelete.length;
  }

  // Storage breakdown calculations
  getStorageBreakdown(userId: string): StorageBreakdown {
    const user = this.getUserById(userId);
    const quota = user ? user.storageQuotaBytes : this.getConfig().defaultQuotaBytes;
    const files = this.getFiles(userId, false);

    let documentsBytes = 0;
    let videosBytes = 0;
    let imagesBytes = 0;
    let audioBytes = 0;
    let archivesBytes = 0;
    let othersBytes = 0;

    for (const f of files) {
      switch (f.category) {
        case 'document':
          documentsBytes += f.fileSize;
          break;
        case 'video':
          videosBytes += f.fileSize;
          break;
        case 'image':
          imagesBytes += f.fileSize;
          break;
        case 'audio':
          audioBytes += f.fileSize;
          break;
        case 'archive':
          archivesBytes += f.fileSize;
          break;
        default:
          othersBytes += f.fileSize;
      }
    }

    const usedBytes = documentsBytes + videosBytes + imagesBytes + audioBytes + archivesBytes + othersBytes;
    const availableBytes = Math.max(0, quota - usedBytes);
    const percentageUsed = quota > 0 ? Math.min(100, Math.round((usedBytes / quota) * 100)) : 0;

    return {
      totalBytes: quota,
      usedBytes,
      availableBytes,
      percentageUsed,
      documentsBytes,
      videosBytes,
      imagesBytes,
      audioBytes,
      archivesBytes,
      othersBytes,
    };
  }

  // Personal Events
  getPersonalEvents(userId: string): PersonalEvent[] {
    const raw = localStorage.getItem(PERSONAL_EVENTS_KEY);
    const all: PersonalEvent[] = raw ? JSON.parse(raw) : [];
    return all.filter((e) => e.ownerUserId === userId).sort((a, b) => `${a.startDate} ${a.startTime}`.localeCompare(`${b.startDate} ${b.startTime}`));
  }

  addPersonalEvent(event: Omit<PersonalEvent, 'id' | 'createdAt' | 'updatedAt'>): PersonalEvent {
    const raw = localStorage.getItem(PERSONAL_EVENTS_KEY);
    const all: PersonalEvent[] = raw ? JSON.parse(raw) : [];
    const now = new Date().toISOString();
    const newEvent: PersonalEvent = {
      ...event,
      id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };
    all.push(newEvent);
    localStorage.setItem(PERSONAL_EVENTS_KEY, JSON.stringify(all));
    return newEvent;
  }

  updatePersonalEvent(eventId: string, updates: Partial<PersonalEvent>): PersonalEvent | null {
    const raw = localStorage.getItem(PERSONAL_EVENTS_KEY);
    const all: PersonalEvent[] = raw ? JSON.parse(raw) : [];
    const idx = all.findIndex((e) => e.id === eventId);
    if (idx < 0) return null;
    all[idx] = { ...all[idx], ...updates, updatedAt: new Date().toISOString() };
    localStorage.setItem(PERSONAL_EVENTS_KEY, JSON.stringify(all));
    return all[idx];
  }

  deletePersonalEvent(eventId: string): boolean {
    const raw = localStorage.getItem(PERSONAL_EVENTS_KEY);
    const all: PersonalEvent[] = raw ? JSON.parse(raw) : [];
    const filtered = all.filter((e) => e.id !== eventId);
    localStorage.setItem(PERSONAL_EVENTS_KEY, JSON.stringify(filtered));
    return true;
  }

  // Announcements Centralized Management
  checkAndPromoteScheduled(): void {
    const raw = localStorage.getItem(ANNOUNCEMENTS_KEY);
    if (!raw) return;
    const all: Announcement[] = JSON.parse(raw);
    const now = new Date();
    let hasChanges = false;

    all.forEach((ann) => {
      if (ann.publicationStatus === 'scheduled' && ann.scheduledAt) {
        const scheduledTime = new Date(ann.scheduledAt);
        if (scheduledTime <= now) {
          ann.publicationStatus = 'published';
          ann.publishedAt = ann.scheduledAt;
          hasChanges = true;

          // Dispatch notifications to eligible students
          const users = this.getUsers().filter((u) => u.role === 'student');
          for (const student of users) {
            if (this.isUserEligibleForAnnouncement(student, ann)) {
              this.addNotification({
                recipientUserId: student.id,
                type: 'announcement',
                title: `${ann.priority === 'Urgent' ? '🚨 URGENT: ' : ''}${ann.title}`,
                message: ann.content.substring(0, 120) + (ann.content.length > 120 ? '...' : ''),
                priority: ann.priority === 'Urgent' ? 'urgent' : 'normal',
                relatedEntityType: 'announcement',
                relatedEntityId: ann.id,
              });
            }
          }
        }
      }
    });

    if (hasChanges) {
      localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(all));
    }
  }

  isUserEligibleForAnnouncement(user: User, announcement: Announcement): boolean {
    if (user.role === 'admin') return true;
    if (announcement.targetType === 'everyone') return true;

    if (announcement.targetType === 'users') {
      return !!announcement.targetUserIds?.includes(user.id);
    }

    if (announcement.targetType === 'groups') {
      const groups = announcement.targetGroups || [];
      if (groups.length === 0) return true;
      const matchesCourse = user.course && groups.includes(user.course);
      const matchesYear = user.yearLevel && groups.includes(user.yearLevel);
      const matchesSection = user.section && groups.includes(user.section);
      return !!(matchesCourse || matchesYear || matchesSection);
    }

    return true;
  }

  getAnnouncements(onlyPublished = true): Announcement[] {
    this.checkAndPromoteScheduled();
    const raw = localStorage.getItem(ANNOUNCEMENTS_KEY);
    const all: Announcement[] = raw ? JSON.parse(raw) : [];
    const filtered = onlyPublished ? all.filter((a) => a.publicationStatus === 'published') : all;
    return filtered.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime();
    });
  }

  getAnnouncementsForUser(user: User, onlyActive = true): Announcement[] {
    this.checkAndPromoteScheduled();
    const raw = localStorage.getItem(ANNOUNCEMENTS_KEY);
    const all: Announcement[] = raw ? JSON.parse(raw) : [];
    const now = new Date();

    return all.filter((ann) => {
      if (ann.publicationStatus !== 'published') return false;
      if (onlyActive && ann.expiresAt && new Date(ann.expiresAt) < now) return false;
      return this.isUserEligibleForAnnouncement(user, ann);
    }).sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime();
    });
  }

  getUserAnnouncementStates(): UserAnnouncementState[] {
    const raw = localStorage.getItem(USER_ANNOUNCEMENT_STATES_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  getUserAnnouncementState(announcementId: string, userId: string): UserAnnouncementState | null {
    const states = this.getUserAnnouncementStates();
    return states.find((s) => s.announcementId === announcementId && s.userId === userId) || null;
  }

  setUserAnnouncementState(update: Partial<UserAnnouncementState> & { announcementId: string; userId: string }): UserAnnouncementState {
    const states = this.getUserAnnouncementStates();
    const idx = states.findIndex((s) => s.announcementId === update.announcementId && s.userId === update.userId);
    const now = new Date().toISOString();

    if (idx >= 0) {
      states[idx] = { ...states[idx], ...update };
      localStorage.setItem(USER_ANNOUNCEMENT_STATES_KEY, JSON.stringify(states));
      return states[idx];
    } else {
      const newState: UserAnnouncementState = {
        id: `state_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        deliveredAt: update.deliveredAt || now,
        firstViewedAt: update.firstViewedAt || null,
        readAt: update.readAt || null,
        dismissedAt: update.dismissedAt || null,
        acknowledgedAt: update.acknowledgedAt || null,
        lastNotifiedVersion: update.lastNotifiedVersion || 1,
        ...update,
      };
      states.push(newState);
      localStorage.setItem(USER_ANNOUNCEMENT_STATES_KEY, JSON.stringify(states));
      return newState;
    }
  }

  getPendingPopupsForUser(user: User): Announcement[] {
    const eligibleAnnouncements = this.getAnnouncementsForUser(user, true);

    return eligibleAnnouncements.filter((ann) => {
      // Must be configured for popup or marked urgent
      const isPopupCandidate = ann.displayMethod === 'popup' || ann.priority === 'Urgent';
      if (!isPopupCandidate) return false;

      const state = this.getUserAnnouncementState(ann.id, user.id);

      // If user acknowledged it, popup is satisfied
      if (ann.requireAcknowledgment) {
        return !state?.acknowledgedAt;
      }

      // If not requiring explicit acknowledgment, check dismissal and version
      if (!state) return true;
      if (!state.dismissedAt && !state.readAt) return true;
      // If administrator republished with higher versionNumber, prompt again
      if (ann.versionNumber > (state.lastNotifiedVersion || 0) && ann.notifyOnUpdate) return true;

      return false;
    });
  }

  dismissAnnouncement(announcementId: string, userId: string): void {
    const ann = this.getAnnouncements(false).find((a) => a.id === announcementId);
    if (!ann) return;

    const dismissed = new Set(ann.dismissedByUserIds || []);
    dismissed.add(userId);
    ann.dismissedByUserIds = Array.from(dismissed);

    this.updateAnnouncement(ann.id, { dismissedByUserIds: ann.dismissedByUserIds });
    this.setUserAnnouncementState({
      announcementId,
      userId,
      dismissedAt: new Date().toISOString(),
      lastNotifiedVersion: ann.versionNumber,
    });
  }

  acknowledgeAnnouncement(announcementId: string, userId: string): void {
    const ann = this.getAnnouncements(false).find((a) => a.id === announcementId);
    if (!ann) return;

    const acks = new Set(ann.acknowledgedByUserIds || []);
    acks.add(userId);
    ann.acknowledgedByUserIds = Array.from(acks);

    const reads = new Set(ann.readByUserIds || []);
    reads.add(userId);
    ann.readByUserIds = Array.from(reads);

    const now = new Date().toISOString();
    this.updateAnnouncement(ann.id, {
      acknowledgedByUserIds: ann.acknowledgedByUserIds,
      readByUserIds: ann.readByUserIds,
    });

    this.setUserAnnouncementState({
      announcementId,
      userId,
      readAt: now,
      acknowledgedAt: now,
      dismissedAt: now,
      lastNotifiedVersion: ann.versionNumber,
    });
  }

  addAnnouncement(
    announcement: Omit<Announcement, 'id' | 'readByUserIds' | 'acknowledgedByUserIds' | 'dismissedByUserIds' | 'createdAt' | 'updatedAt' | 'versionNumber'> & { versionNumber?: number },
    adminName = 'Administrator'
  ): Announcement {
    const raw = localStorage.getItem(ANNOUNCEMENTS_KEY);
    const all: Announcement[] = raw ? JSON.parse(raw) : [];
    const now = new Date().toISOString();
    const newAnn: Announcement = {
      ...announcement,
      id: `ann_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      versionNumber: announcement.versionNumber || 1,
      readByUserIds: [],
      acknowledgedByUserIds: [],
      dismissedByUserIds: [],
      createdAt: now,
      updatedAt: now,
    };
    all.unshift(newAnn);
    localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(all));

    // Audit log
    this.addAuditLog(adminName, 'Created Announcement', `${newAnn.title} (${newAnn.publicationStatus})`);

    // Notify eligible students if published immediately
    if (newAnn.publicationStatus === 'published') {
      const users = this.getUsers().filter((u) => u.role === 'student');
      for (const student of users) {
        if (this.isUserEligibleForAnnouncement(student, newAnn)) {
          this.addNotification({
            recipientUserId: student.id,
            type: 'announcement',
            title: `${newAnn.priority === 'Urgent' ? '🚨 URGENT: ' : ''}${newAnn.title}`,
            message: newAnn.content.substring(0, 120) + (newAnn.content.length > 120 ? '...' : ''),
            priority: newAnn.priority === 'Urgent' ? 'urgent' : 'normal',
            relatedEntityType: 'announcement',
            relatedEntityId: newAnn.id,
          });

          // Seed user announcement state
          this.setUserAnnouncementState({
            announcementId: newAnn.id,
            userId: student.id,
            deliveredAt: now,
            lastNotifiedVersion: newAnn.versionNumber,
          });
        }
      }
    }

    return newAnn;
  }

  updateAnnouncement(id: string, updates: Partial<Announcement>, adminName = 'Administrator'): Announcement | null {
    const raw = localStorage.getItem(ANNOUNCEMENTS_KEY);
    const all: Announcement[] = raw ? JSON.parse(raw) : [];
    const idx = all.findIndex((a) => a.id === id);
    if (idx < 0) return null;

    const previous = all[idx];
    const newVersion = updates.notifyOnUpdate ? previous.versionNumber + 1 : previous.versionNumber;

    all[idx] = {
      ...previous,
      ...updates,
      versionNumber: newVersion,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(all));
    this.addAuditLog(adminName, 'Updated Announcement', `${all[idx].title} (v${newVersion})`);

    // If notifyOnUpdate was requested, notify eligible students again
    if (updates.notifyOnUpdate && all[idx].publicationStatus === 'published') {
      const users = this.getUsers().filter((u) => u.role === 'student');
      for (const student of users) {
        if (this.isUserEligibleForAnnouncement(student, all[idx])) {
          this.addNotification({
            recipientUserId: student.id,
            type: 'announcement',
            title: `Updated Advisory: ${all[idx].title}`,
            message: all[idx].content.substring(0, 120) + (all[idx].content.length > 120 ? '...' : ''),
            priority: all[idx].priority === 'Urgent' ? 'urgent' : 'normal',
            relatedEntityType: 'announcement',
            relatedEntityId: all[idx].id,
          });
        }
      }
    }

    return all[idx];
  }

  unpublishAnnouncement(id: string, adminName = 'Administrator'): boolean {
    const ann = this.getAnnouncements(false).find((a) => a.id === id);
    if (!ann) return false;
    this.updateAnnouncement(id, { publicationStatus: 'unpublished' }, adminName);
    this.addAuditLog(adminName, 'Unpublished Announcement', ann.title);
    return true;
  }

  archiveAnnouncement(id: string, adminName = 'Administrator'): boolean {
    const ann = this.getAnnouncements(false).find((a) => a.id === id);
    if (!ann) return false;
    this.updateAnnouncement(id, { publicationStatus: 'archived' }, adminName);
    this.addAuditLog(adminName, 'Archived Announcement', ann.title);
    return true;
  }

  restoreAnnouncement(id: string, adminName = 'Administrator'): boolean {
    const ann = this.getAnnouncements(false).find((a) => a.id === id);
    if (!ann) return false;
    this.updateAnnouncement(id, { publicationStatus: 'published', publishedAt: new Date().toISOString() }, adminName);
    this.addAuditLog(adminName, 'Restored Announcement to Published', ann.title);
    return true;
  }

  deleteAnnouncement(id: string, adminName = 'Administrator'): boolean {
    const raw = localStorage.getItem(ANNOUNCEMENTS_KEY);
    const all: Announcement[] = raw ? JSON.parse(raw) : [];
    const target = all.find((a) => a.id === id);
    const filtered = all.filter((a) => a.id !== id);
    localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(filtered));

    // Also clean up states
    const statesRaw = localStorage.getItem(USER_ANNOUNCEMENT_STATES_KEY);
    if (statesRaw) {
      const states: UserAnnouncementState[] = JSON.parse(statesRaw);
      const filteredStates = states.filter((s) => s.announcementId !== id);
      localStorage.setItem(USER_ANNOUNCEMENT_STATES_KEY, JSON.stringify(filteredStates));
    }

    if (target) {
      this.addAuditLog(adminName, 'Permanently Deleted Announcement', target.title);
    }
    return true;
  }

  toggleAnnouncementRead(announcementId: string, userId: string): boolean {
    const raw = localStorage.getItem(ANNOUNCEMENTS_KEY);
    const all: Announcement[] = raw ? JSON.parse(raw) : [];
    const idx = all.findIndex((a) => a.id === announcementId);
    if (idx < 0) return false;
    const reads = new Set(all[idx].readByUserIds || []);
    let isReadNow = false;
    if (reads.has(userId)) {
      reads.delete(userId);
      isReadNow = false;
    } else {
      reads.add(userId);
      isReadNow = true;
    }
    all[idx].readByUserIds = Array.from(reads);
    localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(all));

    this.setUserAnnouncementState({
      announcementId,
      userId,
      readAt: isReadNow ? new Date().toISOString() : null,
    });
    return true;
  }

  getAnnouncementAnalytics(announcementId: string) {
    const ann = this.getAnnouncements(false).find((a) => a.id === announcementId);
    if (!ann) return null;

    const allStudents = this.getUsers().filter((u) => u.role === 'student');
    const eligibleStudents = allStudents.filter((u) => this.isUserEligibleForAnnouncement(u, ann));
    const states = this.getUserAnnouncementStates().filter((s) => s.announcementId === announcementId);

    const readSet = new Set(ann.readByUserIds || []);
    const ackSet = new Set(ann.acknowledgedByUserIds || []);
    const dismissSet = new Set(ann.dismissedByUserIds || []);

    const recipients = eligibleStudents.map((student) => {
      const state = states.find((s) => s.userId === student.id);
      return {
        student,
        isRead: readSet.has(student.id),
        isAcknowledged: ackSet.has(student.id),
        isDismissed: dismissSet.has(student.id),
        readAt: state?.readAt || null,
        acknowledgedAt: state?.acknowledgedAt || null,
      };
    });

    return {
      totalEligible: eligibleStudents.length,
      readCount: recipients.filter((r) => r.isRead).length,
      acknowledgedCount: recipients.filter((r) => r.isAcknowledged).length,
      dismissedCount: recipients.filter((r) => r.isDismissed).length,
      recipients,
    };
  }

  // School Events
  getSchoolEvents(onlyPublished = true): SchoolEvent[] {
    const raw = localStorage.getItem(SCHOOL_EVENTS_KEY);
    const all: SchoolEvent[] = raw ? JSON.parse(raw) : [];
    const filtered = onlyPublished ? all.filter((e) => e.publicationStatus === 'published') : all;
    return filtered.sort((a, b) => `${a.startDate} ${a.startTime}`.localeCompare(`${b.startDate} ${b.startTime}`));
  }

  addSchoolEvent(event: Omit<SchoolEvent, 'id' | 'createdAt' | 'updatedAt'>, adminName = 'Administrator'): SchoolEvent {
    const raw = localStorage.getItem(SCHOOL_EVENTS_KEY);
    const all: SchoolEvent[] = raw ? JSON.parse(raw) : [];
    const now = new Date().toISOString();
    const newEv: SchoolEvent = {
      ...event,
      id: `school_ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };
    all.push(newEv);
    localStorage.setItem(SCHOOL_EVENTS_KEY, JSON.stringify(all));

    this.addAuditLog(adminName, 'Created School Event', newEv.title);

    // Notify students
    const users = this.getUsers().filter((u) => u.role === 'student');
    for (const student of users) {
      this.addNotification({
        recipientUserId: student.id,
        type: 'event',
        title: `Official School Event: ${newEv.title}`,
        message: `${newEv.category} scheduled for ${newEv.startDate} at ${newEv.location}.`,
        priority: 'normal',
        relatedEntityType: 'event',
        relatedEntityId: newEv.id,
      });
    }

    return newEv;
  }

  updateSchoolEvent(id: string, updates: Partial<SchoolEvent>, adminName = 'Administrator'): SchoolEvent | null {
    const raw = localStorage.getItem(SCHOOL_EVENTS_KEY);
    const all: SchoolEvent[] = raw ? JSON.parse(raw) : [];
    const idx = all.findIndex((e) => e.id === id);
    if (idx < 0) return null;
    all[idx] = { ...all[idx], ...updates, updatedAt: new Date().toISOString() };
    localStorage.setItem(SCHOOL_EVENTS_KEY, JSON.stringify(all));
    this.addAuditLog(adminName, 'Updated School Event', all[idx].title);
    return all[idx];
  }

  deleteSchoolEvent(id: string, adminName = 'Administrator'): boolean {
    const raw = localStorage.getItem(SCHOOL_EVENTS_KEY);
    const all: SchoolEvent[] = raw ? JSON.parse(raw) : [];
    const target = all.find((e) => e.id === id);
    const filtered = all.filter((e) => e.id !== id);
    localStorage.setItem(SCHOOL_EVENTS_KEY, JSON.stringify(filtered));
    if (target) {
      this.addAuditLog(adminName, 'Deleted School Event', target.title);
    }
    return true;
  }

  // Notifications
  getNotifications(userId: string): NotificationItem[] {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    const all: NotificationItem[] = raw ? JSON.parse(raw) : [];
    return all
      .filter((n) => n.recipientUserId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  addNotification(notification: Omit<NotificationItem, 'id' | 'readAt' | 'createdAt'>): NotificationItem {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    const all: NotificationItem[] = raw ? JSON.parse(raw) : [];
    const newNotif: NotificationItem = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      readAt: null,
      createdAt: new Date().toISOString(),
    };
    all.unshift(newNotif);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(all));
    return newNotif;
  }

  markNotificationAsRead(notifId: string): boolean {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    const all: NotificationItem[] = raw ? JSON.parse(raw) : [];
    const idx = all.findIndex((n) => n.id === notifId);
    if (idx < 0) return false;
    all[idx].readAt = new Date().toISOString();
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(all));
    return true;
  }

  markAllNotificationsAsRead(userId: string): void {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    const all: NotificationItem[] = raw ? JSON.parse(raw) : [];
    const now = new Date().toISOString();
    const updated = all.map((n) => (n.recipientUserId === userId && !n.readAt ? { ...n, readAt: now } : n));
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
  }

  clearNotifications(userId: string): void {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    const all: NotificationItem[] = raw ? JSON.parse(raw) : [];
    const updated = all.filter((n) => n.recipientUserId !== userId);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
  }

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    const raw = localStorage.getItem(AUDIT_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  addAuditLog(adminName: string, action: string, target: string): void {
    const logs = this.getAuditLogs();
    logs.unshift({
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      adminName,
      action,
      target,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs.slice(0, 100))); // keep latest 100
  }
}

export const db = new DatabaseService();
