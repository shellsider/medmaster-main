// src/routes/api/session/+server.js
import { json } from '@sveltejs/kit';

export async function GET({ cookies }) {
    const sessionCookie = cookies.get('session');
    if (!sessionCookie) {
        return json({ error: 'Not authenticated' }, { status: 401 });
    }
    try {
        const session = JSON.parse(sessionCookie);
        // Return only the needed info; here, the active user's email.
        return json({ currentUser: session.email });
    } catch (err) {
        return json({ error: 'Invalid session' }, { status: 401 });
    }
}
