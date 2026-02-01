import multer from 'multer';
import path from 'path';
import fs from 'fs';
// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads', 'logos');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const app_id = req.user.app_id;
        const ext = path.extname(file.originalname);
        const timestamp = Date.now();
        // Format: {app_id}_logo_{timestamp}.{ext}
        cb(null, `${app_id}_logo_${timestamp}${ext}`);
    }
});
// File filter - only allow images
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid file type. Only PNG, JPG, and SVG files are allowed.'));
    }
};
// Multer configuration
export const logoUpload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB limit
    }
});
