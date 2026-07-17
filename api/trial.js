import { sign, verify } from '../lib/token.js';

const TRIAL_DURATION_MS = 3 * 24 * 60 * 60 * 1000; // 3 أيام

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(404).json({ success: false, message: 'Not Found' });
    }

    const { action, deviceId, token } = req.body || {};

    if (!deviceId || !['start', 'status'].includes(action)) {
        return res.status(400).json({ success: false, message: 'بيانات غير صحيحة' });
    }

    if (action === 'start') {
        const now = Date.now();
        const newToken = sign({ t: 'trial', deviceId, iat: now, exp: now + TRIAL_DURATION_MS });
        return res.status(200).json({ success: true, token: newToken });
    }

    // action === 'status'
    if (!token) {
        return res.status(200).json({ expired: false, notStarted: true });
    }

    const payload = verify(token);

    if (!payload || payload.t !== 'trial' || payload.deviceId !== deviceId) {
        // توكن غير صالح أو متلاعب به أو مربوط بجهاز مختلف
        return res.status(200).json({ expired: true, remaining: 0, reason: 'device-mismatch' });
    }

    const remaining = payload.exp - Date.now();
    if (remaining <= 0) {
        return res.status(200).json({ expired: true, remaining: 0 });
    }

    return res.status(200).json({ expired: false, remaining });
}
