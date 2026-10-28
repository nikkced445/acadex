# Acadex StudyCloud — Student Cloud Storage & Academic Dashboard

**Acadex StudyCloud** is a modern, responsive, and secure academic cloud storage and information dashboard system designed specifically for students and academic institutions. It centralizes personal course file storage, multimedia lectures, student-created events, official administrator announcements, and academic scheduling in one unified workspace.

---

## 🚀 Key Features Implemented

### 1. Authentication & Onboarding
- **Google OAuth Sign-In**: Dedicated, full-screen login interface with institutional & personal Google authentication flow.
- **Role-Based Access Control (RBAC)**: Secure separation between `student` and `admin` roles.
- **Profile Initialization & Setup**: First-login onboarding modal capturing student ID, year level, course program, section block, and customizable display name.
- **Fast Role Switcher**: Quick toggle between Student (`Alex Morgan`) and Administrator (`Dean Eleanor Vance`) for immediate review and testing.

### 2. Personal Cloud Storage & File Management
- **Universal File Type Support**: Upload, organize, and preview PDFs, Word documents, Excel sheets, PowerPoint presentations, MP4 videos, MP3 audio, PNG/JPG images, and ZIP archives.
- **Real Binary Storage**: Uses browser **IndexedDB (`StudyCloud_BlobsDB`)** for real binary file blob persistence across sessions, enabling high-performance local storage without external API leaks.
- **Drag-and-Drop & File Picker**: Multi-file uploads with progress bar, duplicate filename resolution, and client-side quota checking.
- **Folder Hierarchy & Organization**: Create, rename, and delete color-coded subject folders; move files between folders; rename; and star favorites.
- **Soft Delete & Trash Management**: Move files to Trash, restore accidentally removed files, or permanently empty trash to reclaim disk space.
- **Built-in Interactive Previews**:
  - **Images**: Zoom in/out, pan, full-screen preview.
  - **Videos**: Built-in HTML5 player with playback controls.
  - **Audio**: Audio player with scrubbers and playback time.
  - **Documents / PDFs**: PDF reader iframe and instant document download.

### 3. Student-Created Events ("My Events")
- Add, edit, and delete personal academic tasks, examinations, assignments, project sprints, and meetings.
- Set dates, time windows, campus locations, color badges, and notification reminder toggles.
- Categorization by Assignment, Examination, Project, Meeting, and Personal.
- Task completion checkbox tracking.

### 4. Official School Announcements & Advisories
- Administrative publishing system for broadcast notices.
- Priority tagging: `Urgent` (red), `Important` (amber), and `Normal` (sky blue).
- Pinning to top of student dashboards.
- Downloadable official PDF advisory attachments.
- Per-student read/unread tracking.

### 5. Unified Academic Calendar
- **Month & Agenda Views**: Synchronizes both student personal events and administrator-published school events.
- **Visual Distinction**: Color badges and icons clearly identify "My Event" versus official "School Event".
- **Date Navigation**: Jump to Today, Previous Month, or Next Month with live day indicators.

### 6. Real-Time Storage Analytics
- **Live Dynamic Quota**: Calculated from actual file byte counts in storage.
- **File Type Breakdown**: Documents, Videos, Images, Audio, and Archives visual gauges.
- **Folder Distribution**: Space consumed by each subject folder.
- **Largest Files Inspector**: Quick sorting and cleanup of high-footprint files.

### 7. Administrator Console
- Restricted to users with the `admin` role.
- **Institution Metrics**: Registered students, total files stored, total capacity used, active announcements.
- **Advisory Publisher**: Full CRUD over school-wide announcements with priority levels and attachments.
- **Academic Event Scheduler**: Publish semester exam periods, university holidays, and seminar workshops.
- **Student Directory**: Inspect student accounts, adjust storage quotas (5GB - 25GB), and activate/suspend accounts.
- **Security Audit Logs**: Chronological immutable log of all administrator actions.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion
- **Icons**: Lucide Icons
- **Storage**: IndexedDB for binary Blobs + LocalStorage for structured relational schemas
- **Styling**: Sky blue (`#38BDF8`), light blue (`#E0F2FE`), slate neutrals (`#0F172A`, `#F8FAFC`)

---

## ⚙️ Environment Variables Template (`.env.example`)

```bash
# GEMINI_API_KEY: Optional Gemini API Key for AI features
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# APP_URL: Production or preview URL
APP_URL="https://your-domain.run.app"

# GOOGLE_CLIENT_ID: Required for production Google OAuth 2.0
VITE_GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"

# ALLOWED_GOOGLE_DOMAINS: Optional domain constraint (leave empty to allow all Google accounts)
VITE_ALLOWED_GOOGLE_DOMAINS="umindanao.edu.ph"
```

---

## 🔐 Google OAuth Setup Guide

To connect Google OAuth in production:
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Navigate to **APIs & Services** > **Credentials**.
3. Create an **OAuth 2.0 Client ID** (Web application).
4. Add your authorized JavaScript origins (e.g. `https://your-domain.com`).
5. Add authorized redirect URIs.
6. Copy the Client ID into your `.env` configuration file as `VITE_GOOGLE_CLIENT_ID`.

---

## 🌐 Quick Deployment Guide

### Option 1: Free GitHub Pages (Automated via GitHub Actions)
This repository includes a pre-configured GitHub Actions workflow (`.github/workflows/deploy.yml`):
1. Create a new repository on GitHub (e.g., `acadex-app`).
2. Push your code:
   ```bash
   git remote add origin https://github.com/<your-username>/acadex-app.git
   git branch -M main
   git push -u origin main
   ```
3. In your GitHub repository:
   - Go to **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, select **GitHub Actions**.
4. GitHub will automatically run the workflow and deploy the app to:
   `https://<your-username>.github.io/acadex-app/`

---

### Option 2: Vercel or Netlify (Recommended for Custom Domains)
If you plan to connect a custom domain soon, **Vercel** or **Netlify** provides free automatic SSL and 1-click custom domain setup:
1. Push your repository to GitHub.
2. Sign in to [Vercel](https://vercel.com) or [Netlify](https://netlify.com) using your GitHub account.
3. Click **Add New Project** and select your `acadex-app` repository.
4. Framework preset will automatically detect **Vite**. Click **Deploy**.
5. Once live, go to **Project Settings** > **Domains** to add your own domain name (e.g., `acadex.yourdomain.com`).

