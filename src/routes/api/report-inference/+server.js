import { json } from '@sveltejs/kit';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';
import { pathToPyhton } from '../../../python/path.helper';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function POST({ request }) {
    try {
        // Parse the multipart form data
        const formData = await request.formData();
        const fileField = formData.get('file');
        if (!fileField || typeof fileField === 'string') {
            return new Response('No file uploaded', { status: 400 });
        }

        // Get language from form data; default to "en"
        const languageField = formData.get('language') || "en";

        // Convert file data (ArrayBuffer) to Buffer
        const arrayBuffer = await fileField.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Save the file to a temporary directory
        const tempDir = tmpdir();
        const fileName = `upload-${Date.now()}.pdf`;
        const filePath = path.join(tempDir, fileName);
        await fs.writeFile(filePath, buffer);

        // Compute the absolute path to the Python script.
        // (Make sure the path matches your file name exactly.)
        const scriptPath = `${pathToPyhton}/report-inference/report-inference.py`

        // Spawn the Python process, passing filePath and language as arguments
        const pythonProcess = spawn('python', [scriptPath, filePath, languageField]);

        let output = '';
        let errorOutput = '';

        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        const exitCode = await new Promise((resolve) => {
            pythonProcess.on('close', resolve);
        });

        // Clean up: delete the temporary file
        await fs.unlink(filePath);

        if (exitCode !== 0) {
            console.error(`Python error: ${errorOutput}`);
            return new Response(`Python script error: ${errorOutput}`, { status: 500 });
        }

        return json({ result: output.trim() });
    } catch (err) {
        console.error(err);
        return new Response(`Internal Server Error: ${err}`, { status: 500 });
    }
}