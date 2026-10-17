export function replaceTelegramConfig(source:string,token:string,chatId:string){
 if(!/^\d{5,}:[A-Za-z0-9_-]{20,}$/.test(token)||!/^\d+$/.test(chatId))throw new Error('Invalid Telegram configuration');
 let text=source;
 for(const [key,value] of Object.entries({TELEGRAM_BOT_TOKEN:token,TELEGRAM_CHAT_ID:chatId})){
  const line=new RegExp(`^\\s*(?:export\\s+)?${key}\\s*=.*$`,'gm');
  text=text.replace(line,'').trimEnd()+`\n${key}=${value}\n`;
 }
 return text;
}
export interface SetupUpdate{message?:{chat?:{id:number;type:string;first_name?:string;username?:string}};}
export function privateSetupChats(updates:SetupUpdate[]){
 const chats=new Map<number,{id:number;label:string}>();
 for(const update of updates){const c=update.message?.chat;if(c?.type==='private'&&Number.isSafeInteger(c.id)&&c.id>0)chats.set(c.id,{id:c.id,label:c.first_name??c.username??'Private chat'});}
 return [...chats.values()];
}
