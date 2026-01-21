
import { google } from 'googleapis';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class GoogleDriveService {
    private static SCOPES = ['https://www.googleapis.com/auth/drive.file'];
    // Use __dirname to get path relative to this file, then go up to backend root
    private static CREDENTIALS_PATH = path.resolve(__dirname, '../../credentials', 'service_account.json');

    /**
     * Authenticates with Google Drive using the Service Account.
     */
    private static async getAuthClient() {
        if (!await fs.pathExists(this.CREDENTIALS_PATH)) {
            console.warn('[GoogleDrive] Service account credentials not found at:', this.CREDENTIALS_PATH);
            return null;
        }

        const auth = new google.auth.GoogleAuth({
            keyFile: this.CREDENTIALS_PATH,
            scopes: this.SCOPES,
        });

        return auth.getClient();
    }

    /**
     * Uploads a file to Google Drive.
     * @param filePath Local path to the file.
     * @param fileName Name of the file in Drive.
     * @param folderId (Optional) ID of the folder to upload to.
     */
    static async uploadFile(
        filePath: string,
        fileName: string,
        mimeType: string = 'application/vnd.android.package-archive',
        shareWithEmail?: string
    ): Promise<string | null> {
        try {
            const authClient = await this.getAuthClient();
            if (!authClient) return null;

            const drive = google.drive({ version: 'v3', auth: authClient as any });

            const requestBody = {
                name: fileName,
                parents: [] as string[], // Add folder ID here if needed: ['folder_id']
            };

            const media = {
                mimeType: mimeType,
                body: fs.createReadStream(filePath),
            };

            console.log(`[GoogleDrive] Uploading ${fileName}...`);

            const response = await drive.files.create({
                requestBody,
                media: media,
                fields: 'id, name, webViewLink, webContentLink',
            });

            console.log('[GoogleDrive] File uploaded successfully:', response.data);

            const fileId = response.data.id;

            // Make file publicly accessible via link
            if (fileId) {
                console.log(`[GoogleDrive] Making file publicly accessible...`);
                await drive.permissions.create({
                    fileId: fileId,
                    requestBody: {
                        role: 'reader',
                        type: 'anyone'
                    }
                });
                console.log(`[GoogleDrive] File is now publicly accessible.`);

                // Also share with specific email if provided
                if (shareWithEmail) {
                    console.log(`[GoogleDrive] Sharing file with ${shareWithEmail}...`);
                    await drive.permissions.create({
                        fileId: fileId,
                        requestBody: {
                            role: 'writer',
                            type: 'user',
                            emailAddress: shareWithEmail
                        }
                    });
                    console.log(`[GoogleDrive] File shared with user successfully.`);
                }
            }

            // Return direct download link instead of view link
            const downloadLink = response.data.webContentLink || response.data.webViewLink;
            return downloadLink || null;

        } catch (error) {
            console.error('[GoogleDrive] Upload/Share failed:', error);
            return null;
        }
    }
}
