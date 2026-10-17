export async function register(){
 if(process.env.VERCEL)return;
 if(process.env.NEXT_RUNTIME!=='nodejs'||process.env.NEXT_PHASE==='phase-production-build'||process.env.GARDEN_NOTIFICATION_WORKER!=='1')return;
 const {startNotificationWorker}=await import('./server/notification-worker');
 startNotificationWorker();
}
