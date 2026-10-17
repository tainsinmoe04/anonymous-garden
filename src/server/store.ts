import type { GardenDatabase as DatabaseSync } from './database';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { transaction } from './database';
import { hash, token, ServiceError, limited } from './security';
import { screenContent, POLICY_VERSION, type Screening } from './moderation';
import type { FlowerType, Language, Story } from '../lib/garden';
interface StoryRow {
    id: string;
    language: Language;
    flower: FlowerType;
    body: string;
    status: 'approved' | 'held' | 'rejected';
    secret_hash: string;
    version: number;
    flags: string;
    created_at: number;
    updated_at: number;
    is_seed: number;
}
interface MessageRow {
    id: string;
    body: string;
    status: string;
    flags: string;
    created_at: number;
    story_id: string;
}
export class GardenStore {
    constructor(public db: DatabaseSync) { }
    async event(type: string, id: string, action: string, reason: string) { await this.db.prepare('INSERT INTO moderation_events VALUES(?,?,?,?,?,?)').run(randomUUID(), type, id, action, reason, Date.now()); }
    async notify() { await this.db.prepare('INSERT INTO notification_outbox(id,kind,created_at) VALUES(?,?,?)').run(randomUUID(), 'review_needed', Date.now()); }
    async accepting() { return (await this.db.prepare("SELECT value FROM settings WHERE key='accepting'").get())?.value === '1'; }
    async reviewTerms(): Promise<string[]> { const row = await this.db.prepare("SELECT value FROM settings WHERE key='review_terms'").get(); try {
        return row ? JSON.parse(String(row.value)) : [];
    }
    catch {
        return [];
    } }
    async screen(body: string, kind: 'story' | 'encouragement') { return screenContent(body, kind, await this.reviewTerms()); }
    async publicStory(row: StoryRow) { const messages = await this.db.prepare("SELECT id,body,flags FROM encouragements WHERE story_id=? AND status='approved' ORDER BY created_at,id LIMIT 100").all(row.id) as unknown as {
        id: string;
        body: string;
        flags: string;
    }[]; return { id: row.id, language: row.language, flower: row.flower, body: row.body, status: 'approved' as const, encouragements: messages.map(m => m.body), messages: messages.map(m => ({ id: m.id, body: m.body })), contentWarnings: [...new Set([...(JSON.parse(row.flags) as string[]), ...messages.flatMap(m => JSON.parse(m.flags) as string[])])].filter(flag => flag !== 'edited_story'), version: row.version, isSeed: !!row.is_seed }; }
    async list(language: Language, after = '') { const rows = await this.db.prepare("SELECT * FROM stories WHERE status='approved' AND language=? AND id>? ORDER BY id LIMIT 31").all(language, after) as unknown as StoryRow[]; return { stories: await Promise.all(rows.slice(0, 30).map(s => this.publicStory(s))), next: rows.length > 30 ? rows[29].id : null }; }
    async get(id: string) { const row = await this.db.prepare("SELECT * FROM stories WHERE id=? AND status='approved'").get(id) as unknown as StoryRow | undefined; if (!row)
        throw new ServiceError('not_found', 404); return await this.publicStory(row); }
    async next(language: Language) { return await transaction(this.db, async () => { const row = await this.db.prepare(`SELECT s.*,COUNT(e.id) AS approved_count FROM stories s LEFT JOIN encouragements e ON e.story_id=s.id AND e.status='approved' WHERE s.status='approved' AND s.language=? GROUP BY s.id ORDER BY CASE WHEN COUNT(e.id)=0 THEN 0 ELSE 1 END,s.last_shown+20000.0*COUNT(e.id)/(COUNT(e.id)+1),RANDOM() LIMIT 1`).get(language) as unknown as StoryRow | undefined; if (!row)
        return null; const latest = Number((await this.db.prepare('SELECT COALESCE(MAX(last_shown),0) AS n FROM stories WHERE language=?').get(language))?.n ?? 0); await this.db.prepare('UPDATE stories SET last_shown=? WHERE id=?').run(Math.max(Date.now(), latest + 1), row.id); return await this.publicStory(row); }); }
    async create(language: Language, flower: FlowerType, body: string) { if (!await this.accepting())
        throw new ServiceError('submissions_paused', 503); const screening = await this.screen(body, 'story'); if (screening.decision === 'rejected')
        return { screening }; const id = randomUUID(), secret = token(), now = Date.now(); await transaction(this.db, async () => { await this.db.prepare('INSERT INTO stories(id,language,flower,body,status,secret_hash,flags,policy,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)').run(id, language, flower, body.trim(), screening.decision, hash(secret), JSON.stringify(screening.flags), POLICY_VERSION, now, now); await this.event('story', id, screening.decision, screening.flags.join(',') || 'unflagged_rules'); if (screening.decision === 'held')
        await this.notify(); }); return { id, secret, screening }; }
    async encourage(storyId: string, body: string) { if (!await this.accepting())
        throw new ServiceError('submissions_paused', 503); const screening = await this.screen(body, 'encouragement'); return await transaction(this.db, async () => { await this.get(storyId); if (screening.decision === 'rejected')
        return { screening }; const id = randomUUID(); await this.db.prepare('INSERT INTO encouragements VALUES(?,?,?,?,?,?,?)').run(id, storyId, body.trim(), screening.decision, JSON.stringify(screening.flags), POLICY_VERSION, Date.now()); await this.event('encouragement', id, screening.decision, screening.flags.join(',') || 'unflagged_rules'); if (screening.decision === 'held')
        await this.notify(); return { id, screening }; }); }
    async capability(id: string, secret: string) { if (!/^[A-Za-z0-9_-]{43}$/.test(secret))
        return false; const row = await this.db.prepare('SELECT secret_hash FROM stories WHERE id=?').get(id) as {
        secret_hash: string;
    } | undefined; return !!row && timingSafeEqual(Buffer.from(hash(secret), 'hex'), Buffer.from(row.secret_hash, 'hex')); }
    async manage(id: string) { const row = await this.db.prepare('SELECT * FROM stories WHERE id=?').get(id) as unknown as StoryRow | undefined; if (!row)
        throw new ServiceError('not_found', 404); const messages = await this.db.prepare("SELECT id,body FROM encouragements WHERE story_id=? AND status='approved' ORDER BY created_at LIMIT 100").all(id); return { id: row.id, language: row.language, flower: row.flower, body: row.body, status: row.status, version: row.version, flags: JSON.parse(row.flags), encouragements: messages.map(m => String(m.body)) }; }
    async edit(id: string, body: string, flower: FlowerType, version: number) { if (!await this.accepting())
        throw new ServiceError('submissions_paused', 503); const screening = await this.screen(body, 'story'); if (screening.decision === 'rejected')
        return { screening }; const held: Screening = { ...screening, decision: 'held', flags: [...screening.flags, 'edited_story'] }; await transaction(this.db, async () => { const changed = await this.db.prepare('UPDATE stories SET body=?,flower=?,status=?,flags=?,policy=?,version=version+1,updated_at=? WHERE id=? AND version=?').run(body.trim(), flower, 'held', JSON.stringify(held.flags), POLICY_VERSION, Date.now(), id, version); if (!changed.changes)
        throw new ServiceError('version_conflict', 409); await this.event('story', id, 'edited', 're_review'); await this.notify(); }); return { screening: held }; }
    async remove(id: string, version?: number) { await transaction(this.db, async () => { const exists = await this.db.prepare('SELECT id,version FROM stories WHERE id=?').get(id); if (!exists)
        throw new ServiceError('not_found', 404); if (version !== undefined && exists.version !== version)
        throw new ServiceError('version_conflict', 409); const comments = await this.db.prepare('SELECT id FROM encouragements WHERE story_id=?').all(id); for (const c of comments) {
        await this.db.prepare("DELETE FROM reports WHERE target_type='encouragement' AND target_id=?").run(c.id!);
        await this.db.prepare("DELETE FROM moderation_events WHERE target_type='encouragement' AND target_id=?").run(c.id!);
    } await this.db.prepare("DELETE FROM reports WHERE target_type='story' AND target_id=?").run(id); await this.db.prepare("DELETE FROM moderation_events WHERE target_type='story' AND target_id=?").run(id); await this.db.prepare('DELETE FROM sessions WHERE story_id=?').run(id); await this.db.prepare('DELETE FROM stories WHERE id=?').run(id); }); await this.db.exec('PRAGMA wal_checkpoint(TRUNCATE)'); }
    async report(type: 'story' | 'encouragement', id: string, reason: string, sessionHash: string) { await limited(this.db, `report:${sessionHash}:${type}:${id}`, 1, 3600); await transaction(this.db, async () => { if (type === 'story')
        await this.get(id);
    else if (!await this.db.prepare("SELECT e.id FROM encouragements e JOIN stories s ON s.id=e.story_id WHERE e.id=? AND e.status='approved' AND s.status='approved'").get(id))
        throw new ServiceError('not_found', 404); await this.db.prepare('INSERT INTO reports(id,target_type,target_id,reason,created_at) VALUES(?,?,?,?,?)').run(randomUUID(), type, id, reason, Date.now()); await this.notify(); }); }
    async queue() { const stories = await this.db.prepare("SELECT id,language,flower,body,status,flags,version,updated_at,is_seed FROM stories WHERE status='held' ORDER BY updated_at ASC LIMIT 100").all(); const messages = await this.db.prepare("SELECT e.id,e.story_id,e.body,e.status,e.flags,e.created_at,s.language,s.version AS version,s.body AS story_body,s.status AS parent_status FROM encouragements e JOIN stories s ON s.id=e.story_id WHERE e.status='held' ORDER BY e.created_at LIMIT 100").all(); const reports = await this.db.prepare("SELECT r.*,CASE WHEN r.target_type='story' THEN s.body ELSE e.body END AS body,CASE WHEN r.target_type='story' THEN s.version ELSE (SELECT version FROM stories WHERE id=e.story_id) END AS version,(SELECT body FROM stories WHERE id=e.story_id) AS story_body,(SELECT status FROM stories WHERE id=e.story_id) AS parent_status FROM reports r LEFT JOIN stories s ON r.target_type='story' AND s.id=r.target_id LEFT JOIN encouragements e ON r.target_type='encouragement' AND e.id=r.target_id WHERE r.status='open' ORDER BY r.created_at LIMIT 100").all(); return { stories, messages, reports, reviewTerms: await this.reviewTerms(), accepting: await this.accepting(), outbox: (await this.db.prepare('SELECT COUNT(*) AS count FROM notification_outbox WHERE sent_at IS NULL').get())?.count ?? 0 }; }
    async moderate(type: 'story' | 'encouragement', id: string, action: 'approve' | 'reject' | 'remove', version: number) { if (type === 'story' && action === 'remove') {
        await this.remove(id, version);
        await this.event('story', id, 'removed', 'moderator_takedown');
        return;
    } await transaction(this.db, async () => { const table = type === 'story' ? 'stories' : 'encouragements'; const row = await this.db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(id) as unknown as StoryRow | MessageRow | undefined; if (!row)
        throw new ServiceError('not_found', 404); if (type === 'story' && (row as StoryRow).version !== version)
        throw new ServiceError('version_conflict', 409); if (type === 'encouragement') {
        const parent = await this.db.prepare('SELECT version,status FROM stories WHERE id=?').get((row as MessageRow).story_id);
        if (!parent || parent.version !== version)
            throw new ServiceError('version_conflict', 409);
        if (action === 'approve' && parent.status !== 'approved')
            throw new ServiceError('parent_review_required', 409);
    } if (action === 'remove') {
        if (type === 'story') {
            await this.db.prepare('DELETE FROM sessions WHERE story_id=?').run(id);
            await this.db.prepare('DELETE FROM stories WHERE id=?').run(id);
        }
        else
            await this.db.prepare('DELETE FROM encouragements WHERE id=?').run(id);
        await this.db.prepare('DELETE FROM reports WHERE target_type=? AND target_id=?').run(type, id);
        await this.event(type, id, 'removed', 'moderator_takedown');
        return;
    } if (action === 'approve' && (await this.screen(row.body, type === 'story' ? 'story' : 'encouragement')).decision === 'rejected')
        throw new ServiceError('must_revise', 409); await this.db.prepare(`UPDATE ${table} SET status=? WHERE id=?`).run(action === 'approve' ? 'approved' : 'rejected', id); await this.db.prepare("UPDATE reports SET status='resolved' WHERE target_type=? AND target_id=?").run(type, id); await this.event(type, id, action, 'moderator_review'); }); }
    async seed(stories: Story[]) { if (await this.db.prepare("SELECT value FROM settings WHERE key='seeded'").get())
        return; await transaction(this.db, async () => { if(await this.db.prepare("SELECT value FROM settings WHERE key='seeded'").get())return; for (const s of stories) {
        const now = Date.now();
        await this.db.prepare('INSERT INTO stories(id,language,flower,body,status,secret_hash,flags,policy,created_at,updated_at,is_seed) VALUES(?,?,?,?,?,?,?,?,?,?,1)').run(s.id, s.language, s.flower, s.body, 'approved', hash(token()), '[]', 'fictional_seed', now, now);
        for (const body of s.encouragements)
            await this.db.prepare('INSERT INTO encouragements VALUES(?,?,?,?,?,?,?)').run(randomUUID(), s.id, body, 'approved', '[]', 'fictional_seed', now);
    } await this.db.prepare("INSERT INTO settings VALUES('seeded','1')").run(); }); }
    async maintenance() { const now = Date.now(); const waiting = (await this.db.prepare("SELECT (SELECT COUNT(*) FROM stories WHERE status='held')+(SELECT COUNT(*) FROM encouragements WHERE status='held')+(SELECT COUNT(*) FROM reports WHERE status='open') AS n").get())?.n; if (waiting === 0)
        await this.db.prepare('DELETE FROM notification_outbox WHERE sent_at IS NULL').run(); await this.db.prepare('DELETE FROM sessions WHERE expires_at<?').run(now); await this.db.prepare('DELETE FROM rate_buckets WHERE expires_at<?').run(now); await this.db.prepare('DELETE FROM moderation_events WHERE created_at<?').run(now - 30 * 86400000); await this.db.prepare('DELETE FROM notification_outbox WHERE sent_at IS NOT NULL AND sent_at<?').run(now - 7 * 86400000); }
}
