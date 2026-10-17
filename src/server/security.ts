import { randomBytes, createHash, scryptSync, timingSafeEqual } from 'node:crypto';
import type { GardenDatabase as DatabaseSync } from './database';
export class ServiceError extends Error {
    constructor(public code: string, public status = 400) { super(code); }
}
export const token = () => randomBytes(32).toString('base64url');
export const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export function hashPassword(password: string) { if (password.length < 16 || password.length > 200)
    throw new ServiceError('password_length'); const salt = randomBytes(16).toString('hex'); return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`; }
export function passwordMatches(password: string, stored: string) { if (password.length > 200)
    return false; const [salt, key] = stored.split(':'); if (!salt || !/^[a-f0-9]{128}$/.test(key ?? ''))
    return false; return timingSafeEqual(Buffer.from(key, 'hex'), scryptSync(password, salt, 64)); }
export async function limited(db: DatabaseSync, bucket: string, limit: number, seconds: number, now = Date.now()) {
    const expiry = now + seconds * 1000;
    await db.prepare('DELETE FROM rate_buckets WHERE expires_at < ?').run(now);
    await db.prepare('INSERT INTO rate_buckets VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET hits=rate_buckets.hits+1').run(bucket, expiry);
    const row = await db.prepare('SELECT hits FROM rate_buckets WHERE bucket=?').get(bucket) as {
        hits: number;
    };
    if (row.hits > limit)
        throw new ServiceError('rate_limited', 429);
}
export async function issueSession(db: DatabaseSync, kind: 'visitor' | 'moderator' | 'management', seconds: number, storyId: string | null = null) { const secret = token(); await db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now()); await db.prepare('INSERT INTO sessions VALUES(?,?,?,?)').run(hash(secret), kind, storyId, Date.now() + seconds * 1000); return secret; }
export async function validSession(db: DatabaseSync, secret: string | undefined, kind: string, storyId?: string) { if (!secret || secret.length > 100)
    return false; const row = await db.prepare('SELECT story_id FROM sessions WHERE hash=? AND kind=? AND expires_at>?').get(hash(secret), kind, Date.now()) as {
    story_id: string | null;
} | undefined; return !!row && (storyId === undefined || row.story_id === storyId); }
export function hostedMode(){return process.env.GARDEN_DEPLOYMENT_MODE==='hosted'||!!process.env.VERCEL;}
function expectedOrigin(){
 if(!hostedMode())return null;
 try{const origin=new URL(process.env.GARDEN_ORIGIN??'');if(origin.protocol!=='https:'||origin.username||origin.password||origin.pathname!=='/'||origin.search||origin.hash)throw new Error();return origin;}catch{throw new ServiceError('deployment_not_configured',503);}
}
export function localRequest(request:Request){
 const url=new URL(request.url),expected=expectedOrigin();
 if(expected){if(url.origin!==expected.origin)throw new ServiceError('origin_not_allowed',403);return;}
 if(!['127.0.0.1','localhost','[::1]'].includes(url.hostname))throw new ServiceError('local_service_only',403);
}
export function sameOrigin(request:Request){
 localRequest(request);let origin:URL;try{origin=new URL(request.headers.get('origin')??'');}catch{throw new ServiceError('origin_not_allowed',403);}
 const expected=expectedOrigin(),url=new URL(request.url),host=request.headers.get('host');
 if(!host||origin.host!==host||origin.protocol!==url.protocol||request.headers.get('sec-fetch-site')==='cross-site'||(expected?origin.origin!==expected.origin:!['127.0.0.1','localhost','[::1]'].includes(origin.hostname)))throw new ServiceError('origin_not_allowed',403);
}
export async function readJson(request: Request) { if (!request.headers.get('content-type')?.startsWith('application/json'))
    throw new ServiceError('json_required', 415); const reader = request.body?.getReader(); if (!reader)
    throw new ServiceError('invalid_body'); let length = 0; const chunks: Uint8Array[] = []; try {
    while (true) {
        const part = await reader.read();
        if (part.done)
            break;
        length += part.value.byteLength;
        if (length > 48000) {
            await reader.cancel();
            throw new ServiceError('body_too_large', 413);
        }
        chunks.push(part.value);
    }
}
finally {
    reader.releaseLock();
} try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>;
}
catch {
    throw new ServiceError('invalid_json');
} }

