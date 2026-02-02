import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads', 'logos');
const profileDir = path.join(process.cwd(), 'uploads', 'profiles');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const userId = (req as any).user.id;
        const appId = (req as any).user.app_id || 'new_app';
        const ext = path.extname(file.originalname);
        const timestamp = Date.now();
        // Format: {app_id}_{userId}_logo_{timestamp}.{ext}
        cb(null, `${appId}_${userId}_logo_${timestamp}${ext}`);
    }
});

// File filter - only allow images
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PNG, JPG, and SVG files are allowed.'));
    }
};

// Multer configuration for logos
export const logoUpload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB limit
    }
});

// Multer configuration for profile pictures
export const profilePictureUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, profileDir);
        },
        filename: (req, file, cb) => {
            const userId = (req as any).user.id;
            const ext = path.extname(file.originalname);
            cb(null, `profile_${userId}_${Date.now()}${ext}`);
        }
    }),
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    }
});
