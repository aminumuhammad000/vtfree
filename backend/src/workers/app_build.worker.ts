import { Worker, Job } from 'bullmq';
import { redisConfig } from '../config/redis.config.js';
import { AppGeneratorService } from '../services/app_generator_new.service.js';
import { GitHubAutomationService } from '../services/github_automation.service.js';
import { GoogleDriveService } from '../services/google_drive.service.js';
import CreatedApp from '../models/created_app.model.js';
import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const githubService = new GitHubAutomationService();

/**
 * Downloads an image from a URL and saves it to a local temporary path.
 */
async function downloadImage(url: string, destPath: string): Promise<string> {
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
    });

    return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(destPath);
        response.data.pipe(writer);
        writer.on('finish', () => resolve(destPath));
        writer.on('error', reject);
    });
}

import { EmailService } from '../services/email.service.js';

const worker = new Worker('app-build-queue', async (job: Job) => {
    const { appId, options } = job.data;
    const jobId = job.id!;
    const tempAssetsDir = path.resolve(__dirname, `../../../apps/${appId}/temp_assets`);

    console.log(`[Worker] Starting job ${jobId} for App ${appId}`);

    try {
        const targets = options.targets || [options.target];
        const totalTargets = targets.length;
        const links: { android?: string, web?: string } = {};

        // 1. Update DB to building
        await CreatedApp.updateOne({ app_id: appId }, {
            build_status_full: 'building',
            build_progress: 5,
            build_stage: 'Preparing environment'
        });

        // 2. Handle Cloudinary/External Logo Download (Once)
        if (options.branding.logo_url) {
            console.log(`[Worker] Downloading logo from: ${options.branding.logo_url}`);
            await fs.ensureDir(tempAssetsDir);
            const localLogoPath = path.join(tempAssetsDir, `logo_${jobId}.png`);
            await downloadImage(options.branding.logo_url, localLogoPath);
            options.branding.logo_path = localLogoPath;
            console.log(`[Worker] Logo downloaded to: ${localLogoPath}`);
        }

        // 3. Prepare Build Dir (Can reuse for multiple targets or clean between? Reusing is faster but safer to clean if targets differ significantly. Here we reuse.)
        const buildDir = await AppGeneratorService.prepareBuildDir(appId, jobId);
        await CreatedApp.updateOne({ app_id: appId }, { build_progress: 15, build_stage: 'Configuring template' });

        // 4. Inject Config
        await AppGeneratorService.injectConfig(buildDir, options);

        // 5. GitHub Automation (Once)
        console.log(`[Worker] Handling GitHub for ${appId}`);
        await CreatedApp.updateOne({ app_id: appId }, { build_progress: 25, build_stage: 'Syncing to GitHub' });
        const repoUrl = await githubService.ensureRepository(`vtfree-app-${appId}`);
        const { commitHash } = await githubService.pushToRepository(buildDir, repoUrl, `Build ${jobId}: ${options.app_name}`);

        await CreatedApp.updateOne({ app_id: appId }, {
            github_repo: repoUrl,
            last_commit: commitHash,
            build_progress: 35,
            build_stage: 'Building application...'
        });

        // 6. Run Builds Sequentially
        let progressStart = 35;
        const progressPerTarget = (90 - 35) / totalTargets;

        for (let i = 0; i < totalTargets; i++) {
            const currentTarget = targets[i];
            const targetName = currentTarget === 'web' ? 'Web Bundle' : 'Android APK';

            // Calculate ETA
            // Android ~ 15-20 min (mocked here as fast), Web ~ 2 min.
            // Since we mocking, we just show text.
            const estimatedTime = currentTarget === 'web' ? '2 mins' : '5 mins';

            await CreatedApp.updateOne({ app_id: appId }, {
                build_stage: `Building ${targetName} (Est: ${estimatedTime})`,
                build_progress: Math.floor(progressStart + (i * progressPerTarget))
            });

            console.log(`[Worker] Building target: ${currentTarget}`);
            const artifactPath = await AppGeneratorService.runBuild(buildDir, currentTarget);

            // Upload to Google Drive
            await CreatedApp.updateOne({ app_id: appId }, { build_stage: `Uploading ${targetName}...` });
            console.log(`[Worker] Uploading ${currentTarget} artifact to Google Drive`);
            const driveLink = await GoogleDriveService.uploadFile(
                artifactPath,
                `${options.app_name}_${currentTarget}_${jobId}.${currentTarget === 'web' ? 'zip' : 'apk'}`,
                currentTarget === 'web' ? 'application/zip' : 'application/vnd.android.package-archive'
            );

            if (currentTarget === 'web') links.web = driveLink;
            else links.android = driveLink;
        }

        // 8. Update DB to completed & Cleanup
        const finalLinks = {
            ... (await CreatedApp.findOne({ app_id: appId }).select('download_links')).download_links,
            ...links
        };

        await CreatedApp.updateOne({ app_id: appId }, {
            build_status_full: 'completed',
            status: 'live',
            build_progress: 100,
            build_stage: 'Completed',
            download_links: finalLinks,
            last_build_id: jobId
        });

        // Cleanup
        await AppGeneratorService.cleanup(appId, jobId);
        if (await fs.pathExists(tempAssetsDir)) {
            await fs.remove(tempAssetsDir);
        }

        console.log(`[Worker] Job ${jobId} finished successfully`);

        // Send Success Email
        if (options.user_email) {
            await EmailService.sendAppBuildSuccess(options.user_email, options.app_name, links);
        }

        return { success: true, links };

    } catch (error: any) {
        console.error(`[Worker] Job ${jobId} failed:`, error);

        await CreatedApp.updateOne({ app_id: appId }, {
            build_status_full: 'failed',
            build_stage: 'Failed',
            build_error: error.message
        });

        // Send Failure Email
        if (options.user_email) {
            await EmailService.sendAppBuildFailure(options.user_email, options.app_name, error.message);
        }

        throw error;
    }
}, {
    connection: redisConfig,
    concurrency: 1,
});

worker.on('completed', (job) => {
    console.log(`[Worker] Build ${job.id} completed`);
});

worker.on('failed', (job, err) => {
    console.error(`[Worker] Build ${job?.id} failed: ${err.message}`);
});

export default worker;
