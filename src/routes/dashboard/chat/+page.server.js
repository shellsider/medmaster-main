// src/routes/chat/+page.server.js
import { redirect } from '@sveltejs/kit';

export function load({ cookies }) {
    const sessionCookie = cookies.get('session');
    if (!sessionCookie) {
        // If no session exists, redirect to sign in.
        throw redirect(302, '/user/auth');
    }
    let session;
    try {
        session = JSON.parse(sessionCookie);
    } catch (err) {
        throw redirect(302, '/user/auth');
    }
    // Pass the user's email (and any other info) to the page.
    return { currentUser: session.email };
}
