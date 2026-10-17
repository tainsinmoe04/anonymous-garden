import nodemailer from 'nodemailer';
import { randomUUID } from 'node:crypto';
import { database } from './database';
let sending = false;
function telegramConfigured() { return !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID); }
export function notificationConfigured() { return telegramConfigured() || !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD && process.env.SMTP_FROM && process.env.MODERATOR_NOTIFICATION_EMAIL); }
export interface NotificationDelivery {
    configured: boolean;
    sent: number;
    failed?: boolean;
}
// No content, management secrets or visitor identifiers enter the notification outbox.
export async function flushNotifications(): Promise<NotificationDelivery> {
    if (sending || !notificationConfigured())
        return { configured: notificationConfigured(), sent: 0 };
    sending = true;
    const db = await database();
    const now = Date.now(), lease = `${now + 60000}:${randomUUID()}`;
    let acquired = false;
    try {
        // A database lease also protects separate route/worker bundles and CLI processes.
        acquired = !!await db.prepare("INSERT INTO settings(key,value) VALUES('notification_delivery_lease',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value WHERE CAST(settings.value AS INTEGER)<? RETURNING value").get(lease, now);
        if (!acquired)
            return { configured: true, sent: 0 };
        const pendingReview = Number((await db.prepare("SELECT (SELECT COUNT(*) FROM stories WHERE status='held')+(SELECT COUNT(*) FROM encouragements WHERE status='held')+(SELECT COUNT(*) FROM reports WHERE status='open') AS n").get())?.n ?? 0);
        if (!pendingReview) {
            await db.prepare('DELETE FROM notification_outbox WHERE sent_at IS NULL').run();
            return { configured: true, sent: 0 };
        }
        const previous = await db.prepare("SELECT value FROM settings WHERE key='last_notification_at'").get();
        if (previous && Date.now() - Number(previous.value) < 5 * 60000)
            return { configured: true, sent: 0 };
        const pending = await db.prepare('SELECT id FROM notification_outbox WHERE sent_at IS NULL AND retry_at<? ORDER BY created_at LIMIT 25').all(Date.now());
        if (!pending.length)
            return { configured: true, sent: 0 };
        const origin = process.env.GARDEN_ORIGIN ?? 'http://127.0.0.1:3001';
        const transport = telegramConfigured() ? null : nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT ?? 465), secure: (process.env.SMTP_PORT ?? '465') === '465', requireTLS: true, auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASSWORD! }, connectionTimeout: 5000, greetingTimeout: 5000, socketTimeout: 7000 });
        try {
            if (telegramConfigured()) {
                const response = await fetch('https://api.telegram.org/bot' + process.env.TELEGRAM_BOT_TOKEN + '/sendMessage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: 'Anonymous Garden — review needed.\nOpen your protected admin panel:\n' + origin + '/admin', link_preview_options: { is_disabled: true } }), signal: AbortSignal.timeout(7000) });
                if (!response.ok)
                    throw new Error('Notification delivery failed');
                const result = await response.json() as {
                    ok?: boolean;
                };
                if (!result.ok)
                    throw new Error('Notification delivery failed');
            }
            else
                await transport!.sendMail({ from: process.env.SMTP_FROM!, to: process.env.MODERATOR_NOTIFICATION_EMAIL!, subject: 'Anonymous Garden — review needed', text: `There are items awaiting your review.\n\nOpen your protected admin panel:\n${origin}/admin\n\nSign in to review. No story content or private management links are included.\nThis is not an emergency alert or a promise of immediate response.` });
            for (const p of pending)
                await db.prepare('UPDATE notification_outbox SET sent_at=?,attempts=attempts+1 WHERE id=?').run(Date.now(), p.id!);
            await db.prepare("INSERT INTO settings VALUES('last_notification_at',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(String(Date.now()));
            return { configured: true, sent: pending.length };
        }
        catch {
            for (const p of pending)
                await db.prepare('UPDATE notification_outbox SET attempts=attempts+1,retry_at=? WHERE id=?').run(Date.now() + 5 * 60000, p.id!);
            return { configured: true, sent: 0, failed: true };
        }
        finally {
            transport?.close();
        }
    }
    finally {
        if (acquired)
            await db.prepare("DELETE FROM settings WHERE key='notification_delivery_lease' AND value=?").run(lease);
        sending = false;
    }
}
