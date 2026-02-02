import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';
export class GitHubAutomationService {
    octokit;
    orgName;
    constructor() {
        this.orgName = process.env.GITHUB_ORG_NAME || 'VTFree-Org';
        // We expect GH_APP_ID, GH_PRIVATE_KEY, and GH_INSTALLATION_ID in env
        this.octokit = new Octokit({
            authStrategy: createAppAuth,
            auth: {
                appId: process.env.GH_APP_ID || '',
                privateKey: (process.env.GH_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
                installationId: process.env.GH_INSTALLATION_ID || '',
            },
        });
    }
    async ensureRepository(repoName) {
        try {
            console.log(`[GitHub] Checking repository: ${this.orgName}/${repoName}`);
            const { data } = await this.octokit.repos.get({
                owner: this.orgName,
                repo: repoName,
            });
            return data.clone_url;
        }
        catch (error) {
            if (error.status === 404) {
                console.log(`[GitHub] Creating repository: ${this.orgName}/${repoName}`);
                const { data } = await this.octokit.repos.createInOrg({
                    org: this.orgName,
                    name: repoName,
                    private: true,
                    description: `Auto-generated VTU application for ${repoName}`,
                });
                return data.clone_url;
            }
            throw error;
        }
    }
    async pushToRepository(localPath, cloneUrl, message = 'Update app configuration') {
        try {
            // Get a fresh installation token for git auth
            const auth = await this.octokit.auth({ type: 'installation' });
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
            return { commitHash };
        }
        catch (error) {
            console.error('[GitHub] Push error:', error);
            throw error;
        }
    }
}
