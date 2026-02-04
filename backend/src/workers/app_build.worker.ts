import { Worker, Job } from 'bullmq';
import { redisConfig } from '../config/redis.config.js';
import { AppGeneratorService } from '../services/app_generator_new.service.js';
import { GitHubAutomationService } from '../services/github_automation.service.js';
import CreatedApp from '../models/created_app.model.js';
import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { socketService } from '../services/socket.service.js';

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
import { logger } from '../config/bootstrap.js';

const worker = new Worker('app-build-queue', async (job: Job) => {
    const { appId, options } = job.data;
    const jobId = job.id!;
    const tempAssetsDir = path.resolve(__dirname, `../../../apps/${appId}/temp_assets`);

    const log = (msg: string) => {
        const logMsg = `[Worker] [Job:${jobId}] [App:${appId}] ${msg}`;
        logger.info(logMsg);
        try {
            const logPath = path.resolve(__dirname, '../../../logs/worker_debug.log');
            fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${logMsg}\n`);
        } catch (e) { console.error('Worker log error', e); }
    };

    log(`Starting job process`);

    try {
        const targets = options.targets || [options.target];
        const totalTargets = targets.length;
        const links: { android?: string, web?: string } = {};

        // 1. Update DB to building
        log(`Updating database status to 'building'`);

        // Base time: 5 mins for environment/deps/github
        // Web: 2 mins
        // Android: 10 mins
        let totalEstimatedMins = 5;
        targets.forEach((t: string) => {
            if (t === 'web' || t.includes('web')) totalEstimatedMins += 2;
            else totalEstimatedMins += 10;
        });

        const estimatedFinishAt = new Date(Date.now() + totalEstimatedMins * 60000);

        await CreatedApp.updateOne({ app_id: appId }, {
            build_status_full: 'building',
            build_progress: 5,
            build_stage: 'Preparing environment',
            estimated_finish_at: estimatedFinishAt
        });
        socketService.emitToApp(appId, 'build_update', {
            status: 'building',
            progress: 5,
            stage: 'Preparing environment',
            step: 'init'
        });
        log(`PROGRESS: 5% - Preparing environment`);

        // 0. Fetch current state for RESUME logic
        const currentApp = await CreatedApp.findOne({ app_id: appId });
        const lastStep = currentApp?.last_successful_step || '';
        const isRetry = options.retry === true;

        log(`Build Info: Retry=${isRetry}, LastStep=${lastStep}`);

        const updateStep = async (stepName: string, progress: number, stage: string) => {
            await CreatedApp.updateOne({ app_id: appId }, {
                build_progress: progress,
                build_stage: stage,
                last_successful_step: stepName
            });
            socketService.emitToApp(appId, 'build_update', {
                status: 'building',
                progress: progress,
                stage: stage,
                step: stepName
            });
            log(`PROGRESS: ${progress}% - ${stage} (Step: ${stepName})`);
        };

        // 2. Handle Cloudinary/External Logo Download (Once)
        // SKIP if lastStep >= 'logo_downloaded'
        if (options.branding.logo_url) {
            if (isRetry && (lastStep === 'logo_downloaded' || lastStep === 'config_injected' || lastStep === 'deps_installed' || lastStep === 'github_synced' || lastStep === 'build_components')) {
                log(`Skipping Logo Download (Already done)`);
                // Ensure path is set even if skipped
                const localLogoPath = path.join(tempAssetsDir, `logo_${jobId}.png`);
                options.branding.logo_path = localLogoPath;
            } else {
                log(`Downloading logo from: ${options.branding.logo_url}`);
                await fs.ensureDir(tempAssetsDir);
                const localLogoPath = path.join(tempAssetsDir, `logo_${jobId}.png`);
                await downloadImage(options.branding.logo_url, localLogoPath);
                options.branding.logo_path = localLogoPath;
                log(`Logo downloaded to: ${localLogoPath}`);
                await updateStep('logo_downloaded', 10, 'Logo downloaded');
            }
        }

        // 3. Prepare Build Dir
        // Can't easily skip if it's a new job ID, assume checking existence via AppGeneratorService
        log(`Preparing build directory`);
        // We pass 'retry' flag to prepareBuildDir if we modify it, but for now we assume check existence
        // If we are retrying, we might need to rely on the fact that files are there.
        // BUT AppGeneratorService.prepareBuildDir currently CLONES.
        // We should skip prepare if we believe it's ready.

        let buildDir = '';
        if (isRetry && (lastStep === 'config_injected' || lastStep === 'deps_installed' || lastStep === 'github_synced')) {
            // Reconstruct path
            buildDir = path.join(path.resolve(__dirname, '../../../apps'), appId, 'builds', jobId);
            if (await fs.pathExists(buildDir)) {
                log(`Skipping Prepare Build Dir (Resuming existing dir: ${buildDir})`);
            } else {
                // Fallback if deleted
                log(`Resume requested but dir missing. Re-preparing.`);
                // TODO: Update prepareBuildDir/generateSourceCode signature to accept server_url if needed?
                // Actually `generateSourceCode` is what matters.
                // If `prepareBuildDir` calls `generateSourceCode`, I need to update it.
                // Let's assume the View step clarifies.
                buildDir = await AppGeneratorService.prepareBuildDir(appId, jobId);
            }
        } else {
            buildDir = await AppGeneratorService.prepareBuildDir(appId, jobId);
        }

        // 4. Inject Config
        if (isRetry && (lastStep === 'config_injected' || lastStep === 'deps_installed' || lastStep === 'github_synced')) {
            log(`Skipping Config Injection (Already done)`);
        } else {
            await AppGeneratorService.injectConfig(buildDir, options);
            await updateStep('config_injected', 15, 'Configuration injected');
        }

        // 5. Build Dependencies (Real Step)
        if (isRetry && (lastStep === 'deps_installed' || lastStep === 'github_synced')) {
            log(`Skipping Dependencies Install (Already done)`);
            socketService.emitToApp(appId, 'build_update', {
                status: 'building', progress: 20, stage: 'Skipping dependencies...', step: 'install_deps_skip'
            });
        } else {
            console.log(`[Worker] Installing dependencies for ${appId}`);
            // Update UI/DB before starting long process
            await CreatedApp.updateOne({ app_id: appId }, {
                build_progress: 15,
                build_stage: 'Installing build dependencies (Est: 3-5 mins)...'
            });
            await AppGeneratorService.installDependencies(buildDir);
            await updateStep('deps_installed', 30, 'Dependencies installed');
        }

        // 6. Run Builds Locally (CRITICAL STEP)
        // Must succeed before we attempt upload
        const builtArtifacts: { [key: string]: string } = {};

        if (isRetry && (lastStep === 'build_local')) {
            log(`Skipping Local Build (Already done)`);
            // We need to re-discover artifact paths if we skip build
            // For now, let's assume if we resumed here, we might need to re-verify or just rebuild to be safe
            // actually re-building is safer unless we stored paths.
            // Given the complexity, let's just re-run "runBuild" if it's quick, OR assume it's done.
            // But 'runBuild' returns a path. If we skip, we don't have the path.
            // Strategy: If 'build_local' is marked done, we assume files exist at standard locations.
            // But for robustness, let's re-run build (it usually takes time) or just check file existence.
            // Since 'runBuild' might be expensive, let's assume we re-run it for now to ensure we have paths, 
            // unless we store paths in DB. For simplicity in this fix, we re-run OR just proceed if we trust the resume.
            // Correction: The user wants to "continue". If we built successfully, artifacts should be there.

            // ... actually let's just run it. If it's `expo export`, it might be fast if cached? 
            // Simplest approach: Run the build loop. If it was successful before, it presumably works now.
        }

        // We will run the build loop now.
        // Update DB
        await CreatedApp.updateOne({ app_id: appId }, {
            build_progress: 40,
            build_stage: 'Building application locally...'
        });

        // Parallel or Serial build? Serial is fine.
        for (const target of targets) {
            log(`Building target locally: ${target}`);
            socketService.emitToApp(appId, 'build_update', {
                status: 'building', progress: 40, stage: `Building ${target} locally...`, step: `build_local_${target}`
            });

            // This throws if build fails -> Job Fails (Desired)
            const artifactPath = await AppGeneratorService.runBuild(buildDir, target);
            builtArtifacts[target] = artifactPath;
            log(`Build successful for ${target}: ${artifactPath}`);
        }

        await updateStep('build_local', 60, 'Local builds completed');

        // 7. GitHub Automation (NON-CRITICAL - Skip on failure)
        let repoName = '';
        let releaseId = 0;

        try {
            if (isRetry && lastStep === 'github_complete') {
                log('Skipping GitHub Sync & Release (Already done)');
            } else {
                // 7a. GitHub Source Sync
                log(`Handling GitHub Source Sync for ${appId}`);
                await CreatedApp.updateOne({ app_id: appId }, { build_progress: 70, build_stage: 'Syncing source code...' });

                const repoUrl = await githubService.ensureRepository(`vtfree-app-${appId}`);
                const pushResult = await githubService.pushToRepository(buildDir, repoUrl, `Build ${jobId}: ${options.app_name}`);
                repoName = pushResult.repoName;

                await CreatedApp.updateOne({ app_id: appId }, {
                    github_repo: repoUrl,
                    last_commit: pushResult.commitHash
                });
                log(`GitHub Source Sync Success: ${repoUrl}`);

                // 7b. Create Release
                log(`Creating GitHub release for artifacts`);
                const tagName = `v1.0.${jobId.substring(0, 4)}-${Date.now()}`;
                const release = await githubService.createRelease(repoName!, tagName, `Build ${jobId}`, `Automated build for ${options.app_name}`);
                releaseId = release.id;

                await updateStep('github_complete', 80, 'GitHub Release Created');
            }

            // 7c. Upload Artifacts (NON-CRITICAL LOOP)
            // Even if one upload fails, try others.
            const ghAssets: { android?: string, web?: string } = {};

            if (releaseId && repoName) {
                let uploadCount = 0;
                // ... (loop content remains same as previous step implicitly, but replace entire block up to DB update)

                // I can't match huge block easily. I'll just match the start of 7c and the end of DB update.

                // WAIT. The tool replace needs CONTIGUOUS block.
                // I will target the variable declaration at start of 7c.
                // And then target the DB update.
                // Two separate edits is safest using allowMultiple? NO. "Do NOT make multiple parallel calls to this tool".
                // I will just view the file again to be precise. The previous replace changed the loop inner.
                // Now I need to add `ghAssets` initialization AND DB update.
                // Initialization should be before loop.
                // DB update is at end.
                // They are far apart.
                // I'll do two separate calls.

                // Call 1: Initialize ghAssets.
                // Call 2: Update DB.

                // Call 1:
                // Target: `// 7c. Upload Artifacts`
                // Replace with: `// 7c ... \n const ghAssets...`

                // Call 2:
                // Target: `download_links: finalLinks,`
                // Replace with: `download_links: finalLinks, github_assets: finalGhAssets,`

                // I'll do call 1 first.

                let uploadCount = 0;
                for (const target of targets) {
                    const artifactPath = builtArtifacts[target];
                    if (!artifactPath) continue;

                    try {
                        const targetName = target === 'web' ? 'Web App' : 'Android App';
                        log(`Uploading ${target} artifact to GitHub Release...`);

                        socketService.emitToApp(appId, 'build_update', {
                            status: 'building', progress: 85, stage: `Uploading ${targetName}...`, step: `upload_${target}`
                        });

                        const fileName = `${options.app_name}_${target}_${jobId}.${target === 'web' ? 'zip' : 'apk'}`;
                        // Now returns { id, url }
                        const uploadResult = await githubService.uploadReleaseAsset(repoName, releaseId, artifactPath, fileName);

                        // Construct Proxy URL
                        // Ensure server_url doesn't end with slash
                        const baseUrl = (options.server_url || 'https://vua.vtfree.com/api').replace(/\/$/, '');
                        const proxyUrl = `${baseUrl}/v1/vtfree/apps/${appId}/download/${target}`;

                        if (target === 'web') {
                            links.web = proxyUrl;
                            ghAssets.web = uploadResult.id.toString();
                        } else {
                            links.android = proxyUrl;
                            ghAssets.android = uploadResult.id.toString();
                        }

                        uploadCount++;
                    } catch (uploadErr: any) {
                        console.error(`[Worker] Failed to upload ${target} artifact:`, uploadErr);
                        log(`WARNING: Upload failed for ${target}. Skipping.`);
                        // Continue to next target
                    }
                }

                if (uploadCount > 0) {
                    await updateStep('upload_complete', 90, 'Artifacts Uploaded');
                } else {
                    log(`WARNING: No artifacts were uploaded successfully.`);
                }
            } else {
                log(`Skipping Asset Upload: No release created.`);
            }

        } catch (ghError: any) {
            console.error(`[Worker] GitHub Automation Failed:`, ghError);
            log(`WARNING: GitHub Source/Release failed. Skipping upload. Your app is built but not hosted.`);
            // We do NOT throw here, proceeding to completion
            socketService.emitToApp(appId, 'build_update', {
                status: 'building', progress: 90, stage: 'GitHub integration skipped due to error', step: 'github_skip'
            });
        }

        // 8. Update DB to completed & Cleanup
        const existingApp = await CreatedApp.findOne({ app_id: appId }).select('download_links github_assets');
        const finalLinks = {
            ... (existingApp?.download_links || {}),
            ...links
        };
        const finalGhAssets = {
            ... (existingApp?.github_assets || {}),
            ...ghAssets
        };

        await CreatedApp.updateOne({ app_id: appId }, {
            build_status_full: 'completed',
            status: 'live',
            build_progress: 100,
            build_stage: 'Completed',
            download_links: finalLinks,
            github_assets: finalGhAssets,
            last_build_id: jobId
        });
        socketService.emitToApp(appId, 'build_update', {
            status: 'live',
            progress: 100,
            stage: 'Completed',
            step: 'completed',
            download_links: finalLinks
        });
        log(`PROGRESS: 100% - Completed successfully`);

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
            status: 'failed',
            build_status_full: 'failed',
            build_stage: 'Failed',
            build_error: error.message
        });
        socketService.emitToApp(appId, 'build_update', {
            status: 'failed',
            progress: 0,
            stage: 'Failed',
            step: 'error',
            error: error.message
        });
        log(`PROGRESS: FAILED - ${error.message}`);

        // DO NOT CLEANUP immediately on failure if we want to support retry/resume.
        // The user explicitly requested to "continue from where it stop".
        // Files will be cleaned up if the user DELETES the app via control panel.
        /*
        try {
            log(`Cleaning up failed build files...`);
            await AppGeneratorService.cleanup(appId, jobId);
            if (await fs.pathExists(tempAssetsDir)) {
                await fs.remove(tempAssetsDir);
            }
            log(`Cleanup complete.`);
        } catch (cleanupErr) {
            console.error(`[Worker] Cleanup failed for job ${jobId}:`, cleanupErr);
        }
        */

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
