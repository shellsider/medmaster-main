import { json } from '@sveltejs/kit';
import { spawn } from 'child_process';
import { Readable } from 'stream';
import { fileURLToPath } from 'url';
import path from 'path';
import { pathToPyhton } from '../../../../python/path.helper';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pythonExecutable = "python"; // Adjust if needed.
const scriptPath = `${pathToPyhton}/exercise/exercise.py`

export async function GET({ url }) {
    const exerciseType = url.searchParams.get('exercise_type') || "Bench Press";
    const pythonProcess = spawn(pythonExecutable, [scriptPath, exerciseType]);

    const stream = new Readable({ read() { } });
    pythonProcess.stdout.on('data', (data) => {
        // Each data event may contain multiple JSON lines.
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
    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        }
    });
}
