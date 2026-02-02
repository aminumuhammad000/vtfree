# VTfree App Building System Documentation

This document provides a comprehensive technical overview of the app generation and building system used in the VTfree platform. It is designed to help developers understand the architecture, data flow, and components involved in converting user configurations into deployable Android APKs and Web Bundles.

## 1. Architecture Overview

The system follows an **asynchronous, event-driven architecture** to handle resource-intensive build tasks without blocking the main API thread.

**High-Level Data Flow:**
`Frontend (User) -> API (Backend) -> Redis Queue (BullMQ) -> Worker Process -> App Generator Service -> External Services (GitHub, Drive, Email)`

### Core Technologies
- **Node.js/Express**: API Server.
- **BullMQ & Redis**: Queue management for background jobs.
- **Expo CLI (npx)**: Used for building the React Native/Expo app.
- **FS-Extra**: File system manipulation.
- **Google Drive API**: Artifact storage.
- **GitHub API**: Version control and code backup.
- **Nodemailer**: Email notifications.

---

## 2. Key Components

### 2.1 Backend Controller (`vtfree_app.controller.ts`)
The entry point for build requests.
- **Endpoint**: `POST /vtfree/apps/:appId/pay-and-build` or `POST /:appId/build`
- **Function**: Validates the request, determines build targets (Android/Web), creates the job payload options, and adds the job to the `app-build-queue`.
- **Status Update**: Sets the app status to `building` in MongoDB immediately.

### 2.2 Job Queue (`app_build.queue.ts`)
A generic wrapper around **BullMQ**.
- Configured with Redis connection details.
- Manages job retries (default: 3 attempts) and backoff strategies.

### 2.3 Build Worker (`app_build.worker.ts`)
The orchestrator of the entire build process. It processes jobs one by one (`concurrency: 1`) to ensure system stability.
- **Responsibilities**:
    1.  Downloads external assets (Logos).
    2.  Prepares the build directory.
    3.  Injects configurations.
    4.  Syncs code to GitHub.
    5.  Runs builds sequentially for each target.
    6.  Uploads artifacts to Google Drive.
    7.  Sends email notifications.
    8.  Cleans up temporary files.

### 2.4 App Generator Service (`app_generator_new.service.ts`)
Contains the low-level logic for file manipulation and shell commands.
- **`prepareBuildDir`**: Clones the master template (`app-templete`) to a unique temporary folder (`apps/:appId/builds/:jobId`).
- **`injectConfig`**:
    - Modifies `app.json` (Package name, slug, version).
    - Rewrites `constants/Colors.ts` with user branding.
    - Rewrites `constants/AppConfig.ts` with API endpoints and keys.
    - Replaces `assets/` (icon.png, splash.png) with the user's uploaded logo.
- **`runBuild`**: Executes `npx expo export` (for web) or simulates Gradle builds (for Android prototype). Zips the output.

---

## 3. The Build Process (Step-by-Step)

When a user initiates a build, the following sequence occurs:

1.  **Job Enqueueing**:
    - The controller pushes a job with `appId`, `options` (branding, package name, targets), and `user_email`.

2.  **Worker Start**:
    - Worker picks up the job.
    - Updates DB: `build_status_full: 'building'`, `progress: 5%`.

3.  **Asset Preparation**:
    - If a `logo_url` exists (Cloudinary), it is downloaded locally to a temp folder.

4.  **Template Configuration**:
    - A clean copy of the `app-templete` is created.
    - `AppGeneratorService.injectConfig` updates code files with dynamic values (AppName, Colors, AppID).

5.  **GitHub Synchronization**:
    - **Service**: `GitHubAutomationService`
    - Checks if a repo `vtfree-app-{appId}` exists, creates it if not.
    - Initializes git in the temp build folder, commits, and pushes to the remote repo.
    - **Purpose**: Provides the user with source code backup and version history.

6.  **Multi-Target Building**:
    - The worker loops through requested targets (e.g., `['android_apk', 'web']`).
    - **Step A**: Update DB with specific stage (e.g., "Building Android APK (Est: 5 mins)").
    - **Step B**: Execute Build Command via `AppGeneratorService`.
    - **Step C**: Upload resulting artifact (.apk or .zip) to Google Drive.
    - **Step D**: Store the Drive Link in memory.

7.  **Finalization**:
    - DB Update: `status: 'live'`, `download_links: { android: ..., web: ... }`, `progress: 100%`.
    - **Email**: Sends a "Build Successful" email to the user with all download links.
    - **Cleanup**: Removes the temporary build directory to save disk space.

---

## 4. Database Status Tracking

The `CreatedApp` MongoDB model tracks the lifecycle:

| Field | Description |
| :--- | :--- |
| `status` | High-level status (`live`, `building`, `failed`, `pending`). |
| `build_status_full` | Detailed internal status. |
| `build_progress` | Integer (0-100) used for frontend progress bars. |
| `build_stage` | Human-readable string (e.g., "Configuring template", "Syncing to GitHub"). |
| `download_links` | Object storing URLs for `android` and `web` artifacts. |
| `last_build_id` | ID of the most recent BullMQ job. |

## 5. Error Handling

- **Worker Catch Block**: If any step throws an error:
    1.  Catches the exception.
    2.  Updates DB: `status: 'failed'`, `build_error: <error_message>`.
    3.  Sends a "Build Failed" email to the user with error details.
    4.  The Queue mechanism may retry the job depending on configuration (currently set to retry 3 times in `app_build.queue.ts`).

## 6. Directory Structure

```
backend/
├── src/
│   ├── controllers/vtfree_app.controller.ts  # API Logic
│   ├── queues/app_build.queue.ts             # Redis Queue Setup
│   ├── workers/app_build.worker.ts           # Job Processor (Main logic)
│   ├── services/
│   │   ├── app_generator_new.service.ts      # File/Build operations
│   │   ├── email.service.ts                  # Notifications
│   │   ├── github_automation.service.ts      # Source Control
│   │   └── google_drive.service.ts           # Storage
```

## 7. How to Extend

- **Adding iOS Support**:
    1.  Update `AppAdmin` or `CreatedApp` model to include `ios` platform toggle.
    2.  Update `vtfree_app.controller.ts` to add `ios_ipa` to `targets` list.
    3.  Update `AppGeneratorService.runBuild` to handle `ios_ipa` target (likely involving EAS Build or fastlane).
    4.  Update `app_build.worker.ts` logic to handle the new artifact type.

- **Changing Template**:
    - Modify the source code in `app-templete/`. All new builds will automatically use the updated code.
