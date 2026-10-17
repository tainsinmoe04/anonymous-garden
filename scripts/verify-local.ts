import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtempSync, unlinkSync, rmdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { openDatabase } from '../src/server/database';
import { hashPassword, token } from '../src/server/security';
async function main() {
    const directory = mkdtempSync(path.join(os.tmpdir(), 'garden-http-'));
    const dbPath = path.join(directory, 'test.sqlite');
    const password = token();
    const db = await openDatabase(dbPath);
    await db.prepare("INSERT INTO settings VALUES('moderator_password',?)").run(hashPassword(password));
    await db.close();
    const base = 'http://127.0.0.1:3002';
    let child: ChildProcess | undefined;
    let assertions = 0;
    const start = async () => { child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '-p', '3002'], { cwd: process.cwd(), windowsHide: true, stdio: 'ignore', env: { ...process.env, GARDEN_DB_PATH: dbPath, DATABASE_URL:'', VERCEL:'', GARDEN_DEPLOYMENT_MODE:'local', GARDEN_ORIGIN:base, GARDEN_NOTIFICATION_WORKER: '0', TELEGRAM_BOT_TOKEN: '', TELEGRAM_CHAT_ID: '', SMTP_HOST: '', SMTP_USER: '', SMTP_PASSWORD: '', MODERATOR_NOTIFICATION_EMAIL: '' } }); for (let i = 0; i < 80; i++) {
        try {
            const r = await fetch(`${base}/api/garden/state`);
            if (r.ok)
                return;
        }
        catch { }
        await new Promise(r => setTimeout(r, 200));
    } throw new Error('Isolated test server did not become ready'); };
    const stop = async () => { if (!child || child.exitCode !== null)
        return; await new Promise<void>(resolve => { child!.once('exit', () => resolve()); child!.kill(); }); };
    const jar: Record<string, string> = {};
    const admin: Record<string, string> = {};
    async function request(route: string, method = 'GET', body?: unknown, cookies = jar, origin = base) { const r = await fetch(`${base}/api/garden/${route}`, { method, headers: { ...(method === 'GET' ? {} : { Origin: origin, 'Content-Type': 'application/json' }), Cookie: Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ') }, body: body === undefined ? undefined : JSON.stringify(body) }); for (const c of r.headers.getSetCookie()) {
        const [name, value] = c.split(';')[0].split('=');
        if (value)
            cookies[name] = value;
        else
            delete cookies[name];
    } return { status: r.status, data: await r.json(), headers: r.headers }; }
    const eq = (actual: unknown, expected: unknown) => { assert.deepEqual(actual, expected, `HTTP check ${assertions + 1}`); assertions++; };
    try {
        await start();
        eq((await request('stories?language=en')).status, 401);
        eq((await request('access', 'POST', { adult: true }, jar, 'https://untrusted.example')).status, 403);
        eq((await request('admin/queue')).status, 401);
        const access = await request('access', 'POST', { adult: true });
        eq(access.status, 200);
        assert.match(access.headers.getSetCookie().join(' '), /HttpOnly/);
        assert.match(access.headers.getSetCookie().join(' '), /SameSite=strict/i);
        assertions += 2;
        const publicStory = await request('stories', 'POST', { language: 'en', flower: 'daisy', body: 'An isolated fictional story about a peaceful walk.' });
        eq(publicStory.status, 201);
        eq(publicStory.data.screening.decision, 'approved');
        const storyId = publicStory.data.id as string, secret = publicStory.data.secret as string;
        eq(secret.length, 43);
        const reader: Record<string, string> = {};
        await request('access', 'POST', { adult: true }, reader);
        const publicView = await request(`stories/${storyId}`, 'GET', undefined, reader);
        eq(publicView.status, 200);
        eq(JSON.stringify(publicView.data).includes(secret), false);
        eq((await request(`manage/${storyId}`, 'GET', undefined, reader)).status, 401);
        eq((await request('manage/open', 'POST', { id: storyId, secret: 'x'.repeat(43) }, reader)).status, 401);
        const held = await request('stories', 'POST', { language: 'en', flower: 'lily', body: 'Fictional disclosure: I survived abuse and need someone to listen.' });
        eq(held.data.screening.decision, 'held');
        eq((await request(`stories/${held.data.id}`)).status, 404);
        const pii = await request('stories', 'POST', { language: 'en', flower: 'lily', body: 'My fictional phone is ၀၉၁၂၃၄၅၆၇၈၉.' });
        eq(pii.data.screening.decision, 'rejected');
        eq(pii.data.id, undefined);
        eq((await request('encouragements', 'POST', { storyId, body: 'Thank you for sharing. I am listening.' })).data.screening.decision, 'approved');
        const heldMessage = await request('encouragements', 'POST', { storyId, body: 'Fictional quotation about abuse, offered with support.' });
        eq(heldMessage.data.screening.decision, 'held');
        eq((await request(`stories/${storyId}`)).data.story.encouragements.length, 1);
        eq((await request('admin/session', 'POST', { password }, admin)).status, 200);
        const queue = await request('admin/queue', 'GET', undefined, admin);
        eq(queue.data.stories.some((r: {
            id: string;
        }) => r.id === held.data.id), true);
        eq(queue.data.notificationsConfigured, false);
        eq((await request('admin/terms', 'PATCH', { terms: ['private-review-term'] }, reader)).status, 401);
        eq((await request('admin/terms', 'PATCH', { terms: ['private-review-term'] }, admin)).status, 200);
        const custom = await request('stories', 'POST', { language: 'en', flower: 'daisy', body: 'Fictional text with a private-review-term for testing.' }, reader);
        eq(custom.data.screening.decision, 'held');
        await request(`manage/${custom.data.id}`, 'DELETE', undefined, reader);
        eq((await request('admin/terms', 'PATCH', { terms: [] }, admin)).status, 200);
        eq((await request('admin/moderate', 'POST', { type: 'encouragement', id: heldMessage.data.id, action: 'approve', version: 1 }, admin)).status, 200);
        eq((await request(`stories/${storyId}`)).data.story.encouragements.length, 2);
        eq((await request(`manage/${storyId}`, 'PATCH', { body: 'A revised fictional story about a peaceful walk.', flower: 'camellia', version: 1 })).data.screening.decision, 'held');
        eq((await request(`stories/${storyId}`)).status, 404);
        eq((await request('admin/moderate', 'POST', { type: 'story', id: storyId, action: 'approve', version: 1 }, admin)).status, 409);
        eq((await request('admin/moderate', 'POST', { type: 'story', id: storyId, action: 'approve', version: 2 }, admin)).status, 200);
        eq((await request('reports', 'POST', { type: 'story', id: storyId, reason: 'other' }, reader)).status, 200);
        eq((await request('reports', 'POST', { type: 'story', id: storyId, reason: 'other' }, reader)).status, 429);
        eq((await request('admin/settings', 'PATCH', { accepting: false }, admin)).status, 200);
        eq((await request('stories', 'POST', { language: 'en', flower: 'daisy', body: 'This is an isolated fictional pause check.' })).status, 503);
        eq((await request(`stories/${storyId}`)).status, 200);
        await request('admin/settings', 'PATCH', { accepting: true }, admin);
        eq((await request('manage/open', 'POST', { id: storyId, secret }, reader)).status, 200);
        await stop();
        await start();
        eq((await request(`stories/${storyId}`)).status, 200);
        eq((await request(`manage/${storyId}`, 'GET', undefined, reader)).data.story.version, 2);
        eq((await request(`manage/${storyId}`, 'DELETE', undefined, reader)).status, 200);
        eq((await request(`stories/${storyId}`)).status, 404);
        eq((await request(`manage/${storyId}`, 'GET', undefined, reader)).status, 401);
        await request(`manage/${held.data.id}`, 'DELETE');
        await request('admin/session', 'DELETE', undefined, admin);
        eq((await request('admin/queue', 'GET', undefined, admin)).status, 401);
        console.log(`PASS: ${assertions} HTTP integration assertions, including persistence across restart. Isolated fictional database only; no emails sent.`);
    }
    finally {
        await stop();
        for (const name of ['test.sqlite', 'test.sqlite-wal', 'test.sqlite-shm']) {
            const file = path.join(directory, name);
            if (existsSync(file))
                unlinkSync(file);
        }
        rmdirSync(directory);
    }
}
void main().catch(error => { console.error(error instanceof Error ? error.message : 'Integration verification failed'); process.exitCode = 1; });
