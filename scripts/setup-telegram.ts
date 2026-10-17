import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline/promises';
import {Writable} from 'node:stream';
import {privateSetupChats,replaceTelegramConfig,type SetupUpdate} from '../src/server/telegram-config';
async function main(){
 if(process.argv.includes('--help')){console.log('npm run telegram:setup\nInteractive local-only credential entry. Token input is hidden. Verifies bot, lists private chat IDs from recent messages, and writes .env.local only after confirmation. No notification is sent.');return;}
 if(!process.stdin.isTTY||!process.stdout.isTTY){console.log('Run npm run telegram:setup in your own interactive terminal. Never paste the token in chat or command arguments.');process.exitCode=1;return;}
 let hidden=false;
 const output=new Writable({write(chunk,_encoding,done){if(!hidden)process.stdout.write(chunk);done();}});
 const input=createInterface({input:process.stdin,output,terminal:true});
 const ask=async(prompt:string,secret=false)=>{process.stdout.write(prompt);hidden=secret;try{return (await input.question('')).trim();}finally{hidden=false;if(secret)process.stdout.write('\n');}};
 try{
  console.log('Telegram notification setup — no paid service, no story content.\nCreate a dedicated bot in Telegram @BotFather, then open your bot and send /start from your own private chat.\nToken stays in this computer’s ignored .env.local file.');
  const token=await ask('Bot token (hidden): ',true);
  if(!/^\d{5,}:[A-Za-z0-9_-]{20,}$/.test(token)){console.log('Token format is invalid. Nothing saved.');return;}
  const call=async<T>(method:string):Promise<T>=>{
   const response=await fetch(`https://api.telegram.org/bot${token}/${method}`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(10000)});
   if(!response.ok)throw new Error('telegram_setup_failed');
   const result=await response.json() as {ok:boolean;result:T};if(!result.ok)throw new Error('telegram_setup_failed');return result.result;
  };
  const bot=await call<{username?:string}>('getMe');
  console.log(`Bot verified: @${bot.username??'(unnamed)'}`);
  const chats=privateSetupChats(await call<SetupUpdate[]>('getUpdates'));
  if(!chats.length){console.log('No recent private chat found. Send /start to your bot, then run setup again. Nothing saved.');return;}
  chats.forEach((chat,index)=>console.log(`${index+1}. ${chat.label} — private chat ID ${chat.id}`));
  const choice=Number(await ask('Select YOUR private chat number: '));
  if(!Number.isInteger(choice)||choice<1||choice>chats.length){console.log('Invalid choice. Nothing saved.');return;}
  const chatId=String(chats[choice-1].id);
  if((await ask('Save bot credentials for this chat in .env.local? Type SAVE: '))!=='SAVE'){console.log('Cancelled. Nothing saved.');return;}
  const filename='.env.local';
  writeFileSync(filename,replaceTelegramConfig(existsSync(filename)?readFileSync(filename,'utf8'):'',token,chatId),{mode:0o600});
  console.log('Saved privately. Restart the garden server to enable Telegram. No test notification was sent. Admin links work remotely only after secured hosting is configured.');
 }catch{console.log('Telegram could not be verified. Check the token and network. A bot with an existing webhook needs a separate dedicated bot for this setup. Nothing saved; secrets are not printed.');process.exitCode=1;}
 finally{input.close();output.end();}
}
void main();
