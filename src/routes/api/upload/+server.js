// src/routes/api/upload/+server.js
import { json } from '@sveltejs/kit';
import { uploadFile } from '../../../utils/cloudinary.helper.js';

export async function POST({ request }) {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
        return json({ error: "No file provided" }, { status: 400 });
    }

    try {
        // Read the file as an ArrayBuffer then convert to Buffer.
        const buffer = Buffer.from(await file.arrayBuffer());
        // Use Cloudinary uploader with an upload stream.
        // Since Cloudinary's uploader.upload_stream requires a callback,
        // we can wrap it in a promise.
        const uploadResult = await new Promise((resolve, reject) => {
            const stream = uploadFileStream((error, result) => {
                if (error) reject(error);
                else resolve(result);
            });
            stream.end(buffer);
        });

        return json({ filePath: uploadResult.secure_url });
    } catch (error) {
        console.error("Error in Cloudinary upload endpoint:", error);
        return json({ error: error.message }, { status: 500 });
    }
}

// Helper function to wrap cloudinary.uploader.upload_stream in a Promise.
import { v2 as cloudinary } from 'cloudinary';
function uploadFileStream(callback) {
    return cloudinary.uploader.upload_stream(callback);
}
