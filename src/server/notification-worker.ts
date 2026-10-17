import {flushNotifications,notificationConfigured} from './notifications';
const globalWorker=globalThis as typeof globalThis & {gardenNotificationTimer?:ReturnType<typeof setInterval>};
// Only the persistent, local Node server enables this pump. It is not a serverless scheduler.
export function startNotificationWorker(){
 if(globalWorker.gardenNotificationTimer||!notificationConfigured())return;
 globalWorker.gardenNotificationTimer=setInterval(()=>{
  void flushNotifications().catch(()=>{console.warn('Garden notification retry failed; queued items remain available in Admin.');});
 },60_000);
 globalWorker.gardenNotificationTimer.unref();
 console.info('Garden notification retry worker active: local Node, 60-second checks.');
}
