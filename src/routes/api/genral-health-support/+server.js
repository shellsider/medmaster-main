import { json } from '@sveltejs/kit';
import { spawn } from 'child_process';
import { tmpdir } from 'os';
import fs from 'fs/promises';
import path from 'path';
import { pathToPyhton } from '../../../python/path.helper';

export async function POST({ request }) {
    try {
        // Parse the form data from the request
        const formData = await request.formData();
        const symptoms = formData.get('symptoms');
        const language = formData.get('language') || "en";
        if (!symptoms || typeof symptoms !== 'string') {
            return new Response("No symptoms provided", { status: 400 });
        }

        // Set the absolute path to your Python script.
        // Adjust the path to match your project structure.
        const scriptPath = `${pathToPyhton}/genral-health-support/genral_health_support.py`

        // Spawn the Python process with the symptoms and language as arguments.
        const pythonProcess = spawn('python', [scriptPath, symptoms, language]);

        let output = "";
        let errorOutput = "";

        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        const exitCode = await new Promise((resolve) => {
            pythonProcess.on('close', resolve);
        });

        if (exitCode !== 0) {
            console.error(`Python error: ${errorOutput}`);
            return new Response(`Python script error: ${errorOutput}`, { status: 500 });
        }

        const result = JSON.parse(output);
        return json(result);
    } catch (err) {
        console.error(err);
        return new Response(`Internal Server Error: ${err}`, { status: 500 });
    }
}
