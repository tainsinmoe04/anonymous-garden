import { existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { database } from '../src/server/database';
import { hashPassword, token } from '../src/server/security';
async function main() {
    const db = await database();
    const existing = await db.prepare("SELECT value FROM settings WHERE key='moderator_password'").get();
    if (existing && !process.argv.includes('--rotate')) {
        console.log('Moderator already configured. Use --rotate only when you intend to replace the password and revoke all moderator sessions.');
        process.exit(0);
    }
    const password = token();
    const credentialPath = path.join(process.cwd(), '.garden-data', 'moderator-login.txt');
    await db.prepare("INSERT INTO settings VALUES('moderator_password',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(hashPassword(password));
    await db.prepare("DELETE FROM sessions WHERE kind='moderator'").run();
    writeFileSync(credentialPath, `LOCAL ADMIN LOGIN — do not share or commit this file.\n\nURL: http://127.0.0.1:3001/admin\nPassword: ${password}\n\nSave this password securely, then remove this temporary file.\nReset: npm run admin:setup -- --rotate\n`, { mode: 0o600 });
    if (!existsSync('.env.local'))
        writeFileSync('.env.local', 'GARDEN_ORIGIN=http://127.0.0.1:3001\n', { mode: 0o600 });
    console.log('Local moderator configured. The generated password is saved privately in .garden-data/moderator-login.txt; it is not printed in logs. No email has been sent.');
    await db.close();
}
void main();
