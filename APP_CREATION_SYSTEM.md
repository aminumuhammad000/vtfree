# VTfree App Creation System Documentation

This document outlines the end-to-end architecture and workflow of the App Creation System within the VTfree platform. It covers the user interaction, backend processing, payment handling, and the automated build pipeline.

> **Status**: Production-Grade / Active Development
> **Last Review**: 2026-02-03 (Architecture Audit Completed)

## 1. System Overview

The system allows users to create custom-branded white-label apps (Android & Web) without writing code. It uses a **Queue-Worker architecture** to handle resource-intensive build tasks asynchronously, ensuring the main API remains responsive.

**Key Components:**
*   **API Server (Express)**: Handles user requests, validation, payments, and job scheduling.
*   **Database (MongoDB)**: Stores app metadata, user wallets, and build statuses.
*   **Message Queue (BullMQ + Redis)**: Manages the build job queue to process builds sequentially or concurrently.
*   **Build Worker**: A dedicated process that executes the actual code generation, building, and deployment tasks.
*   **Socket.io**: Real-time event-based communication for instant build progress updates on the frontend.
*   **External Services**:
    *   **GitHub**: Used for source code hosting, version control, and artifact hosting (Releases).
    *   **Cloudinary**: Stores user-uploaded assets (logos).
    *   **Email Service**: Notifies users of build completion or failure.

---

## 2. Detailed Workflow

### Phase 1: Initiation & Payment (`vtfree_app.controller.ts`)

1.  **User Request**: User submits app details (Name, Package Name, Colors, Services, Platforms) via the frontend.
2.  **Cost Calculation**:
    *   The system calculates the total cost based on selected platforms (Android/iOS/Web) and services.
    *   Pricing is dynamic and fetched via `PricingService`.
3.  **Wallet Check**:
    *   The system checks the user's `VTfreeUser` wallet balance.
    *   **Insufficient Funds**: The app is saved to the database with a `pending` status. The user receives a response indicating payment is required.
    *   **Sufficient Funds**:
        *   Funds are deducted immediately.
        *   A `VTfreeTransaction` record (Debit) is created.
        *   The app record is created with a `paid` status.
        *   The build job is immediately added to the queue via `addBuildJob`.

*Note: There is also a `payAndStartBuild` endpoint for users to pay for previously "pending" apps.*

### Phase 2: Job Queueing (`app_build.queue.ts`)

*   **Technology**: BullMQ backed by Redis.
*   **Job Data**: Contains `appId`, `options` (branding, config), and user email.
*   **Purpose**: Decouples the HTTP request from the long-running build process.
*   **Real-time Updates**: The build worker emits socket events (`build_update`) for each step, allowing the frontend to display granular progress without polling.

### Phase 3: The Build Worker (`app_build.worker.ts`)

The worker processes jobs one by one (Concurrency: 1). It performs the following steps:

#### Step 1: Initialization
*   Updates the App status in MongoDB to `building`.
*   Calculates an **Estimated Completion Time** based on targets (e.g., +2 mins for Web, +10 mins for Android).
*   Downloads the User's Logo from Cloudinary to a local temporary directory.

#### Step 2: Code Generation
*   **Prepare Directory**: Copies the master template code to a unique workspace: `apps/{appId}/`.
*   **Inject Configuration**: Replaces specific tokens in the code (Project Name, Package Name, API URLs, Colors) with the user's data.

#### Step 3: Dependency Installation
*   Runs `npm install` (or `yarn`) in the generated directory to install necessary node modules.

#### Step 4: GitHub Synchronization (`GitHubAutomationService`)
*   **Repo Management**: Checks if a GitHub repository `vtfree-app-{appId}` exists; creates it if not.
*   **Push Code**: Commits and pushes the newly generated code to the repository.
*   **Release Tag**: Creates a new GitHub Release tag (e.g., `v1.0.xxxx`).

#### Step 5: Build Execution
The worker iterates through the requested targets (Android, Web):

*   **Web Build**:
    *   Runs the web build command.
    *   Zips the output bundle.
