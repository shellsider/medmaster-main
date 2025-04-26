// src/routes/api/compare-inference/+server.js
import { json } from '@sveltejs/kit';
import db from '../../../server/db.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Update this path to point to your Python comparison script
const comparisonScript = path.join(__dirname, '../../../python/report-inference/compare_inference.py');

export async function POST({ request, locals }) {
    try {
        // Expect JSON with: newInference and previousReportId
        const { newInference, previousReportId } = await request.json();
        const userId = locals.user?.id;


        if (!userId || !newInference || !previousReportId) {
            return json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Fetch the previous inference from DB to compare against
        const stmt = db.prepare(`SELECT inference FROM reports WHERE id = ? AND user_id = ?`);
        const row = stmt.get(previousReportId, userId);
        if (!row) {
            return json({ error: 'Previous report not found' }, { status: 404 });
        }
        const previousInference = row.inference;

        // Spawn a Python process to compare inferences
        const pythonProcess = spawn('python', [comparisonScript, JSON.stringify(newInference), JSON.stringify(previousInference)]);
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

        if (exitCode !== 0) {
            console.error(`Python error: ${errorOutput}`);
            return json({ error: 'Error generating comparison' }, { status: 500 });
        }

        return json({ comparison: output.trim() });
    } catch (err) {
        console.error(err);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}
