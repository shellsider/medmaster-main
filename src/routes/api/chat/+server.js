// src/routes/api/chat/+server.js
import { json } from '@sveltejs/kit';
import db from '../../../server/db.js';

/**
 * GET: Returns chat messages between the current user and another user.
 * Expects two query parameters:
 * - user: the current user's username.
 * - with: the username of the person to chat with.
 */
export async function GET({ url }) {
    const currentUser = url.searchParams.get('user');
    const otherUser = url.searchParams.get('with');
    if (!currentUser || !otherUser) {
        return json({ error: "'user' and 'with' query parameters are required." }, { status: 400 });
    }

    // Query messages where the sender/receiver match the two users.
    const stmt = db.prepare(`
    SELECT * FROM messages 
    WHERE (sender = ? AND receiver = ?) OR (sender = ? AND receiver = ?)
    ORDER BY timestamp ASC
  `);
    const messages = stmt.all(currentUser, otherUser, otherUser, currentUser);
    return json({ messages });
}

/**
 * POST: Inserts a new chat message.
 * Expected JSON payload:
 * {
 *   sender: "username1",
 *   receiver: "username2",
 *   message: "Text message",    // optional if file is attached
 *   filePath: "/uploads/filename.ext"   // optional
 * }
 * A timestamp is automatically added.
 */
export async function POST({ request }) {
    try {
        const { sender, receiver, message, filePath } = await request.json();
        if (!sender || !receiver) {
            return json({ error: "Missing sender or receiver" }, { status: 400 });
        }
        const timestamp = new Date().toISOString();
        const stmt = db.prepare(`
      INSERT INTO messages (sender, receiver, message, file_path, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `);
        const result = stmt.run(sender, receiver, message, filePath, timestamp);
        return json({ success: true, id: result.lastInsertRowid });
    } catch (err) {
        return json({ error: err.message }, { status: 500 });
    }
}
