export type UserRole = 'student' | 'admin';

export interface User {
  id: string;
  providerId: string;
  fullName: string;
  displayName: string;
  email: string;
  profilePictureUrl: string;
  role: UserRole;
  studentId?: string;
  course?: string;
  yearLevel?: string;
  section?: string;
  storageQuotaBytes: number; // e.g. 5 GB
  isSetupComplete: boolean;
  status: 'active' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export type FileCategory = 'document' | 'video' | 'image' | 'audio' | 'archive' | 'other';

export interface Folder {
  id: string;
  ownerUserId: string;
  parentFolderId: string | null;
  name: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileItem {
  id: string;
  ownerUserId: string;
  folderId: string | null;
  name: string;
  mimeType: string;
  fileSize: number; // in bytes
  category: FileCategory;
  extension: string;
  storageUrl?: string; // Blob or Data URL
  blobData?: Blob;
  isFavorite: boolean;
  isDeleted: boolean; // Trash
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type EventCategory = 'Assignment' | 'Examination' | 'Project' | 'Meeting' | 'Personal';

export interface PersonalEvent {
  id: string;
  ownerUserId: string;
  title: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endDate: string; // YYYY-MM-DD
  endTime: string; // HH:mm
  location?: string;
  category: EventCategory;
  reminder: boolean;
  color: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AnnouncementPriority = 'Normal' | 'Important' | 'Urgent';
export type PublicationStatus = 'published' | 'draft' | 'scheduled' | 'unpublished' | 'archived';
export type AnnouncementTargetType = 'everyone' | 'users' | 'groups';
export type AnnouncementDisplayMethod = 'card' | 'bell' | 'popup' | 'banner';
export type AnnouncementCategory =
  | 'Academic Advisory'
  | 'Campus Maintenance'
  | 'Exam Clearance'
  | 'Event & Activity'
  | 'Emergency Notice'
  | 'General Info';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  authorName: string;
  authorAdminId: string;
  authorRole: string;
  priority: AnnouncementPriority;
  displayMethod: AnnouncementDisplayMethod;
  targetType: AnnouncementTargetType;
  targetUserIds?: string[]; // Specific user IDs when targetType === 'users'
  targetGroups?: string[]; // Groups (e.g. "BS in Computer Science", "3rd Year") when targetType === 'groups'
  publicationStatus: PublicationStatus;
  publishedAt: string | null;
  scheduledAt: string | null;
  expiresAt: string | null;
  isPinned: boolean;
  requireAcknowledgment: boolean;
  notifyOnUpdate: boolean;
  versionNumber: number;
  coverImageUrl?: string | null;
  actionButtonLabel?: string | null;
  actionButtonUrl?: string | null;
  attachmentName?: string | null;
  attachmentUrl?: string | null;
  attachmentSize?: number | null;
  readByUserIds: string[];
  acknowledgedByUserIds: string[];
  dismissedByUserIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserAnnouncementState {
  id: string;
  announcementId: string;
  userId: string;
  deliveredAt: string;
  firstViewedAt: string | null;
  readAt: string | null;
  dismissedAt: string | null;
  acknowledgedAt: string | null;
  lastNotifiedVersion: number;
}

export type SchoolEventCategory =
  | 'Academic Deadline'
  | 'Examination Schedule'
  | 'School Activity'
  | 'Seminar & Workshop'
  | 'Holiday';

export interface SchoolEvent {
  id: string;
  title: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endDate: string; // YYYY-MM-DD
  endTime: string; // HH:mm
  location: string;
  category: SchoolEventCategory;
  publicationStatus: PublicationStatus;
  authorAdminId: string;
  registrationLink?: string | null;
  attachmentName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType = 'announcement' | 'event' | 'storage' | 'system';

export interface NotificationItem {
  id: string;
  recipientUserId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: 'normal' | 'urgent';
  relatedEntityType?: 'announcement' | 'event' | 'file' | null;
  relatedEntityId?: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  adminId?: string;
  adminName: string;
  action: string;
  target: string;
  details?: string;
  timestamp: string;
}

export interface StorageBreakdown {
  totalBytes: number;
  usedBytes: number;
  availableBytes: number;
  percentageUsed: number;
  documentsBytes: number;
  videosBytes: number;
  imagesBytes: number;
  audioBytes: number;
  archivesBytes: number;
  othersBytes: number;
}
