import { sign } from '../lib/token.js';

// قائمة المفاتيح المسموح بها فقط
const VALID_KEYS = ["CRR-MM-2026-OLODL"];

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(404).json({ status: 'error', message: 'Not Found' });
    }

    const { key, deviceId } = req.body || {};

    if (!key || !deviceId) {
        return res.status(400).json({ status: 'error', message: 'بيانات ناقصة (المفتاح أو معرّف الجهاز)' });
    }

    if (!VALID_KEYS.includes(key)) {
        return res.status(401).json({ status: 'error', message: 'المفتاح غير صحيح' });
    }

    // نوقّع بيانات التفعيل ونرجّعها كتوكن، بدل ما نخزّنها في قاعدة بيانات
    const token = sign({ t: 'lic', key, deviceId, iat: Date.now() });

    return res.status(200).json({ status: 'success', token });
}
