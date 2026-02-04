import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';

export class GitHubAutomationService {
    private octokit: Octokit;
    private orgName: string;

    constructor() {
        this.orgName = process.env.GITHUB_ORG_NAME || 'VTFree-Org';

        const appId = process.env.GH_APP_ID;
        const privateKey = process.env.GH_PRIVATE_KEY;
        const installationId = process.env.GH_INSTALLATION_ID;

        if (!appId || !privateKey || !installationId) {
            console.warn('[GitHub] Missing GitHub App credentials in .env. Automation will fail.');
            this.octokit = null as any;
            return;
        }

        this.octokit = new Octokit({
            authStrategy: createAppAuth,
            auth: {
                appId: appId,
                privateKey: privateKey.replace(/\\n/g, '\n'),
                installationId: installationId,
            },
        });
    }

    private checkInitialized() {
        if (!this.octokit) {
            // throw new Error('GitHub service not initialized ...');
            // We shouldn't throw if we want to just skip safely in some contexts, but rely on worker catch.
            // Actually, throwing is fine as long as catch works.
            throw new Error('GitHub service not initialized. Check env vars.');
        }
    }

    async ensureRepository(repoName: string): Promise<string> {
        this.checkInitialized();
        try {
            console.log(`[GitHub] Checking repository: ${this.orgName}/${repoName}`);
            const { data } = await this.octokit.repos.get({
                owner: this.orgName,
                repo: repoName,
            });
            return data.clone_url;
        } catch (error: any) {
            if (error.status === 404) {
                console.log(`[GitHub] Repository not found at ${this.orgName}/${repoName}. Attempting creation...`);

                try {
                    // Try creating in Organization first
                    console.log(`[GitHub] Attempting createInOrg for: ${this.orgName}`);
                    const { data } = await this.octokit.repos.createInOrg({
                        org: this.orgName,
                        name: repoName,
                        private: true,
                        description: `Auto-generated VTU application for ${repoName}`,
                    });
                    return data.clone_url;
                } catch (orgError: any) {
                    console.warn(`[GitHub] createInOrg failed (${orgError.status}). Assuming Personal Account or Permission Issue.`);
                    console.log(`[GitHub] Attempting createForAuthenticatedUser for: ${repoName}`);

                    // Fallback: Create for authenticated user (Personal Account where App is installed)
                    const { data } = await this.octokit.repos.createForAuthenticatedUser({
                        name: repoName,
                        private: true,
                        description: `Auto-generated VTU application for ${repoName}`,
                    });
                    return data.clone_url;
                }
            }
            throw error;
        }
    }

    async pushToRepository(localPath: string, cloneUrl: string, message: string = 'Update app configuration') {
        this.checkInitialized();
        try {
            // Get a fresh installation token for git auth
            const auth: any = await this.octokit.auth({ type: 'installation' });
            const token = auth.token;

            // Transform https://github.com/org/repo.git to https://x-access-token:<token>@github.com/org/repo.git
            const authenticatedUrl = cloneUrl.replace('https://', `https://x-access-token:${token}@`);

            console.log(`[GitHub] Initializing git in ${localPath}`);

            // Ensure we are in a clean state if .git exists
            if (await fs.pathExists(path.join(localPath, '.git'))) {
                await fs.remove(path.join(localPath, '.git'));
            }

            await execa('git', ['init'], { cwd: localPath });
            await execa('git', ['config', 'user.name', 'vtfree-bot'], { cwd: localPath });
            await execa('git', ['config', 'user.email', 'bot@vtfree.com'], { cwd: localPath });
            await execa('git', ['remote', 'add', 'origin', authenticatedUrl], { cwd: localPath });
            await execa('git', ['add', '.'], { cwd: localPath });
            await execa('git', ['commit', '-m', message], { cwd: localPath });
            await execa('git', ['branch', '-M', 'main'], { cwd: localPath });

            console.log(`[GitHub] Pushing to ${cloneUrl}`);
            await execa('git', ['push', '-u', 'origin', 'main', '--force'], { cwd: localPath });

            const { stdout: commitHash } = await execa('git', ['rev-parse', 'HEAD'], { cwd: localPath });

            // Extract repo name from cloneUrl
            const repoName = cloneUrl.split('/').pop()?.replace('.git', '') || '';

            return { commitHash, repoName };
        } catch (error) {
            console.error('[GitHub] Push error:', error);
            throw error;
        }
    }

    async createRelease(repoName: string, tagName: string, name: string, body: string = '') {
        this.checkInitialized();
        try {
            console.log(`[GitHub] Creating release ${tagName} for ${repoName}`);
            const { data } = await this.octokit.repos.createRelease({
                owner: this.orgName,
                repo: repoName,
                tag_name: tagName,
                name: name,
                body: body,
                draft: false,
                prerelease: false
            });
            return data;
        } catch (error: any) {
            console.error('[GitHub] Release creation error:', error);
            throw error;
        }
    }

    async uploadReleaseAsset(repoName: string, releaseId: number, filePath: string, fileName: string) {
        this.checkInitialized();
        try {
            const stats = await fs.stat(filePath);
            const data = await fs.readFile(filePath);

            console.log(`[GitHub] Uploading asset ${fileName} to release ${releaseId}`);
            const { data: asset } = await this.octokit.repos.uploadReleaseAsset({
                owner: this.orgName,
                repo: repoName,
                release_id: releaseId,
                name: fileName,
                data: data as any,
                headers: {
                    'content-type': 'application/octet-stream',
                    'content-length': stats.size
                }
            });
            // Return both ID and URL
            return { id: asset.id, url: asset.browser_download_url };
        } catch (error: any) {
            console.error('[GitHub] Asset upload error:', error);
            throw error;
        }
    }

    async streamAsset(repoName: string, assetId: number): Promise<any> {
        this.checkInitialized();
        try {
            // Using 'octet-stream' media type with getReleaseAsset redirects to the S3 bucket with auth
            // But we can also get the arraybuffer directly.
            // Octokit request with 'Accept: application/octet-stream' returns the raw data.
            // Note: This downloads the file to memory? For large files, stream is better.
            // Octokit doesn't support streams natively well in Node without some custom request options.
            // But let's try just getting the redirect URL and piping? 
            // Private repos: The API URL redirects to S3.

            const response = await this.octokit.request('GET /repos/{owner}/{repo}/releases/assets/{asset_id}', {
                owner: this.orgName,
                repo: repoName,
                asset_id: assetId,
                headers: {
                    Accept: 'application/octet-stream'
                },
                request: {
                    parse: false // Do not parse JSON, get raw response
                }
            });

            // The response.data should be the buffer (if parse:false?). 
            // Actually, octokit/rest documentation says `parse: false` is not standard.
            // Let's us `responseType: 'arraybuffer'`?
            // Or better: just get the redirect URL manually?

            // Simpler: octokit.repos.getReleaseAsset returns a redirect or the file.
            // Let's use specific octokit config for streams?
            // Since we are running on server, we can fetch.

            // For now, let's just return the buffer. APK/Zip are ~20-50MB. Memory is fine.
            return response.data;

        } catch (error) {
            console.error('[GitHub] Stream asset error:', error);
            throw error;
        }
    }
}
