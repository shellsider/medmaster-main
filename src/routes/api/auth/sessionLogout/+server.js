// src/routes/api/auth/sessionLogout/+server.js
import { json } from '@sveltejs/kit';

export async function POST() {
    return json(
        { success: true },
        {
            headers: {
                'Set-Cookie': `session=; Path=/; HttpOnly; Secure; Max-Age=0`
            }
        }
    );
}
