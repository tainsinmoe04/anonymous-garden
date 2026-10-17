import {existsSync} from 'node:fs';
if(existsSync('.env.local'))process.loadEnvFile('.env.local');
async function main(){const {flushNotifications}=await import('../src/server/notifications');const result=await flushNotifications();console.log(result.configured?`Notification delivery: ${result.sent} queued item(s) included${result.failed?' — delivery failed; retry remains queued':''}.`:'Telegram / SMTP is not configured. No notification sent; review items remain in the outbox.');}
void main();
