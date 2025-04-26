// src/routes/dashboard/+layout.server.js
import { redirect, json } from '@sveltejs/kit';
import db from '../../server/db.js';

export function load({ cookies }) {
    const sessionCookie = cookies.get('session');
    if (!sessionCookie) {
        throw redirect(302, '/user/auth');
    }
    let session;
    try {
        session = JSON.parse(sessionCookie);
    } catch (error) {
        throw redirect(302, '/user/auth');
    }
    const user = db.prepare('SELECT mbti, ei_I, ei_E, sn_N, sn_S, tf_F, tf_T, jp_P, jp_J FROM users WHERE id = ?').get(session.userId);
    // If values are null, set them to 0%
    const mbtiData = {
        mbti: user.mbti || '',
        ei: { I: user.ei_I || 0, E: user.ei_E || 0 },
        sn: { N: user.sn_N || 0, S: user.sn_S || 0 },
        tf: { F: user.tf_F || 0, T: user.tf_T || 0 },
        jp: { P: user.jp_P || 0, J: user.jp_J || 0 }
    };
    return { session, mbtiData };
}
