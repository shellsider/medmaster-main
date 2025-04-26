// src/routes/api/auth/signup/+server.js
import db from '../../../../server/db.js';
import bcrypt from 'bcrypt';
import { json } from '@sveltejs/kit';

export async function POST({ request }) {
    const { email, password, role } = await request.json();

    // Hash the password (using 10 salt rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        // Insert new user into the database; default role is 'user'
        const stmt = db.prepare(`
      INSERT INTO users (email, password, role)
      VALUES (?, ?, ?)
    `);
        const result = stmt.run(email, hashedPassword, role || 'user');

        return json({ success: true, userId: result.lastInsertRowid });
    } catch (error) {
        // Likely a unique constraint violation if the email exists
        return json({ error: error.message }, { status: 400 });
    }
}
