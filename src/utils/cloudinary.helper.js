// src/utils/cloudinary.helper.js
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary using your credentials.
// In production, store credentials in environment variables.
cloudinary.config({
    cloud_name: 'deefwes8x',
    api_key: '411393753654659',
    api_secret: 'S5Wfs01fuRSCzHTYMmAO0NkQ6oI' // ensure this is set in your environment
});

/**
 * Uploads a file to Cloudinary.
 * @param {string} filePath - The local file path or a buffer/stream.
 * @param {object} options - Additional upload options.
 * @returns {Promise<object>} - The upload result.
 */
export async function uploadFile(file, options = {}) {
    try {
        // Cloudinary accepts buffers if you use the "upload_stream" method.
        // If you have a file path (local path) you can use uploader.upload.
        // Here, we assume file is a path or a remote URL.
        const result = await cloudinary.uploader.upload(file, options);
        return result;
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        throw error;
    }
}

/**
 * Generates an optimized URL for a Cloudinary resource.
 * @param {string} publicId - The public ID of the resource.
 * @param {object} options - Transformation options.
 * @returns {string} - The generated URL.
 */
export function generateOptimizedUrl(publicId, options = {}) {
    return cloudinary.url(publicId, options);
}
