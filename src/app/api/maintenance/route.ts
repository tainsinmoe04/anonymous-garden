import {timingSafeEqual} from 'node:crypto';
import {database} from '@/server/database';
import {GardenStore} from '@/server/store';
import {flushNotifications} from '@/server/notifications';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const secret=process.env.CRON_SECRET,provided=request.headers.get('authorization')??'';
 const actual=Buffer.from(provided),expected=Buffer.from('Bearer '+(secret??''));
 if(!secret||secret.length<32||actual.length!==expected.length||!timingSafeEqual(actual,expected))return Response.json({error:'unauthorized'},{status:401,headers:{'Cache-Control':'no-store'}});
 try{await new GardenStore(await database()).maintenance();const delivery=await flushNotifications();return Response.json({ok:true,notificationsSent:delivery.sent},{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'service_unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
