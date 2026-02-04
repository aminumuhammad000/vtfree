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
            const safePackageName = package_name || 'com.vtfree.app';
            appJson.expo.slug = safePackageName.split('.').pop() || 'vtu-app';
            appJson.expo.android.package = safePackageName;
            appJson.expo.ios.bundleIdentifier = safePackageName;
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
     * Installs dependencies in the build directory.
     */
    static async installDependencies(buildDir: string) {
        console.log(`[AppGenerator] Installing dependencies in: ${buildDir}`);
        // Use --no-audit and --no-fund to speed up
        await execa('npm', ['install', '--no-audit', '--no-fund', '--prefer-offline'], { cwd: buildDir });
    }

    /**
     * Executes the build based on target.
     */
    static async runBuild(buildDir: string, target: string): Promise<string> {
        console.log(`[AppGenerator] Starting build for target: ${target}`);

        if (target === 'web') {
            // Ensure expo is available (locally)
            await execa('npx', ['expo', 'export', '--platform', 'web'], {
                cwd: buildDir,
                env: { ...process.env, CI: 'true' }
            });
            const webDistPath = path.join(buildDir, 'dist');
            const zipPath = path.join(buildDir, 'web-build.zip');
            await this.zipDirectory(webDistPath, zipPath);
            return zipPath;
        } else if (target === 'android_apk') {
            console.log('[AppGenerator] Running Expo Prebuild...');
            // Prebuild to generate native android folder
            await execa('npx', ['expo', 'prebuild', '--platform', 'android', '--clean'], {
                cwd: buildDir,
                stdio: 'inherit',
                env: { ...process.env, CI: '1', EXPO_NO_INTERACTIVE_PROMPTS: '1' }
            });

            const androidDir = path.join(buildDir, 'android');

            // Locate Tools (JDK, Android SDK) relative to backend/src/services
            // Expected structure: vtfree/tools/
            const toolsDir = path.resolve(__dirname, '../../../tools');
            const jdkPath = path.join(toolsDir, 'jdk-17.0.2');
            const androidSdkPath = path.join(toolsDir, 'android-sdk'); // Ensure this exists or fallback to system?

            // Prepare Environment Variables
            // We prioritize our bundled tools if they exist
            let env = { ...process.env };

            if (await fs.pathExists(jdkPath)) {
                console.log(`[AppGenerator] Using bundled JDK: ${jdkPath}`);
                env.JAVA_HOME = jdkPath;
                env.PATH = `${path.join(jdkPath, 'bin')}:${env.PATH}`;
            }

            if (await fs.pathExists(androidSdkPath)) {
                console.log(`[AppGenerator] Using bundled Android SDK: ${androidSdkPath}`);
                env.ANDROID_HOME = androidSdkPath;
                // Create local.properties to ensure Gradle sees it
                await fs.writeFile(path.join(androidDir, 'local.properties'), `sdk.dir=${androidSdkPath}\n`);
            }

            console.log('[AppGenerator] Running Gradle AssembleRelease...');
            try {
                await execa('chmod', ['+x', 'gradlew'], { cwd: androidDir });
                await execa('./gradlew', ['assembleRelease'], {
                    cwd: androidDir,
                    stdio: 'inherit',
                    env
                });
            } catch (buildErr: any) {
                console.error('[AppGenerator] Gradle build failed:', buildErr);
                // Fallback: If build fails (e.g. memory), we MIGHT want to throw.
                // But for "fully functional" we need it to work.
                throw new Error(`Gradle build failed: ${buildErr.message}`);
            }

            const apkPath = path.join(androidDir, 'app/build/outputs/apk/release/app-release.apk');
            if (await fs.pathExists(apkPath)) {
                return apkPath;
            } else {
                throw new Error('APK file not found after build completion.');
            }
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
