import test from 'node:test';
import assert from 'node:assert/strict';
import { database } from './database';
import { GardenStore } from './store';
import { flushNotifications } from './notifications';
test('Telegram sends only generic admin notice, batches requests and retries failures', async () => {
    process.env.GARDEN_DB_PATH = ':memory:';
    delete process.env.DATABASE_URL;
    delete process.env.VERCEL;
    process.env.TELEGRAM_BOT_TOKEN = 'fictional-test-token';
    process.env.TELEGRAM_CHAT_ID = '123';
    process.env.GARDEN_ORIGIN = 'https://garden.example';
    const db = await database(), store = new GardenStore(db);
    await store.create('en', 'daisy', 'A fictional disclosure about abuse to hold for review.');
    const originalFetch = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = async (_url, options) => {
        calls++;
        const payload = JSON.parse(String(options?.body));
        assert.equal(payload.chat_id, '123');
        assert.equal(payload.text, 'Anonymous Garden — review needed.\nOpen your protected admin panel:\nhttps://garden.example/admin');
        assert.deepEqual(payload.link_preview_options, { is_disabled: true });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
    };
    try {
        await db.prepare("INSERT INTO settings VALUES('notification_delivery_lease',?)").run(String(Date.now() + 60000) + ':other-process');
        assert.equal((await flushNotifications()).sent, 0);
        assert.equal(calls, 0);
        await db.prepare("UPDATE settings SET value='0:expired' WHERE key='notification_delivery_lease'").run();
        assert.ok((await flushNotifications()).sent > 0);
        assert.equal(await db.prepare("SELECT value FROM settings WHERE key='notification_delivery_lease'").get(), undefined);
        await store.notify();
        assert.equal((await flushNotifications()).sent, 0);
        assert.equal(calls, 1);
        await db.prepare("DELETE FROM settings WHERE key='last_notification_at'").run();
        globalThis.fetch = async () => new Response('{}', { status: 429 });
        assert.equal((await flushNotifications()).failed, true);
        const pending = await db.prepare('SELECT attempts,retry_at FROM notification_outbox WHERE sent_at IS NULL').get();
        assert.equal(pending?.attempts, 1);
        assert.ok(Number(pending?.retry_at) > Date.now());
    }
    finally {
        globalThis.fetch = originalFetch;
        delete process.env.TELEGRAM_BOT_TOKEN;
        delete process.env.TELEGRAM_CHAT_ID;
        await db.close();
    }
});
