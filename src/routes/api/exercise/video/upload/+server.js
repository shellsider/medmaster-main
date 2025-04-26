import { json } from '@sveltejs/kit';
import fs from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';

export async function POST({ request }) {
    try {
        const formData = await request.formData();
        const fileField = formData.get('file');
        if (!fileField) {
            return new Response('No file uploaded', { status: 400 });
        }
        const arrayBuffer = await fileField.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const tempDir = tmpdir();
        const fileName = `upload-${Date.now()}${path.extname(fileField.name)}`;
        const filePath = path.join(tempDir, fileName);
        await fs.writeFile(filePath, buffer);
        return json({ video_id: filePath });
    } catch (err) {
        console.error(err);
        return new Response(`Internal Server Error: ${err}`, { status: 500 });
    }
}
