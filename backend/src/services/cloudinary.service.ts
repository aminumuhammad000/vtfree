import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/env.js';

// Configure Cloudinary
cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
});

export const cloudinaryService = {
    /**
     * Upload an image to Cloudinary
     * @param filePath Path to the local file
     * @param folder Folder name in Cloudinary
     * @returns Promise with upload result
     */
    uploadImage: async (filePath: string, folder: string = 'vtfree/logos') => {
        try {
            const result = await cloudinary.uploader.upload(filePath, {
                folder: folder,
                resource_type: 'auto',
            });
            return result;
        } catch (error) {
            console.error('Cloudinary upload error:', error);
            throw error;
        }
    },

    /**
     * Delete an image from Cloudinary
     * @param publicId Public ID of the image
     */
    deleteImage: async (publicId: string) => {
        try {
            const result = await cloudinary.uploader.destroy(publicId);
            return result;
        } catch (error) {
            console.error('Cloudinary delete error:', error);
            throw error;
        }
    },

    /**
     * Extract public ID from Cloudinary URL
     * @param url Cloudinary URL
     */
    getPublicIdFromUrl: (url: string) => {
        const parts = url.split('/');
        const fileNameWithExt = parts[parts.length - 1];
        const [fileName] = fileNameWithExt.split('.');

        // If it's in a folder, we need the folder name too
        // Example: https://res.cloudinary.com/demo/image/upload/v12345678/folder/image.jpg
        // public_id would be 'folder/image'

        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex !== -1 && parts.length > uploadIndex + 2) {
            // Skip the version part (starts with 'v')
            let startIndex = uploadIndex + 1;
            if (parts[startIndex].startsWith('v')) {
                startIndex++;
            }
            const publicIdParts = parts.slice(startIndex);
            const fullPublicId = publicIdParts.join('/');
            return fullPublicId.split('.')[0];
        }

        return fileName;
    }
};
