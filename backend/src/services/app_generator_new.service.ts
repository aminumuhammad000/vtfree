import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { execa } from 'execa';
import archiver from 'archiver';
import { GoogleDriveService } from './google_drive.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface BuildOptions {
    app_id: string;
    app_name: string;
    package_name: string;
    branding: {
        primary_color: string;
        secondary_color: string;
        logo_url?: string;
        logo_path?: string; // Path to local renamed logo.png
        splash_path?: string;
    };
    server_url: string;
    target: 'web' | 'android_preview' | 'android_apk';
}

export class AppGeneratorService {
    private static TEMPLATE_PATH = path.resolve(__dirname, '../../../app-templete');
    private static APPS_BASE_PATH = path.resolve(__dirname, '../../../apps');

    /**
     * Prepares an isolated build environment for a specific app ID and job ID.
     */
    static async prepareBuildDir(appId: string, jobId: string): Promise<string> {
        const buildDir = path.join(this.APPS_BASE_PATH, appId, 'builds', jobId);
        await fs.ensureDir(buildDir);

        console.log(`[AppGenerator] Cloning template to: ${buildDir}`);
        await fs.copy(this.TEMPLATE_PATH, buildDir, {
            filter: (src) => !src.includes('node_modules') && !src.includes('.git') && !src.includes('.expo')
        });

        return buildDir;
    }

    /**
     * Injects configuration into the template.
     */
    static async injectConfig(buildDir: string, options: BuildOptions) {
        const { app_id, app_name, package_name, branding, server_url } = options;

        // 1. app.json
        const appJsonPath = path.join(buildDir, 'app.json');
        if (await fs.pathExists(appJsonPath)) {
            const appJson = await fs.readJson(appJsonPath);
            appJson.expo.name = app_name;
            appJson.expo.slug = package_name.split('.').pop() || 'vtu-app';
            appJson.expo.android.package = package_name;
            appJson.expo.ios.bundleIdentifier = package_name;
            appJson.expo.version = "1.0.0";
            await fs.writeJson(appJsonPath, appJson, { spaces: 2 });
        }

        // 2. Constants/Colors.ts
        const colorsPath = path.join(buildDir, 'constants/Colors.ts');
        if (await fs.pathExists(colorsPath)) {
            const newColorsContent = `
export const Colors = {
    primary: '${branding.primary_color}',
    primaryLight: '${branding.secondary_color}',
    primaryLighter: '${branding.secondary_color}40',
    secondary: '${branding.secondary_color}',
    accent: '#8B5CF6',
    success: '#10B981',
    warning: '#F59E0B',
    background: '#F9FAFB',
    white: '#FFFFFF',
    black: '#000000',
    gray: {
        50: '#F9FAFB', 100: '#F3F4F6', 200: '#E5E7EB', 300: '#D1D5DB',
        400: '#9CA3AF', 500: '#6B7280', 600: '#4B5563', 700: '#374151',
        800: '#1F2937', 900: '#111827',
    },
    green: {
        50: '#F0FDF4', 100: '#DCFCE7', 200: '#BBF7D0', 300: '#86EFAC',
        500: '${branding.primary_color}', 600: '${branding.primary_color}', 700: '${branding.primary_color}',
    },
    yellow: {
        50: '#FFFBEB', 100: '#FEF3C7', 200: '#FDE68A', 500: '#F59E0B', 700: '#B45309',
    },
    red: {
        100: '#FEE2E2', 500: '#EF4444', 600: '#DC2626', 700: '#B91C1C',
    },
    text: {
        primary: '#111827', secondary: '#6B7280', tertiary: '#9CA3AF', white: '#FFFFFF',
    },
    border: {
        light: '#E5E7EB', medium: '#D1D5DB',
    },
    shadow: {
        default: '#00000015',
    },
};
export default Colors;
`;
            await fs.writeFile(colorsPath, newColorsContent);
        }

        // 3. AppConfig.ts
        const configPath = path.join(buildDir, 'constants/AppConfig.ts');
        const configContent = `
export const AppConfig = {
    APP_ID: '${app_id}',
    API_URL: '${server_url}',
    APP_NAME: '${app_name}',
    PACKAGE_NAME: '${package_name}'
};
`;
        await fs.ensureDir(path.dirname(configPath));
        await fs.writeFile(configPath, configContent);

        // 4. Asset Injection (logo.png)
        if (branding.logo_path && await fs.pathExists(branding.logo_path)) {
            const assetsDir = path.join(buildDir, 'assets');
            await fs.ensureDir(assetsDir);

            // Update app icons and splash
            await fs.copy(branding.logo_path, path.join(assetsDir, 'icon.png'));
            await fs.copy(branding.logo_path, path.join(assetsDir, 'adaptive-icon.png'));
            await fs.copy(branding.logo_path, path.join(assetsDir, 'logo.png')); // Requirement: logo.png
            await fs.copy(branding.logo_path, path.join(assetsDir, 'splash.png')); // Use as splash too if no separate splash
        }
    }

    /**
     * Executes the build based on target.
     */
    static async runBuild(buildDir: string, target: string): Promise<string> {
        console.log(`[AppGenerator] Starting build for target: ${target}`);

        if (target === 'web') {
            await execa('npx', ['expo', 'export', '--platform', 'web'], { cwd: buildDir });
            const webDistPath = path.join(buildDir, 'dist');
            const zipPath = path.join(buildDir, 'web-build.zip');
            await this.zipDirectory(webDistPath, zipPath);
            return zipPath;
        } else if (target === 'android_apk') {
            // For now, we simulate but we expect real path if we were actually running gradlew
            const mockApk = path.join(buildDir, 'release.apk');
            await fs.writeFile(mockApk, 'MOCK APK CONTENT FOR ' + target);
            return mockApk;
        }

        throw new Error(`Unsupported build target: ${target}`);
    }

    private static async zipDirectory(sourceDir: string, outPath: string): Promise<void> {
        const archive = archiver('zip', { zlib: { level: 9 } });
        const stream = fs.createWriteStream(outPath);

        return new Promise((resolve, reject) => {
            archive
                .directory(sourceDir, false)
                .on('error', err => reject(err))
                .pipe(stream);

            stream.on('close', () => resolve());
            archive.finalize();
        });
    }

    /**
     * Cleans up build directory.
     */
    static async cleanup(appId: string, jobId: string) {
        const buildDir = path.join(this.APPS_BASE_PATH, appId, 'builds', jobId);
        if (await fs.pathExists(buildDir)) {
            await fs.remove(buildDir);
        }
    }
}