*   **Android Build**:
    *   Executes the Android build process (likely via Gradle or EAS).
    *   Generates a signed APK file.

#### Step 6: Artifact Upload & Delivery
*   **Upload**: Uploads the generated artifacts (APK, Web Zip) to the **GitHub Release** created in Step 4.
*   **Link Storage**: Retreives the direct download URLs from GitHub and saves them to the `CreatedApp` record in MongoDB.

#### Step 7: Completion
*   **Update Status**: Sets App status to `live`.
*   **Cleanup**: Deletes temporary build directories to save disk space.
*   **Notification**: Sends a "Build Success" email to the user with download links.

---

## 3. Error Handling

If any step in the worker fails (e.g., build error, git conflict):
1.  The worker catches the exception.
2.  App status is updated to `failed`.
3.  The specific error message is saved to `build_error` in the database.
4.  A "Build Failed" email is sent to the user explaining the issue.
5.  The user can retry the build from the dashboard (triggering `triggerBuildApk`).

## 4. Updates & Upgrades

*   **Updates**: Users can change app details (Name, Colors). This triggers a "Rebuild" job if requested.
*   **Upgrades**: Users can upgrade to a newer template version (e.g., v1.0 -> v2.0).
    *   An upgrade fee may apply.
    *   If paid, the system updates the `version` field and queues a new build job.

## 5. Technical Stack Summary

| Component | Technology |
| :--- | :--- |
| **Language** | TypeScript (Node.js) |
| **Queue** | BullMQ / Redis |
| **Real-time** | Socket.io (Server & Client) |
| **Database** | MongoDB (Mongoose) |
| **Build Tool** | Expo / React Native CLI / Vite (Web) |
| **Version Control** | Simple Git (interacting with GitHub API) |
| **Storage** | Cloudinary (Images), GitHub Releases (Binaries) |

## 6. Architecture Roadmap & Planned Refinements

Following a comprehensive architecture audit, the following improvements are prioritized to reach enterprise-grade maturity.

### 6.1 Worker & Queue Optimization
*   **Split Workers**: Decouple workers by responsibility (`build:web`, `build:android`, `postprocess:upload`) to allow safe parallelization.
*   **Job Priorities**: Implement priority levels (paid > upgrade > retry) with exponential backoff for retries.
*   **Concurrency**: Increase concurrency for lighter workloads (Web) while maintaining single-concurrency per machine for heavy workloads (Android).

### 6.2 Build Reproducibility & Isolation
*   **Dependency Management**: Move from `npm install` to `npm ci` with committed lockfiles to ensure deterministic builds.
*   **Configuration**: Replace token replacement with a central `app.config.json` injection strategy.
*   **Isolation**: Run builds in isolated containers (Docker) or separate users to prevent environment leakage and credential exposure.
*   **Security**: Use per-app keystores for Android signing and ensure no secrets (GitHub tokens, signing keys) are exposed in the build environment.

### 6.3 Enhanced Progress Tracking (UX)
*   **Granular Steps**: Replace coarse statuses with structured events:
    ```ts
    updateApp(appId, {
      build_step: "android_build", // install_deps | build_android | upload
      progress: 65,
      log_tail: "Gradle build executing..."
    })
    ```
*   **✅ [IMPLEMENTED] Real-time Updates**: Expose progress via WebSocket/SSE to effectively reduce support inquiries.

### 6.4 Artifact Management & GitHub Decoupling
*   **Storage**: Decouple artifact storage from source control. Move binary storage to S3-compatible service (MinIO/R2) to avoid GitHub rate limits and repo bloat.
*   **Source Control**: Maintain the GitHub repository for source code versioning only. Keep the template repository private.

### 6.5 Error Handling & Observability
*   **Structured Errors**: Store detailed error objects (`code`, `step`, `retryable`) instead of simple strings to enable auto-retry logic and better UI feedback.
*   **Observability**: Implement worker metrics, build duration tracking, and detailed audit logs for all financial and build, actions.
