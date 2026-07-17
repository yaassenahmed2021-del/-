import crypto from 'crypto';

// غيّر هذا عبر متغيّر بيئة LICENSE_SECRET في إعدادات مشروع Vercel
// (Project Settings -> Environment Variables). لا تتركه على القيمة
// الافتراضية في بيئة الإنتاج.
const SECRET = process.env.LICENSE_SECRET || 'change-me-insecure-dev-secret';

if (!process.env.LICENSE_SECRET) {
    console.warn(
        '[token] تحذير: LICENSE_SECRET غير معرف في متغيرات البيئة، ' +
        'يتم استخدام مفتاح افتراضي غير آمن. عرّفه في إعدادات المشروع.'
    );
}

function base64url(input) {
    return Buffer.from(input)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

function base64urlDecode(input) {
    let padded = input.replace(/-/g, '+').replace(/_/g, '/');
    while (padded.length % 4) padded += '=';
    return Buffer.from(padded, 'base64').toString('utf8');
}

/** يوقّع أي كائن JSON ويرجّعه كنص توكن "payload.signature". */
export function sign(payload) {
    const payloadStr = base64url(JSON.stringify(payload));
    const sig = crypto.createHmac('sha256', SECRET).update(payloadStr).digest('hex');
    return `${payloadStr}.${sig}`;
}

/** يتحقق من توقيع التوكن ويرجّع الكائن الأصلي، أو null لو التوكن غير صالح/متلاعب به. */
export function verify(token) {
    if (!token || typeof token !== 'string' || !token.includes('.')) return null;

    const [payloadStr, sig] = token.split('.');
    if (!payloadStr || !sig) return null;

    const expectedSig = crypto.createHmac('sha256', SECRET).update(payloadStr).digest('hex');
    const sigBuf = Buffer.from(sig, 'hex');
    const expectedBuf = Buffer.from(expectedSig, 'hex');

    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
        return null;
    }

    try {
        return JSON.parse(base64urlDecode(payloadStr));
    } catch {
        return null;
    }
}
