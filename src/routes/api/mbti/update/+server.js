// src/routes/api/mbti/update/+server.js
import db from '../../../../server/db.js';
import { json } from '@sveltejs/kit';

export async function POST({ request, cookies }) {
    // Retrieve the session cookie (assumed to contain JSON with at least userId)
    const sessionCookie = cookies.get('session');
    if (!sessionCookie) {
        return json({ error: 'Not authenticated' }, { status: 401 });
    }
    let session;
    try {
        session = JSON.parse(sessionCookie);
    } catch (err) {
        return json({ error: 'Invalid session' }, { status: 401 });
    }
    const userId = session.userId;
    const { mbti, ei, sn, tf, jp } = await request.json();

    try {
        const stmt = db.prepare(`
      UPDATE users
      SET mbti = ?,
          ei_I = ?,
          ei_E = ?,
          sn_N = ?,
          sn_S = ?,
          tf_F = ?,
          tf_T = ?,
          jp_P = ?,
          jp_J = ?
      WHERE id = ?
    `);
        stmt.run(mbti, ei.I, ei.E, sn.N, sn.S, tf.F, tf.T, jp.P, jp.J, userId);
        return json({ success: true });
    } catch (error) {
        return json({ error: error.message }, { status: 400 });
    }
}
