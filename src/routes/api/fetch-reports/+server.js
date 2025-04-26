// src/routes/api/fetch-reports/+server.js
import { json } from '@sveltejs/kit';
import db from '../../../server/db.js';

export async function GET({ url, locals }) {
    try {
        const testType = url.searchParams.get('testType'); // e.g., 'CBC'
        const userId = locals.user?.id;

        if (!userId || !testType) {
            return json({ error: 'Missing required query parameters' }, { status: 400 });
        }

        const stmt = db.prepare(`
      SELECT id, report_date, inference
      FROM reports
      WHERE user_id = ? AND test_type = ?
      ORDER BY report_date DESC
    `);
        const reports = stmt.all(userId, testType);

        return json({ reports });
    } catch (err) {
        console.error(err);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}
