import { json } from '@sveltejs/kit';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';
import { Readable } from 'stream';
import { fileURLToPath } from 'url';
import { pathToPyhton } from '../../../../python/path.helper';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pythonExecutable = "python";
const scriptPath = `${pathToPyhton}/exercise/exercise.py`

export async function POST({ request }) {
    try {
        const formData = await request.formData();
        const exerciseType = formData.get('exercise_type');
        const fileField = formData.get('file');
        if (!exerciseType || !fileField) {
            return new Response('Missing exercise type or file', { status: 400 });
        }

        // Save the uploaded video file to a temporary file.
        const arrayBuffer = await fileField.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const tempDir = tmpdir();
        const fileName = `upload-${Date.now()}${path.extname(fileField.name)}`;
        const filePath = path.join(tempDir, fileName);
        await fs.writeFile(filePath, buffer);

        // Spawn the Python process, passing exerciseType and the video file path.
        const pythonProcess = spawn(pythonExecutable, [scriptPath, exerciseType, filePath]);

        const stream = new Readable({
            read() { }
        });

        pythonProcess.stdout.on('data', (data) => {
            const lines = data.toString().split('\n').filter(Boolean);
            for (const line of lines) {
                stream.push(`data: ${line}\n\n`);
            }
        });

        pythonProcess.stdout.on('end', () => {
            stream.push(null);
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error("Python stderr:", data.toString());
        });

        // Once process ends, clean up the temporary file.
        pythonProcess.on('close', async () => {
            try {
                await fs.unlink(filePath);
            } catch (err) {
                console.error("Error deleting temp file:", err);
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            }
        });
    } catch (err) {
        console.error(err);
        return new Response(`Internal Server Error: ${err}`, { status: 500 });
    }
}
