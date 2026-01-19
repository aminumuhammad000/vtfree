import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';
import { execa } from 'execa';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export class AppGeneratorService {
    // Define paths relative to the backend/src/services directory
    // backend is at vtfree/backend
    // app-templete is at vtfree/app-templete
    static TEMPLATE_PATH = path.resolve(__dirname, '../../../app-templete');
    static OUTPUT_BASE_PATH = path.resolve(__dirname, '../../../generated_apps');
    static async generateSourceCode(data) {
        try {
            const { app_id, app_name, package_name, branding } = data;
            const appPath = path.join(this.OUTPUT_BASE_PATH, app_id);
            console.log(`[AppGenerator] Starting generation for ${app_id} at ${appPath}`);
            // 1. Ensure output directory exists
            await fs.ensureDir(this.OUTPUT_BASE_PATH);
            // 2. Clone Template
            await fs.copy(this.TEMPLATE_PATH, appPath, {
                filter: (src) => {
                    // Skip node_modules and git folders to speed up copy
                    return !src.includes('node_modules') && !src.includes('.git') && !src.includes('dist.zip');
                }
            });
            console.log(`[AppGenerator] Template cloned`);
            // 3. Configure App (app.json)
            const appJsonPath = path.join(appPath, 'app.json');
            if (await fs.pathExists(appJsonPath)) {
                const appJson = await fs.readJson(appJsonPath);
                // Update expo config
                appJson.expo.name = app_name;
                appJson.expo.slug = package_name.split('.').pop() || 'vtu-app';
                appJson.expo.android.package = package_name;
                appJson.expo.ios.bundleIdentifier = package_name;
                appJson.expo.scheme = `vtu${app_id.replace('app_', '')}`; // Unique scheme
                await fs.writeJson(appJsonPath, appJson, { spaces: 2 });
                console.log(`[AppGenerator] app.json updated`);
            }
            // 4. Update Colors (constants/Colors.ts)
            const colorsPath = path.join(appPath, 'constants/Colors.ts');
            if (await fs.pathExists(colorsPath)) {
                const newColorsContent = `
export const Colors = {
    primary: '${branding.primary_color}',
    primaryLight: '${branding.secondary_color}', // Approx
    primaryLighter: '${branding.secondary_color}40', // Approx with opacity
    secondary: '${branding.secondary_color}',
    accent: '#8B5CF6',
    success: '#10B981',
    warning: '#F59E0B',
    background: '#F9FAFB',
    white: '#FFFFFF',
    black: '#000000',
    gray: {
        50: '#F9FAFB',
        100: '#F3F4F6',
        200: '#E5E7EB',
        300: '#D1D5DB',
        400: '#9CA3AF',
        500: '#6B7280',
        600: '#4B5563',
        700: '#374151',
        800: '#1F2937',
        900: '#111827',
    },
    green: {
        50: '#F0FDF4',
        100: '#DCFCE7',
        200: '#BBF7D0',
        300: '#86EFAC',
        500: '${branding.primary_color}', // Map primary to green.500
        600: '${branding.primary_color}',
        700: '${branding.primary_color}',
    },
    yellow: {
        50: '#FFFBEB',
        100: '#FEF3C7',
        200: '#FDE68A',
        500: '#F59E0B',
        700: '#B45309',
    },
    red: {
        100: '#FEE2E2',
        500: '#EF4444',
        600: '#DC2626',
        700: '#B91C1C',
    },
    text: {
        primary: '#111827',
        secondary: '#6B7280',
        tertiary: '#9CA3AF',
        white: '#FFFFFF',
    },
    border: {
        light: '#E5E7EB',
        medium: '#D1D5DB',
    },
    shadow: {
        default: '#00000015',
    },
};
export default Colors;
`;
                await fs.writeFile(colorsPath, newColorsContent);
                console.log(`[AppGenerator] Colors.ts updated`);
            }
            // 5. Inject App Config
            // Create constants/AppConfig.ts
            const configPath = path.join(appPath, 'constants/AppConfig.ts');
            const configContent = `
export const AppConfig = {
    APP_ID: '${app_id}',
    API_URL: 'https://vua.vtfree.com/api', // TODO: Make this dynamic from env or current backend
    APP_NAME: '${app_name}',
    PACKAGE_NAME: '${package_name}'
};
`;
            await fs.ensureDir(path.dirname(configPath));
            await fs.writeFile(configPath, configContent);
            console.log(`[AppGenerator] AppConfig.ts created`);
            console.log(`[AppGenerator] Successfully generated app source at ${appPath}`);
            return {
                success: true,
                path: appPath
            };
        }
        catch (error) {
            console.error('[AppGenerator] Error:', error);
            throw error;
        }
    }
    static async buildApk(app_id) {
        const appPath = path.join(this.OUTPUT_BASE_PATH, app_id);
        const androidPath = path.join(appPath, 'android');
        const apkOutputRelativePath = 'android/app/build/outputs/apk/release/app-release.apk';
        const apkPath = path.join(appPath, apkOutputRelativePath);
        console.log(`[AppGenerator] Starting APK build for ${app_id}...`);
        try {
            // Check if app source exists
            if (!await fs.pathExists(appPath)) {
                throw new Error('App source code not found. Please generate it first.');
            }
            // 1. Install Dependencies
            console.log(`[AppGenerator] Installing dependencies...`);
            await execa('npm', ['install'], { cwd: appPath, stdio: 'inherit' });
            // 2. Prebuild (Generate Native Code)
            console.log(`[AppGenerator] Prebuilding Android project...`);
            // We need to bypass interactive prompts, assume default
            // --platform android to save time
            await execa('npx', ['expo', 'prebuild', '--platform', 'android', '--clean'], { cwd: appPath, stdio: 'inherit' });
            // 3. Build APK with Gradle
            console.log(`[AppGenerator] Building APK with Gradle...`);
            // Allow execute permission on gradlew
            await execa('chmod', ['+x', 'gradlew'], { cwd: androidPath });
            // Run assembleRelease
            await execa('./gradlew', ['assembleRelease'], { cwd: androidPath, stdio: 'inherit' });
            // 4. Verify output
            if (await fs.pathExists(apkPath)) {
                console.log(`[AppGenerator] APK built successfully at ${apkPath}`);
                return { success: true, apkPath };
            }
            else {
                // Check for debug apk if release failed/moved
                const debugApkPath = path.join(appPath, 'android/app/build/outputs/apk/debug/app-debug.apk');
                if (await fs.pathExists(debugApkPath)) {
                    return { success: true, apkPath: debugApkPath, message: 'Debug APK created' };
                }
                throw new Error('APK file not found after build');
            }
        }
        catch (error) {
            console.error('[AppGenerator] Build failed:', error);
            return {
                success: false,
                message: error.message || 'Build process failed. Check logs.'
            };
        }
    }
    static async zipSourceCode(app_id) {
        return new Promise((resolve, reject) => {
            const sourceDir = path.join(this.OUTPUT_BASE_PATH, app_id);
            const zipPath = path.join(this.OUTPUT_BASE_PATH, `${app_id}.zip`);
            // Check if source exists
            if (!fs.existsSync(sourceDir)) {
                return reject(new Error('App source not found'));
            }
            const output = fs.createWriteStream(zipPath);
            const archive = archiver('zip', { zlib: { level: 9 } });
            output.on('close', () => {
                console.log(`[AppGenerator] Zip created: ${zipPath} (${archive.pointer()} total bytes)`);
                resolve(zipPath);
            });
            archive.on('error', (err) => reject(err));
            archive.pipe(output);
            archive.directory(sourceDir, false);
            archive.finalize();
        });
    }
}
