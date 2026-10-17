import { NextRequest, NextResponse, after } from 'next/server';
import { database } from '@/server/database';
import { GardenStore } from '@/server/store';
import { hostedMode, hash, issueSession, limited, localRequest, passwordMatches, readJson, sameOrigin, ServiceError, validSession } from '@/server/security';
import { flushNotifications, notificationConfigured } from '@/server/notifications';
import { flowers, seeds, type FlowerType, type Language } from '@/lib/garden';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const common = { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' };
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: common });
function text(value: unknown, max = 2500) { if (typeof value !== 'string' || value.length > max)
    throw new ServiceError('invalid_input'); return value; }
function id(value: unknown) { const v = text(value, 80); if (!/^[a-zA-Z0-9-]{4,80}$/.test(v))
    throw new ServiceError('invalid_id'); return v; }
function language(value: unknown): Language { if (value !== 'my' && value !== 'en')
    throw new ServiceError('invalid_language'); return value; }
function flower(value: unknown): FlowerType { if (!flowers.some(f => f.type === value))
    throw new ServiceError('invalid_flower'); return value as FlowerType; }
type Context = {
    params: Promise<{
        path: string[];
    }>;
};
async function handle(request: NextRequest, context: Context) {
    try {
        localRequest(request);
        const db = await database(), store = new GardenStore(db);
        if(!hostedMode())await store.seed(seeds);
        await store.maintenance();
        const { path } = await context.params;
        const route = path.join('/');
        const method = request.method;
        const visitor = request.cookies.get('ag_visitor')?.value;
        const admin = request.cookies.get('ag_moderator')?.value;
        const requireVisitor = async () => { if (!await validSession(db, visitor, 'visitor'))
            throw new ServiceError('age_required', 401); };
        const requireAdmin = async () => { if (!await validSession(db, admin, 'moderator'))
            throw new ServiceError('unauthorized', 401); };
        const requireManagement = async (storyId: string) => { if (!await validSession(db, request.cookies.get(`ag_manage_${storyId}`)?.value, 'management', storyId))
            throw new ServiceError('unauthorized', 401); };
        if (method === 'GET') {
            if (route === 'state')
                return json({ attested: await validSession(db, visitor, 'visitor'), accepting: await store.accepting(), service: hostedMode()?'hosted':'local', moderation: 'rules_with_human_review' });
            if (route === 'admin/session')
                return json({ authenticated: await validSession(db, admin, 'moderator'), configured: !!await db.prepare("SELECT value FROM settings WHERE key='moderator_password'").get() });
            if (route === 'admin/queue') {
                await requireAdmin();
                return json({ ...await store.queue(), notificationsConfigured: notificationConfigured(), automaticApproval: true });
            }
            if (path[0] === 'manage' && path.length === 2) {
                const storyId = id(path[1]);
                await requireManagement(storyId);
                return json({ story: await store.manage(storyId) });
            }
            await requireVisitor();
            if (route === 'stories')
                return json(await store.list(language(request.nextUrl.searchParams.get('language')), request.nextUrl.searchParams.get('after') ?? ''));
            if (path[0] === 'stories' && path.length === 2)
                return json({ story: await store.get(id(path[1])) });
            throw new ServiceError('not_found', 404);
        }
        sameOrigin(request);
        if (method === 'DELETE' && route === 'admin/session') {
            if (admin)
                await db.prepare('DELETE FROM sessions WHERE hash=?').run(hash(admin));
            const response = json({ ok: true });
            response.cookies.set('ag_moderator', '', { path: '/api/garden', maxAge: 0, httpOnly: true, sameSite: 'strict' });
            return response;
        }
        if (method === 'DELETE' && path[0] === 'manage' && path.length === 2) {
            const storyId = id(path[1]);
            await requireManagement(storyId);
            await store.remove(storyId);
            const response = json({ ok: true });
            response.cookies.set(`ag_manage_${storyId}`, '', { path: '/api/garden', maxAge: 0, httpOnly: true, sameSite: 'strict' });
            return response;
        }
        const body = await readJson(request);
        const cookieOptions = { httpOnly: true, sameSite: 'strict' as const, secure: request.nextUrl.protocol === 'https:', path: '/api/garden', maxAge: 3600 };
        if (method === 'POST' && route === 'access') {
            await limited(db, 'global:access', 30, 60);
            if (body.adult !== true)
                throw new ServiceError('age_required', 401);
            const response = json({ ok: true });
            response.cookies.set('ag_visitor', await issueSession(db, 'visitor', 3600), cookieOptions);
            return response;
        }
        if (method === 'POST' && route === 'admin/session') {
            await limited(db, 'global:login', 8, 15 * 60);
            const stored = await db.prepare("SELECT value FROM settings WHERE key='moderator_password'").get();
            if (!stored)
                throw new ServiceError('moderator_setup_required', 503);
            if (!passwordMatches(text(body.password, 200), String(stored.value)))
                throw new ServiceError('unauthorized', 401);
            const response = json({ ok: true });
            response.cookies.set('ag_moderator', await issueSession(db, 'moderator', 3600), cookieOptions);
            return response;
        }
        if (route.startsWith('admin/')) {
            await requireAdmin();
            await limited(db, 'admin:mutations', 120, 60);
            if (method === 'POST' && route === 'admin/moderate') {
                const type = body.type;
                if (type !== 'story' && type !== 'encouragement')
                    throw new ServiceError('invalid_input');
                const action = body.action;
                if (action !== 'approve' && action !== 'reject' && action !== 'remove')
                    throw new ServiceError('invalid_input');
                if (!Number.isInteger(body.version))
                    throw new ServiceError('invalid_input');
                await store.moderate(type, id(body.id), action, Number(body.version));
                return json({ ok: true });
            }
            if (method === 'POST' && route === 'admin/notifications') {
                after(async () => { await flushNotifications(); });
                return json({ queued: true, configured: notificationConfigured() });
            }
            if (method === 'PATCH' && route === 'admin/settings') {
                if (typeof body.accepting !== 'boolean')
                    throw new ServiceError('invalid_input');
                await db.prepare("UPDATE settings SET value=? WHERE key='accepting'").run(body.accepting ? '1' : '0');
                await store.event('service', 'settings', 'submissions_changed', body.accepting ? 'open' : 'paused');
                return json({ ok: true });
            }
            if (method === 'PATCH' && route === 'admin/terms') {
                if (!Array.isArray(body.terms) || body.terms.length > 100 || body.terms.some(term => typeof term !== 'string' || term.trim().length < 2 || term.length > 80))
                    throw new ServiceError('invalid_input');
                const terms = [...new Set((body.terms as string[]).map(s => s.trim()))];
                await db.prepare("INSERT INTO settings VALUES('review_terms',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(JSON.stringify(terms));
                await store.event('service', 'policy', 'terms_changed', 'custom_terms');
                return json({ ok: true });
            }
            throw new ServiceError('not_found', 404);
        }
        if (method === 'POST' && route === 'manage/open') {
            await requireVisitor();
            await limited(db, 'global:capability', 30, 60);
            const storyId = id(body.id);
            const secret = text(body.secret, 100);
            if (!await store.capability(storyId, secret))
                throw new ServiceError('unauthorized', 401);
            const response = json({ story: await store.manage(storyId) });
            response.cookies.set(`ag_manage_${storyId}`, await issueSession(db, 'management', 3600, storyId), cookieOptions);
            return response;
        }
        if (method === 'PATCH' && path[0] === 'manage' && path.length === 2) {
            const storyId = id(path[1]);
            await requireManagement(storyId);
            await limited(db, `edit:${storyId}`, 5, 3600);
            if (!Number.isInteger(body.version))
                throw new ServiceError('invalid_input');
            const result = await store.edit(storyId, text(body.body), flower(body.flower), Number(body.version));
            after(async () => { await flushNotifications(); });
            return json(result);
        }
        await requireVisitor();
        if (method === 'POST' && route === 'next') {
            await limited(db, `browse:${hash(visitor!)}`, 120, 60);
            return json({ story: await store.next(language(body.language)) });
        }
        await limited(db, 'global:submissions', 60, 60);
        await limited(db, `visitor:${hash(visitor!)}`, 12, 3600);
        await limited(db, 'global:hourly_submissions', 300, 3600);
        if (body.honeypot)
            throw new ServiceError('invalid_input');
        if (method === 'POST' && route === 'stories') {
            const result = await store.create(language(body.language), flower(body.flower), text(body.body));
            const response = json(result, result.id ? 201 : 200);
            if (result.id)
                response.cookies.set(`ag_manage_${result.id}`, await issueSession(db, 'management', 3600, result.id), cookieOptions);
            after(async () => { await flushNotifications(); });
            return response;
        }
        if (method === 'POST' && route === 'encouragements') {
            const result = await store.encourage(id(body.storyId), text(body.body));
            after(async () => { await flushNotifications(); });
            return json(result);
        }
        if (method === 'POST' && route === 'reports') {
            const type = body.type;
            if (type !== 'story' && type !== 'encouragement')
                throw new ServiceError('invalid_input');
            const reason = text(body.reason, 40);
            if (!['harm', 'harassment', 'personal_information', 'spam', 'other'].includes(reason))
                throw new ServiceError('invalid_input');
            await store.report(type, id(body.id), reason, hash(visitor!));
            after(async () => { await flushNotifications(); });
            return json({ ok: true });
        }
        throw new ServiceError('not_found', 404);
    }
    catch (error) {
        if (error instanceof ServiceError)
            return json({ error: error.code }, error.status);
        return json({ error: 'service_unavailable' }, 503);
    }
}
export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
