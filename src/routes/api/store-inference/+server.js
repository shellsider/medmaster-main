// src/routes/api/store-inference/+server.js
import { json } from '@sveltejs/kit';
import db from '../../../server/db.js';

export async function POST({ request, locals }) {
    try {
        // Assume the request body is JSON containing: testType, reportDate, inference, reportData.
        const { testType, reportDate, inference, reportData } = await request.json();
        const userId = locals.user?.id; // assuming user is stored in locals via session/auth middleware
        console.log('locals.user:', locals.user);
        console.log('testType:', testType, 'reportDate:', reportDate, 'inference:', inference);


        if (!userId || !testType || !reportDate || !inference) {
            return json({ error: 'Missing required fields' }, { status: 400 });
        }

        const stmt = db.prepare(`
      INSERT INTO reports (user_id, test_type, report_date, inference, report_data)
      VALUES (?, ?, ?, ?, ?)
    `);
        stmt.run(userId, testType, reportDate, inference, reportData || null);

        return json({ message: 'Report stored successfully' });
    } catch (err) {
        console.error(err);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}
