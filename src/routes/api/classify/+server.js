import { json } from '@sveltejs/kit';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';
import { pathToPyhton } from '../../../python/path.helper';

export async function POST({ request }) {
    try {
        // Parse the multipart form data
        const formData = await request.formData();
        const fileField = formData.get('file');
        if (!fileField || typeof fileField === 'string') {
            return new Response('No file uploaded', { status: 400 });
        }

        // Get the selected model type (default: "brain")
        const modelType = formData.get('modelType') || 'brain';

        // Convert file data to a Node Buffer
        const arrayBuffer = await fileField.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Write file to a temporary directory
        const tempDir = tmpdir();
        const fileName = `upload-${Date.now()}${path.extname(fileField.name)}`;
        const filePath = path.join(tempDir, fileName);
        await fs.writeFile(filePath, buffer);

        // Compute the absolute path to the Python script
        const scriptPath = `${pathToPyhton}/classifier/classifier.py`;

        // Spawn the Python process with file path and model type as arguments
        const pythonProcess = spawn('python', [scriptPath, filePath, modelType]);

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

        // Delete the temporary file
        await fs.unlink(filePath);

        if (exitCode !== 0) {
            console.error(`Python error: ${errorOutput}`);
            return new Response(`Python script error: ${errorOutput}`, { status: 500 });
        }

        console.log('Python script output:', output);

        // Parse the JSON output from the Python script
        const result = JSON.parse(output);
        return json(result);
    } catch (err) {
        console.error(err);
        return new Response(`Internal Server Error: ${err}`, { status: 500 });
    }
}
