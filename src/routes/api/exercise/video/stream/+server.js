import { json } from '@sveltejs/kit';
import { spawn } from 'child_process';
import { Readable } from 'stream';
import { fileURLToPath } from 'url';
import path from 'path';
import { pathToPyhton } from '../../../../../python/path.helper';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pythonExecutable = "python"; // Adjust if needed.
const scriptPath = `${pathToPyhton}/exercise/exercise.py`

export async function GET({ url }) {
    const videoId = url.searchParams.get('video_id');
    const exerciseType = url.searchParams.get('exercise_type') || "Bench Press";
    if (!videoId) {
        return new Response("Missing video_id", { status: 400 });
    }
    const pythonProcess = spawn(pythonExecutable, [scriptPath, exerciseType, videoId]);

    const stream = new Readable({ read() { } });
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
    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        }
    });
}
