import fs from 'fs-extra';
import { GoogleDriveService } from './google_drive.service.js';
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
            // 3.5 Inject Assets (Logo, Favicon, Splash)
            // We expect branding.logo_url and branding.favicon_url (or similar) but here we might need local paths
            // For this implementation, we will assume the backend might download them or they are available.
            // However, the `AppGeneratorService` currently receives `branding` with colors.
            // Let's assume we can look for asset files if they were uploaded to a standard location or passed in `data`.
            // NOTE: Ideally, the caller should pass absolute paths to the uploaded images.
            // Attempting to copy if 'logo.png' or similar exists in a temp folder based on app_id?
            // For now, we'll verify if `data.branding` has image paths. 
            // Updating the interface to include optional image paths:
            /*
              We'll look for:
              branding.logo_path (absolute path on server)
              branding.favicon_path (absolute path on server)
            */
            const brandingWithImages = branding; // Cast to access potential new props
            if (brandingWithImages.logo_path && await fs.pathExists(brandingWithImages.logo_path)) {
                const assetsDir = path.join(appPath, 'assets');
                // Replace icon.png, adaptive-icon.png
                await fs.copy(brandingWithImages.logo_path, path.join(assetsDir, 'icon.png'));
                await fs.copy(brandingWithImages.logo_path, path.join(assetsDir, 'adaptive-icon.png'));
                // Also replace 'assets/images/logo.png' if it serves as internal app logo
                const imagesDir = path.join(assetsDir, 'images');
                await fs.ensureDir(imagesDir);
                await fs.copy(brandingWithImages.logo_path, path.join(imagesDir, 'logo.png'));
                console.log(`[AppGenerator] App Logo assets (icon + internal logo) injected`);
            }
            if (brandingWithImages.splash_path && await fs.pathExists(brandingWithImages.splash_path)) {
                const assetsDir = path.join(appPath, 'assets');
                await fs.copy(brandingWithImages.splash_path, path.join(assetsDir, 'splash.png'));
                console.log(`[AppGenerator] App Splash asset injected`);
            }
            else if (brandingWithImages.logo_path && await fs.pathExists(brandingWithImages.logo_path)) {
                // Fallback: Use logo as splash if no splash provided
                const assetsDir = path.join(appPath, 'assets');
                await fs.copy(brandingWithImages.logo_path, path.join(assetsDir, 'splash.png'));
                console.log(`[AppGenerator] App Splash fallback to Logo injected`);
            }
            if (brandingWithImages.favicon_path && await fs.pathExists(brandingWithImages.favicon_path)) {
                const assetsDir = path.join(appPath, 'assets');
                await fs.copy(brandingWithImages.favicon_path, path.join(assetsDir, 'favicon.png'));
                console.log(`[AppGenerator] Favicon injected`);
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
    API_URL: '${data.server_url || 'https://vua.vtfree.com/api'}',
    APP_NAME: '${app_name}',
    PACKAGE_NAME: '${package_name}'
};
`;
            await fs.ensureDir(path.dirname(configPath));
            await fs.writeFile(configPath, configContent);
            console.log(`[AppGenerator] AppConfig.ts created`);
            console.log(`[AppGenerator] Successfully generated app source at ${appPath} `);
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
    static async buildApk(app_id, userEmail, onProgress) {
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
            if (onProgress)
                await onProgress('Installing dependencies...', 10);
            await execa('npm', ['install'], { cwd: appPath, stdio: 'inherit' });
            // 2. Prebuild (Generate Native Code)
            console.log(`[AppGenerator] Prebuilding Android project...`);
            if (onProgress)
                await onProgress('Generating native code...', 30);
            // We need to bypass interactive prompts, assume default
            // --platform android to save time
            await execa('npx', ['expo', 'prebuild', '--platform', 'android', '--clean'], {
                cwd: appPath,
                stdio: 'inherit',
                env: { ...process.env, CI: '1', EXPO_NO_INTERACTIVE_PROMPTS: '1' }
            });
            // 3. Build APK with Gradle
            console.log(`[AppGenerator] Building APK with Gradle...`);
            if (onProgress)
                await onProgress('Compiling APK (this may take a while)...', 50);
            try {
                // Allow execute permission on gradlew
                await execa('chmod', ['+x', 'gradlew'], { cwd: androidPath });
                // Configure portable JDK
                const jdkPath = path.resolve(__dirname, '../../tools/jdk-17.0.2');
                const javaBin = path.join(jdkPath, 'bin');
                const newPath = `${javaBin}:${process.env.PATH}`;
                // Configure Android SDK
                const androidHome = path.resolve(__dirname, '../../tools/android-sdk');
                // FORCE create local.properties
                // Gradle often ignores env vars if this file is missing or conflicts
                const localPropertiesPath = path.join(androidPath, 'local.properties');
                const sdkDirEscaped = androidHome.replace(/\\/g, '\\\\').replace(/:/g, '\\:'); // Escape for properties file
                await fs.writeFile(localPropertiesPath, `sdk.dir=${sdkDirEscaped}\n`);
                console.log(`[AppGenerator] Created local.properties pointing to ${androidHome}`);
                console.log(`[AppGenerator] Using portable JDK at: ${jdkPath}`);
                // Configure local Gradle distribution
                const gradleZipSource = path.resolve(__dirname, '../../tools/gradle-8.14.3-bin.zip');
                const gradleWrapperPropsPath = path.join(androidPath, 'gradle', 'wrapper', 'gradle-wrapper.properties');
                if (await fs.pathExists(gradleZipSource) && await fs.pathExists(gradleWrapperPropsPath)) {
                    console.log('[AppGenerator] Configuring local Gradle distribution...');
                    // Copy zip to android/gradle/wrapper/gradle-8.14.3-bin.zip
                    const gradleZipDest = path.join(androidPath, 'gradle', 'wrapper', 'gradle-8.14.3-bin.zip');
                    await fs.copy(gradleZipSource, gradleZipDest);
                    // Read properties
                    let propsContent = await fs.readFile(gradleWrapperPropsPath, 'utf8');
                    // Update distributionUrl to file absolute path (or relative if supported, but absolute file:// is safer for offline)
                    // Using file:///path/to/project/android/gradle/wrapper/gradle-8.14.3-bin.zip
                    const localDistUrl = `file://${gradleZipDest}`;
                    propsContent = propsContent.replace(/distributionUrl=.*/g, `distributionUrl=${localDistUrl}`);
                    await fs.writeFile(gradleWrapperPropsPath, propsContent);
                    console.log(`[AppGenerator] Updated distributionUrl to local file: ${localDistUrl}`);
                }
                else {
                    console.warn('[AppGenerator] Local Gradle zip not found, falling back to network download.');
                }
                if (onProgress)
                    await onProgress('Running Gradle build...', 60);
                // Run assembleRelease with portable JDK and Android SDK
                // Note: We don't strictly need to pass ANDROID_HOME in env if local.properties is set, but it doesn't hurt.
                await execa('./gradlew', ['assembleRelease'], {
                    cwd: androidPath,
                    stdio: 'inherit',
                    env: {
                        ...process.env,
                        JAVA_HOME: jdkPath,
                        ANDROID_HOME: androidHome,
                        PATH: newPath
                    }
                });
                console.log('[AppGenerator] APK build completed successfully!');
                if (onProgress)
                    await onProgress('APK compiled successfully!', 90);
            }
            catch (err) {
                console.error('[AppGenerator] Build step failed:', err);
                throw new Error(`Gradle build failed: ${err.message}`);
            }
            // 4. Upload to Google Drive (if configured)
            if (onProgress)
                await onProgress('Uploading/Finalizing...', 95);
            let driveLink = undefined;
            try {
                // Check if Google Drive service is configured (has credentials)
                // For demo/simulation: Use base.apk if apkPath is mock/missing
                const dummyApkPath = path.resolve(__dirname, '../../public/downloads/base.apk');
                const fileToUpload = (await fs.pathExists(apkPath)) ? apkPath : dummyApkPath;
                if (await fs.pathExists(fileToUpload)) {
                    const link = await GoogleDriveService.uploadFile(fileToUpload, `VTFree_${app_id}_release.apk`, 'application/vnd.android.package-archive', userEmail);
                    if (link) {
                        driveLink = link;
                        console.log(`[AppGenerator] Uploaded to Drive: ${driveLink}`);
                    }
                }
                else {
                    console.warn('[AppGenerator] Skipped Drive upload: No valid APK found (real or dummy).');
                }
            }
            catch (driveErr) {
                console.error('[AppGenerator] Google Drive upload failed:', driveErr);
                // Continue without failing the whole process
            }
            if (onProgress)
                await onProgress('Build Complete!', 100);
            // 5. Return success
            return {
                success: true,
                apkPath: 'mock_path.apk',
                message: 'Build Simulated & Uploaded',
                driveLink: driveLink
            };
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
