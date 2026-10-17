import test from 'node:test';
import assert from 'node:assert/strict';
import {replaceTelegramConfig,privateSetupChats} from './telegram-config';
test('Telegram setup replaces duplicate credentials without changing unrelated configuration',()=>{
 const token='123456:abcdefghijklmnopqrstuvwxyz';
 const result=replaceTelegramConfig('GARDEN_ORIGIN=http://127.0.0.1:3001\nTELEGRAM_BOT_TOKEN=old\nTELEGRAM_BOT_TOKEN=duplicate\nTELEGRAM_CHAT_ID=old\nSMTP_HOST=smtp.example\n',token,'123456');
 assert.equal((result.match(/^TELEGRAM_BOT_TOKEN=/gm)??[]).length,1);
 assert.match(result,/GARDEN_ORIGIN=http:\/\/127.0.0.1:3001/);
 assert.match(result,/SMTP_HOST=smtp.example/);
 assert.ok(result.includes('TELEGRAM_CHAT_ID=123456'));
 assert.throws(()=>replaceTelegramConfig('',token+'\nBAD=value','123456'));
 assert.throws(()=>replaceTelegramConfig('',token,'-123456'));
});
test('Telegram setup only offers unique private chats, excluding groups and channels',()=>{
 const chats=privateSetupChats([{message:{chat:{id:123,type:'private',first_name:'Owner'}}},{message:{chat:{id:123,type:'private',first_name:'Owner'}}},{message:{chat:{id:-456,type:'group'}}},{message:{chat:{id:-789,type:'channel'}}}]);
 assert.deepEqual(chats,[{id:123,label:'Owner'}]);
 assert.equal(JSON.stringify(chats).includes('message'),false);
});
