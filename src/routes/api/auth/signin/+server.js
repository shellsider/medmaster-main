// src/routes/api/auth/signin/+server.js
import db from '../../../../server/db.js';
import bcrypt from 'bcrypt';
import { json } from '@sveltejs/kit';
import { v4 as uuidv4 } from 'uuid';

export async function POST({ request, cookies }) {
    const { email, password } = await request.json();

    // Retrieve the user from the database using the email.
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
        return json({ error: 'User not found' }, { status: 404 });
    }

    // Compare the provided password with the hashed password.
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
        return json({ error: 'Invalid password' }, { status: 401 });
    }

    // Create a session token (in production, sign this token)
    const sessionToken = uuidv4();

    // Store the session token along with the user's email, id, and role.
    cookies.set(
        'session',
        JSON.stringify({
            token: sessionToken,
            userId: user.id,
            email: user.email,
            role: user.role
        }),
        {
            path: '/',
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 5 // 5 days
        }
    );

    return json({ success: true, user: { id: user.id, email: user.email, role: user.role } });
}
