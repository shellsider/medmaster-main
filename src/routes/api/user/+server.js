// src/routes/api/user/+server.js
import { json } from '@sveltejs/kit';
import db from '../../../server/db.js';

export async function GET({ cookies }) {
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

    const user = db
        .prepare('SELECT * FROM users WHERE id = ?')
        .get(session.userId);

    if (!user) {
        return json({ error: 'User not found' }, { status: 404 });
    }

    return json({ user });
}
