// src/routes/api/auth/sessionLogin/+server.js
import admin from '$lib/server/firebase-admin';
import { json } from '@sveltejs/kit';

export async function POST({ request }) {
    try {
        const { idToken } = await request.json();

        // Define session expiration (e.g. 5 days in milliseconds)
        const expiresIn = 60 * 60 * 24 * 5 * 1000;

        // Create session cookie based on the ID token
        const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });

        // Return the session cookie as an HTTP‑only cookie
        return json(
            { success: true },
            {
                headers: {
                    // The Set-Cookie header will send the cookie to the browser.
                    'Set-Cookie': `session=${sessionCookie}; Path=/; HttpOnly; Secure; Max-Age=${expiresIn / 1000}`
                }
            }
        );
    } catch (error) {
        return json({ error: error.message }, { status: 400 });
    }
}
