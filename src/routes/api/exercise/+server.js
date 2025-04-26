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
        // Parse the multipart form data.
        const formData = await request.formData();
        const exerciseType = formData.get('exercise_type');
        const file = formData.get('file');
        if (!exerciseType || !file) {
            return new Response('Missing exercise type or file', { status: 400 });
        }

        // Save the uploaded video file to a temporary directory.
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const tempDir = tmpdir();
        const fileName = `upload-${Date.now()}${path.extname(file.name)}`;
        const filePath = path.join(tempDir, fileName);
        await fs.writeFile(filePath, buffer);

        // Compute the absolute path to the Python script.
        // Adjust this path to match your project structure.
        const scriptPath = `${pathToPyhton}/exercise/exercise.py`

        // Spawn the Python process, passing the file path and exercise type as arguments.
        const pythonProcess = spawn('python', [scriptPath, filePath, exerciseType]);

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

        // Clean up the temporary file.
        await fs.unlink(filePath);

        if (exitCode !== 0) {
            console.error(`Python error: ${errorOutput}`);
            return new Response(`Python script error: ${errorOutput}`, { status: 500 });
        }

        return json(JSON.parse(output));
    } catch (err) {
        console.error(err);
        return new Response(`Internal Server Error: ${err}`, { status: 500 });
    }
}
